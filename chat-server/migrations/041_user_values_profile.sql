-- Migration 041: Create user_values_profile table
-- Created: 2025-01-04
-- Description: Creates table for storing learned user values, stances, and motivations
--              Previously created at runtime in valuesProfile.js - now standardized via migration

-- ============================================================================
-- PART 1: Create user_values_profile table
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_values_profile (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

  -- Learned values with confidence scores (0-100)
  values_scores JSONB DEFAULT '{}',

  -- Specific stances on topics
  stances JSONB DEFAULT '[]',

  -- Self-image keywords
  self_image JSONB DEFAULT '[]',

  -- Non-negotiables (explicitly stated or strongly inferred)
  non_negotiables JSONB DEFAULT '[]',

  -- Motivations (why they care about things)
  motivations JSONB DEFAULT '[]',

  -- Message count used for learning
  messages_analyzed INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(user_id)
);

-- ============================================================================
-- PART 2: Create indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_values_profile_user_id ON user_values_profile(user_id);
CREATE INDEX IF NOT EXISTS idx_user_values_profile_updated ON user_values_profile(updated_at);

-- ============================================================================
-- PART 3: Add table comments
-- ============================================================================

COMMENT ON TABLE user_values_profile IS 'Stores learned user values, stances, motivations, and non-negotiables for AI mediation';
COMMENT ON COLUMN user_values_profile.values_scores IS 'JSONB mapping value names to confidence scores (0-100)';
COMMENT ON COLUMN user_values_profile.stances IS 'JSONB array of specific stances on topics';
COMMENT ON COLUMN user_values_profile.non_negotiables IS 'JSONB array of explicitly stated or strongly inferred non-negotiable values';

