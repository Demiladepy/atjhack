# Database Schema (Supabase / PostgreSQL)

See `docs/supabase_schema.sql` for base tables. Payment-related changes are in `integration/migrations/001_paystack_subscription.sql`.

## Base Tables
- **merchants** — id, phone, name, business_type, location, currency, created_at, updated_at
- **transactions** — merchant_id, type (sale|expense|purchase|payment_received), item, quantity, unit, unit_price, total_amount, customer_name, payment_status, amount_paid, amount_owed, category, raw_message, created_at
- **debts** — merchant_id, customer_name, total_owed, last_transaction_at, status (active|settled|overdue), created_at, updated_at

## After migration 001
- **merchants** gains: subscription_plan (default 'free'), paid_until (timestamptz), paystack_reference
- **payments** — id, merchant_id, amount, reference (unique), status, plan, created_at

## Feature gating
Backend uses `subscription_plan = 'pro'` and `paid_until > now()` to allow access to credit score and other Pro features.
