-- WhatsApp OTP table for custom auth flow
CREATE TABLE IF NOT EXISTS whatsapp_otps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone TEXT NOT NULL UNIQUE,
    otp_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for phone lookups
CREATE INDEX IF NOT EXISTS idx_whatsapp_otps_phone ON whatsapp_otps (phone);

-- Auto-cleanup: expired OTPs can be purged periodically
-- In production, set up a Supabase cron or pg_cron to run:
-- DELETE FROM whatsapp_otps WHERE expires_at < now();

-- Enable RLS
ALTER TABLE whatsapp_otps ENABLE ROW LEVEL SECURITY;

-- Only backend service role can access this table (no client access)
CREATE POLICY "Service role only" ON whatsapp_otps
    FOR ALL USING (auth.role() = 'service_role');
