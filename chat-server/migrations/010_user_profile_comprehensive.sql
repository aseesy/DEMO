-- Migration 010: Comprehensive User Profile System
-- Feature: 010-user-profile-comprehensive
-- Created: 2025-11-28
-- Description: Adds 40+ new profile columns to users table, creates privacy settings and audit log tables

-- =============================================================================
-- PART 1: Add new columns to users table
-- =============================================================================

DO $$
BEGIN
  -- -------------------------------------------------------------------------
  -- PERSONAL INFORMATION
  -- -------------------------------------------------------------------------

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'preferred_name') THEN
    ALTER TABLE users ADD COLUMN preferred_name TEXT;
    RAISE NOTICE 'Added preferred_name column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'pronouns') THEN
    ALTER TABLE users ADD COLUMN pronouns TEXT;
    RAISE NOTICE 'Added pronouns column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'birthdate') THEN
    ALTER TABLE users ADD COLUMN birthdate TEXT;
    RAISE NOTICE 'Added birthdate column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'language') THEN
    ALTER TABLE users ADD COLUMN language TEXT DEFAULT 'en';
    RAISE NOTICE 'Added language column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'timezone') THEN
    ALTER TABLE users ADD COLUMN timezone TEXT;
    RAISE NOTICE 'Added timezone column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'phone') THEN
    ALTER TABLE users ADD COLUMN phone TEXT;
    RAISE NOTICE 'Added phone column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'city') THEN
    ALTER TABLE users ADD COLUMN city TEXT;
    RAISE NOTICE 'Added city column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'state') THEN
    ALTER TABLE users ADD COLUMN state TEXT;
    RAISE NOTICE 'Added state column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'zip') THEN
    ALTER TABLE users ADD COLUMN zip TEXT;
    RAISE NOTICE 'Added zip column';
  END IF;

  -- -------------------------------------------------------------------------
  -- WORK & SCHEDULE
  -- -------------------------------------------------------------------------

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'employment_status') THEN
    ALTER TABLE users ADD COLUMN employment_status TEXT;
    RAISE NOTICE 'Added employment_status column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'employer') THEN
    ALTER TABLE users ADD COLUMN employer TEXT;
    RAISE NOTICE 'Added employer column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'work_schedule') THEN
    ALTER TABLE users ADD COLUMN work_schedule TEXT;
    RAISE NOTICE 'Added work_schedule column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'schedule_flexibility') THEN
    ALTER TABLE users ADD COLUMN schedule_flexibility TEXT;
    RAISE NOTICE 'Added schedule_flexibility column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'commute_time') THEN
    ALTER TABLE users ADD COLUMN commute_time TEXT;
    RAISE NOTICE 'Added commute_time column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'travel_required') THEN
    ALTER TABLE users ADD COLUMN travel_required TEXT;
    RAISE NOTICE 'Added travel_required column';
  END IF;

  -- -------------------------------------------------------------------------
  -- HEALTH & WELLBEING (encrypted at application level)
  -- -------------------------------------------------------------------------

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'health_physical_conditions') THEN
    ALTER TABLE users ADD COLUMN health_physical_conditions TEXT;
    RAISE NOTICE 'Added health_physical_conditions column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'health_physical_limitations') THEN
    ALTER TABLE users ADD COLUMN health_physical_limitations TEXT;
    RAISE NOTICE 'Added health_physical_limitations column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'health_mental_conditions') THEN
    ALTER TABLE users ADD COLUMN health_mental_conditions TEXT;
    RAISE NOTICE 'Added health_mental_conditions column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'health_mental_treatment') THEN
    ALTER TABLE users ADD COLUMN health_mental_treatment TEXT;
    RAISE NOTICE 'Added health_mental_treatment column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'health_mental_history') THEN
    ALTER TABLE users ADD COLUMN health_mental_history TEXT;
    RAISE NOTICE 'Added health_mental_history column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'health_substance_history') THEN
    ALTER TABLE users ADD COLUMN health_substance_history TEXT;
    RAISE NOTICE 'Added health_substance_history column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'health_in_recovery') THEN
    ALTER TABLE users ADD COLUMN health_in_recovery TEXT;
    RAISE NOTICE 'Added health_in_recovery column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'health_recovery_duration') THEN
    ALTER TABLE users ADD COLUMN health_recovery_duration TEXT;
    RAISE NOTICE 'Added health_recovery_duration column';
  END IF;

  -- -------------------------------------------------------------------------
  -- FINANCIAL CONTEXT (encrypted at application level)
  -- -------------------------------------------------------------------------

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'finance_income_level') THEN
    ALTER TABLE users ADD COLUMN finance_income_level TEXT;
    RAISE NOTICE 'Added finance_income_level column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'finance_income_stability') THEN
    ALTER TABLE users ADD COLUMN finance_income_stability TEXT;
    RAISE NOTICE 'Added finance_income_stability column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'finance_employment_benefits') THEN
    ALTER TABLE users ADD COLUMN finance_employment_benefits TEXT;
    RAISE NOTICE 'Added finance_employment_benefits column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'finance_housing_status') THEN
    ALTER TABLE users ADD COLUMN finance_housing_status TEXT;
    RAISE NOTICE 'Added finance_housing_status column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'finance_housing_type') THEN
    ALTER TABLE users ADD COLUMN finance_housing_type TEXT;
    RAISE NOTICE 'Added finance_housing_type column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'finance_vehicles') THEN
    ALTER TABLE users ADD COLUMN finance_vehicles TEXT;
    RAISE NOTICE 'Added finance_vehicles column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'finance_debt_stress') THEN
    ALTER TABLE users ADD COLUMN finance_debt_stress TEXT;
    RAISE NOTICE 'Added finance_debt_stress column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'finance_support_paying') THEN
    ALTER TABLE users ADD COLUMN finance_support_paying TEXT;
    RAISE NOTICE 'Added finance_support_paying column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'finance_support_receiving') THEN
    ALTER TABLE users ADD COLUMN finance_support_receiving TEXT;
    RAISE NOTICE 'Added finance_support_receiving column';
  END IF;

  -- -------------------------------------------------------------------------
  -- BACKGROUND & EDUCATION
  -- -------------------------------------------------------------------------

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'background_birthplace') THEN
    ALTER TABLE users ADD COLUMN background_birthplace TEXT;
    RAISE NOTICE 'Added background_birthplace column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'background_raised') THEN
    ALTER TABLE users ADD COLUMN background_raised TEXT;
    RAISE NOTICE 'Added background_raised column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'background_family_origin') THEN
    ALTER TABLE users ADD COLUMN background_family_origin TEXT;
    RAISE NOTICE 'Added background_family_origin column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'background_culture') THEN
    ALTER TABLE users ADD COLUMN background_culture TEXT;
    RAISE NOTICE 'Added background_culture column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'background_religion') THEN
    ALTER TABLE users ADD COLUMN background_religion TEXT;
    RAISE NOTICE 'Added background_religion column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'background_military') THEN
    ALTER TABLE users ADD COLUMN background_military TEXT;
    RAISE NOTICE 'Added background_military column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'background_military_branch') THEN
    ALTER TABLE users ADD COLUMN background_military_branch TEXT;
    RAISE NOTICE 'Added background_military_branch column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'background_military_status') THEN
    ALTER TABLE users ADD COLUMN background_military_status TEXT;
    RAISE NOTICE 'Added background_military_status column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'education_level') THEN
    ALTER TABLE users ADD COLUMN education_level TEXT;
    RAISE NOTICE 'Added education_level column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'education_field') THEN
    ALTER TABLE users ADD COLUMN education_field TEXT;
    RAISE NOTICE 'Added education_field column';
  END IF;

  -- -------------------------------------------------------------------------
  -- PROFILE METADATA
  -- -------------------------------------------------------------------------

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'profile_completion_percentage') THEN
    ALTER TABLE users ADD COLUMN profile_completion_percentage INTEGER DEFAULT 0;
    RAISE NOTICE 'Added profile_completion_percentage column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'profile_last_updated') THEN
    ALTER TABLE users ADD COLUMN profile_last_updated TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Added profile_last_updated column';
  END IF;

