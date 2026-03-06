-- Run in Supabase SQL Editor after initial schema.
-- Adds subscription and payments for Paystack monetization.

-- Add subscription fields to merchants
ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(20) DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS paid_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS paystack_reference VARCHAR(100);

-- Payments log table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    reference VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    plan VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_merchant ON payments(merchant_id);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(reference);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on payments" ON payments;
CREATE POLICY "Allow all on payments" ON payments FOR ALL USING (true);
