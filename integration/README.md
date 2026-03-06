# Integrations

This folder holds **integration guides and checklists** for SMB Bookkeeper: **Paystack** (monetization), **Twilio WhatsApp**, and **Cursor IDE** setup.

## Contents

| File | Purpose |
|------|--------|
| [CHECKLIST.md](./CHECKLIST.md) | Master to-do list for integrations and hackathon demo. |
| [PAYSTACK_PAYMENTS.md](./PAYSTACK_PAYMENTS.md) | Paystack setup, env vars, webhook URL, and test cards. |
| [env.example](./env.example) | Copy into `backend/.env` — Paystack, Twilio, Gemini, Supabase, app. |
| [migrations/001_paystack_subscription.sql](./migrations/001_paystack_subscription.sql) | SQL to add subscription columns and `payments` table in Supabase. |

## Payment provider: Paystack

- **Paystack** is used for subscriptions (Pro tier). Xara.ai is a consumer WhatsApp product, not a payments API — do not use it for integration.
- Dashboard: https://dashboard.paystack.com  
- API docs: https://paystack.com/docs/api  
- Test keys are available immediately after signup (no business verification for sandbox).

## Quick links

- **Backend:** `backend/` (FastAPI, Paystack routes under `/api/payments/`, webhook at `/api/webhook/paystack`)
- **Frontend:** `frontend/` (UpgradeModal, PaymentSuccess route, credit score gated)
- **Cursor:** `.cursorrules` at project root; `.cursor/PAYSTACK_API.md`, `TWILIO_WEBHOOK.md`, `DATABASE_SCHEMA.md`
