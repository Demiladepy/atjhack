"""Input validation utilities for API endpoints."""

import re
import uuid
from fastapi import HTTPException, status


def validate_uuid(value: str, field_name: str = "id") -> str:
    """Validate that a string is a valid UUID. Raises 422 if invalid."""
    try:
        uuid.UUID(value, version=4)
    except (ValueError, AttributeError):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid {field_name}: must be a valid UUID",
        )
    return value


def validate_phone(phone: str) -> str:
    """Validate phone number format. Must be digits with optional + prefix."""
    cleaned = phone.replace("whatsapp:", "").strip()
    if not re.match(r"^\+?[1-9]\d{6,14}$", cleaned):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid phone number format",
        )
    return cleaned


def sanitize_string(value: str, max_length: int = 1000) -> str:
    """Sanitize a user-provided string: strip, truncate, remove null bytes."""
    if not isinstance(value, str):
        return ""
    value = value.replace("\x00", "").strip()
    return value[:max_length]


def validate_plan(plan: str) -> str:
    """Validate payment plan identifier."""
    allowed = {"pro_monthly", "pro_yearly"}
    if plan not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid plan. Must be one of: {', '.join(sorted(allowed))}",
        )
    return plan


def validate_transaction_type(tx_type: str | None) -> str | None:
    """Validate transaction type filter if provided."""
    if tx_type is None:
        return None
    allowed = {"sale", "expense", "purchase", "payment_received"}
    if tx_type not in allowed:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid type. Must be one of: {', '.join(sorted(allowed))}",
        )
    return tx_type


def validate_paystack_reference(reference: str) -> str:
    """Validate Paystack reference format — alphanumeric with dashes/underscores only."""
    if not re.match(r"^[a-zA-Z0-9_\-]{5,100}$", reference):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid payment reference format",
        )
    return reference
