-- PostgreSQL Migration: Enhance Pairing Sessions for Production-Grade Invite System
-- Adds missing fields for proper invite management: revoked_at, max_uses, use_count, created_by
--
-- Feature: Production-Grade Invite System
-- Purpose: Support token revocation, usage tracking, and creator tracking

-- ============================================================================
-- ADD NEW COLUMNS TO pairing_sessions
-- ============================================================================

-- Track when invitation was revoked (if null, not revoked)
ALTER TABLE pairing_sessions 
ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMP WITH TIME ZONE;

-- Maximum number of uses (default 1 for single-use)
ALTER TABLE pairing_sessions 
ADD COLUMN IF NOT EXISTS max_uses INTEGER DEFAULT 1;

-- Current usage count (incremented on acceptance)
ALTER TABLE pairing_sessions 
ADD COLUMN IF NOT EXISTS use_count INTEGER DEFAULT 0;

-- Track who created the invitation (usually same as parent_a_id, but allows delegation)
ALTER TABLE pairing_sessions 
ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- ============================================================================
-- BACKFILL EXISTING DATA
-- ============================================================================

-- Set created_by to parent_a_id for existing records
UPDATE pairing_sessions 
SET created_by = parent_a_id 
WHERE created_by IS NULL;

-- Set max_uses = 1 and use_count = 0 for existing records
UPDATE pairing_sessions 
SET max_uses = 1, use_count = 0 
WHERE max_uses IS NULL OR use_count IS NULL;

-- Set use_count = 1 for already accepted invitations
UPDATE pairing_sessions 
SET use_count = 1 
WHERE status = 'active' AND use_count = 0;

-- ============================================================================
-- ADD CONSTRAINTS
-- ============================================================================

-- Ensure use_count doesn't exceed max_uses
ALTER TABLE pairing_sessions 
ADD CONSTRAINT chk_pairing_use_count CHECK (use_count <= max_uses);

-- Ensure max_uses is positive
ALTER TABLE pairing_sessions 
ADD CONSTRAINT chk_pairing_max_uses CHECK (max_uses > 0);

-- ============================================================================
-- ADD INDEXES
-- ============================================================================

-- Index for revoked invitations lookup
CREATE INDEX IF NOT EXISTS idx_pairing_revoked ON pairing_sessions(revoked_at) WHERE revoked_at IS NOT NULL;

-- Index for created_by lookups
CREATE INDEX IF NOT EXISTS idx_pairing_created_by ON pairing_sessions(created_by);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN pairing_sessions.revoked_at IS 'Timestamp when invitation was revoked (NULL if active)';
COMMENT ON COLUMN pairing_sessions.max_uses IS 'Maximum number of times this invitation can be used (default: 1)';
COMMENT ON COLUMN pairing_sessions.use_count IS 'Number of times this invitation has been used';
COMMENT ON COLUMN pairing_sessions.created_by IS 'User who created the invitation (usually same as parent_a_id)';


