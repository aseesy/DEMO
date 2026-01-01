-- Migration 035: Data Integrity Constraints
-- Created: 2025-12-29
-- Description: Adds CHECK constraints, NOT NULL constraints, and verifies foreign keys
--              to ensure data integrity across the database
--
-- This migration:
-- 1. Adds CHECK constraints for status fields and boolean values
-- 2. Adds NOT NULL constraints for required fields
-- 3. Verifies existing foreign key constraints
-- 4. Ensures referential integrity

-- ============================================================================
-- CHECK CONSTRAINTS
-- ============================================================================

-- Threads: is_archived must be 0 or 1 (boolean)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_threads_is_archived'
  ) THEN
    ALTER TABLE threads
    ADD CONSTRAINT chk_threads_is_archived
    CHECK (is_archived IN (0, 1));
    RAISE NOTICE 'Added CHECK constraint chk_threads_is_archived';
  ELSE
    RAISE NOTICE 'CHECK constraint chk_threads_is_archived already exists';
  END IF;
END $$;

-- Threads: depth must be non-negative
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_threads_depth'
  ) THEN
    ALTER TABLE threads
    ADD CONSTRAINT chk_threads_depth
    CHECK (depth >= 0);
    RAISE NOTICE 'Added CHECK constraint chk_threads_depth';
  ELSE
    RAISE NOTICE 'CHECK constraint chk_threads_depth already exists';
  END IF;
END $$;

-- Tasks: status validation (if status column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'status'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'chk_tasks_status'
    ) THEN
      ALTER TABLE tasks
      ADD CONSTRAINT chk_tasks_status
      CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled'));
      RAISE NOTICE 'Added CHECK constraint chk_tasks_status';
    ELSE
      RAISE NOTICE 'CHECK constraint chk_tasks_status already exists';
    END IF;
  ELSE
    RAISE NOTICE 'tasks.status column does not exist, skipping constraint';
  END IF;
END $$;

-- Messages: private must be 0 or 1 (if column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'private'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'chk_messages_private'
    ) THEN
      ALTER TABLE messages
      ADD CONSTRAINT chk_messages_private
      CHECK (private IN (0, 1));
      RAISE NOTICE 'Added CHECK constraint chk_messages_private';
    ELSE
      RAISE NOTICE 'CHECK constraint chk_messages_private already exists';
    END IF;
  ELSE
    RAISE NOTICE 'messages.private column does not exist, skipping constraint';
  END IF;
END $$;

-- Messages: flagged must be 0 or 1 (if column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'flagged'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'chk_messages_flagged'
    ) THEN
      ALTER TABLE messages
      ADD CONSTRAINT chk_messages_flagged
      CHECK (flagged IN (0, 1));
      RAISE NOTICE 'Added CHECK constraint chk_messages_flagged';
    ELSE
      RAISE NOTICE 'CHECK constraint chk_messages_flagged already exists';
    END IF;
  ELSE
    RAISE NOTICE 'messages.flagged column does not exist, skipping constraint';
  END IF;
END $$;

-- Messages: edited must be 0 or 1 (if column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'edited'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'chk_messages_edited'
    ) THEN
      ALTER TABLE messages
      ADD CONSTRAINT chk_messages_edited
      CHECK (edited IN (0, 1));
      RAISE NOTICE 'Added CHECK constraint chk_messages_edited';
    ELSE
      RAISE NOTICE 'CHECK constraint chk_messages_edited already exists';
    END IF;
  ELSE
    RAISE NOTICE 'messages.edited column does not exist, skipping constraint';
  END IF;
END $$;

-- Rooms: is_private must be 0 or 1
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_rooms_is_private'
  ) THEN
    ALTER TABLE rooms
    ADD CONSTRAINT chk_rooms_is_private
    CHECK (is_private IN (0, 1));
    RAISE NOTICE 'Added CHECK constraint chk_rooms_is_private';
  ELSE
    RAISE NOTICE 'CHECK constraint chk_rooms_is_private already exists';
  END IF;
END $$;

-- ============================================================================
-- NOT NULL CONSTRAINTS
-- ============================================================================

-- Threads: room_id is required
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'threads' 
    AND column_name = 'room_id'
    AND is_nullable = 'YES'
  ) THEN
    -- First, set NULL values to a default (if any exist)
    -- This should not happen, but handle gracefully
    UPDATE threads SET room_id = (SELECT id FROM rooms LIMIT 1)
    WHERE room_id IS NULL
    AND EXISTS (SELECT 1 FROM rooms LIMIT 1);
    
    -- Then add NOT NULL constraint
    ALTER TABLE threads
    ALTER COLUMN room_id SET NOT NULL;
    RAISE NOTICE 'Added NOT NULL constraint to threads.room_id';
  ELSE
    RAISE NOTICE 'threads.room_id already has NOT NULL constraint or column does not exist';
  END IF;
