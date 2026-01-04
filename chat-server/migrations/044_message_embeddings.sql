-- Migration 044: Add embedding column to messages table
-- Created: 2025-01-04
-- Description: Adds embedding column for semantic similarity search.
--              Uses REAL[] array type (PostgreSQL native) instead of pgvector
--              since Railway's base PostgreSQL doesn't have pgvector installed.
--              Can be upgraded to pgvector later for better performance.

-- ============================================================================
-- PART 1: Add embedding column to messages table
-- ============================================================================

-- Add embedding column as REAL array (1536 dimensions for text-embedding-3-small)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS embedding REAL[];

-- Add column to track if embedding was generated
ALTER TABLE messages ADD COLUMN IF NOT EXISTS embedding_generated_at TIMESTAMP WITH TIME ZONE;

-- ============================================================================
-- PART 2: Create indexes for efficient queries
-- ============================================================================

-- Index on embedding_generated_at for finding messages without embeddings
CREATE INDEX IF NOT EXISTS idx_messages_embedding_generated
ON messages(embedding_generated_at)
WHERE embedding_generated_at IS NOT NULL;

-- Partial index for messages that need embedding generation
CREATE INDEX IF NOT EXISTS idx_messages_needs_embedding
ON messages(room_id, timestamp)
WHERE embedding IS NULL;

-- ============================================================================
-- PART 3: Add table comments
-- ============================================================================

COMMENT ON COLUMN messages.embedding IS 'OpenAI text-embedding-3-small vector (1536 dimensions). Stored as REAL[] array.';
COMMENT ON COLUMN messages.embedding_generated_at IS 'Timestamp when embedding was generated';

-- ============================================================================
-- NOTES
-- ============================================================================
--
-- Similarity search without pgvector:
--
-- Cosine similarity can be computed using:
-- 1 - (
--   (SELECT SUM(a * b) FROM unnest(m1.embedding, m2.embedding) AS t(a, b)) /
--   (SQRT(SELECT SUM(a * a) FROM unnest(m1.embedding) AS t(a)) *
--    SQRT(SELECT SUM(b * b) FROM unnest(m2.embedding) AS t(b)))
-- )
--
-- For better performance, consider:
-- 1. Pre-computing vector magnitudes
-- 2. Limiting candidate set before computing similarity
-- 3. Migrating to pgvector when Railway supports it on base template
--
