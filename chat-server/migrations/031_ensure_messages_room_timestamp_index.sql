-- Migration 031: Ensure Composite Index on Messages (room_id, timestamp DESC)
-- Created: 2025-12-29
-- Description: Ensures the composite index exists for efficient message queries by room and timestamp
-- Note: This index may already exist from migration 017, but this ensures it's consistently applied

-- Composite index for the most common query pattern: messages by room, ordered by timestamp DESC
CREATE INDEX IF NOT EXISTS idx_messages_room_timestamp
ON messages(room_id, timestamp DESC);

-- This index optimizes queries like:
-- SELECT * FROM messages WHERE room_id = $1 ORDER BY timestamp DESC;
-- Which is used extensively in getMessageHistory and similar functions

