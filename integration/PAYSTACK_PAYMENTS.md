# Paystack Payments (SMB Bookkeeper)

Paystack is used for **Pro subscriptions** (₦2,000/month or ₦20,000/year). Do **not** use Xara.ai for payments — it is a consumer WhatsApp product, not a payments API.

## 1. Get keys

1. Sign up at https://dashboard.paystack.com
2. Go to **Settings → API Keys & Webhooks**
3. Use **Test** keys for development: `sk_test_...` and `pk_test_...`

## 2. Environment variables (backend)

Add to `backend/.env`:

```env
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxx
PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx
FRONTEND_URL=http://localhost:5173
```

In production, set `FRONTEND_URL` to your frontend origin (e.g. `https://app.smbookkeeper.com`).

## 3. Webhook URL

In Paystack Dashboard → **Settings → Webhooks**:

- URL: `https://your-backend-domain/api/webhook/paystack`
- For local dev: run `ngrok http 8000` and use `https://xxxx.ngrok-free.app/api/webhook/paystack`

Paystack signs the body with HMAC SHA512 using your secret key. The backend verifies `x-paystack-signature` and updates `merchants.subscription_plan` and `paid_until` on `charge.success`.

## 4. Test cards

- **Card number:** 4084 0840 8408 4081
- **Expiry:** Any future date
- **CVV:** 408
- **OTP:** 123456
- **PIN:** 1234

## 5. Monetization model

- **Free:** Unlimited WhatsApp bookkeeping, reports, debt tracking, basic dashboard.
- **Pro (₦2,000/month or ₦20,000/year):** Credit Score, Financial Health Profile, PDF reports, “Loan Ready” badge, priority support.

Backend gates the credit score endpoint: non-Pro merchants get `402 upgrade_required`. Frontend shows `UpgradeModal` and redirects to Paystack; after payment, user lands on `/payment/success` and the app verifies the transaction.

## 6. Links

- Dashboard: https://dashboard.paystack.com  
- API docs: https://paystack.com/docs/api  
- Test payments: https://paystack.com/docs/payments/test-payments  
