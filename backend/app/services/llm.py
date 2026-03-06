"""LLM parsing: natural language -> structured intent and data."""

import json
from typing import Any

from google import genai

from app.core.config import settings
from app.core.logging_config import get_logger, log_exception

logger = get_logger(__name__)

SYSTEM_PROMPT = """You are a bookkeeping assistant for small business owners in Nigeria. Your job is to extract structured financial data from natural language messages sent via WhatsApp.

LANGUAGE: Merchants write in English, Pidgin English, or a mix. Common patterns:
- "I sell" / "I don sell" / "I sold" = completed sale
- "I buy" / "I purchase" = expense or stock purchase
- "on credit" / "she go pay later" / "owe me" / "e dey owe me" = debt/credit sale
- "pay me" / "settle" / "clear" = payment received against existing debt
- "15k" = 15,000 / "2.5m" = 2,500,000 / "5 bags" = quantity with unit
- "how I do" / "how my business" / "report" / "summary" = report request

RULES:
1. Always return valid JSON. No markdown, no explanation, just the JSON object.
2. If a message is about a sale, expense, purchase, or payment — extract the data.
3. If a message is asking for a report/summary — classify as report_request.
4. If a message is a greeting or unrelated — classify as other.
5. If amounts are ambiguous, set "needs_clarification": true and include a "clarification_question".
6. Never guess amounts. If you're not sure, ask.
7. Currency is always NGN (Nigerian Naira) unless explicitly stated otherwise.

OUTPUT FORMAT for transactions:
{
    "intent": "transaction",
    "data": {
        "type": "sale|expense|purchase|payment_received",
        "item": "string or null",
        "quantity": number or null,
        "unit": "bags|cartons|pieces|dozen|crates|kg|litres|null",
        "unit_price": number or null,
        "total_amount": number,
        "customer_name": "string or null",
        "payment_status": "paid|partial|credit",
        "amount_paid": number,
        "amount_owed": number,
        "category": "string or null"
    },
    "confirmation_message": "A friendly confirmation in the same language the merchant used",
    "needs_clarification": false
}

OUTPUT FORMAT for report requests:
{
    "intent": "report_request",
    "period": "today|this_week|this_month|custom",
    "confirmation_message": "Let me pull up your numbers..."
}

OUTPUT FORMAT for other messages:
{
    "intent": "other",
    "response": "A friendly, helpful response in the merchant's language"
}

EXAMPLES:

Input: "I sell 3 bag rice 48k each give Alhaji. He pay 100k, rest next week"
Output: {"intent":"transaction","data":{"type":"sale","item":"rice","quantity":3,"unit":"bags","unit_price":48000,"total_amount":144000,"customer_name":"Alhaji","payment_status":"partial","amount_paid":100000,"amount_owed":44000,"category":"food/grains"},"confirmation_message":"✅ Recorded: 3 bags rice to Alhaji. ₦144,000 total — ₦100k paid, ₦44k outstanding.","needs_clarification":false}

Input: "buy diesel for generator 25k"
Output: {"intent":"transaction","data":{"type":"expense","item":"diesel (generator)","quantity":null,"unit":null,"unit_price":null,"total_amount":25000,"customer_name":null,"payment_status":"paid","amount_paid":25000,"amount_owed":0,"category":"operations/fuel"},"confirmation_message":"✅ Recorded expense: Diesel for generator — ₦25,000","needs_clarification":false}

Input: "Mama Joy pay me the 15k wey she owe"
Output: {"intent":"transaction","data":{"type":"payment_received","item":null,"quantity":null,"unit":null,"unit_price":null,"total_amount":15000,"customer_name":"Mama Joy","payment_status":"paid","amount_paid":15000,"amount_owed":0,"category":null},"confirmation_message":"✅ Received ₦15,000 from Mama Joy. I go update her balance.","needs_clarification":false}

Input: "How I do this week?"
Output: {"intent":"report_request","period":"this_week","confirmation_message":"Make I check your numbers for this week... one moment 🔍"}

Input: "Good morning"
Output: {"intent":"other","response":"Good morning! 👋 Ready to record your sales and expenses today. Just text me what you sell or buy and I go handle the rest!"}
"""


def _get_client() -> genai.Client:
    """Lazy client so config can be validated at startup before any LLM call."""
    if not settings.is_llm_configured():
        raise RuntimeError("GEMINI_API_KEY is not set.")
    return genai.Client(api_key=settings.gemini_api_key)


def _strip_markdown_json(text: str) -> str:
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    if text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()


async def parse_message(message: str) -> dict[str, Any]:
    """
    Send merchant message to Gemini and return structured output.
    Returns a dict with at least "intent" (transaction | report_request | other)
    and intent-specific fields (data, response, period, etc.).
    On parse or API errors, returns a safe "other" response for the user.
    """
    if not message or not message.strip():
        return {
            "intent": "other",
            "response": "Send me your sales and expenses and I go track am for you! 📊",
        }

    try:
        client = _get_client()
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=message,
            config=genai.types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                temperature=0.1,
                max_output_tokens=1024,
            ),
        )
        result_text = (response.text or "").strip()
        if not result_text:
            logger.warning("LLM returned empty text for message length=%s", len(message))
            return _fallback_other("Sorry, I no get response. Try again.")
        result_text = _strip_markdown_json(result_text)
        return json.loads(result_text)
    except json.JSONDecodeError as e:
        logger.warning("LLM JSON decode error: %s", e)
        return {
            "intent": "other",
            "response": "Sorry, I no understand that one well. Try tell me again — wetin you sell or buy today?",
        }
    except Exception as e:
        log_exception(logger, "LLM request failed", e, message_preview=message[:80])
        return {
            "intent": "other",
            "response": "E get small wahala. Try send am again in one minute 🙏",
        }


def _fallback_other(response: str) -> dict[str, Any]:
    return {"intent": "other", "response": response}
