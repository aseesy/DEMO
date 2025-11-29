-- Migration 011: Extended Contact Fields
-- Adds child-specific and relationship fields to contacts table
-- Created: 2025-11-29

-- Child-specific fields
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS child_birthdate TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS child_age TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS school TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS school_address TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS school_lat DECIMAL(10, 8);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS school_lng DECIMAL(11, 8);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS custody_arrangement TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS linked_contact_id INTEGER;

-- Partner relationship fields
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS partner_duration TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS has_children TEXT;

-- Co-parent relationship fields
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS separation_date TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS difficult_aspects TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS friction_situations TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS legal_matters TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS safety_concerns TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS substance_mental_health TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS neglect_abuse_concerns TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS additional_thoughts TEXT;

-- General contact fields
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS relationship_history TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS communication_challenges TEXT;
