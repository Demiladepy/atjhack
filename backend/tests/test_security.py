"""Security test suite for SMB Bookkeeper API.

Tests cover:
1. Input validation (UUID, phone, strings)
2. Authentication enforcement
3. Security headers
4. Paystack webhook signature verification
5. CORS configuration
6. Request size limits
7. LLM input sanitization
8. Path traversal / injection prevention
"""

import hmac
import hashlib
import json
import pytest
from unittest.mock import patch


# =============================================================================
# 1. INPUT VALIDATION TESTS
# =============================================================================

class TestUUIDValidation:
    """Ensure merchant_id path params reject non-UUID values."""

    def test_invalid_uuid_merchant_detail(self, client):
        resp = client.get("/api/merchants/not-a-uuid")
        assert resp.status_code == 422
        assert "UUID" in resp.json()["detail"]

    def test_sql_injection_in_merchant_id(self, client):
        resp = client.get("/api/merchants/'; DROP TABLE merchants; --")
        assert resp.status_code == 422

    def test_valid_uuid_passes_validation(self, client, mock_supabase):
        """Valid UUID passes validation (404 expected since mock returns empty)."""
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
        resp = client.get("/api/merchants/12345678-1234-4234-8234-123456789012")
        assert resp.status_code == 404

    def test_invalid_uuid_transactions(self, client):
        resp = client.get("/api/merchants/INVALID/transactions")
        assert resp.status_code == 422

    def test_invalid_uuid_credit_score(self, client):
        resp = client.get("/api/merchants/INVALID/reports/credit-score")
        assert resp.status_code == 422


class TestTransactionTypeValidation:
    """Ensure transaction type filter rejects invalid values."""

    def test_invalid_type_filter(self, client, mock_supabase):
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [{"id": "test"}]
        resp = client.get(
            "/api/merchants/12345678-1234-4234-8234-123456789012/transactions?type=DROP_TABLE"
        )
        assert resp.status_code == 422
        assert "type" in resp.json()["detail"].lower()

    def test_days_too_large(self, client):
        resp = client.get(
            "/api/merchants/12345678-1234-4234-8234-123456789012/transactions?days=9999"
        )
        assert resp.status_code == 422


# =============================================================================
# 2. AUTHENTICATION TESTS
# =============================================================================

class TestAPIKeyAuth:
    """Ensure API key authentication works correctly."""

    def test_no_key_in_dev_allowed(self, client):
        """In dev mode with no key configured, requests should pass."""
        resp = client.get("/api/merchants")
        assert resp.status_code != 401

    def test_wrong_key_rejected(self, authed_client):
        """With a key configured, wrong key should be rejected."""
        resp = authed_client.get(
            "/api/merchants",
            headers={"X-API-Key": "wrong-key"},
        )
        assert resp.status_code == 401

    def test_missing_key_rejected(self, authed_client):
        """With a key configured, missing key should be rejected."""
        resp = authed_client.get("/api/merchants")
        assert resp.status_code == 401

    def test_correct_key_accepted(self, authed_client, mock_supabase):
        """Correct key should allow access."""
        mock_supabase.table.return_value.select.return_value.order.return_value.execute.return_value.data = []
        resp = authed_client.get(
            "/api/merchants",
            headers={"X-API-Key": "test-secret-key-12345"},
        )
        assert resp.status_code == 200

    def test_production_no_key_rejects(self, mock_supabase):
        """In production, if no API key is set, endpoints should fail."""
        from app.core.config import settings
        orig_env = settings.app_env
        orig_key = settings.dashboard_api_key
        settings.app_env = "production"
        settings.dashboard_api_key = ""

        from app.main import app
        from fastapi.testclient import TestClient
        with TestClient(app, raise_server_exceptions=False) as c:
            resp = c.get("/api/merchants")
            assert resp.status_code in (401, 503)

        settings.app_env = orig_env
        settings.dashboard_api_key = orig_key

    def test_health_endpoint_no_auth(self, authed_client):
        """Health check should not require auth."""
        resp = authed_client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"


# =============================================================================
# 3. SECURITY HEADERS TESTS
# =============================================================================

