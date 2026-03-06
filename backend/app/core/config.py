"""Application configuration with validation. Fails fast on missing required vars."""

from functools import lru_cache
from typing import Literal

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Validated settings from environment. Required keys must be set (or in .env)."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Twilio
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_whatsapp_number: str = "whatsapp:+14155238886"
    twilio_webhook_secret: str = ""  # optional: for signature verification

    # Google Gemini
    gemini_api_key: str = ""

    # Supabase
    supabase_url: str = ""
    supabase_key: str = ""

    # App
    app_env: Literal["development", "staging", "production"] = "development"
    webhook_base_url: str = ""
    frontend_url: str = "http://localhost:5173"
    cors_origins: str = "*"  # comma-separated; "*" for development

    # Paystack (monetization)
    paystack_secret_key: str = ""
    paystack_public_key: str = ""

    @field_validator("supabase_url", "supabase_key", "gemini_api_key", mode="before")
    @classmethod
    def require_non_empty(cls, v: str) -> str:
        if v is None or (isinstance(v, str) and not v.strip()):
            return ""
        return v.strip() if isinstance(v, str) else v

    def is_webhook_configured(self) -> bool:
        """True if Twilio credentials are set (needed for webhook)."""
        return bool(self.twilio_account_sid and self.twilio_auth_token)

    def is_llm_configured(self) -> bool:
        return bool(self.gemini_api_key)

    def is_db_configured(self) -> bool:
        return bool(self.supabase_url and self.supabase_key)

    def get_cors_origins_list(self) -> list[str]:
        if not self.cors_origins or self.cors_origins.strip() == "*":
            return ["*"]
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance. Use this in app; validate at startup in main."""
    return Settings()


# Singleton for direct import where DI is not used
settings = get_settings()
