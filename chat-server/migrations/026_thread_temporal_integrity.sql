-- Migration 026: Add temporal integrity to threads
-- Adds sequence numbers for message ordering within threads
-- Handles out-of-order message delivery gracefully

-- Add sequence number to messages for ordering within a thread
-- This is set atomically when a message is added to a thread
ALTER TABLE messages ADD COLUMN IF NOT EXISTS thread_sequence INTEGER DEFAULT NULL;

-- Add next_sequence tracking to threads for atomic assignment
-- Avoids race conditions when multiple messages are added simultaneously
ALTER TABLE threads ADD COLUMN IF NOT EXISTS next_sequence INTEGER DEFAULT 1;

-- Index for efficient sequence-based ordering within threads
CREATE INDEX IF NOT EXISTS idx_messages_thread_sequence ON messages(thread_id, thread_sequence) WHERE thread_id IS NOT NULL;

-- Index for finding messages by sequence within a thread
CREATE INDEX IF NOT EXISTS idx_messages_thread_id_sequence ON messages(thread_id, thread_sequence ASC) WHERE thread_id IS NOT NULL AND thread_sequence IS NOT NULL;

-- Update existing threaded messages with sequence numbers (preserving timestamp order)
-- This ensures existing data has proper sequence numbers
WITH numbered_messages AS (
  SELECT
    id,
    thread_id,
    ROW_NUMBER() OVER (PARTITION BY thread_id ORDER BY timestamp ASC, id ASC) as seq
  FROM messages
  WHERE thread_id IS NOT NULL
)
UPDATE messages m
SET thread_sequence = nm.seq
FROM numbered_messages nm
WHERE m.id = nm.id AND m.thread_id IS NOT NULL;

-- Update next_sequence on each thread to be max(thread_sequence) + 1
UPDATE threads t
SET next_sequence = COALESCE((
  SELECT MAX(thread_sequence) + 1
  FROM messages m
  WHERE m.thread_id = t.id
), 1);
