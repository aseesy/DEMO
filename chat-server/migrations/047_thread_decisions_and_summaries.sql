-- Migration 047: Add decisions, open items, and summaries to threads
-- Enhances threads with AI-extracted structured data

-- ============================================================================
-- Add summary column to threads (AI-generated conversation summary)
-- ============================================================================
ALTER TABLE threads ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE threads ADD COLUMN IF NOT EXISTS ai_confidence DECIMAL(3,2) DEFAULT 0.80;
ALTER TABLE threads ADD COLUMN IF NOT EXISTS first_message_at TIMESTAMPTZ;
ALTER TABLE threads ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'complete';

-- Constraint for confidence score
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_threads_ai_confidence'
  ) THEN
    ALTER TABLE threads ADD CONSTRAINT chk_threads_ai_confidence
      CHECK (ai_confidence IS NULL OR (ai_confidence >= 0 AND ai_confidence <= 1));
  END IF;
END$$;

-- ============================================================================
-- Table: thread_decisions
-- Tracks decisions made during a conversation thread
-- ============================================================================
CREATE TABLE IF NOT EXISTS thread_decisions (
  id TEXT PRIMARY KEY DEFAULT 'dec_' || gen_random_uuid()::text,
  thread_id TEXT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  decision_text TEXT NOT NULL,
  decided_by TEXT,  -- user_email of who proposed/agreed
  agreed_by TEXT[], -- array of user_emails who agreed
  source_message_ids TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Table: thread_open_items
-- Tracks unresolved items from conversation threads
-- ============================================================================
CREATE TABLE IF NOT EXISTS thread_open_items (
  id TEXT PRIMARY KEY DEFAULT 'open_' || gen_random_uuid()::text,
  thread_id TEXT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  item_text TEXT NOT NULL,
  status TEXT DEFAULT 'open',  -- 'open', 'resolved', 'superseded'
  assigned_to TEXT,  -- user_email
  source_message_ids TEXT[] NOT NULL DEFAULT '{}',
  resolved_at TIMESTAMPTZ,
  resolved_by_thread_id TEXT REFERENCES threads(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Constraint for status values
ALTER TABLE thread_open_items DROP CONSTRAINT IF EXISTS chk_open_item_status;
ALTER TABLE thread_open_items ADD CONSTRAINT chk_open_item_status
  CHECK (status IN ('open', 'resolved', 'superseded'));

-- ============================================================================
-- Indexes for query performance
-- ============================================================================

-- Thread decisions indexes
CREATE INDEX IF NOT EXISTS idx_thread_decisions_thread ON thread_decisions(thread_id);
CREATE INDEX IF NOT EXISTS idx_thread_decisions_created ON thread_decisions(created_at DESC);

-- Thread open items indexes
CREATE INDEX IF NOT EXISTS idx_thread_open_items_thread ON thread_open_items(thread_id);
CREATE INDEX IF NOT EXISTS idx_thread_open_items_status ON thread_open_items(status)
  WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_thread_open_items_created ON thread_open_items(created_at DESC);

-- Threads indexes for new columns
CREATE INDEX IF NOT EXISTS idx_threads_processing_status ON threads(processing_status)
  WHERE processing_status IN ('pending', 'processing');
CREATE INDEX IF NOT EXISTS idx_threads_first_message ON threads(room_id, first_message_at DESC);

-- ============================================================================
-- Comments for documentation
-- ============================================================================
COMMENT ON COLUMN threads.summary IS 'AI-generated summary of the conversation thread';
COMMENT ON COLUMN threads.ai_confidence IS 'AI confidence score for categorization (0-1)';
COMMENT ON COLUMN threads.first_message_at IS 'Timestamp of first message in thread';
COMMENT ON COLUMN threads.processing_status IS 'AI processing status: pending, processing, complete, failed';

COMMENT ON TABLE thread_decisions IS 'Decisions extracted from conversation threads';
COMMENT ON COLUMN thread_decisions.decided_by IS 'Email of user who proposed the decision';
COMMENT ON COLUMN thread_decisions.agreed_by IS 'Array of emails of users who agreed';
COMMENT ON COLUMN thread_decisions.source_message_ids IS 'Message IDs supporting this decision';

COMMENT ON TABLE thread_open_items IS 'Unresolved items requiring follow-up';
COMMENT ON COLUMN thread_open_items.status IS 'open, resolved, or superseded by newer item';
COMMENT ON COLUMN thread_open_items.resolved_by_thread_id IS 'Thread where this was resolved';

-- ============================================================================
-- Migrate existing topic_summaries to threads (if any exist)
-- ============================================================================
DO $$
DECLARE
  topic RECORD;
  new_thread_id TEXT;
BEGIN
  -- Only run if topic_summaries has data and threads is missing entries
  FOR topic IN
    SELECT ts.* FROM topic_summaries ts
    WHERE NOT EXISTS (
      SELECT 1 FROM threads t
      WHERE t.room_id = ts.room_id
      AND t.title = ts.title
    )
  LOOP
    new_thread_id := 'thread_' || gen_random_uuid()::text;

    INSERT INTO threads (
      id, room_id, title, category, message_count,
      first_message_at, last_message_at, summary, ai_confidence,
      created_at, updated_at
    ) VALUES (
      new_thread_id,
      topic.room_id,
      topic.title,
      COALESCE(topic.category, 'logistics'),
      topic.message_count,
      topic.first_message_at,
      topic.last_message_at,
      topic.summary_text,
      topic.confidence_score,
      topic.created_at,
      topic.updated_at
    );

    -- Migrate topic_messages to thread_id on messages
    UPDATE messages m
    SET thread_id = new_thread_id
    FROM topic_messages tm
    WHERE tm.topic_id = topic.id
    AND tm.message_id = m.id
    AND m.thread_id IS NULL;

    RAISE NOTICE 'Migrated topic % to thread %', topic.id, new_thread_id;
  END LOOP;
END$$;

-- ============================================================================
-- Backfill first_message_at for existing threads
-- ============================================================================
UPDATE threads t
SET first_message_at = (
  SELECT MIN(m.timestamp)
  FROM messages m
  WHERE m.thread_id = t.id
)
WHERE t.first_message_at IS NULL;
