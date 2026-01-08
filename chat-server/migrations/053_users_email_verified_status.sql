-- Migration 053: Add email_verified and status fields to users table
-- Part of Phase 2: Data Model & Session Management

BEGIN;

-- Add email_verified column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

-- Add status column to users table (active, suspended, deleted, etc.)
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- Set email_verified for existing users based on auth_identities
-- If user has at least one verified identity, mark user as verified
UPDATE users u
SET email_verified = true
WHERE EXISTS (
  SELECT 1 FROM auth_identities ai
  WHERE ai.user_id = u.id AND ai.email_verified = true
);

-- For users with Google OAuth who don't have auth_identities yet (edge case)
-- Mark them as verified (existing Google users are typically verified)
UPDATE users
SET email_verified = true
WHERE google_id IS NOT NULL
  AND email_verified = false
  AND NOT EXISTS (
    SELECT 1 FROM auth_identities ai WHERE ai.user_id = users.id
  );

-- Set status to 'active' for all existing users (default migration behavior)
UPDATE users
SET status = 'active'
WHERE status IS NULL;

-- Add constraint for status values
ALTER TABLE users ADD CONSTRAINT check_status_values 
  CHECK (status IN ('active', 'suspended', 'deleted', 'pending_verification'));

-- Create index for status lookups
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status) WHERE status != 'active';
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified) WHERE email_verified = false;

-- Add comments
COMMENT ON COLUMN users.email_verified IS 'Whether the primary email is verified (based on auth_identities)';
COMMENT ON COLUMN users.status IS 'Account status: active, suspended, deleted, pending_verification';

COMMIT;

