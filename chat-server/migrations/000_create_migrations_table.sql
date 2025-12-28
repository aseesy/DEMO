-- Migration 000: Create migrations tracking table
-- This table tracks which migrations have been executed
-- Must be created first before any other migrations run

CREATE TABLE IF NOT EXISTS migrations (
  id SERIAL PRIMARY KEY,
  filename TEXT UNIQUE NOT NULL,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  execution_time_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_migrations_filename ON migrations(filename);
CREATE INDEX IF NOT EXISTS idx_migrations_executed_at ON migrations(executed_at);

