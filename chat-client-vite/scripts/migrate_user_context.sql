-- Migration script to create user_context table
CREATE TABLE IF NOT EXISTS user_context (
  user_id TEXT PRIMARY KEY,
  co_parent TEXT,
  children JSONB DEFAULT '[]'::jsonb,
  contacts JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
