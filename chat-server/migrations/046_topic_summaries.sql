-- Migration 046: AI Topic Summaries with Citations
-- Part of AI Thread Summaries feature
-- Creates tables for topic detection, AI-generated summaries, and citation tracking

-- ============================================================================
-- Table: topic_summaries
-- Stores AI-generated topic summaries for conversation clusters
-- ============================================================================
CREATE TABLE IF NOT EXISTS topic_summaries (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  summary_text TEXT NOT NULL,
  summary_version INTEGER DEFAULT 1,
  message_count INTEGER DEFAULT 0,
  first_message_at TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  confidence_score DECIMAL(3,2) DEFAULT 0.80,
  is_archived BOOLEAN DEFAULT FALSE,

  -- Constraint: confidence between 0 and 1
  CONSTRAINT chk_confidence_score CHECK (confidence_score >= 0 AND confidence_score <= 1)
);

-- ============================================================================
-- Table: summary_citations
-- Links specific claims in summaries to source messages
-- ============================================================================
CREATE TABLE IF NOT EXISTS summary_citations (
  id TEXT PRIMARY KEY,
  summary_id TEXT NOT NULL REFERENCES topic_summaries(id) ON DELETE CASCADE,
  claim_text TEXT NOT NULL,
  claim_start_index INTEGER NOT NULL,
  claim_end_index INTEGER NOT NULL,
  message_ids TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint: valid index range
  CONSTRAINT chk_index_range CHECK (claim_start_index >= 0 AND claim_end_index > claim_start_index)
);

-- ============================================================================
-- Table: topic_messages
-- Junction table linking messages to topics
-- ============================================================================
CREATE TABLE IF NOT EXISTS topic_messages (
  topic_id TEXT NOT NULL REFERENCES topic_summaries(id) ON DELETE CASCADE,
  message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  relevance_score DECIMAL(3,2) DEFAULT 1.0,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (topic_id, message_id),

  -- Constraint: relevance between 0 and 1
  CONSTRAINT chk_relevance_score CHECK (relevance_score >= 0 AND relevance_score <= 1)
);

-- ============================================================================
-- Table: summary_history
-- Version history for summaries (audit trail)
-- ============================================================================
CREATE TABLE IF NOT EXISTS summary_history (
  id TEXT PRIMARY KEY,
  summary_id TEXT NOT NULL REFERENCES topic_summaries(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  summary_text TEXT NOT NULL,
  citations JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique version per summary
  CONSTRAINT uq_summary_version UNIQUE (summary_id, version)
);

-- ============================================================================
-- Indexes for query performance
-- ============================================================================

-- Topic summaries indexes
CREATE INDEX IF NOT EXISTS idx_topic_summaries_room ON topic_summaries(room_id);
CREATE INDEX IF NOT EXISTS idx_topic_summaries_room_category ON topic_summaries(room_id, category);
CREATE INDEX IF NOT EXISTS idx_topic_summaries_updated ON topic_summaries(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_topic_summaries_room_active ON topic_summaries(room_id)
  WHERE is_archived = FALSE;

-- Summary citations indexes
CREATE INDEX IF NOT EXISTS idx_summary_citations_summary ON summary_citations(summary_id);

-- Topic messages indexes
CREATE INDEX IF NOT EXISTS idx_topic_messages_topic ON topic_messages(topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_messages_message ON topic_messages(message_id);

-- Summary history indexes
CREATE INDEX IF NOT EXISTS idx_summary_history_summary ON summary_history(summary_id);
CREATE INDEX IF NOT EXISTS idx_summary_history_summary_version ON summary_history(summary_id, version DESC);

-- ============================================================================
-- Comments for documentation
-- ============================================================================
COMMENT ON TABLE topic_summaries IS 'AI-generated topic summaries for conversation clusters';
COMMENT ON TABLE summary_citations IS 'Links claims in summaries to source message IDs';
COMMENT ON TABLE topic_messages IS 'Junction table mapping messages to topics';
COMMENT ON TABLE summary_history IS 'Version history for summary changes';

COMMENT ON COLUMN topic_summaries.confidence_score IS 'AI confidence in topic coherence (0-1)';
COMMENT ON COLUMN summary_citations.claim_start_index IS 'Character position where cited claim starts in summary_text';
COMMENT ON COLUMN summary_citations.message_ids IS 'Array of message IDs supporting this claim';
COMMENT ON COLUMN topic_messages.relevance_score IS 'How relevant the message is to the topic (0-1)';
