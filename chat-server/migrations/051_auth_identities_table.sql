-- Migration 051: Create auth_identities table
-- Normalizes identity management - supports multiple auth methods per user
-- Part of Phase 2: Data Model & Session Management

BEGIN;

-- Create auth_identities table
CREATE TABLE IF NOT EXISTS auth_identities (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- 'google', 'email_password', 'email_magiclink'
  provider_subject TEXT NOT NULL, -- Google 'sub', email for email-based auth
  provider_email TEXT, -- Email associated with this identity
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Unique constraint: one identity per provider + provider_subject combination
  UNIQUE(provider, provider_subject)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_auth_identities_user_id ON auth_identities(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_identities_provider ON auth_identities(provider);
CREATE INDEX IF NOT EXISTS idx_auth_identities_provider_subject ON auth_identities(provider, provider_subject);
CREATE INDEX IF NOT EXISTS idx_auth_identities_provider_email ON auth_identities(provider_email) WHERE provider_email IS NOT NULL;

-- Migrate existing Google OAuth data from users table to auth_identities
-- Only migrate users that have google_id set
INSERT INTO auth_identities (user_id, provider, provider_subject, provider_email, email_verified, created_at, updated_at)
SELECT 
  id,
  'google',
  google_id,
  email,
  COALESCE(email_verified, true) as email_verified, -- Assume existing users are verified
  created_at,
  COALESCE(last_login, created_at) as updated_at
FROM users
WHERE google_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM auth_identities ai 
    WHERE ai.user_id = users.id AND ai.provider = 'google'
  );

-- Migrate existing email/password users to auth_identities
-- Users with password_hash but no google_id are email_password users
INSERT INTO auth_identities (user_id, provider, provider_subject, provider_email, email_verified, created_at, updated_at)
SELECT 
  id,
  'email_password',
  LOWER(TRIM(email)), -- Use normalized email as provider_subject
  email,
  COALESCE(email_verified, false) as email_verified,
  created_at,
  COALESCE(last_login, created_at) as updated_at
FROM users
WHERE email IS NOT NULL
  AND password_hash IS NOT NULL
  AND google_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM auth_identities ai 
    WHERE ai.user_id = users.id AND ai.provider = 'email_password'
  );

-- Add comments for documentation
COMMENT ON TABLE auth_identities IS 'Normalized authentication identities - supports multiple auth methods per user';
COMMENT ON COLUMN auth_identities.provider IS 'Authentication provider: google, email_password, email_magiclink';
COMMENT ON COLUMN auth_identities.provider_subject IS 'Provider-specific subject identifier (Google sub, normalized email)';
COMMENT ON COLUMN auth_identities.provider_email IS 'Email associated with this identity (may differ from user.email)';
COMMENT ON COLUMN auth_identities.email_verified IS 'Whether the email for this identity is verified';

COMMIT;

