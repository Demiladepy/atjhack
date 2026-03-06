-- Run this in Supabase SQL Editor (Part 2.3 of spec)

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Merchants table
CREATE TABLE merchants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255),
    business_type VARCHAR(100),
    location VARCHAR(255),
    currency VARCHAR(3) DEFAULT 'NGN',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('sale', 'expense', 'purchase', 'payment_received')),
    item VARCHAR(255),
    quantity DECIMAL(10,2),
    unit VARCHAR(50),
    unit_price DECIMAL(12,2),
    total_amount DECIMAL(12,2) NOT NULL,
    customer_name VARCHAR(255),
    payment_status VARCHAR(20) DEFAULT 'paid' CHECK (payment_status IN ('paid', 'partial', 'credit', 'pending')),
    amount_paid DECIMAL(12,2) DEFAULT 0,
    amount_owed DECIMAL(12,2) DEFAULT 0,
    category VARCHAR(100),
    raw_message TEXT,
    parsed_confidence DECIMAL(3,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Debts ledger
CREATE TABLE debts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    total_owed DECIMAL(12,2) NOT NULL DEFAULT 0,
    last_transaction_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'settled', 'overdue')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(merchant_id, customer_name)
);

-- Indexes for performance
CREATE INDEX idx_transactions_merchant ON transactions(merchant_id);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_debts_merchant ON debts(merchant_id);
CREATE INDEX idx_debts_status ON debts(status);
CREATE INDEX idx_merchants_phone ON merchants(phone);

-- Enable Row Level Security
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;

-- Policies (allow all for now, tighten in production)
CREATE POLICY "Allow all on merchants" ON merchants FOR ALL USING (true);
CREATE POLICY "Allow all on transactions" ON transactions FOR ALL USING (true);
CREATE POLICY "Allow all on debts" ON debts FOR ALL USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE debts;
ALTER PUBLICATION supabase_realtime ADD TABLE merchants;
