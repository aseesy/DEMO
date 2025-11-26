-- PostgreSQL Migration: Invitations and In-App Notifications
-- Creates tables for co-parent invitation system with required invitation during signup
-- and in-app notifications for existing users
--
-- Feature: 003-account-creation-coparent-invitation
-- Constitutional Compliance: Library-First (invitations as standalone concept)
-- Backward Compatibility: Additive only - no modifications to existing tables

-- ============================================================================
-- INVITATIONS TABLE
-- Stores pending co-parent invitations with secure token hashing
-- ============================================================================

CREATE TABLE IF NOT EXISTS invitations (
    id SERIAL PRIMARY KEY,

    -- Token stored as hash for security (bcrypt or sha256)
    token_hash VARCHAR(255) NOT NULL UNIQUE,

    -- Who sent the invitation (INTEGER to match users.id SERIAL)
    inviter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Email of the person being invited
    invitee_email VARCHAR(255) NOT NULL,

    -- If invitee already has an account, store their user ID (INTEGER to match users.id)
    invitee_id INTEGER REFERENCES users(id) ON DELETE SET NULL,

    -- Status: pending, accepted, declined, expired, cancelled
    status VARCHAR(50) NOT NULL DEFAULT 'pending',

    -- Optional: Room ID if room is pre-created (TEXT to match rooms.id)
    room_id TEXT REFERENCES rooms(id) ON DELETE SET NULL,

    -- Metadata for tracking
    invitation_type VARCHAR(50) NOT NULL DEFAULT 'coparent',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,

    -- Prevent duplicate active invitations to same email from same inviter
    CONSTRAINT unique_active_invitation UNIQUE (inviter_id, invitee_email, status)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_invitations_token_hash ON invitations(token_hash);
CREATE INDEX IF NOT EXISTS idx_invitations_inviter_id ON invitations(inviter_id);
CREATE INDEX IF NOT EXISTS idx_invitations_invitee_email ON invitations(invitee_email);
CREATE INDEX IF NOT EXISTS idx_invitations_invitee_id ON invitations(invitee_id);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_expires_at ON invitations(expires_at);

-- Comments for documentation
COMMENT ON TABLE invitations IS 'Co-parent invitation system for required signup invitations';
COMMENT ON COLUMN invitations.token_hash IS 'SHA-256 hash of the invitation token (actual token sent via email)';
COMMENT ON COLUMN invitations.inviter_id IS 'User ID of the person who sent the invitation';
COMMENT ON COLUMN invitations.invitee_email IS 'Email address of the invited co-parent';
COMMENT ON COLUMN invitations.invitee_id IS 'User ID if invitee already has an account (for in-app notification)';
COMMENT ON COLUMN invitations.status IS 'pending|accepted|declined|expired|cancelled';
COMMENT ON COLUMN invitations.invitation_type IS 'Type of invitation: coparent (default)';

-- ============================================================================
-- IN-APP NOTIFICATIONS TABLE
-- Notifications displayed within the app (not email)
-- Used for existing users who receive co-parent invitations
-- ============================================================================

CREATE TABLE IF NOT EXISTS in_app_notifications (
    id SERIAL PRIMARY KEY,

    -- Who receives this notification (INTEGER to match users.id SERIAL)
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Notification type for filtering and display
    type VARCHAR(50) NOT NULL,

    -- Display content
    title VARCHAR(255) NOT NULL,
    message TEXT,

    -- JSONB for flexible additional data (invitation_id, action URLs, etc.)
    data JSONB DEFAULT '{}'::jsonb,

    -- Read status
    read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,

    -- Action taken (accepted, declined, dismissed, null if no action)
    action_taken VARCHAR(50),
    action_at TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Optional: Link to related invitation
    invitation_id INTEGER REFERENCES invitations(id) ON DELETE SET NULL
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON in_app_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON in_app_notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON in_app_notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON in_app_notifications(user_id, read) WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON in_app_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_invitation_id ON in_app_notifications(invitation_id);

-- Comments for documentation
COMMENT ON TABLE in_app_notifications IS 'In-app notifications for user actions and invitations';
COMMENT ON COLUMN in_app_notifications.type IS 'Notification type: coparent_invitation, invitation_accepted, etc.';
COMMENT ON COLUMN in_app_notifications.data IS 'JSONB: Additional data like invitation_id, action URLs';
COMMENT ON COLUMN in_app_notifications.action_taken IS 'User action: accepted|declined|dismissed|null';

-- ============================================================================
-- USER TABLE EXTENSION (Additive only)
-- Add field to track if user completed co-parent invitation during signup
-- ============================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS signup_invitation_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS signup_completed_at TIMESTAMP WITH TIME ZONE;

-- Index for finding users who haven't completed signup flow
CREATE INDEX IF NOT EXISTS idx_users_signup_invitation ON users(signup_invitation_sent) WHERE signup_invitation_sent = FALSE;

COMMENT ON COLUMN users.signup_invitation_sent IS 'Whether user sent required co-parent invitation during signup';
COMMENT ON COLUMN users.signup_completed_at IS 'When user completed full signup flow including invitation';

-- ============================================================================
-- HELPER VIEW: Active Invitations
-- Combines invitation data with user info for easy querying
-- ============================================================================

CREATE OR REPLACE VIEW active_invitations AS
SELECT
    i.id,
    i.token_hash,
    i.inviter_id,
    u.username AS inviter_name,
    u.email AS inviter_email,
    i.invitee_email,
    i.invitee_id,
    i.status,
    i.room_id,
    i.invitation_type,
    i.created_at,
    i.expires_at,
    i.accepted_at,
    CASE
        WHEN i.expires_at < CURRENT_TIMESTAMP THEN TRUE
        ELSE FALSE
    END AS is_expired
FROM invitations i
JOIN users u ON i.inviter_id = u.id
WHERE i.status = 'pending';

COMMENT ON VIEW active_invitations IS 'View of pending invitations with inviter details';
