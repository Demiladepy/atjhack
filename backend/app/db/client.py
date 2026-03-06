"""Lazy Supabase client. Created on first use after config is validated."""

from typing import TYPE_CHECKING

from supabase import Client, create_client

from app.core.config import settings

if TYPE_CHECKING:
    pass

_client: Client | None = None


def get_supabase_client() -> Client:
    """Return the Supabase client, creating it on first call. Uses validated settings."""
    global _client
    if _client is None:
        if not settings.is_db_configured():
            raise RuntimeError(
                "Supabase is not configured. Set SUPABASE_URL and SUPABASE_KEY."
            )
        _client = create_client(settings.supabase_url, settings.supabase_key)
    return _client
