# Twilio WhatsApp Webhook Reference

## Incoming Message (POST to your webhook)
Content-Type: application/x-www-form-urlencoded

Key fields:
- Body: The message text
- From: whatsapp:+[phone number]
- ProfileName: Sender's WhatsApp name
- WaId: Phone number without +
- NumMedia: Number of media attachments
- MediaUrl0, MediaContentType0: If media attached

## Replying (TwiML)
Return XML with Content-Type: application/xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>Your reply text here</Message>
</Response>
```

## Python with FastAPI
```python
from twilio.twiml.messaging_response import MessagingResponse

twiml = MessagingResponse()
twiml.message("Reply text")
return Response(content=str(twiml), media_type="application/xml")
```

## Sending Proactive Messages (outside webhook)
```python
from twilio.rest import Client
client = Client(ACCOUNT_SID, AUTH_TOKEN)
client.messages.create(
    body="Your weekly report...",
    from_="whatsapp:+14155238886",
    to="whatsapp:+2348012345678"
)
```
Note: Outside 24-hour window, must use approved templates.

Docs: https://www.twilio.com/docs/whatsapp/api
