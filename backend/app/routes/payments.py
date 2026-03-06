"""Paystack payment: initialize, webhook, verify."""

import hmac
import hashlib
import json
from datetime import datetime, timedelta

import httpx
from fastapi import APIRouter, Request, HTTPException

from app.core.config import settings
from app.core.logging_config import get_logger
from app.db.client import get_supabase_client

logger = get_logger(__name__)
router = APIRouter()

PLANS = {
    "pro_monthly": {"amount": 200000, "name": "Pro Monthly"},   # ₦2,000 in kobo
    "pro_yearly": {"amount": 2000000, "name": "Pro Yearly"},   # ₦20,000 in kobo
}


@router.post("/payments/initialize")
async def initialize_payment(request: Request):
    """Start a subscription payment for a merchant. Returns Paystack authorization URL."""
    if not settings.paystack_secret_key:
        raise HTTPException(status_code=503, detail="Payments not configured")
    body = await request.json()
    merchant_id = body.get("merchant_id")
    plan = body.get("plan", "pro_monthly")
    if not merchant_id:
        raise HTTPException(status_code=400, detail="merchant_id required")

    client = get_supabase_client()
    merchant_result = client.table("merchants").select("*").eq("id", merchant_id).execute()
    if not merchant_result.data:
        raise HTTPException(status_code=404, detail="Merchant not found")
    merchant = merchant_result.data[0]

    selected = PLANS.get(plan)
    if not selected:
        raise HTTPException(status_code=400, detail="Invalid plan")

    callback_url = f"{settings.frontend_url.rstrip('/')}/payment/success"
    async with httpx.AsyncClient() as client_http:
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
                    "merchant_id": merchant_id,
                    "plan": plan,
                    "merchant_name": merchant.get("name", ""),
                },
                "callback_url": callback_url,
            },
        )
    data = response.json()

    if not data.get("status"):
        logger.warning("Paystack init failed: %s", data)
        raise HTTPException(status_code=500, detail="Payment initialization failed")

    return {
        "authorization_url": data["data"]["authorization_url"],
        "reference": data["data"]["reference"],
    }


@router.post("/webhook/paystack")
async def paystack_webhook(request: Request):
    """Handle Paystack payment webhooks. Verify signature then update merchant subscription."""
    secret = settings.paystack_secret_key
    if not secret:
        raise HTTPException(status_code=503, detail="Payments not configured")

    body = await request.body()
    signature = request.headers.get("x-paystack-signature", "")
    expected = hmac.new(secret.encode("utf-8"), body, hashlib.sha512).hexdigest()
    if signature != expected:
        raise HTTPException(status_code=400, detail="Invalid signature")

    payload = json.loads(body)
    event = payload.get("event")
    if event != "charge.success":
        return {"status": "ok"}

    data = payload.get("data", {})
    metadata = data.get("metadata", {})
    merchant_id = metadata.get("merchant_id")
    plan = metadata.get("plan", "pro_monthly")
    reference = data.get("reference", "")

    if not merchant_id:
        return {"status": "ok"}

    now = datetime.utcnow()
    paid_until = now + timedelta(days=365) if "yearly" in plan else now + timedelta(days=30)

    client = get_supabase_client()
    client.table("merchants").update({
        "subscription_plan": "pro",
        "paid_until": paid_until.isoformat() + "Z",
        "paystack_reference": reference,
    }).eq("id", merchant_id).execute()

    amount_kobo = data.get("amount", 0)
    client.table("payments").insert({
        "merchant_id": merchant_id,
        "amount": amount_kobo / 100.0,
        "reference": reference,
        "status": "success",
        "plan": plan,
    }).execute()

    logger.info("Payment success merchant_id=%s plan=%s reference=%s", merchant_id, plan, reference)
    return {"status": "ok"}


@router.get("/payments/verify/{reference}")
async def verify_payment(reference: str):
    """Verify a payment by reference (for frontend callback after redirect)."""
    if not settings.paystack_secret_key:
        raise HTTPException(status_code=503, detail="Payments not configured")
    async with httpx.AsyncClient() as client:
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