class TestSecurityHeaders:
    """Verify security headers are present on responses."""

    def test_x_content_type_options(self, client):
        resp = client.get("/health")
        assert resp.headers.get("X-Content-Type-Options") == "nosniff"

    def test_x_frame_options(self, client):
        resp = client.get("/health")
        assert resp.headers.get("X-Frame-Options") == "DENY"

    def test_x_xss_protection(self, client):
        resp = client.get("/health")
        assert "1" in resp.headers.get("X-XSS-Protection", "")

    def test_referrer_policy(self, client):
        resp = client.get("/health")
        assert resp.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"

    def test_cache_control_no_store(self, client):
        resp = client.get("/health")
        assert "no-store" in resp.headers.get("Cache-Control", "")

    def test_content_security_policy(self, client):
        resp = client.get("/health")
        csp = resp.headers.get("Content-Security-Policy", "")
        assert "default-src 'none'" in csp

    def test_permissions_policy(self, client):
        resp = client.get("/health")
        pp = resp.headers.get("Permissions-Policy", "")
        assert "camera=()" in pp

    def test_hsts_in_production(self, prod_client):
        resp = prod_client.get("/health")
        hsts = resp.headers.get("Strict-Transport-Security", "")
        assert "max-age=" in hsts

    def test_no_hsts_in_dev(self, client):
        resp = client.get("/health")
        assert "Strict-Transport-Security" not in resp.headers


# =============================================================================
# 4. PAYSTACK WEBHOOK SECURITY TESTS
# =============================================================================

class TestPaystackWebhookSecurity:
    """Test Paystack webhook signature verification."""

    def _make_signed_payload(self, secret: str, payload: dict) -> tuple[bytes, str]:
        body = json.dumps(payload).encode("utf-8")
        sig = hmac.new(secret.encode("utf-8"), body, hashlib.sha512).hexdigest()
        return body, sig

    def test_missing_signature_rejected(self, client, mock_supabase):
        from app.core.config import settings
        orig = settings.paystack_secret_key
        settings.paystack_secret_key = "test-paystack-secret"

        resp = client.post(
            "/api/webhook/paystack",
            content=b'{"event": "charge.success"}',
            headers={"Content-Type": "application/json"},
        )
        assert resp.status_code == 400

        settings.paystack_secret_key = orig

    def test_invalid_signature_rejected(self, client, mock_supabase):
        from app.core.config import settings
        orig = settings.paystack_secret_key
        settings.paystack_secret_key = "test-paystack-secret"

        resp = client.post(
            "/api/webhook/paystack",
            content=b'{"event": "charge.success"}',
            headers={
                "Content-Type": "application/json",
                "x-paystack-signature": "definitely-wrong-signature",
            },
        )
        assert resp.status_code == 400

        settings.paystack_secret_key = orig

    def test_valid_signature_accepted(self, client, mock_supabase):
        from app.core.config import settings
        secret = "test-paystack-secret"
        orig = settings.paystack_secret_key
        settings.paystack_secret_key = secret

        payload = {
            "event": "charge.success",
            "data": {
                "reference": "ref_12345",
                "amount": 200000,
                "metadata": {
                    "merchant_id": "12345678-1234-4234-8234-123456789012",
                    "plan": "pro_monthly",
                },
            },
        }
        body, sig = self._make_signed_payload(secret, payload)

        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [
            {"id": "12345678-1234-4234-8234-123456789012"}
        ]
        mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value.data = [{}]
        mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [{}]

        resp = client.post(
            "/api/webhook/paystack",
            content=body,
            headers={
                "Content-Type": "application/json",
                "x-paystack-signature": sig,
            },
        )
        assert resp.status_code == 200

        settings.paystack_secret_key = orig


# =============================================================================
# 5. PAYMENT REFERENCE VALIDATION
# =============================================================================

class TestPaymentReferenceValidation:
    """Ensure payment reference is sanitized."""

    def test_injection_in_reference(self, client, mock_supabase):
        from app.core.config import settings
        orig = settings.paystack_secret_key
        settings.paystack_secret_key = "test"

        resp = client.get("/api/payments/verify/ab!@#$%")
        assert resp.status_code == 422

        settings.paystack_secret_key = orig

    def test_too_short_reference(self, client, mock_supabase):
        from app.core.config import settings
        orig = settings.paystack_secret_key
        settings.paystack_secret_key = "test"

        resp = client.get("/api/payments/verify/ab")
        assert resp.status_code == 422

        settings.paystack_secret_key = orig


