-- Migration 025: Add hierarchical thread support
-- Enables nested threads (sub-threads spawned from messages)
-- Tracks parent-child relationships and root thread for deep nesting

-- Add parent thread reference (for sub-threads)
ALTER TABLE threads ADD COLUMN IF NOT EXISTS parent_thread_id TEXT REFERENCES threads(id) ON DELETE SET NULL;

-- Add root thread reference (always points to the top-level thread, even in deep nesting)
ALTER TABLE threads ADD COLUMN IF NOT EXISTS root_thread_id TEXT REFERENCES threads(id) ON DELETE SET NULL;

-- Add parent message reference (the specific message that spawned this thread)
ALTER TABLE threads ADD COLUMN IF NOT EXISTS parent_message_id TEXT REFERENCES messages(id) ON DELETE SET NULL;

-- Add depth tracking for query optimization (0 = top-level, 1 = first sub-thread, etc.)
ALTER TABLE threads ADD COLUMN IF NOT EXISTS depth INTEGER DEFAULT 0;

-- Index for efficient parent lookups (find all sub-threads of a thread)
CREATE INDEX IF NOT EXISTS idx_threads_parent_thread_id ON threads(parent_thread_id) WHERE parent_thread_id IS NOT NULL;

-- Index for efficient root lookups (find all threads in a hierarchy)
CREATE INDEX IF NOT EXISTS idx_threads_root_thread_id ON threads(root_thread_id) WHERE root_thread_id IS NOT NULL;

-- Index for finding threads spawned from a specific message
CREATE INDEX IF NOT EXISTS idx_threads_parent_message_id ON threads(parent_message_id) WHERE parent_message_id IS NOT NULL;

-- Index for depth-based queries (e.g., find all top-level threads)
CREATE INDEX IF NOT EXISTS idx_threads_depth ON threads(room_id, depth);

-- Update existing threads: set root_thread_id = id for all top-level threads (where parent_thread_id IS NULL)
-- This ensures the root reference is always set, even for existing data
UPDATE threads
SET root_thread_id = id, depth = 0
WHERE parent_thread_id IS NULL AND root_thread_id IS NULL;
