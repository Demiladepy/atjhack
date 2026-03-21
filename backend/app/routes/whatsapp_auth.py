"""WhatsApp OTP authentication: send OTP via Twilio WhatsApp, verify, issue Firebase custom token."""

import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator
from twilio.rest import Client as TwilioClient

from app.core.config import settings
from app.core.logging_config import get_logger
from app.core.validation import validate_phone
from app.core.firebase_admin import create_custom_token, is_firebase_admin_configured
from app.db.client import get_supabase_client

logger = get_logger(__name__)
router = APIRouter()

OTP_LENGTH = 6
OTP_EXPIRY_MINUTES = 5
MAX_OTP_ATTEMPTS = 5  # Max verify attempts before OTP is invalidated


def _hash_otp(otp: str) -> str:
    """Hash OTP with SHA-256 so we never store plaintext codes."""
    return hashlib.sha256(otp.encode("utf-8")).hexdigest()


class SendOtpRequest(BaseModel):
    phone: str

    @field_validator("phone")
    @classmethod
    def check_phone(cls, v: str) -> str:
        return validate_phone(v)


class VerifyOtpRequest(BaseModel):
    phone: str
    otp: str

    @field_validator("phone")
    @classmethod
    def check_phone(cls, v: str) -> str:
        return validate_phone(v)

    @field_validator("otp")
    @classmethod
    def check_otp(cls, v: str) -> str:
        v = v.strip()
        if not v.isdigit() or len(v) != OTP_LENGTH:
            raise ValueError(f"OTP must be exactly {OTP_LENGTH} digits")
        return v


@router.post("/whatsapp/send-otp")
async def send_whatsapp_otp(body: SendOtpRequest):
    """Generate a 6-digit OTP and send it to the user's WhatsApp via Twilio."""
    if not settings.is_webhook_configured():
        raise HTTPException(status_code=503, detail="Twilio is not configured")
    if not is_firebase_admin_configured():
        raise HTTPException(status_code=503, detail="Firebase Admin is not configured")

    phone = body.phone

    # Generate secure random OTP
    otp = "".join([str(secrets.randbelow(10)) for _ in range(OTP_LENGTH)])
    otp_hash = _hash_otp(otp)
    expires_at = (datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRY_MINUTES)).isoformat()

    # Store OTP in database (upsert by phone so only one active OTP per number)
    client = get_supabase_client()

    # Delete any existing OTP for this phone
    client.table("whatsapp_otps").delete().eq("phone", phone).execute()

    # Insert new OTP
    client.table("whatsapp_otps").insert({
        "phone": phone,
        "otp_hash": otp_hash,
        "expires_at": expires_at,
        "attempts": 0,
    }).execute()

    # Send OTP via Twilio WhatsApp
    try:
        twilio_client = TwilioClient(settings.twilio_account_sid, settings.twilio_auth_token)
        twilio_client.messages.create(
            body=f"Your SMB Bookkeeper login code is: {otp}\n\nThis code expires in {OTP_EXPIRY_MINUTES} minutes. Do not share it with anyone.",
            from_=settings.twilio_whatsapp_from,
            to=f"whatsapp:{phone}",
        )
    except Exception as e:
        logger.error("Failed to send WhatsApp OTP to %s: %s", phone, e)
        # Clean up the OTP we just stored
        client.table("whatsapp_otps").delete().eq("phone", phone).execute()
        raise HTTPException(status_code=502, detail="Failed to send WhatsApp message")

    logger.info("WhatsApp OTP sent to %s", phone)
    return {"success": True, "message": "OTP sent via WhatsApp"}


@router.post("/whatsapp/verify-otp")
async def verify_whatsapp_otp(body: VerifyOtpRequest):
    """Verify the OTP and return a Firebase custom token."""
    if not is_firebase_admin_configured():
        raise HTTPException(status_code=503, detail="Firebase Admin is not configured")

    phone = body.phone
    otp = body.otp

    client = get_supabase_client()

    # Look up OTP record
    result = client.table("whatsapp_otps").select("*").eq("phone", phone).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="No OTP found for this number. Request a new code.")

    record = result.data[0]

    # Check attempts limit
    attempts = record.get("attempts", 0)
    if attempts >= MAX_OTP_ATTEMPTS:
        client.table("whatsapp_otps").delete().eq("phone", phone).execute()
        raise HTTPException(status_code=429, detail="Too many attempts. Request a new code.")

    # Increment attempts
    client.table("whatsapp_otps").update({
        "attempts": attempts + 1,
    }).eq("phone", phone).execute()

    # Check expiry
    expires_at = record.get("expires_at", "")
    try:
        expiry = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
        if datetime.now(timezone.utc) > expiry:
            client.table("whatsapp_otps").delete().eq("phone", phone).execute()
            raise HTTPException(status_code=400, detail="OTP has expired. Request a new code.")
    except (ValueError, TypeError):
        client.table("whatsapp_otps").delete().eq("phone", phone).execute()
        raise HTTPException(status_code=400, detail="Invalid OTP record. Request a new code.")

    # Verify OTP hash
    if _hash_otp(otp) != record.get("otp_hash"):
        remaining = MAX_OTP_ATTEMPTS - (attempts + 1)
        raise HTTPException(
            status_code=400,
            detail=f"Invalid code. {remaining} attempt{'s' if remaining != 1 else ''} remaining.",
        )

    # OTP is valid — delete it (one-time use)
    client.table("whatsapp_otps").delete().eq("phone", phone).execute()

    # Create Firebase custom token
    uid = f"whatsapp:{phone}"
    token = create_custom_token(uid)
    if not token:
        raise HTTPException(status_code=500, detail="Failed to create authentication token")

    logger.info("WhatsApp OTP verified for %s", phone)
    return {"success": True, "token": token}
