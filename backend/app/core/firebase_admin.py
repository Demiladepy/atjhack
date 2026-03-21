"""Firebase Admin SDK initialization for custom token generation."""

import json
import firebase_admin
from firebase_admin import credentials, auth as fb_auth

from app.core.config import settings
from app.core.logging_config import get_logger

logger = get_logger(__name__)

_initialized = False


def _init_firebase() -> None:
    """Initialize Firebase Admin SDK (once)."""
    global _initialized
    if _initialized:
        return

    service_account_path = settings.firebase_service_account_path
    if not service_account_path:
        logger.warning("FIREBASE_SERVICE_ACCOUNT_PATH not set; WhatsApp auth will not work")
        return

    try:
        cred = credentials.Certificate(service_account_path)
        firebase_admin.initialize_app(cred)
        _initialized = True
        logger.info("Firebase Admin SDK initialized")
    except Exception as e:
        logger.error("Failed to initialize Firebase Admin SDK: %s", e)


def create_custom_token(uid: str) -> str | None:
    """Create a Firebase custom token for the given UID.

    Returns the token as a string, or None if Firebase Admin is not configured.
    """
    _init_firebase()
    if not _initialized:
        return None
    token = fb_auth.create_custom_token(uid)
    return token.decode("utf-8") if isinstance(token, bytes) else token


def is_firebase_admin_configured() -> bool:
    """Check if Firebase Admin SDK can be initialized."""
    _init_firebase()
    return _initialized