END $$;

-- =============================================================================
-- PART 2: Create user_profile_privacy table
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_profile_privacy (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE,

  -- Section visibility: 'private' or 'shared'
  personal_visibility TEXT NOT NULL DEFAULT 'shared',
  work_visibility TEXT NOT NULL DEFAULT 'private',
  health_visibility TEXT NOT NULL DEFAULT 'private',      -- Always private, cannot be changed
  financial_visibility TEXT NOT NULL DEFAULT 'private',   -- Always private, cannot be changed
  background_visibility TEXT NOT NULL DEFAULT 'shared',

  -- JSON field for granular field-level overrides
  field_overrides TEXT DEFAULT '{}',

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create index for fast lookups by user_id
CREATE INDEX IF NOT EXISTS idx_user_profile_privacy_user_id ON user_profile_privacy(user_id);

-- =============================================================================
-- PART 3: Create profile_audit_log table
-- =============================================================================

CREATE TABLE IF NOT EXISTS profile_audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,

  -- Action type: 'view', 'update', 'privacy_change'
  action TEXT NOT NULL,

  -- What changed or was accessed
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,

  -- Who performed the action (for view events, this is the viewer)
  actor_user_id INTEGER,

  -- Request context
  ip_address TEXT,
  user_agent TEXT,

  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_profile_audit_log_user_id ON profile_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_audit_log_timestamp ON profile_audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_profile_audit_log_action ON profile_audit_log(action);

-- =============================================================================
-- PART 4: Insert default privacy settings for existing users
-- =============================================================================

INSERT INTO user_profile_privacy (user_id, personal_visibility, work_visibility, health_visibility, financial_visibility, background_visibility)
SELECT id, 'shared', 'private', 'private', 'private', 'shared'
FROM users
WHERE id NOT IN (SELECT user_id FROM user_profile_privacy)
ON CONFLICT (user_id) DO NOTHING;

-- =============================================================================
-- Migration complete
-- =============================================================================
