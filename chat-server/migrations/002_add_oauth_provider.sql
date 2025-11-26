-- Add oauth_provider column to users table
-- This column stores the OAuth provider name (e.g., 'google') for users who sign in via OAuth

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'oauth_provider') THEN
    ALTER TABLE users ADD COLUMN oauth_provider TEXT;
    RAISE NOTICE 'Added oauth_provider column to users table';
  ELSE
    RAISE NOTICE 'oauth_provider column already exists';
  END IF;
END $$;
