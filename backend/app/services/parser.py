"""
Thin wrapper around LLM output. Webhook uses parse_message from llm.py directly;
this module can validate parsed shape with Pydantic if needed.
"""
from app.services.llm import parse_message

__all__ = ["parse_message"]
