-- Migration 033: Schema Cleanup - Remove Deprecated Columns
-- Created: 2025-12-29
-- Description: Removes deprecated columns that have been replaced by newer alternatives
--              WARNING: This migration should ONLY be run AFTER code migration is complete
--
-- Deprecated columns being removed:
-- 1. users.username (replaced by email in migration 028)
-- 2. messages.username (replaced by user_email in migration 028)
-- 3. threads.created_by (replaced by created_by_email in migration 028)
--
-- Legacy tables (commented out - verify before dropping):
-- - pending_connections (replaced by pairing_sessions)
-- - room_invites (replaced by pairing_sessions)
-- - invitations (replaced by pairing_sessions)

-- ============================================================================
-- WARNING: VERIFY CODE MIGRATION BEFORE RUNNING
-- ============================================================================
-- This migration removes columns that may still be referenced in code.
-- Before running:
-- 1. Verify all code uses email/user_email instead of username
-- 2. Verify all code uses created_by_email instead of created_by
-- 3. Run code search: grep -r "\.username" chat-server/src
-- 4. Run code search: grep -r "\.created_by" chat-server/src
-- 5. Ensure no queries reference these columns
-- ============================================================================

-- ============================================================================
-- PART 1: REMOVE DEPRECATED COLUMNS
-- ============================================================================

-- Remove users.username column (replaced by email)
-- WARNING: This will fail if any code still references users.username
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'username'
  ) THEN
    -- Check if there are any non-null usernames (safety check)
    IF EXISTS (SELECT 1 FROM users WHERE username IS NOT NULL AND username != '') THEN
      RAISE WARNING 'Found non-null usernames in users table. Verify code migration is complete before dropping.';
      RAISE WARNING 'To proceed, uncomment the ALTER TABLE statement below after verification.';
      -- Uncomment after verification:
      -- ALTER TABLE users DROP COLUMN IF EXISTS username;
      -- RAISE NOTICE 'Dropped users.username column';
    ELSE
      ALTER TABLE users DROP COLUMN IF EXISTS username;
      RAISE NOTICE 'Dropped users.username column (all values were NULL)';
    END IF;
  ELSE
    RAISE NOTICE 'users.username column does not exist, skipping';
  END IF;
END $$;

-- Remove messages.username column (replaced by user_email)
-- WARNING: This will fail if any code still references messages.username
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'username'
  ) THEN
    -- Check if there are any non-null usernames (safety check)
    IF EXISTS (SELECT 1 FROM messages WHERE username IS NOT NULL AND username != '') THEN
      RAISE WARNING 'Found non-null usernames in messages table. Verify code migration is complete before dropping.';
      RAISE WARNING 'To proceed, uncomment the ALTER TABLE statement below after verification.';
      -- Uncomment after verification:
      -- ALTER TABLE messages DROP COLUMN IF EXISTS username;
      -- RAISE NOTICE 'Dropped messages.username column';
    ELSE
      ALTER TABLE messages DROP COLUMN IF EXISTS username;
      RAISE NOTICE 'Dropped messages.username column (all values were NULL)';
    END IF;
  ELSE
    RAISE NOTICE 'messages.username column does not exist, skipping';
  END IF;
END $$;

-- Remove threads.created_by column (replaced by created_by_email)
-- WARNING: This will fail if any code still references threads.created_by
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'threads' AND column_name = 'created_by'
  ) THEN
    -- Check if created_by_email is populated for all rows
    IF EXISTS (
      SELECT 1 FROM threads 
      WHERE created_by IS NOT NULL 
      AND (created_by_email IS NULL OR created_by_email = '')
    ) THEN
      RAISE WARNING 'Found threads with created_by but no created_by_email. Migrate data first.';
      RAISE WARNING 'To proceed, uncomment the ALTER TABLE statement below after data migration.';
      -- Uncomment after verification:
      -- ALTER TABLE threads DROP COLUMN IF EXISTS created_by;
      -- RAISE NOTICE 'Dropped threads.created_by column';
    ELSE
      ALTER TABLE threads DROP COLUMN IF EXISTS created_by;
      RAISE NOTICE 'Dropped threads.created_by column (created_by_email is populated)';
    END IF;
  ELSE
    RAISE NOTICE 'threads.created_by column does not exist, skipping';
  END IF;
