-- Migration: Create waitlist table for pre-launch email collection
-- Run: psql $DATABASE_URL -f migrations/001_create_waitlist_table.sql

CREATE TABLE IF NOT EXISTS waitlist (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  source TEXT DEFAULT 'landing_page',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  converted_at TIMESTAMP WITH TIME ZONE,  -- When they became a real user
  user_id INTEGER REFERENCES users(id),   -- Link to user if they converted
  notes TEXT
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist(created_at);

-- Add comment for documentation
COMMENT ON TABLE waitlist IS 'Pre-launch waitlist for email collection';
COMMENT ON COLUMN waitlist.source IS 'Where the signup came from: landing_page, hero_cta, sticky_mobile, etc.';
COMMENT ON COLUMN waitlist.converted_at IS 'When this waitlist entry became a registered user';
