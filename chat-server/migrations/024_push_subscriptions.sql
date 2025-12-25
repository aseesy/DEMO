-- PostgreSQL Migration: Push Notification Subscriptions
-- Creates table for storing push notification subscriptions for PWA users
--
-- Feature: PWA Push Notifications
-- Allows users to receive push notifications on mobile devices when messages arrive

-- ============================================================================
-- PUSH SUBSCRIPTIONS TABLE
-- Stores Web Push API subscriptions for users
-- ============================================================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
    id SERIAL PRIMARY KEY,
    
    -- User who owns this subscription (INTEGER to match users.id SERIAL)
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Push subscription endpoint URL (unique per device/browser)
    endpoint TEXT NOT NULL UNIQUE,
    
    -- P256dh key (public key for encryption)
    p256dh TEXT NOT NULL,
    
    -- Auth secret (for encryption)
    auth TEXT NOT NULL,
    
    -- User agent for debugging
    user_agent TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    -- Soft delete flag (subscriptions can be disabled without deleting)
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_active ON push_subscriptions(user_id, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

-- Comments for documentation
COMMENT ON TABLE push_subscriptions IS 'Web Push API subscriptions for PWA push notifications';
COMMENT ON COLUMN push_subscriptions.endpoint IS 'Unique push service endpoint URL';
COMMENT ON COLUMN push_subscriptions.p256dh IS 'Public key for message encryption';
COMMENT ON COLUMN push_subscriptions.auth IS 'Authentication secret for message encryption';
COMMENT ON COLUMN push_subscriptions.is_active IS 'Whether this subscription is currently active';

