-- Migration 021: Add linked_user_id to contacts table
-- Links contacts to actual user accounts for AI context and relationship tracking
-- Created: 2025-12-21

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS linked_user_id INTEGER;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_contacts_linked_user_id ON contacts(linked_user_id);

-- Add foreign key constraint if users table exists
-- Note: This may fail if users table doesn't exist, which is fine
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    -- Check if constraint already exists
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'contacts_linked_user_id_fkey'
    ) THEN
      ALTER TABLE contacts 
      ADD CONSTRAINT contacts_linked_user_id_fkey 
      FOREIGN KEY (linked_user_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

