"""API key authentication for dashboard endpoints."""

import secrets

from fastapi import Security, HTTPException, status
from fastapi.security import APIKeyHeader

from app.core.config import settings

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def require_api_key(
    api_key: str | None = Security(api_key_header),
) -> str:
    """
    FastAPI dependency that enforces API key auth on dashboard endpoints.

    - If DASHBOARD_API_KEY is not set, auth is skipped (dev convenience).
    - In production, requests without a valid key get 401.
    """
    expected = settings.dashboard_api_key
    if not expected:
        # No key configured — skip auth (development mode)
        return "dev"

    if not api_key or not secrets.compare_digest(api_key, expected):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key",
        )
    return api_key
