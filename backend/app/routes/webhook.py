"""WhatsApp webhook: thin route, logic in WebhookService."""

from fastapi import APIRouter, Request, Response
from twilio.twiml.messaging_response import MessagingResponse
from twilio.request_validator import RequestValidator

from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import settings
from app.core.logging_config import get_logger
from app.deps import WebhookSvc

router = APIRouter()
logger = get_logger(__name__)
limiter = Limiter(key_func=get_remote_address)


def _validate_twilio_request(request: Request, form_data) -> bool:
    """Validate that the request actually came from Twilio using signature verification."""
    auth_token = settings.twilio_auth_token
    if not auth_token:
        # Skip validation in dev when Twilio isn't configured
        if settings.app_env == "development":
            return True
        logger.warning("Twilio auth token not set; rejecting webhook request")
        return False

    validator = RequestValidator(auth_token)
    # Reconstruct the full URL Twilio used to call us
    url = str(request.url)
    # If behind a reverse proxy / ngrok, use the webhook_base_url
    if settings.webhook_base_url:
        url = f"{settings.webhook_base_url.rstrip('/')}/webhook/whatsapp"

    signature = request.headers.get("X-Twilio-Signature", "")
    params = {k: v for k, v in form_data.multi_items()}

    return validator.validate(url, params, signature)


@router.post("/webhook/whatsapp")
@limiter.limit("20/minute")  # Protect Gemini API costs
async def whatsapp_webhook(request: Request, service: WebhookSvc) -> Response:
    """Handle incoming WhatsApp messages from Twilio. Returns TwiML."""
    form_data = await request.form()

    # Verify Twilio signature to prevent spoofed requests
    if not _validate_twilio_request(request, form_data):
        logger.warning("Rejected webhook request: invalid Twilio signature")
        return Response(status_code=403, content="Forbidden")

    body = (form_data.get("Body") or "").strip()
    from_number = (form_data.get("From") or "").strip()
    profile_name = (form_data.get("ProfileName") or "Merchant").strip()

    if not from_number:
        twiml = MessagingResponse()
        twiml.message("We couldn't identify your number. Please send from WhatsApp.")
        return Response(content=str(twiml), media_type="application/xml")

    reply = await service.handle_incoming(
        body=body,
        from_number=from_number,
        profile_name=profile_name,
    )
    twiml = MessagingResponse()
    twiml.message(reply)
    return Response(content=str(twiml), media_type="application/xml")
