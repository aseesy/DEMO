-- Migration: Add missing profile columns to users table
-- This migration ensures all profile columns exist, even if database was created with fallback migration

-- Add profile columns if they don't exist (for existing databases)
DO $$
BEGIN
  -- Add first_name column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'first_name') THEN
    ALTER TABLE users ADD COLUMN first_name TEXT;
    RAISE NOTICE 'Added first_name column to users table';
  END IF;

  -- Add last_name column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_name') THEN
    ALTER TABLE users ADD COLUMN last_name TEXT;
    RAISE NOTICE 'Added last_name column to users table';
  END IF;

  -- Add display_name column (if not already added by 001_initial_schema.sql)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'display_name') THEN
    ALTER TABLE users ADD COLUMN display_name TEXT;
    RAISE NOTICE 'Added display_name column to users table';
  END IF;

  -- Add address column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'address') THEN
    ALTER TABLE users ADD COLUMN address TEXT;
    RAISE NOTICE 'Added address column to users table';
  END IF;

  -- Add household_members column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'household_members') THEN
    ALTER TABLE users ADD COLUMN household_members TEXT;
    RAISE NOTICE 'Added household_members column to users table';
  END IF;

  -- Add occupation column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'occupation') THEN
    ALTER TABLE users ADD COLUMN occupation TEXT;
    RAISE NOTICE 'Added occupation column to users table';
  END IF;

  -- Add communication_style column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'communication_style') THEN
    ALTER TABLE users ADD COLUMN communication_style TEXT;
    RAISE NOTICE 'Added communication_style column to users table';
  END IF;

  -- Add communication_triggers column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'communication_triggers') THEN
    ALTER TABLE users ADD COLUMN communication_triggers TEXT;
    RAISE NOTICE 'Added communication_triggers column to users table';
  END IF;

  -- Add communication_goals column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'communication_goals') THEN
    ALTER TABLE users ADD COLUMN communication_goals TEXT;
    RAISE NOTICE 'Added communication_goals column to users table';
  END IF;

  -- Add last_login column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_login') THEN
    ALTER TABLE users ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Added last_login column to users table';
  END IF;
END $$;

