-- Migration 043: Create user_insights table
-- Created: 2025-01-04
-- Description: Creates table for storing user insights (observations and suggestions)
--              Previously created at runtime in userIntelligence.js - now standardized via migration

-- ============================================================================
-- PART 1: Create user_insights table
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_insights (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  room_id TEXT,
  
  -- Insight details
  insight_type TEXT,
  observation TEXT,
  suggestion TEXT,
  
  -- User interaction tracking
  shown_to_user BOOLEAN DEFAULT FALSE,
  user_found_helpful BOOLEAN,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PART 2: Create indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_insights_user_id ON user_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_user_insights_room_id ON user_insights(room_id);
CREATE INDEX IF NOT EXISTS idx_user_insights_shown ON user_insights(shown_to_user);
CREATE INDEX IF NOT EXISTS idx_user_insights_user_shown ON user_insights(user_id, shown_to_user);
CREATE INDEX IF NOT EXISTS idx_user_insights_created ON user_insights(created_at);

-- ============================================================================
-- PART 3: Add table comments
-- ============================================================================

COMMENT ON TABLE user_insights IS 'Stores AI-generated insights (observations and suggestions) for users';
COMMENT ON COLUMN user_insights.shown_to_user IS 'Whether this insight has been shown to the user';
COMMENT ON COLUMN user_insights.user_found_helpful IS 'Whether the user marked this insight as helpful (NULL if not yet rated)';

