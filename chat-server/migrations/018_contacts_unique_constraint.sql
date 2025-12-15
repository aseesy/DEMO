-- Migration: Add unique constraint to contacts table
-- Required for ON CONFLICT upsert in pairing acceptance
-- Prevents duplicate co-parent contacts per user

-- Add unique constraint on (user_id, contact_email) if not exists
-- This allows INSERT...ON CONFLICT to work correctly
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'contacts_user_email_unique'
    ) THEN
        -- First, remove any existing duplicates (keep the most recent)
        DELETE FROM contacts a
        USING contacts b
        WHERE a.id < b.id
          AND a.user_id = b.user_id
          AND LOWER(a.contact_email) = LOWER(b.contact_email)
          AND a.contact_email IS NOT NULL
          AND b.contact_email IS NOT NULL;

        -- Now add the unique constraint
        ALTER TABLE contacts
        ADD CONSTRAINT contacts_user_email_unique
        UNIQUE (user_id, contact_email);
    END IF;
END $$;

-- Add index for faster lookups by email (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_contacts_user_email_lower
ON contacts(user_id, LOWER(contact_email));

COMMENT ON CONSTRAINT contacts_user_email_unique ON contacts IS
'Ensures each user can only have one contact entry per email address';
