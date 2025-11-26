-- Migration 006: Add missing columns to messages table
-- These columns are needed for full message persistence including AI intervention data

-- Add socket_id column (for tracking which socket sent the message)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'socket_id') THEN
    ALTER TABLE messages ADD COLUMN socket_id TEXT;
  END IF;
END $$;

-- Add private column (for private/system messages that shouldn't be shown)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'private') THEN
    ALTER TABLE messages ADD COLUMN private INTEGER DEFAULT 0;
  END IF;
END $$;

-- Add flagged column (for messages flagged by AI as potentially harmful)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'flagged') THEN
    ALTER TABLE messages ADD COLUMN flagged INTEGER DEFAULT 0;
  END IF;
END $$;

-- Add validation column (AI validation result/explanation)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'validation') THEN
    ALTER TABLE messages ADD COLUMN validation TEXT;
  END IF;
END $$;

-- Add tip1 column (first AI coaching tip)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'tip1') THEN
    ALTER TABLE messages ADD COLUMN tip1 TEXT;
  END IF;
END $$;

-- Add tip2 column (second AI coaching tip)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'tip2') THEN
    ALTER TABLE messages ADD COLUMN tip2 TEXT;
  END IF;
END $$;

-- Add rewrite column (AI suggested rewrite)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'rewrite') THEN
    ALTER TABLE messages ADD COLUMN rewrite TEXT;
  END IF;
END $$;

-- Add original_message column (JSON of original message before intervention)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'original_message') THEN
    ALTER TABLE messages ADD COLUMN original_message TEXT;
  END IF;
END $$;

-- Add edited column (whether message was edited)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'edited') THEN
    ALTER TABLE messages ADD COLUMN edited INTEGER DEFAULT 0;
  END IF;
END $$;

-- Add edited_at column (when message was last edited)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'edited_at') THEN
    ALTER TABLE messages ADD COLUMN edited_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Add reactions column (JSON object of emoji reactions)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'reactions') THEN
    ALTER TABLE messages ADD COLUMN reactions TEXT DEFAULT '{}';
  END IF;
END $$;

-- Add user_flagged_by column (JSON array of usernames who flagged this message)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'user_flagged_by') THEN
    ALTER TABLE messages ADD COLUMN user_flagged_by TEXT DEFAULT '[]';
  END IF;
END $$;

-- Add index for faster lookups by private/flagged status
CREATE INDEX IF NOT EXISTS idx_messages_private ON messages(private);
CREATE INDEX IF NOT EXISTS idx_messages_flagged ON messages(flagged);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC);
