-- Migration 012: Child Activities Table
-- Feature: 012-data-persistence-fix
-- Created: 2025-11-28
-- Description: Creates child_activities table for tracking children's extracurricular activities

-- =============================================================================
-- Create child_activities table
-- =============================================================================

CREATE TABLE IF NOT EXISTS child_activities (
  id SERIAL PRIMARY KEY,
  contact_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,

  -- Activity details
  activity_name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  instructor_contact TEXT,

  -- Schedule
  days_of_week TEXT,  -- JSON array: ["Monday", "Wednesday"]
  start_time TEXT,
  end_time TEXT,
  recurrence TEXT,  -- weekly, biweekly, monthly, one-time
  start_date TEXT,
  end_date TEXT,

  -- Cost tracking
  cost DECIMAL(10,2),
  cost_frequency TEXT,  -- per_session, weekly, monthly, semester, annual
  split_type TEXT DEFAULT 'equal',  -- equal, percentage, alternate, one_parent
  split_percentage DECIMAL(5,2),  -- If split_type is 'percentage', this is parent 1's share
  paid_by TEXT,  -- username of parent who pays, or 'alternate'

  -- Notes
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Foreign keys
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================================================
-- Create indexes for performance
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_child_activities_contact_id ON child_activities(contact_id);
CREATE INDEX IF NOT EXISTS idx_child_activities_user_id ON child_activities(user_id);

-- =============================================================================
-- Migration complete
-- =============================================================================
