-- Migration 028: Replace username with email as primary identifier
-- This migration transitions the system from username-based to email-based identification
-- Username field is kept nullable for backward compatibility during transition

-- =============================================================================
-- PART 1: Ensure all users have email (required for migration)
-- =============================================================================

-- First, ensure email is set for all users (use a placeholder if missing)
DO $$
BEGIN
  UPDATE users 
  SET email = COALESCE(email, 'user_' || id || '@migration.placeholder')
  WHERE email IS NULL OR email = '';
  
  -- Make email NOT NULL
  ALTER TABLE users ALTER COLUMN email SET NOT NULL;
  
  -- Ensure email is unique (should already be, but enforce it)
  CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users(email) WHERE email IS NOT NULL;
END $$;

-- =============================================================================
-- PART 2: Update messages table to use user_email instead of username
-- =============================================================================

-- Add user_email column to messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS user_email TEXT;

-- Migrate existing data: populate user_email from username by joining with users table
UPDATE messages m
SET user_email = (
  SELECT u.email 
  FROM users u 
  WHERE LOWER(u.username) = LOWER(m.username)
  LIMIT 1
)
WHERE m.user_email IS NULL AND m.username IS NOT NULL;

-- For messages where we can't find a matching user, use a placeholder
UPDATE messages
SET user_email = COALESCE(user_email, 'unknown_' || SUBSTRING(id, 1, 8) || '@migration.placeholder')
WHERE user_email IS NULL;

-- Make user_email NOT NULL
ALTER TABLE messages ALTER COLUMN user_email SET NOT NULL;

-- Add index for user_email lookups
CREATE INDEX IF NOT EXISTS idx_messages_user_email ON messages(user_email);

-- =============================================================================
-- PART 3: Update user_context table to use email instead of username
-- =============================================================================

-- Add new column for email-based user_id
ALTER TABLE user_context ADD COLUMN IF NOT EXISTS user_email TEXT;

-- Migrate existing data: populate user_email from user_id (which stores username)
UPDATE user_context uc
SET user_email = (
  SELECT u.email 
  FROM users u 
  WHERE LOWER(u.username) = LOWER(uc.user_id)
  LIMIT 1
)
WHERE uc.user_email IS NULL AND uc.user_id IS NOT NULL;

-- Make user_email the primary key (we'll drop the old one)
-- First, ensure all rows have user_email
UPDATE user_context
SET user_email = COALESCE(user_email, 'unknown_' || SUBSTRING(user_id, 1, 8) || '@migration.placeholder')
WHERE user_email IS NULL;

-- Create unique index on user_email
CREATE UNIQUE INDEX IF NOT EXISTS user_context_user_email_unique ON user_context(user_email);

-- =============================================================================
-- PART 4: Update message_flags table
-- =============================================================================

-- Add flagged_by_email column
ALTER TABLE message_flags ADD COLUMN IF NOT EXISTS flagged_by_email TEXT;

-- Migrate existing data
UPDATE message_flags mf
SET flagged_by_email = (
  SELECT u.email 
  FROM users u 
  WHERE LOWER(u.username) = LOWER(mf.flagged_by_username)
  LIMIT 1
)
WHERE mf.flagged_by_email IS NULL AND mf.flagged_by_username IS NOT NULL;

-- =============================================================================
-- PART 5: Update threads table (created_by field)
-- =============================================================================

-- Add created_by_email column
ALTER TABLE threads ADD COLUMN IF NOT EXISTS created_by_email TEXT;

-- Migrate existing data
UPDATE threads t
SET created_by_email = (
  SELECT u.email 
  FROM users u 
  WHERE LOWER(u.username) = LOWER(t.created_by)
  LIMIT 1
)
WHERE t.created_by_email IS NULL AND t.created_by IS NOT NULL;

-- =============================================================================
-- PART 6: Make username nullable (for backward compatibility)
-- =============================================================================

-- Remove NOT NULL constraint from username (keep it for backward compatibility)
ALTER TABLE users ALTER COLUMN username DROP NOT NULL;

-- Remove unique constraint from username (email is now the unique identifier)
-- In PostgreSQL, UNIQUE creates both a constraint and index with the same name
-- Must drop constraint first, then index
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_username_key;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_username_unique;
DROP INDEX IF EXISTS users_username_unique;
DROP INDEX IF EXISTS users_username_key;

-- =============================================================================
-- NOTES FOR CODE MIGRATION:
-- =============================================================================
-- After this migration:
-- 1. All new code should use email instead of username
-- 2. Display names should use first_name + last_name
-- 3. Old username field can be removed in a future migration after code is updated
-- 4. user_context.user_id can be migrated to user_email in a future migration

