-- PostgreSQL Migration: Communication Profiles
-- Extends user_context table with sender-specific communication profile fields
-- for AI mediation that distinguishes between sender and receiver
--
-- Feature: 002-sender-profile-mediation
-- Constitutional Compliance: Library-First (profiles as standalone concept)

-- Add communication profile fields to user_context table
-- Using JSONB for flexibility and query performance

-- communication_patterns: Tracks how this user typically communicates
-- Example: {"tone_tendencies": ["direct", "formal"], "common_phrases": ["I need...", "Can we..."], "avg_message_length": 45}
ALTER TABLE user_context ADD COLUMN IF NOT EXISTS communication_patterns JSONB DEFAULT '{}'::jsonb;

-- triggers: What topics/phrases tend to cause this user stress or conflict
-- Example: {"topics": ["money", "schedule changes"], "phrases": ["you always", "you never"], "intensity": 0.7}
ALTER TABLE user_context ADD COLUMN IF NOT EXISTS triggers JSONB DEFAULT '{}'::jsonb;

-- successful_rewrites: History of AI suggestions this user accepted
-- Example: [{"original": "You never...", "rewrite": "I feel frustrated when...", "accepted_at": "2024-01-15T10:30:00Z"}]
ALTER TABLE user_context ADD COLUMN IF NOT EXISTS successful_rewrites JSONB DEFAULT '[]'::jsonb;

-- intervention_history: Record of AI interventions for this user
-- Example: {"total_interventions": 15, "accepted_count": 12, "acceptance_rate": 0.8, "last_intervention": "2024-01-15T10:30:00Z"}
ALTER TABLE user_context ADD COLUMN IF NOT EXISTS intervention_history JSONB DEFAULT '{}'::jsonb;

-- profile_version: For future schema migrations within the profile
ALTER TABLE user_context ADD COLUMN IF NOT EXISTS profile_version INTEGER DEFAULT 1;

-- last_profile_update: When the communication profile was last updated
ALTER TABLE user_context ADD COLUMN IF NOT EXISTS last_profile_update TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Create index for efficient profile queries
CREATE INDEX IF NOT EXISTS idx_user_context_profile_update ON user_context(last_profile_update);

-- Add comment for documentation
COMMENT ON COLUMN user_context.communication_patterns IS 'JSONB: User communication style patterns (tone, phrases, message length)';
COMMENT ON COLUMN user_context.triggers IS 'JSONB: Topics and phrases that cause stress for this user';
COMMENT ON COLUMN user_context.successful_rewrites IS 'JSONB: Array of accepted AI rewrite suggestions';
COMMENT ON COLUMN user_context.intervention_history IS 'JSONB: Statistics about AI interventions for this user';
COMMENT ON COLUMN user_context.profile_version IS 'Schema version for communication profile data';
COMMENT ON COLUMN user_context.last_profile_update IS 'Timestamp of last profile update for temporal decay';