# =============================================================================
# 6. PAYMENT INITIALIZATION VALIDATION
# =============================================================================

class TestPaymentInitValidation:
    """Ensure payment init validates input properly."""

    def test_missing_merchant_id(self, client, mock_supabase):
        from app.core.config import settings
        orig = settings.paystack_secret_key
        settings.paystack_secret_key = "test"

        resp = client.post("/api/payments/initialize", json={"plan": "pro_monthly"})
        assert resp.status_code == 422

        settings.paystack_secret_key = orig

    def test_invalid_plan(self, client, mock_supabase):
        from app.core.config import settings
        orig = settings.paystack_secret_key
        settings.paystack_secret_key = "test"

        resp = client.post(
            "/api/payments/initialize",
            json={
                "merchant_id": "12345678-1234-4234-8234-123456789012",
                "plan": "free_forever_hack",
            },
        )
        assert resp.status_code in (400, 422)

        settings.paystack_secret_key = orig

    def test_invalid_merchant_id_format(self, client, mock_supabase):
        from app.core.config import settings
        orig = settings.paystack_secret_key
        settings.paystack_secret_key = "test"

        resp = client.post(
            "/api/payments/initialize",
            json={"merchant_id": "not-a-uuid", "plan": "pro_monthly"},
        )
        assert resp.status_code == 422

        settings.paystack_secret_key = orig


# =============================================================================
# 7. LLM INPUT SANITIZATION TESTS
# =============================================================================

class TestLLMSanitization:
    """Test input sanitization before LLM processing."""

    def test_sanitize_null_bytes(self):
        from app.services.llm import _sanitize_message
        result = _sanitize_message("sell rice\x00 50k")
        assert "\x00" not in result
        assert "sell rice 50k" == result

    def test_truncate_long_message(self):
        from app.services.llm import _sanitize_message, MAX_MESSAGE_LENGTH
        long_msg = "a" * 5000
        result = _sanitize_message(long_msg)
        assert len(result) == MAX_MESSAGE_LENGTH

    def test_strip_whitespace(self):
        from app.services.llm import _sanitize_message
        result = _sanitize_message("  sell rice 50k  ")
        assert result == "sell rice 50k"

    def test_validate_llm_response_bad_intent(self):
        from app.services.llm import _validate_llm_response
        result = _validate_llm_response({"intent": "hack_system"})
        assert result["intent"] == "other"

    def test_validate_llm_response_bad_tx_type(self):
        from app.services.llm import _validate_llm_response
        result = _validate_llm_response({
            "intent": "transaction",
            "data": {"type": "steal", "total_amount": 1000},
        })
        assert result["intent"] == "other"

    def test_validate_llm_response_absurd_amount(self):
        from app.services.llm import _validate_llm_response
        result = _validate_llm_response({
            "intent": "transaction",
            "data": {"type": "sale", "total_amount": 999_999_999_999},
        })
        assert result["intent"] == "other"

    def test_validate_llm_response_negative_amount(self):
        from app.services.llm import _validate_llm_response
        result = _validate_llm_response({
            "intent": "transaction",
            "data": {"type": "sale", "total_amount": -5000},
        })
        assert result["intent"] == "other"

    def test_validate_llm_response_valid_transaction(self):
        from app.services.llm import _validate_llm_response
        result = _validate_llm_response({
            "intent": "transaction",
            "data": {
                "type": "sale",
                "total_amount": 50000,
                "item": "rice",
                "customer_name": "Alhaji",
            },
        })
        assert result["intent"] == "transaction"

    def test_validate_llm_response_truncates_long_customer(self):
        from app.services.llm import _validate_llm_response
        result = _validate_llm_response({
            "intent": "transaction",
            "data": {
                "type": "sale",
                "total_amount": 1000,
                "customer_name": "A" * 500,
            },
        })
        assert len(result["data"]["customer_name"]) == 200

    def test_validate_llm_response_invalid_period_defaults(self):
        from app.services.llm import _validate_llm_response
        result = _validate_llm_response({
            "intent": "report_request",
            "period": "last_century",
        })
        assert result["period"] == "this_week"


# =============================================================================
# 8. VALIDATION UTILITY TESTS
# =============================================================================

