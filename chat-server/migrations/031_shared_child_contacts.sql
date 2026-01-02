-- Migration: 030_shared_child_contacts.sql
-- Purpose: Add tracking for shared child contacts between co-parents
-- When one parent adds a child contact, it should automatically be shared with their co-parent

-- Add column to track which user originally shared this contact
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS shared_from_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Add timestamp for when contact was shared
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS shared_at TIMESTAMP WITH TIME ZONE;

-- Index for efficient queries on shared contacts
CREATE INDEX IF NOT EXISTS idx_contacts_shared_from ON contacts(shared_from_user_id) WHERE shared_from_user_id IS NOT NULL;

-- Index for finding child contacts efficiently
CREATE INDEX IF NOT EXISTS idx_contacts_relationship ON contacts(user_id, relationship);

-- Comment explaining the sharing model
COMMENT ON COLUMN contacts.shared_from_user_id IS 'User ID of the co-parent who originally created this contact (NULL if created by owner)';
COMMENT ON COLUMN contacts.shared_at IS 'Timestamp when this contact was shared from co-parent (NULL if created by owner)';
