-- Migration 042: Create user_intelligence table
-- Created: 2025-01-04
-- Description: Creates table for storing user intelligence (communication patterns, triggers, emotional patterns)
--              Previously created at runtime in userIntelligence.js - now standardized via migration
--              Used as PostgreSQL fallback when Neo4j is unavailable

-- ============================================================================
-- PART 1: Create user_intelligence table
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_intelligence (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  
  -- Analysis metrics
  messages_analyzed INTEGER DEFAULT 0,
  
  -- Communication patterns (JSONB for flexibility)
  communication_styles JSONB DEFAULT '{}',
  
  -- Triggers (what causes stress/conflict)
  triggers JSONB DEFAULT '{}',
  
  -- Emotional patterns
  emotional_patterns JSONB DEFAULT '{}',
  
  -- Values
  values JSONB DEFAULT '{}',
  
  -- Timestamps
  last_analyzed TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PART 2: Create indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_intelligence_user_id ON user_intelligence(user_id);
CREATE INDEX IF NOT EXISTS idx_user_intelligence_updated ON user_intelligence(updated_at);
CREATE INDEX IF NOT EXISTS idx_user_intelligence_last_analyzed ON user_intelligence(last_analyzed);

-- ============================================================================
-- PART 3: Add table comments
-- ============================================================================

COMMENT ON TABLE user_intelligence IS 'Stores learned user intelligence: communication patterns, triggers, emotional patterns, and values. PostgreSQL fallback when Neo4j is unavailable.';
COMMENT ON COLUMN user_intelligence.communication_styles IS 'JSONB storing learned communication style patterns';
COMMENT ON COLUMN user_intelligence.triggers IS 'JSONB storing topics/phrases that cause stress or conflict';
COMMENT ON COLUMN user_intelligence.emotional_patterns IS 'JSONB storing learned emotional response patterns';