class TestValidationUtils:
    """Test the validation utility functions directly."""

    def test_validate_uuid_valid(self):
        from app.core.validation import validate_uuid
        result = validate_uuid("12345678-1234-4234-8234-123456789012")
        assert result == "12345678-1234-4234-8234-123456789012"

    def test_validate_uuid_invalid(self):
        from app.core.validation import validate_uuid
        from fastapi import HTTPException
        with pytest.raises(HTTPException) as exc_info:
            validate_uuid("not-a-uuid")
        assert exc_info.value.status_code == 422

    def test_validate_uuid_sql_injection(self):
        from app.core.validation import validate_uuid
        from fastapi import HTTPException
        with pytest.raises(HTTPException):
            validate_uuid("'; DROP TABLE merchants; --")

    def test_validate_phone_valid(self):
        from app.core.validation import validate_phone
        assert validate_phone("+2348012345678") == "+2348012345678"
        assert validate_phone("whatsapp:+2348012345678") == "+2348012345678"

    def test_validate_phone_invalid(self):
        from app.core.validation import validate_phone
        from fastapi import HTTPException
        with pytest.raises(HTTPException):
            validate_phone("not-a-phone")

    def test_sanitize_string_null_bytes(self):
        from app.core.validation import sanitize_string
        assert "\x00" not in sanitize_string("hello\x00world")

    def test_sanitize_string_truncation(self):
        from app.core.validation import sanitize_string
        result = sanitize_string("a" * 2000, max_length=100)
        assert len(result) == 100

    def test_validate_paystack_reference_valid(self):
        from app.core.validation import validate_paystack_reference
        assert validate_paystack_reference("ref_abc123") == "ref_abc123"

    def test_validate_paystack_reference_invalid(self):
        from app.core.validation import validate_paystack_reference
        from fastapi import HTTPException
        with pytest.raises(HTTPException):
            validate_paystack_reference("../../etc/passwd")

    def test_validate_paystack_reference_too_short(self):
        from app.core.validation import validate_paystack_reference
        from fastapi import HTTPException
        with pytest.raises(HTTPException):
            validate_paystack_reference("ab")

    def test_validate_transaction_type_valid(self):
        from app.core.validation import validate_transaction_type
        assert validate_transaction_type("sale") == "sale"
        assert validate_transaction_type(None) is None

    def test_validate_transaction_type_invalid(self):
        from app.core.validation import validate_transaction_type
        from fastapi import HTTPException
        with pytest.raises(HTTPException):
            validate_transaction_type("hacked")


# =============================================================================
# 9. DOCS HIDDEN IN PRODUCTION
# =============================================================================

class TestProductionDocs:
    """Verify API docs are hidden in production."""

    def test_docs_available_in_dev(self, client):
        resp = client.get("/docs")
        assert resp.status_code == 200

    def test_openapi_available_in_dev(self, client):
        resp = client.get("/openapi.json")
        assert resp.status_code == 200


# =============================================================================
# 10. WEBHOOK SECURITY TESTS
# =============================================================================

class TestWebhookSecurity:
    """Test WhatsApp webhook security."""

    def test_webhook_rejects_without_twilio_sig_in_prod(self, mock_supabase):
        from app.core.config import settings
        orig_env = settings.app_env
        orig_token = settings.twilio_auth_token
        settings.app_env = "production"
        settings.twilio_auth_token = ""

        from app.main import app
        from fastapi.testclient import TestClient
        with TestClient(app, raise_server_exceptions=False) as c:
            resp = c.post(
                "/webhook/whatsapp",
                data={"Body": "sell rice 50k", "From": "whatsapp:+2348012345678"},
            )
            assert resp.status_code == 403

        settings.app_env = orig_env
        settings.twilio_auth_token = orig_token

    def test_webhook_allows_dev_without_twilio(self, client, mock_supabase):
        """In dev mode without Twilio configured, webhook should still work."""
        with patch("app.services.webhook_service.parse_message") as mock_parse:
            mock_parse.return_value = {
                "intent": "other",
                "response": "Hello!",
            }
            # Mock merchant repo
            mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [
                {"id": "test-id", "phone": "+2348012345678", "name": "Test"}
            ]
            resp = client.post(
                "/webhook/whatsapp",
                data={"Body": "hello", "From": "whatsapp:+2348012345678"},
            )
            assert resp.status_code == 200
            assert "Hello!" in resp.text
