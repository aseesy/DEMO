-- PostgreSQL Migration: Add short codes to invitations
-- Adds human-readable short codes for easier sharing (e.g., LZ-ABC123)
--
-- Feature: 003-account-creation-coparent-invitation
-- Constitutional Compliance: Additive only - no modifications to existing data

-- Add short_code column to invitations table
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS short_code VARCHAR(20) UNIQUE;

-- Index for fast lookup by short code
CREATE INDEX IF NOT EXISTS idx_invitations_short_code ON invitations(short_code);

-- Comment for documentation
COMMENT ON COLUMN invitations.short_code IS 'Human-readable short code for sharing (e.g., LZ-ABC123)';
