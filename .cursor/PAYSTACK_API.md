# Paystack API Quick Reference

Base URL: https://api.paystack.co
Auth: Bearer token (secret key) in Authorization header

## Initialize Transaction
POST /transaction/initialize
Body: { email, amount (in kobo), currency: "NGN", metadata: {...}, callback_url }
Response: { status: true, data: { authorization_url, reference } }

## Verify Transaction
GET /transaction/verify/{reference}
Response: { status: true, data: { status: "success", amount, metadata } }

## Webhook
Paystack sends POST to your webhook URL on payment events.
Verify with HMAC SHA512 of raw body using your secret key.
Header: x-paystack-signature

## Test Cards
Card: 4084 0840 8408 4081
Expiry: Any future date
CVV: 408
OTP: 123456
PIN: 1234

## Amounts
Amounts are in kobo (1 NGN = 100 kobo). ₦2,000 = 200000 kobo.

Docs: https://paystack.com/docs/api
