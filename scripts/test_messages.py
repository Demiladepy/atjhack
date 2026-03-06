"""
Test LLM parsing with sample messages. No Twilio/Supabase required.
Run: python scripts/test_messages.py
Requires GEMINI_API_KEY in env (e.g. backend/.env or export).
"""
import asyncio
import os
import sys

backend_dir = os.path.join(os.path.dirname(__file__), "..", "backend")
if os.path.isdir(backend_dir):
    sys.path.insert(0, backend_dir)

from dotenv import load_dotenv
load_dotenv(os.path.join(backend_dir, ".env"))
load_dotenv()

if not os.getenv("GEMINI_API_KEY"):
    print("Set GEMINI_API_KEY in .env or environment")
    sys.exit(1)

from app.services.llm import parse_message


SAMPLES = [
    "I sell 5 bags cement 15k each",
    "sold 3 carton milk to Blessing on credit",
    "Blessing pay me 20k",
    "buy diesel 25k",
    "how I do this week",
    "good morning",
    "I don sell 2 bag garri give Mama Joy",
]


async def main():
    for msg in SAMPLES:
        print(f"\nInput: {msg!r}")
        result = await parse_message(msg)
        print(f"Output: {result}")


if __name__ == "__main__":
    asyncio.run(main())
