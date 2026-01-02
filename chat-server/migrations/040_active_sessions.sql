-- Migration: Active Sessions Table
-- Stores active socket connections for session persistence across server restarts
-- Part of Phase 1: Server Reliability Improvements

BEGIN;

CREATE TABLE IF NOT EXISTS active_sessions (
  id SERIAL PRIMARY KEY,
  socket_id TEXT UNIQUE NOT NULL,
  user_email TEXT NOT NULL,
  room_id TEXT NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Indexes for fast lookups
  CONSTRAINT idx_active_sessions_socket_id UNIQUE (socket_id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_active_sessions_email ON active_sessions(user_email);
CREATE INDEX IF NOT EXISTS idx_active_sessions_room_id ON active_sessions(room_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_expires_at ON active_sessions(expires_at);

-- Clean up expired sessions (run periodically)
-- Sessions expire after 24 hours of inactivity
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM active_sessions
  WHERE expires_at < CURRENT_TIMESTAMP
     OR (last_activity < CURRENT_TIMESTAMP - INTERVAL '24 hours' AND expires_at IS NULL);
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON TABLE active_sessions IS 'Stores active socket connections for session persistence';
COMMENT ON COLUMN active_sessions.socket_id IS 'Socket.io socket ID (unique per connection)';
COMMENT ON COLUMN active_sessions.user_email IS 'User email (lowercase, trimmed)';
COMMENT ON COLUMN active_sessions.room_id IS 'Room ID user is connected to';
COMMENT ON COLUMN active_sessions.expires_at IS 'Optional expiration time (for temporary sessions)';

COMMIT;
