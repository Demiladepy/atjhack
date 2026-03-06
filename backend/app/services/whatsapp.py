"""Twilio WhatsApp outbound message helper. Used for proactive sends if needed; inbound replies are TwiML from webhook."""
# Optional for MVP. Uncomment and set TWILIO_* env when adding proactive notifications.
# from twilio.rest import Client
# import os
# client = Client(os.getenv("TWILIO_ACCOUNT_SID"), os.getenv("TWILIO_AUTH_TOKEN"))
# def send_whatsapp_message(to: str, body: str) -> str:
#     return client.messages.create(from_=os.getenv("TWILIO_WHATSAPP_NUMBER"), to=f"whatsapp:{to}", body=body)
