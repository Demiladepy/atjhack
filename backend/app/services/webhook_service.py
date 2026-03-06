"""WhatsApp webhook business logic. Keeps the route thin."""

from typing import Any

from app.core.logging_config import get_logger
from app.repositories import MerchantRepository, TransactionRepository, DebtRepository
from app.services.llm import parse_message
from app.services.report_text import (
    build_daily_report,
    build_weekly_report,
    build_monthly_report,
)

logger = get_logger(__name__)

DEFAULT_OTHER_RESPONSE = (
    "Send me your sales and expenses and I go track am for you! 📊"
)


class WebhookService:
    """Handles incoming WhatsApp message: parse, persist, or report."""

    def __init__(self) -> None:
        self.merchants = MerchantRepository()
        self.transactions = TransactionRepository()
        self.debts = DebtRepository()

    async def handle_incoming(
        self,
        *,
        body: str,
        from_number: str,
        profile_name: str,
    ) -> str:
        """
        Process one incoming message. Returns the reply text to send back.
        body: message text (e.g. form Body)
        from_number: Twilio From (e.g. whatsapp:+234...)
        profile_name: Twilio ProfileName (e.g. Merchant)
        """
        phone = from_number.replace("whatsapp:", "").strip()
        if not phone:
            logger.warning("Webhook received message with empty From")
            return "We need your number to track your business. Please send from WhatsApp."

        merchant = self.merchants.get_or_create(phone, profile_name or "Merchant")
        merchant_id = merchant["id"]

        parsed = await parse_message(body)
        intent = parsed.get("intent") or "other"

        if intent == "transaction":
            return await self._handle_transaction(merchant_id, body, parsed)
        if intent == "report_request":
            return await self._handle_report_request(merchant_id, parsed)
        return parsed.get("response", DEFAULT_OTHER_RESPONSE)

    async def _handle_transaction(
        self, merchant_id: str, raw_message: str, parsed: dict[str, Any]
    ) -> str:
        data = parsed.get("data")
        if not data or not isinstance(data, dict):
            return "Sorry, I no understand that one well. Try tell me again — wetin you sell or buy today?"

        data = data.copy()
        data["raw_message"] = raw_message

        # Normalize numeric fields
        total = _float_or_zero(data.get("total_amount"))
        data["total_amount"] = total
        data["amount_paid"] = _float_or_zero(data.get("amount_paid", 0))
        data["amount_owed"] = _float_or_zero(data.get("amount_owed", 0))

        self.transactions.insert(
            merchant_id=merchant_id,
            type=data["type"],
            total_amount=total,
            item=data.get("item"),
            quantity=data.get("quantity"),
            unit=data.get("unit"),
            unit_price=data.get("unit_price"),
            customer_name=data.get("customer_name"),
            payment_status=data.get("payment_status", "paid"),
            amount_paid=data["amount_paid"],
            amount_owed=data["amount_owed"],
            category=data.get("category"),
            raw_message=raw_message,
        )

        customer = data.get("customer_name")
        if data.get("amount_owed", 0) > 0 and customer:
            self.debts.update_balance(
                merchant_id, customer, data["amount_owed"], action="add"
            )
        if data.get("type") == "payment_received" and customer:
            amount = data.get("amount_paid") or data.get("total_amount") or 0
            self.debts.update_balance(merchant_id, customer, amount, action="subtract")

        return parsed.get("confirmation_message", "✅ Recorded!")

    async def _handle_report_request(self, merchant_id: str, parsed: dict[str, Any]) -> str:
        period = parsed.get("period", "this_week")

        if period == "today":
            since = _today_start_iso()
            txns = self.transactions.get_since(merchant_id, since)
            return build_daily_report(txns)
        if period == "this_month":
            since = _month_start_iso()
            txns = self.transactions.get_since(merchant_id, since)
            return build_monthly_report(txns)
        # default: this_week
        since = _week_ago_iso()
        txns = self.transactions.get_since(merchant_id, since)
        debts = self.debts.get_active_for_merchant(merchant_id)
        return build_weekly_report(txns, debts)


def _float_or_zero(v: Any) -> float:
    if v is None:
        return 0.0
    try:
        return float(v)
    except (TypeError, ValueError):
        return 0.0


def _today_start_iso() -> str:
    from datetime import datetime
    return datetime.utcnow().replace(hour=0, minute=0, second=0).isoformat()


def _month_start_iso() -> str:
    from datetime import datetime
    return datetime.utcnow().replace(day=1, hour=0, minute=0, second=0).isoformat()


def _week_ago_iso() -> str:
    from datetime import datetime, timedelta
    return (datetime.utcnow() - timedelta(days=7)).isoformat()
