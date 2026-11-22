-- Migration: 20261121000002_pay_links.sql
-- Add pay_token to invoices and create payment_claims table

-- 1. Add pay_token to invoices table
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS pay_token TEXT UNIQUE;

-- 2. Backfill existing invoices where pay_token is NULL
UPDATE invoices
SET pay_token = lower(replace(replace(replace(encode(gen_random_bytes(24), 'base64'), '+', '-'), '/', '_'), '=', ''))
WHERE pay_token IS NULL;

-- 3. Create payment_claims table
CREATE TABLE IF NOT EXISTS payment_claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    claimed_amount INTEGER NOT NULL CHECK (claimed_amount > 0),
    reference TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- Indexes for performance & integrity
CREATE INDEX IF NOT EXISTS idx_payment_claims_invoice_id ON payment_claims(invoice_id);

-- Enforce at most one pending claim per invoice
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_claims_unique_pending
ON payment_claims(invoice_id)
WHERE status = 'pending';
