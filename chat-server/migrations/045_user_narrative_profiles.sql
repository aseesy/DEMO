-- Migration 045: Create user_narrative_profiles table
-- Created: 2025-01-04
-- Description: Stores narrative memory for each user in a room.
--              Part of the Dual-Brain AI Mediator architecture.
--              This is the "Therapist Pass" - understanding what happened,
--              beliefs, patterns, and historical wounds from the user's perspective.

-- ============================================================================
-- PART 1: Create user_narrative_profiles table
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_narrative_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,

  -- Core beliefs (extracted by AI from message history)
  -- e.g., ["fairness", "respect", "consistency", "child wellbeing"]
  core_values JSONB DEFAULT '[]',

  -- Known triggers (phrases/topics that upset this user)
  -- e.g., ["accusations of laziness", "money topics", "schedule changes"]
  known_triggers JSONB DEFAULT '[]',

  -- Communication patterns (how they express themselves)
  -- e.g., {"uses_absolutes": 0.8, "defensive_language": 0.3, "collaborative": 0.6}
  communication_patterns JSONB DEFAULT '{}',

  -- Recurring complaints (historical pain points)
  -- e.g., ["feeling unheard", "schedule not being followed", "lack of communication"]
  recurring_complaints JSONB DEFAULT '[]',

  -- Conflict themes (topics that cause tension in this room)
  -- e.g., ["custody transitions", "finances", "new partners", "school decisions"]
  conflict_themes JSONB DEFAULT '[]',

  -- Profile embedding for semantic search
  -- Embedding of the overall profile text for finding similar situations
  profile_embedding REAL[],

  -- Analysis metadata
  last_analyzed_at TIMESTAMP WITH TIME ZONE,
  message_count_analyzed INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Each user has one profile per room
  UNIQUE(user_id, room_id)
);

-- ============================================================================
-- PART 2: Create indexes
-- ============================================================================

-- Fast lookup by user and room
CREATE INDEX IF NOT EXISTS idx_user_narrative_profiles_user_room
ON user_narrative_profiles(user_id, room_id);

-- Index on last_analyzed_at for finding stale profiles
-- Note: Partial index with NOW() removed because NOW() is not immutable
-- Application code should query: WHERE last_analyzed_at IS NULL OR last_analyzed_at < NOW() - INTERVAL '7 days'
CREATE INDEX IF NOT EXISTS idx_user_narrative_profiles_last_analyzed
ON user_narrative_profiles(last_analyzed_at);

-- Index for updated_at to find recently changed profiles
CREATE INDEX IF NOT EXISTS idx_user_narrative_profiles_updated
ON user_narrative_profiles(updated_at DESC);

-- ============================================================================
-- PART 3: Create trigger for updated_at
-- ============================================================================

-- Create function to update timestamp if it doesn't exist
CREATE OR REPLACE FUNCTION update_user_narrative_profiles_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists and recreate
DROP TRIGGER IF EXISTS update_user_narrative_profiles_timestamp ON user_narrative_profiles;
CREATE TRIGGER update_user_narrative_profiles_timestamp
  BEFORE UPDATE ON user_narrative_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_narrative_profiles_timestamp();

-- ============================================================================
-- PART 4: Add table comments
-- ============================================================================

COMMENT ON TABLE user_narrative_profiles IS 'Narrative memory for each user - beliefs, triggers, patterns. Part of Dual-Brain AI Mediator.';
COMMENT ON COLUMN user_narrative_profiles.core_values IS 'JSONB array of core values extracted from message history';
COMMENT ON COLUMN user_narrative_profiles.known_triggers IS 'JSONB array of phrases/topics that trigger this user';
COMMENT ON COLUMN user_narrative_profiles.communication_patterns IS 'JSONB object with communication pattern scores (0-1)';
COMMENT ON COLUMN user_narrative_profiles.recurring_complaints IS 'JSONB array of historical pain points';
COMMENT ON COLUMN user_narrative_profiles.conflict_themes IS 'JSONB array of topics that cause tension';
COMMENT ON COLUMN user_narrative_profiles.profile_embedding IS 'OpenAI embedding of profile summary for semantic search';
COMMENT ON COLUMN user_narrative_profiles.message_count_analyzed IS 'Number of messages analyzed to create this profile';

-- ============================================================================
-- EXAMPLE USAGE
-- ============================================================================
--
-- Insert/update profile:
-- INSERT INTO user_narrative_profiles (user_id, room_id, core_values, known_triggers)
-- VALUES (1, 'room-123', '["fairness", "consistency"]', '["money topics"]')
-- ON CONFLICT (user_id, room_id)
-- DO UPDATE SET
--   core_values = EXCLUDED.core_values,
--   known_triggers = EXCLUDED.known_triggers,
--   last_analyzed_at = NOW();
--
-- Query user's triggers:
-- SELECT known_triggers FROM user_narrative_profiles
-- WHERE user_id = 1 AND room_id = 'room-123';
--
