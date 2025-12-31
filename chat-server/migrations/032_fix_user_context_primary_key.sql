-- Migration: 032_fix_user_context_primary_key.sql
-- Purpose: Complete migration from user_id (TEXT) to user_email (TEXT) as primary key
-- Related: Migration 028 added user_email column but kept user_id as primary key
-- Created: 2025-12-30

-- =============================================================================
-- PART 1: Ensure all rows have user_email (with proper error handling)
-- =============================================================================

-- Migrate any remaining rows that don't have user_email
-- This handles edge cases where migration 028 didn't catch everything
DO $$
BEGIN
  UPDATE user_context uc
  SET user_email = (
    SELECT u.email 
    FROM users u 
    WHERE LOWER(u.username) = LOWER(uc.user_id)
    LIMIT 1
  )
  WHERE uc.user_email IS NULL AND uc.user_id IS NOT NULL;

  -- For any rows that still don't have user_email, use a placeholder
  -- (These should be rare - only if user was deleted but context remains)
  UPDATE user_context
  SET user_email = COALESCE(
    user_email,
    'migrated_' || SUBSTRING(user_id, 1, 8) || '@migration.placeholder'
  )
  WHERE user_email IS NULL;

  -- Verify no NULL values remain before setting NOT NULL
  IF EXISTS (SELECT 1 FROM user_context WHERE user_email IS NULL) THEN
    RAISE EXCEPTION 'Cannot proceed: user_email still has NULL values';
  END IF;
END $$;

-- Make user_email NOT NULL (only if not already)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_context' 
    AND column_name = 'user_email' 
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE user_context ALTER COLUMN user_email SET NOT NULL;
  END IF;
END $$;

-- =============================================================================
-- PART 2: Change primary key from user_id to user_email
-- =============================================================================

-- Step 1: Drop any indexes that depend on user_id (they'll be recreated if needed)
DO $$
DECLARE
  idx_record RECORD;
BEGIN
  FOR idx_record IN 
    SELECT indexname 
    FROM pg_indexes 
    WHERE tablename = 'user_context' 
    AND indexdef LIKE '%user_id%'
    AND indexname != 'user_context_pkey'
  LOOP
    EXECUTE 'DROP INDEX IF EXISTS ' || quote_ident(idx_record.indexname);
  END LOOP;
END $$;

-- Step 2: Drop the old primary key constraint (must be done before dropping column)
DO $$
BEGIN
  -- Check if primary key exists and is on user_id
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'user_context'::regclass 
    AND contype = 'p'
    AND conkey::text LIKE '%user_id%'
  ) THEN
    ALTER TABLE user_context DROP CONSTRAINT user_context_pkey;
  END IF;
END $$;

-- Step 3: Drop the old user_id column (no longer needed)
-- Note: This is safe because:
-- 1. Migration 028 already migrated all data to user_email
-- 2. All code now uses user_email (see userContext.js, context.js)
-- 3. user_id was TEXT (stored username), not INTEGER user ID
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_context' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE user_context DROP COLUMN user_id;
  END IF;
END $$;

-- Step 4: Make user_email the primary key (only if not already)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'user_context'::regclass 
    AND contype = 'p'
    AND conkey::text LIKE '%user_email%'
  ) THEN
    ALTER TABLE user_context ADD PRIMARY KEY (user_email);
  END IF;
END $$;

-- Step 5: Ensure unique index exists (migration 028 should have created this, but ensure it)
CREATE UNIQUE INDEX IF NOT EXISTS user_context_user_email_unique ON user_context(user_email);

-- =============================================================================
-- PART 3: Add foreign key constraint (optional but recommended)
-- =============================================================================

-- Add foreign key to users.email for referential integrity
-- Note: This requires users.email to be unique (which migration 028 ensured)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'user_context'::regclass
    AND conname = 'fk_user_context_user_email'
  ) THEN
    -- Check if users.email is unique (required for foreign key)
    IF EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conrelid = 'users'::regclass 
      AND contype = 'u'
      AND conkey::text LIKE '%email%'
    ) THEN
      ALTER TABLE user_context
      ADD CONSTRAINT fk_user_context_user_email
      FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE;
      
      RAISE NOTICE 'Added foreign key constraint on user_context.user_email';
    ELSE
      RAISE NOTICE 'Skipping foreign key: users.email is not unique';
    END IF;
  ELSE
    RAISE NOTICE 'Foreign key constraint already exists';
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- If foreign key creation fails (e.g., duplicate emails, missing users), log but don't fail
  RAISE NOTICE 'Could not add foreign key constraint: %', SQLERRM;
END $$;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
--
-- SUMMARY OF CHANGES:
-- 1. Ensured all rows have user_email (migrated from user_id if needed)
-- 2. Dropped old user_id TEXT column (was storing username, not user ID)
-- 3. Changed primary key from user_id to user_email
-- 4. Added foreign key constraint to users.email (optional)
--
-- BENEFITS:
-- - user_context now uses email as identifier (consistent with rest of system)
-- - Removed TEXT user_id column that was confusing (stored username, not ID)
-- - Better referential integrity with foreign key constraint
-- - Matches code usage (all code uses user_email, not user_id)
--

