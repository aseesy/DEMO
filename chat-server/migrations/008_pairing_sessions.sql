-- PostgreSQL Migration: Unified Pairing Sessions
-- Creates simplified pairing system to replace dual-table architecture
--
-- Feature: 004-account-pairing-refactor
-- Constitutional Compliance: Library-First, Contract-First, Idempotent Operations
-- Purpose: Simplify co-parent account linking with email, link, and code methods
--
-- This migration:
-- 1. Creates pairing_sessions table (unified pairing system)
-- 2. Creates pairing_audit_log table (legal/custody compliance)
-- 3. Adds indexes for performance
-- 4. Does NOT drop old tables (backward compatibility during transition)

-- ============================================================================
-- PAIRING SESSIONS TABLE
-- Unified storage for all co-parent pairing attempts
-- Replaces: pending_connections + room_invites (dual system)
-- ============================================================================

CREATE TABLE IF NOT EXISTS pairing_sessions (
    id SERIAL PRIMARY KEY,

    -- Unique pairing code (LZ-NNNNNN format, 6 digits)
    pairing_code VARCHAR(10) UNIQUE NOT NULL,

    -- Parent A: User who initiated the pairing
    parent_a_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Parent B: User who accepts the pairing (NULL until accepted)
    parent_b_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

    -- Email of invitee (for email-based invitations)
    parent_b_email TEXT,

    -- Status: pending | active | canceled | expired
    status VARCHAR(20) NOT NULL DEFAULT 'pending',

    -- Invitation method: email | link | code
    invite_type VARCHAR(20) NOT NULL,

    -- Secure token for link-based invites (SHA-256 hash stored)
    invite_token VARCHAR(64) UNIQUE,

    -- Display name for UI ("Join [Name] on LiaiZen")
    invited_by_username TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,

    -- Associated shared room (created on acceptance)
    shared_room_id TEXT REFERENCES rooms(id) ON DELETE SET NULL,

    -- Constraints
    CONSTRAINT chk_pairing_status CHECK (status IN ('pending', 'active', 'canceled', 'expired')),
    CONSTRAINT chk_pairing_invite_type CHECK (invite_type IN ('email', 'link', 'code')),
    CONSTRAINT chk_pairing_not_self CHECK (parent_a_id != parent_b_id OR parent_b_id IS NULL)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Primary lookup patterns
CREATE INDEX IF NOT EXISTS idx_pairing_code ON pairing_sessions(pairing_code);
CREATE INDEX IF NOT EXISTS idx_pairing_token ON pairing_sessions(invite_token);
CREATE INDEX IF NOT EXISTS idx_pairing_email ON pairing_sessions(parent_b_email);

-- User-based lookups (find all pairings for a user)
CREATE INDEX IF NOT EXISTS idx_pairing_parent_a ON pairing_sessions(parent_a_id);
CREATE INDEX IF NOT EXISTS idx_pairing_parent_b ON pairing_sessions(parent_b_id);

-- Status and expiration filtering
CREATE INDEX IF NOT EXISTS idx_pairing_status ON pairing_sessions(status);
CREATE INDEX IF NOT EXISTS idx_pairing_expires ON pairing_sessions(expires_at);

-- Composite index for finding pending pairings for a user
CREATE INDEX IF NOT EXISTS idx_pairing_pending_a ON pairing_sessions(parent_a_id, status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_pairing_pending_b ON pairing_sessions(parent_b_email, status) WHERE status = 'pending';

-- Active pairings lookup (for checking if already paired)
CREATE INDEX IF NOT EXISTS idx_pairing_active ON pairing_sessions(parent_a_id, parent_b_id, status) WHERE status = 'active';

-- ============================================================================
-- PAIRING AUDIT LOG TABLE
-- Comprehensive audit trail for legal/custody compliance
-- ============================================================================

CREATE TABLE IF NOT EXISTS pairing_audit_log (
    id SERIAL PRIMARY KEY,

    -- Reference to pairing session
    pairing_session_id INTEGER REFERENCES pairing_sessions(id) ON DELETE CASCADE,

    -- Action performed: created | accepted | declined | canceled | expired | resent
    action VARCHAR(50) NOT NULL,

    -- Who performed the action
    actor_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,

    -- Request metadata for security auditing
    ip_address INET,
    user_agent TEXT,

    -- When the action occurred
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Additional structured data (error details, previous values, etc.)
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for audit queries
CREATE INDEX IF NOT EXISTS idx_audit_session ON pairing_audit_log(pairing_session_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON pairing_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON pairing_audit_log(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON pairing_audit_log(timestamp);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE pairing_sessions IS 'Unified co-parent pairing system - replaces dual pending_connections/room_invites';
COMMENT ON COLUMN pairing_sessions.pairing_code IS 'Human-readable code (LZ-NNNNNN) for quick pairing';
COMMENT ON COLUMN pairing_sessions.parent_a_id IS 'User who initiated the pairing request';
COMMENT ON COLUMN pairing_sessions.parent_b_id IS 'User who accepted (NULL until acceptance)';
COMMENT ON COLUMN pairing_sessions.parent_b_email IS 'Email of invitee for email-based invitations';
COMMENT ON COLUMN pairing_sessions.status IS 'pending → active|canceled|expired';
COMMENT ON COLUMN pairing_sessions.invite_type IS 'email (7d), link (7d), or code (15min)';
COMMENT ON COLUMN pairing_sessions.invite_token IS 'SHA-256 hash of secure token for link invites';
COMMENT ON COLUMN pairing_sessions.shared_room_id IS 'Chat room created when pairing completes';

COMMENT ON TABLE pairing_audit_log IS 'Audit trail for all pairing operations (legal/custody compliance)';
COMMENT ON COLUMN pairing_audit_log.action IS 'created|accepted|declined|canceled|expired|resent';
COMMENT ON COLUMN pairing_audit_log.metadata IS 'JSONB: error details, previous values, context';

-- ============================================================================
-- HELPER VIEW: Active Pairing Status
-- Quick lookup of current pairing state for a user
-- ============================================================================

CREATE OR REPLACE VIEW user_pairing_status AS
SELECT
    u.id AS user_id,
    u.username,
    ps.id AS pairing_id,
    ps.pairing_code,
    ps.status,
    ps.invite_type,
    CASE
        WHEN ps.parent_a_id = u.id THEN 'initiator'
        WHEN ps.parent_b_id = u.id THEN 'acceptor'
        ELSE 'unknown'
    END AS user_role,
    CASE
        WHEN ps.parent_a_id = u.id THEN ps.parent_b_id
        ELSE ps.parent_a_id
    END AS partner_id,
    ps.shared_room_id,
    ps.created_at,
    ps.expires_at,
    ps.accepted_at,
    CASE
        WHEN ps.status = 'pending' AND ps.expires_at < CURRENT_TIMESTAMP THEN TRUE
        ELSE FALSE
    END AS is_expired
FROM users u
LEFT JOIN pairing_sessions ps ON (
    (ps.parent_a_id = u.id OR ps.parent_b_id = u.id)
    AND ps.status IN ('pending', 'active')
);

COMMENT ON VIEW user_pairing_status IS 'View of current pairing state for each user';

-- ============================================================================
-- NOTE: Old tables (invitations, pending_connections, room_invites) are NOT dropped.
-- They remain for backward compatibility during the 30-day transition period.
-- After transition, run: DROP TABLE invitations, pending_connections, room_invites;
-- ============================================================================