END $$;

-- ============================================================================
-- PART 2: DROP DEPRECATED INDEXES
-- ============================================================================

-- Drop index on messages.username (if it exists)
DROP INDEX IF EXISTS idx_messages_username_timestamp;

-- Drop index on users.username (if it exists)
DROP INDEX IF EXISTS users_username_key;
DROP INDEX IF EXISTS users_username_unique;

-- ============================================================================
-- PART 3: LEGACY TABLE MIGRATION (COMMENTED OUT - VERIFY FIRST)
-- ============================================================================

-- NOTE: The following tables may still be in use. Verify before dropping:
-- - pending_connections (replaced by pairing_sessions in migration 008)
-- - room_invites (replaced by pairing_sessions in migration 008)
-- - invitations (replaced by pairing_sessions in migration 008)

-- To migrate data from legacy tables to pairing_sessions:
-- 1. Verify pairing_sessions table has all necessary columns
-- 2. Migrate data from pending_connections/room_invites to pairing_sessions
-- 3. Verify no code references legacy tables
-- 4. Uncomment the DROP TABLE statements below

/*
-- Migrate pending_connections to pairing_sessions (if not already done)
INSERT INTO pairing_sessions (
  parent_a_id,
  parent_b_email,
  status,
  invite_type,
  created_at,
  expires_at
)
SELECT 
  inviter_id,
  invitee_email,
  CASE 
    WHEN status = 'pending' THEN 'pending'
    WHEN status = 'accepted' THEN 'active'
    ELSE 'expired'
  END,
  'email',
  created_at,
  COALESCE(expires_at, created_at + INTERVAL '7 days')
FROM pending_connections
WHERE NOT EXISTS (
  SELECT 1 FROM pairing_sessions ps
  WHERE ps.parent_a_id = pending_connections.inviter_id
  AND ps.parent_b_email = pending_connections.invitee_email
);

-- Migrate room_invites to pairing_sessions (if not already done)
INSERT INTO pairing_sessions (
  parent_a_id,
  parent_b_email,
  status,
  invite_type,
  invite_token,
  created_at,
  expires_at,
  shared_room_id
)
SELECT 
  invited_by,
  NULL, -- room_invites doesn't have email, would need to look up
  CASE 
    WHEN status = 'pending' THEN 'pending'
    WHEN status = 'accepted' THEN 'active'
    ELSE 'expired'
  END,
  'link',
  invite_code, -- Use invite_code as token
  created_at,
  expires_at,
  room_id
FROM room_invites
WHERE NOT EXISTS (
  SELECT 1 FROM pairing_sessions ps
  WHERE ps.invite_token = room_invites.invite_code
);

-- After data migration and code verification, drop legacy tables:
-- DROP TABLE IF EXISTS pending_connections CASCADE;
-- DROP TABLE IF EXISTS room_invites CASCADE;
-- DROP TABLE IF EXISTS invitations CASCADE;
*/

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify deprecated columns were removed
DO $$
DECLARE
  username_col_exists BOOLEAN;
  created_by_col_exists BOOLEAN;
BEGIN
  -- Check users.username
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'username'
  ) INTO username_col_exists;
  
  -- Check messages.username
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'username'
  ) INTO username_col_exists;
  
  -- Check threads.created_by
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'threads' AND column_name = 'created_by'
  ) INTO created_by_col_exists;
  
  IF NOT username_col_exists AND NOT created_by_col_exists THEN
    RAISE NOTICE 'All deprecated columns removed successfully ✓';
  ELSE
    RAISE WARNING 'Some deprecated columns still exist. Verify code migration before proceeding.';
  END IF;
END $$;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS
-- ============================================================================
-- If you need to rollback this migration:
-- 1. Restore columns from backup
-- 2. Or recreate columns:
--    ALTER TABLE users ADD COLUMN username TEXT;
--    ALTER TABLE messages ADD COLUMN username TEXT;
--    ALTER TABLE threads ADD COLUMN created_by TEXT;
-- 3. Re-populate data from user_email/created_by_email if needed
-- ============================================================================

