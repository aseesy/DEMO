-- Migration 020: Partner Living Together Fields
-- Adds fields for tracking living together status, since date, and relationship notes for partner contacts
-- Created: 2025-12-21

-- Partner relationship fields
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS partner_living_together TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS partner_living_together_since TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS partner_relationship_notes TEXT;

