-- Migration 015: Add separation_details field to contacts
-- Adds separation_details text field for additional separation information
-- Created: 2025-12-14

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS separation_details TEXT;

COMMENT ON COLUMN contacts.separation_details IS 'Additional details about the separation';

