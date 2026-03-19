"""Shared test fixtures for security tests."""

import pytest
from unittest.mock import patch, MagicMock, PropertyMock
from fastapi.testclient import TestClient


@pytest.fixture(autouse=True)
def _mock_env(monkeypatch):
    """Set safe defaults so real services are never called."""
    monkeypatch.setenv("SUPABASE_URL", "https://fake.supabase.co")
    monkeypatch.setenv("SUPABASE_KEY", "fake-key")
    monkeypatch.setenv("GEMINI_API_KEY", "fake-gemini-key")
    monkeypatch.setenv("APP_ENV", "development")
    monkeypatch.setenv("DASHBOARD_API_KEY", "")
    monkeypatch.setenv("PAYSTACK_SECRET_KEY", "")
    monkeypatch.setenv("TWILIO_ACCOUNT_SID", "")
    monkeypatch.setenv("TWILIO_AUTH_TOKEN", "")
    monkeypatch.setenv("CORS_ORIGINS", "*")


@pytest.fixture()
def mock_supabase():
    """Mock the Supabase client to prevent real DB calls."""
    mock_client = MagicMock()
    with patch("app.db.client.get_supabase_client", return_value=mock_client):
        yield mock_client


@pytest.fixture()
def client(mock_supabase):
    """TestClient with dev defaults (no API key required)."""
    from app.main import app
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c


@pytest.fixture()
def authed_client(mock_supabase):
    """TestClient with API key enforcement enabled."""
    from app.core.config import settings
    original = settings.dashboard_api_key
    settings.dashboard_api_key = "test-secret-key-12345"

    from app.main import app
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c

    settings.dashboard_api_key = original


@pytest.fixture()
def prod_client(mock_supabase):
    """TestClient configured as production."""
    from app.core.config import settings
    orig_env = settings.app_env
    orig_key = settings.dashboard_api_key
    orig_cors = settings.cors_origins

    settings.app_env = "production"
    settings.dashboard_api_key = "prod-secret-key-99999"
    settings.cors_origins = "https://app.smbookkeeper.com"

    from app.main import app
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c

    settings.app_env = orig_env
    settings.dashboard_api_key = orig_key
    settings.cors_origins = orig_cors
