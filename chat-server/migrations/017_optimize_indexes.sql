-- Migration 017: Optimize Indexes for Common Query Patterns
-- Created: 2025-12-15
-- Description: Adds composite indexes for frequently-used query patterns to improve performance

-- Messages: Room + timestamp (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_messages_room_timestamp
ON messages(room_id, timestamp DESC);

-- Note: Partial index on 'deleted' column skipped - column doesn't exist in all environments
-- If deleted column exists, add: CREATE INDEX idx_messages_room_timestamp_active ON messages(room_id, timestamp DESC) WHERE deleted = false;

-- Tasks: User + status + due_date (for task management queries)
CREATE INDEX IF NOT EXISTS idx_tasks_user_status_due 
ON tasks(user_id, status, due_date) 
WHERE status != 'completed';

-- Tasks: User + status for active tasks
CREATE INDEX IF NOT EXISTS idx_tasks_user_status_active 
ON tasks(user_id, status) 
WHERE status IN ('open', 'in_progress');

-- Contacts: User + relationship type (for filtering contacts)
CREATE INDEX IF NOT EXISTS idx_contacts_user_relationship 
ON contacts(user_id, relationship);

-- Communication stats: User + room for analytics queries
CREATE INDEX IF NOT EXISTS idx_comm_stats_user_room 
ON communication_stats(user_id, room_id);

-- Communication stats: Room for room-level analytics
CREATE INDEX IF NOT EXISTS idx_comm_stats_room 
ON communication_stats(room_id);

-- Room members: Room + user for membership lookups
CREATE INDEX IF NOT EXISTS idx_room_members_room_user 
ON room_members(room_id, user_id);

-- Messages: Username + timestamp for user activity queries
CREATE INDEX IF NOT EXISTS idx_messages_username_timestamp 
ON messages(username, timestamp DESC);

-- Messages: Thread + timestamp for thread-based queries
CREATE INDEX IF NOT EXISTS idx_messages_thread_timestamp 
ON messages(thread_id, timestamp DESC) 
WHERE thread_id IS NOT NULL;

