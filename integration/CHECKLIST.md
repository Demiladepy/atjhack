# Integration & Hackathon Demo Checklist

Use this as the **master to-do list** for integrations and for the live demo.

---

## 1. Paystack (monetization)

- [ ] Sign up at https://dashboard.paystack.com — get **test** secret and public keys (Settings → API Keys & Webhooks).
- [ ] Add to `backend/.env`: `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY`, `FRONTEND_URL` (e.g. `http://localhost:5173`).
- [ ] Run SQL: `integration/migrations/001_paystack_subscription.sql` in Supabase SQL Editor.
- [ ] In Paystack Dashboard → Settings → Webhooks: set URL to `https://your-backend-url/api/webhook/paystack` (POST). For local dev use ngrok and paste the ngrok URL.
- [ ] **Demo flow:** Open Credit Score (as a non-demo merchant) → see upgrade prompt → Subscribe → Paystack test checkout → card `4084 0840 8408 4081`, CVV `408`, OTP `123456` → redirect to `/payment/success` → verify and unlock.

---

## 2. Twilio WhatsApp

- [ ] Sign up at https://www.twilio.com/try-twilio — get Account SID and Auth Token from console.
- [ ] Activate WhatsApp Sandbox: Messaging → Try it Out → Send a WhatsApp message → join with your phone (`join <code>`).
- [ ] Set webhook URL to `https://your-backend-url/webhook/whatsapp` (POST). For local dev use ngrok: `ngrok http 8000` → use the https URL.
- [ ] Add to `backend/.env`: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886` (or your sandbox number).
- [ ] Test: send a message from WhatsApp to the sandbox number → backend should reply (ensure backend is running and Gemini key is set).

---

## 3. Google Gemini

- [ ] Get API key at https://aistudio.google.com (Get API Key).
- [ ] Add to `backend/.env`: `GEMINI_API_KEY=...`.

---

## 4. Supabase

- [ ] Create project at https://supabase.com/dashboard.
- [ ] Run `docs/supabase_schema.sql` then `integration/migrations/001_paystack_subscription.sql` in SQL Editor.
- [ ] Add to `backend/.env`: `SUPABASE_URL`, `SUPABASE_KEY` (anon key).
- [ ] Add to `frontend/.env`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL` (backend URL for proxy or full URL).

---

## 5. Cursor IDE

- [ ] `.cursorrules` is at project root (already created).
- [ ] `.cursor/PAYSTACK_API.md`, `TWILIO_WEBHOOK.md`, `DATABASE_SCHEMA.md` exist for reference.

---

## 6. Hackathon demo payment flow (script)

1. Show dashboard with free tier (bookkeeping, transactions, debts).
2. Click **Credit Score** → show “Upgrade to Pro — ₦2,000/month”.
3. Click **Subscribe with Paystack** → Paystack checkout opens.
4. Test card: `4084 0840 8408 4081`, any future expiry, CVV `408`, OTP `123456`.
5. Redirect back to app → “You’re on Pro” → credit score unlocks.
6. Show full credit score gauge + “Qualifies for ₦500K microloan”.

**Pitch line:** “Mama Nkechi pays ₦2,000/month. That’s the price of one bag of garri. In return she gets a credit score that opens ₦500,000 in microloans. 10,000 Pro subscribers = ₦20M/month revenue.”

---

## 7. File checklist (after full build)

| Item | Status |
|------|--------|
| backend/.env with Paystack, Twilio, Gemini, Supabase, FRONTEND_URL | |
| backend/app/routes/payments.py | Done |
| backend/app/services/gating.py | Done |
| backend/app/routes/webhook.py (Twilio) | Exists |
| backend/app/services/llm.py (Gemini) | Exists |
| frontend: UpgradeModal, PaymentSuccess route, credit score gated | Done |
| .cursorrules | Done |
| .cursor/PAYSTACK_API.md, TWILIO_WEBHOOK.md, DATABASE_SCHEMA.md | Done |
| Supabase: merchants subscription columns + payments table | Run migration |
| Twilio sandbox webhook URL set | |
| Paystack webhook URL set in dashboard | |