END $$;

-- Threads: title is required
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'threads' 
    AND column_name = 'title'
    AND is_nullable = 'YES'
  ) THEN
    -- Set NULL titles to a default value
    UPDATE threads SET title = 'Untitled Thread'
    WHERE title IS NULL;
    
    ALTER TABLE threads
    ALTER COLUMN title SET NOT NULL;
    RAISE NOTICE 'Added NOT NULL constraint to threads.title';
  ELSE
    RAISE NOTICE 'threads.title already has NOT NULL constraint or column does not exist';
  END IF;
END $$;

-- Messages: room_id is required (if column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' 
    AND column_name = 'room_id'
    AND is_nullable = 'YES'
  ) THEN
    -- Delete messages without room_id (orphaned messages)
    -- This is safe because orphaned messages cannot be displayed
    DELETE FROM messages WHERE room_id IS NULL;
    
    ALTER TABLE messages
    ALTER COLUMN room_id SET NOT NULL;
    RAISE NOTICE 'Added NOT NULL constraint to messages.room_id';
  ELSE
    RAISE NOTICE 'messages.room_id already has NOT NULL constraint or column does not exist';
  END IF;
END $$;

-- Messages: timestamp is required
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' 
    AND column_name = 'timestamp'
    AND is_nullable = 'YES'
  ) THEN
    -- Set NULL timestamps to current timestamp
    UPDATE messages SET timestamp = CURRENT_TIMESTAMP
    WHERE timestamp IS NULL;
    
    ALTER TABLE messages
    ALTER COLUMN timestamp SET NOT NULL;
    RAISE NOTICE 'Added NOT NULL constraint to messages.timestamp';
  ELSE
    RAISE NOTICE 'messages.timestamp already has NOT NULL constraint or column does not exist';
  END IF;
END $$;

-- Messages: type is required
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' 
    AND column_name = 'type'
    AND is_nullable = 'YES'
  ) THEN
    -- Set NULL types to 'text' as default
    UPDATE messages SET type = 'text'
    WHERE type IS NULL;
    
    ALTER TABLE messages
    ALTER COLUMN type SET NOT NULL;
    RAISE NOTICE 'Added NOT NULL constraint to messages.type';
  ELSE
    RAISE NOTICE 'messages.type already has NOT NULL constraint or column does not exist';
  END IF;
END $$;

-- ============================================================================
-- FOREIGN KEY VERIFICATION
-- ============================================================================

-- Verify messages.thread_id -> threads.id foreign key exists
DO $$
DECLARE
  fk_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_messages_thread_id'
  ) INTO fk_exists;
  
  IF fk_exists THEN
    RAISE NOTICE 'Foreign key fk_messages_thread_id exists ✓';
  ELSE
    RAISE WARNING 'Foreign key fk_messages_thread_id does NOT exist - should be added by migration 022';
  END IF;
END $$;

-- Verify thread_messages foreign keys exist
DO $$
DECLARE
  fk_thread_exists BOOLEAN;
  fk_message_exists BOOLEAN;
BEGIN
  -- Check if thread_messages table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'thread_messages'
  ) THEN
    -- Check thread_id foreign key
    SELECT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname LIKE '%thread_messages_thread_id%'
    ) INTO fk_thread_exists;
    
    -- Check message_id foreign key
    SELECT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname LIKE '%thread_messages_message_id%'
    ) INTO fk_message_exists;
    
    IF fk_thread_exists THEN
      RAISE NOTICE 'Foreign key for thread_messages.thread_id exists ✓';
    ELSE
      RAISE WARNING 'Foreign key for thread_messages.thread_id does NOT exist';
    END IF;
    
    IF fk_message_exists THEN
      RAISE NOTICE 'Foreign key for thread_messages.message_id exists ✓';
    ELSE
      RAISE WARNING 'Foreign key for thread_messages.message_id does NOT exist';
    END IF;
  ELSE
    RAISE NOTICE 'thread_messages table does not exist, skipping foreign key verification';
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION SUMMARY
-- ============================================================================

DO $$
DECLARE
  constraint_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO constraint_count
  FROM pg_constraint
  WHERE conname LIKE 'chk_%'
  AND conrelid IN (
    SELECT oid FROM pg_class 
    WHERE relname IN ('threads', 'messages', 'tasks', 'rooms')
  );
  
  RAISE NOTICE 'Total CHECK constraints added/verified: %', constraint_count;
END $$;

