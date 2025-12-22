-- Migration 022: Thread Indexes and Foreign Key Constraints
-- Created: 2025-12-21
-- Description: Adds performance indexes and referential integrity for thread feature
--
-- This migration:
-- 1. Adds index on threads.room_id for getThreadsForRoom() queries
-- 2. Adds index on threads.updated_at for sorting threads by recency
-- 3. Adds foreign key constraint from messages.thread_id to threads.id
-- 4. Ensures data integrity and improves query performance

-- ============================================================================
-- THREAD INDEXES
-- ============================================================================

-- Index for filtering threads by room (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_threads_room_id ON threads(room_id);

-- Index for sorting threads by update time (used in getThreadsForRoom)
CREATE INDEX IF NOT EXISTS idx_threads_updated_at ON threads(updated_at DESC);

-- Note: messages(thread_id, timestamp DESC) index already exists in migration 017
-- This migration focuses on threads table indexes and referential integrity

-- ============================================================================
-- FOREIGN KEY CONSTRAINT
-- ============================================================================

-- Add foreign key constraint from messages.thread_id to threads.id
-- This ensures referential integrity: messages can only reference existing threads
-- ON DELETE SET NULL: If thread is deleted, set message.thread_id to NULL (preserves message)
DO $$
BEGIN
  -- Check if constraint already exists
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'fk_messages_thread_id'
  ) THEN
    -- Check if messages.thread_id column exists
    IF EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'messages' 
      AND column_name = 'thread_id'
    ) THEN
      -- Add foreign key constraint
      ALTER TABLE messages 
      ADD CONSTRAINT fk_messages_thread_id 
      FOREIGN KEY (thread_id) 
      REFERENCES threads(id) 
      ON DELETE SET NULL;
      
      RAISE NOTICE 'Foreign key constraint fk_messages_thread_id created successfully';
    ELSE
      RAISE NOTICE 'messages.thread_id column does not exist, skipping foreign key constraint';
    END IF;
  ELSE
    RAISE NOTICE 'Foreign key constraint fk_messages_thread_id already exists';
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify indexes were created
DO $$
DECLARE
  index_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE tablename = 'threads'
  AND indexname IN ('idx_threads_room_id', 'idx_threads_updated_at');
  
  IF index_count = 2 THEN
    RAISE NOTICE 'All thread indexes created successfully';
  ELSE
    RAISE WARNING 'Expected 2 thread indexes, found %', index_count;
  END IF;
END $$;

