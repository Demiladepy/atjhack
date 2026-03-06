"""WhatsApp webhook: thin route, logic in WebhookService."""

from fastapi import APIRouter, Request, Response
from twilio.twiml.messaging_response import MessagingResponse

from app.deps import WebhookSvc

router = APIRouter()


@router.post("/webhook/whatsapp")
async def whatsapp_webhook(request: Request, service: WebhookSvc) -> Response:
    """Handle incoming WhatsApp messages from Twilio. Returns TwiML."""
    form_data = await request.form()
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
