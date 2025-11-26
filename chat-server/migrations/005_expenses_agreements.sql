-- PostgreSQL Migration: Expenses and Agreements
-- Creates tables for tracking shared expenses and co-parenting agreements
--
-- Feature: 005-expenses-agreements
-- Constitutional Compliance: Library-First
-- Backward Compatibility: Additive only

-- ============================================================================
-- EXPENSES TABLE
-- Tracks shared expenses, requests, and payments
-- ============================================================================

CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    requested_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT NOT NULL,
    category TEXT DEFAULT 'general', -- general, medical, education, clothing, etc.
    status TEXT DEFAULT 'pending', -- pending, approved, declined, paid
    receipt_url TEXT,
    notes TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for expenses
CREATE INDEX IF NOT EXISTS idx_expenses_room ON expenses(room_id);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_created ON expenses(created_at DESC);

-- ============================================================================
-- AGREEMENTS TABLE
-- Tracks formal and informal agreements between co-parents
-- ============================================================================

CREATE TABLE IF NOT EXISTS agreements (
    id SERIAL PRIMARY KEY,
    room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    proposed_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    details TEXT,
    status TEXT DEFAULT 'proposed', -- proposed, agreed, rejected, active, archived
    agreed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for agreements
CREATE INDEX IF NOT EXISTS idx_agreements_room ON agreements(room_id);
CREATE INDEX IF NOT EXISTS idx_agreements_status ON agreements(status);
CREATE INDEX IF NOT EXISTS idx_agreements_created ON agreements(created_at DESC);

-- Comments
COMMENT ON TABLE expenses IS 'Shared expenses between co-parents';
COMMENT ON TABLE agreements IS 'Co-parenting agreements and proposals';
