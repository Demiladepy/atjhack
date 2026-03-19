"""Paystack payment: initialize, webhook, verify."""

import hmac
import hashlib
import json
from datetime import datetime, timedelta, timezone

import httpx
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel, field_validator

from app.core.config import settings
from app.core.logging_config import get_logger
from app.core.validation import validate_uuid, validate_plan, validate_paystack_reference
from app.db.client import get_supabase_client

logger = get_logger(__name__)
router = APIRouter()

PLANS = {
    "pro_monthly": {"amount": 200000, "name": "Pro Monthly"},   # ₦2,000 in kobo
    "pro_yearly": {"amount": 2000000, "name": "Pro Yearly"},   # ₦20,000 in kobo
}

# Max webhook body size: 64KB (Paystack payloads are small)
MAX_WEBHOOK_BODY_SIZE = 65536


class PaymentInitRequest(BaseModel):
    """Validated request body for payment initialization."""
    merchant_id: str
    plan: str = "pro_monthly"

    @field_validator("merchant_id")
    @classmethod
    def check_merchant_id(cls, v: str) -> str:
        validate_uuid(v, "merchant_id")
        return v

    @field_validator("plan")
    @classmethod
    def check_plan(cls, v: str) -> str:
        validate_plan(v)
        return v


@router.post("/payments/initialize")
async def initialize_payment(body: PaymentInitRequest):
    """Start a subscription payment for a merchant. Returns Paystack authorization URL."""
    if not settings.paystack_secret_key:
        raise HTTPException(status_code=503, detail="Payments not configured")

    client = get_supabase_client()
    merchant_result = client.table("merchants").select("id, phone, name").eq("id", body.merchant_id).execute()
    if not merchant_result.data:
        raise HTTPException(status_code=404, detail="Merchant not found")
    merchant = merchant_result.data[0]

    selected = PLANS[body.plan]

    callback_url = f"{settings.frontend_url.rstrip('/')}/payment/success"
    async with httpx.AsyncClient(timeout=15.0) as client_http:
        response = await client_http.post(
            "https://api.paystack.co/transaction/initialize",
            headers={
                "Authorization": f"Bearer {settings.paystack_secret_key}",
                "Content-Type": "application/json",
            },
            json={
                "email": f"{merchant.get('phone', '')}@smbookkeeper.com",
                "amount": selected["amount"],
                "currency": "NGN",
                "metadata": {
                    "merchant_id": body.merchant_id,
                    "plan": body.plan,
                    "merchant_name": merchant.get("name", ""),
                },
                "callback_url": callback_url,
            },
        )
    data = response.json()

    if not data.get("status"):
        logger.warning("Paystack init failed: %s", data.get("message", "unknown"))
        raise HTTPException(status_code=502, detail="Payment initialization failed")

    return {
        "authorization_url": data["data"]["authorization_url"],
        "reference": data["data"]["reference"],
    }


@router.post("/webhook/paystack")
async def paystack_webhook(request: Request):
    """Handle Paystack payment webhooks. Verify HMAC signature then update merchant subscription."""
    secret = settings.paystack_secret_key
    if not secret:
        raise HTTPException(status_code=503, detail="Payments not configured")

    # Limit body size to prevent memory exhaustion
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > MAX_WEBHOOK_BODY_SIZE:
        raise HTTPException(status_code=413, detail="Payload too large")

    body = await request.body()
    if len(body) > MAX_WEBHOOK_BODY_SIZE:
        raise HTTPException(status_code=413, detail="Payload too large")

    signature = request.headers.get("x-paystack-signature", "")
    if not signature:
        logger.warning("Paystack webhook: missing signature header")
        raise HTTPException(status_code=400, detail="Missing signature")

    # Timing-safe HMAC comparison
    expected = hmac.new(secret.encode("utf-8"), body, hashlib.sha512).hexdigest()
    if not hmac.compare_digest(signature, expected):
        logger.warning("Paystack webhook: invalid signature")
        raise HTTPException(status_code=400, detail="Invalid signature")

    try:
        payload = json.loads(body)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    event = payload.get("event")
    if event != "charge.success":
        return {"status": "ok"}

    data = payload.get("data", {})
    metadata = data.get("metadata", {})
    merchant_id = metadata.get("merchant_id")
    plan = metadata.get("plan", "pro_monthly")
    reference = data.get("reference", "")

    if not merchant_id:
        logger.warning("Paystack webhook: missing merchant_id in metadata")
        return {"status": "ok"}

    # Validate extracted values
    try:
        validate_uuid(merchant_id, "merchant_id")
    except HTTPException:
        logger.warning("Paystack webhook: invalid merchant_id=%s", merchant_id)
        return {"status": "ok"}

    if plan not in PLANS:
        plan = "pro_monthly"

    now = datetime.now(timezone.utc)
    paid_until = now + timedelta(days=365) if "yearly" in plan else now + timedelta(days=30)

    client = get_supabase_client()

    # Verify merchant exists before updating
    merchant_check = client.table("merchants").select("id").eq("id", merchant_id).execute()
    if not merchant_check.data:
        logger.warning("Paystack webhook: merchant not found id=%s", merchant_id)
        return {"status": "ok"}

    client.table("merchants").update({
        "subscription_plan": "pro",
        "paid_until": paid_until.isoformat(),
        "paystack_reference": reference,
    }).eq("id", merchant_id).execute()

    amount_kobo = data.get("amount", 0)
    try:
        amount_naira = float(amount_kobo) / 100.0
    except (TypeError, ValueError):
        amount_naira = 0.0

    client.table("payments").insert({
        "merchant_id": merchant_id,
        "amount": amount_naira,
        "reference": reference,
        "status": "success",
        "plan": plan,
    }).execute()

    logger.info("Payment success merchant_id=%s plan=%s", merchant_id, plan)
    return {"status": "ok"}


@router.get("/payments/verify/{reference}")
async def verify_payment(reference: str):
    """Verify a payment by reference (for frontend callback after redirect)."""
    if not settings.paystack_secret_key:
        raise HTTPException(status_code=503, detail="Payments not configured")

    validate_paystack_reference(reference)

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(
            f"https://api.paystack.co/transaction/verify/{reference}",
            headers={"Authorization": f"Bearer {settings.paystack_secret_key}"},
        )
    data = response.json()
    tx = data.get("data", {})
    return {
        "verified": tx.get("status") == "success",
        "amount": (tx.get("amount", 0) or 0) / 100.0,
        "metadata": tx.get("metadata"),
    }
