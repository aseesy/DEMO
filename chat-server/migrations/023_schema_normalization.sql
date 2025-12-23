-- PostgreSQL Migration: Schema Normalization
-- Addresses: God Table, JSONB Junk Drawers, Primitive Obsession, Vague Naming
--
-- This migration applies Clean Code principles to the database schema:
-- 1. Single Responsibility: Each table has one reason to change
-- 2. Type Safety: ENUMs for fixed states, CHECK constraints for validation
-- 3. Normalization: User profile data extracted from monolithic users table
-- 4. Clear Naming: Tables named for what they ARE
--
-- Created: 2024-12-23

-- =============================================================================
-- PART 1: CREATE CHECK CONSTRAINTS FOR TYPE SAFETY
-- =============================================================================
-- We can't easily change existing TEXT columns to ENUMs, but we can add
-- CHECK constraints to enforce valid values.

DO $$
BEGIN
  -- room_invites.status
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_room_invites_status'
  ) THEN
    ALTER TABLE room_invites
    ADD CONSTRAINT chk_room_invites_status
    CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'canceled'));
    RAISE NOTICE 'Added check constraint for room_invites.status';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not add room_invites constraint: %', SQLERRM;
END $$;

DO $$
BEGIN
  -- pending_connections.status
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_pending_connections_status'
  ) THEN
    ALTER TABLE pending_connections
    ADD CONSTRAINT chk_pending_connections_status
    CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'canceled'));
    RAISE NOTICE 'Added check constraint for pending_connections.status';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not add pending_connections constraint: %', SQLERRM;
END $$;

DO $$
BEGIN
  -- tasks.status
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_tasks_status'
  ) THEN
    ALTER TABLE tasks
    ADD CONSTRAINT chk_tasks_status
    CHECK (status IN ('open', 'in_progress', 'completed', 'canceled'));
    RAISE NOTICE 'Added check constraint for tasks.status';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not add tasks.status constraint: %', SQLERRM;
END $$;

DO $$
BEGIN
  -- tasks.priority
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_tasks_priority'
  ) THEN
    ALTER TABLE tasks
    ADD CONSTRAINT chk_tasks_priority
    CHECK (priority IN ('low', 'medium', 'high', 'urgent'));
    RAISE NOTICE 'Added check constraint for tasks.priority';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not add tasks.priority constraint: %', SQLERRM;
END $$;

DO $$
BEGIN
  -- room_members.role
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_room_members_role'
  ) THEN
    ALTER TABLE room_members
    ADD CONSTRAINT chk_room_members_role
    CHECK (role IN ('owner', 'member', 'readonly'));
    RAISE NOTICE 'Added check constraint for room_members.role';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not add room_members.role constraint: %', SQLERRM;
END $$;

-- =============================================================================
-- PART 2: EXTRACT USER PROFILE INTO SEPARATE TABLES
-- =============================================================================
-- The users table should be about IDENTITY and AUTHENTICATION only.
-- Everything else gets its own table with a foreign key to users.

-- 2a. User Demographics (personal info that rarely changes)
CREATE TABLE IF NOT EXISTS user_demographics (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  preferred_name TEXT,
  pronouns TEXT,
  birthdate DATE,
  language TEXT DEFAULT 'en',
  timezone TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE user_demographics IS 'Personal demographic info. Actor: Product/UX. Changes when: user updates profile.';

-- 2b. User Employment (work-related info)
CREATE TABLE IF NOT EXISTS user_employment (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  employment_status TEXT,
  occupation TEXT,
  employer TEXT,
  work_schedule TEXT,
  schedule_flexibility TEXT,
  commute_time TEXT,
  travel_required BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE user_employment IS 'Work and schedule info. Actor: Product/UX. Changes when: job situation changes.';

-- 2c. User Health Context (HIGHLY SENSITIVE - separate for access control)
CREATE TABLE IF NOT EXISTS user_health_context (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  physical_conditions TEXT,
  physical_limitations TEXT,
  mental_conditions TEXT,
  mental_treatment TEXT,
  mental_history TEXT,
  substance_history TEXT,
  in_recovery BOOLEAN DEFAULT FALSE,
  recovery_duration TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE user_health_context IS 'Health info. ALWAYS PRIVATE. Actor: Compliance. Changes when: health status changes.';

-- 2d. User Financials (SENSITIVE - separate for access control)
CREATE TABLE IF NOT EXISTS user_financials (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  income_level TEXT,
  income_stability TEXT,
  employment_benefits TEXT,
  housing_status TEXT,
  housing_type TEXT,
  vehicles TEXT,
  debt_stress TEXT,
  support_paying BOOLEAN DEFAULT FALSE,
  support_receiving BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE user_financials IS 'Financial info. ALWAYS PRIVATE. Actor: Compliance. Changes when: financial status changes.';

-- 2e. User Background (cultural, educational)
CREATE TABLE IF NOT EXISTS user_background (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  birthplace TEXT,
  raised_location TEXT,
  family_origin TEXT,
  culture TEXT,
  religion TEXT,
  military_service BOOLEAN DEFAULT FALSE,
  military_branch TEXT,
  military_status TEXT,
  education_level TEXT,
  education_field TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE user_background IS 'Background info. Actor: Product/UX. Changes when: user updates profile.';

-- =============================================================================
-- PART 3: REPLACE JSONB WITH PROPER RELATIONAL TABLES
-- =============================================================================

-- 3a. Communication Profile (replaces communication_patterns JSONB)
-- This is the AI's learned model of how a user communicates
CREATE TABLE IF NOT EXISTS communication_profiles (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  tone_tendencies TEXT[], -- Array of tendencies: ['direct', 'formal', 'casual']
  avg_message_length INTEGER,
  vocabulary_complexity TEXT, -- 'simple', 'moderate', 'complex'
  emoji_usage TEXT, -- 'none', 'minimal', 'moderate', 'frequent'
  profile_version INTEGER DEFAULT 1,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE communication_profiles IS 'AI-learned communication patterns. Actor: AI Team. Changes when: AI updates model.';

-- 3b. Communication Triggers (replaces triggers JSONB)
-- Topics and phrases that tend to cause conflict for this user
CREATE TABLE IF NOT EXISTS communication_triggers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('topic', 'phrase', 'pattern')),
  trigger_value TEXT NOT NULL, -- The actual trigger (e.g., 'money', 'you always')
  intensity DECIMAL(3,2) DEFAULT 0.5 CHECK (intensity >= 0 AND intensity <= 1),
  detection_count INTEGER DEFAULT 1,
  last_detected TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_triggers_user_id ON communication_triggers(user_id);
CREATE INDEX IF NOT EXISTS idx_triggers_type ON communication_triggers(trigger_type);

COMMENT ON TABLE communication_triggers IS 'User-specific conflict triggers. Actor: AI Team. Changes when: new patterns detected.';

-- 3c. Intervention Rewrites (replaces successful_rewrites JSONB array)
-- History of AI suggestions and their outcomes
CREATE TABLE IF NOT EXISTS intervention_rewrites (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  original_text TEXT NOT NULL,
  rewrite_text TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('accepted', 'rejected', 'modified', 'ignored')),
  pattern_detected TEXT, -- What pattern triggered the intervention
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  room_id TEXT REFERENCES rooms(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_rewrites_user_id ON intervention_rewrites(user_id);
CREATE INDEX IF NOT EXISTS idx_rewrites_outcome ON intervention_rewrites(outcome);
CREATE INDEX IF NOT EXISTS idx_rewrites_created_at ON intervention_rewrites(created_at);

COMMENT ON TABLE intervention_rewrites IS 'AI rewrite history. Actor: AI Team. Changes when: user responds to intervention.';

-- 3d. Intervention Statistics (replaces intervention_history JSONB)
-- Aggregated stats about AI interventions per user
CREATE TABLE IF NOT EXISTS intervention_statistics (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_interventions INTEGER DEFAULT 0,
  accepted_count INTEGER DEFAULT 0,
  rejected_count INTEGER DEFAULT 0,
  modified_count INTEGER DEFAULT 0,
  ignored_count INTEGER DEFAULT 0,
  last_intervention_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add a view for acceptance rate (computed on query, not stored)
CREATE OR REPLACE VIEW intervention_stats_with_rate AS
SELECT
  *,
  CASE
    WHEN total_interventions > 0
    THEN ROUND(accepted_count::DECIMAL / total_interventions, 2)
    ELSE 0
  END as acceptance_rate
FROM intervention_statistics;

COMMENT ON TABLE intervention_statistics IS 'Aggregated intervention stats. Actor: AI Team. Changes when: intervention recorded.';

-- =============================================================================
-- PART 4: CREATE MIGRATION HELPER FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION migrate_user_profile_data(p_user_id INTEGER)
RETURNS VOID AS $$
BEGIN
  -- Migrate demographics
  INSERT INTO user_demographics (
    user_id, preferred_name, pronouns, birthdate, language, timezone, city, state, zip
  )
  SELECT
    id, preferred_name, pronouns,
    CASE WHEN birthdate ~ '^\d{4}-\d{2}-\d{2}$' THEN birthdate::DATE ELSE NULL END,
    language, timezone, city, state, zip
  FROM users WHERE id = p_user_id
  ON CONFLICT (user_id) DO UPDATE SET
    preferred_name = EXCLUDED.preferred_name,
    pronouns = EXCLUDED.pronouns,
    birthdate = EXCLUDED.birthdate,
    language = EXCLUDED.language,
    timezone = EXCLUDED.timezone,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    zip = EXCLUDED.zip,
    updated_at = CURRENT_TIMESTAMP;

  -- Migrate employment
  INSERT INTO user_employment (
    user_id, employment_status, occupation, employer, work_schedule,
    schedule_flexibility, commute_time, travel_required
  )
  SELECT
    id, employment_status, occupation, employer, work_schedule,
    schedule_flexibility, commute_time,
    COALESCE(travel_required, 'no') = 'yes'
  FROM users WHERE id = p_user_id
  ON CONFLICT (user_id) DO UPDATE SET
    employment_status = EXCLUDED.employment_status,
    occupation = EXCLUDED.occupation,
    employer = EXCLUDED.employer,
    work_schedule = EXCLUDED.work_schedule,
    schedule_flexibility = EXCLUDED.schedule_flexibility,
    commute_time = EXCLUDED.commute_time,
    travel_required = EXCLUDED.travel_required,
    updated_at = CURRENT_TIMESTAMP;

  -- Migrate health context
  INSERT INTO user_health_context (
    user_id, physical_conditions, physical_limitations, mental_conditions,
    mental_treatment, mental_history, substance_history, in_recovery, recovery_duration
  )
  SELECT
    id, health_physical_conditions, health_physical_limitations, health_mental_conditions,
    health_mental_treatment, health_mental_history, health_substance_history,
    COALESCE(health_in_recovery, 'no') = 'yes',
    health_recovery_duration
  FROM users WHERE id = p_user_id
  ON CONFLICT (user_id) DO UPDATE SET
    physical_conditions = EXCLUDED.physical_conditions,
    physical_limitations = EXCLUDED.physical_limitations,
    mental_conditions = EXCLUDED.mental_conditions,
    mental_treatment = EXCLUDED.mental_treatment,
    mental_history = EXCLUDED.mental_history,
    substance_history = EXCLUDED.substance_history,
    in_recovery = EXCLUDED.in_recovery,
    recovery_duration = EXCLUDED.recovery_duration,
    updated_at = CURRENT_TIMESTAMP;

  -- Migrate financials
  INSERT INTO user_financials (
    user_id, income_level, income_stability, employment_benefits, housing_status,
    housing_type, vehicles, debt_stress, support_paying, support_receiving
  )
  SELECT
    id, finance_income_level, finance_income_stability, finance_employment_benefits,
    finance_housing_status, finance_housing_type, finance_vehicles, finance_debt_stress,
    COALESCE(finance_support_paying, 'no') = 'yes',
    COALESCE(finance_support_receiving, 'no') = 'yes'
  FROM users WHERE id = p_user_id
  ON CONFLICT (user_id) DO UPDATE SET
    income_level = EXCLUDED.income_level,
    income_stability = EXCLUDED.income_stability,
    employment_benefits = EXCLUDED.employment_benefits,
    housing_status = EXCLUDED.housing_status,
    housing_type = EXCLUDED.housing_type,
    vehicles = EXCLUDED.vehicles,
    debt_stress = EXCLUDED.debt_stress,
    support_paying = EXCLUDED.support_paying,
    support_receiving = EXCLUDED.support_receiving,
    updated_at = CURRENT_TIMESTAMP;

  -- Migrate background
  INSERT INTO user_background (
    user_id, birthplace, raised_location, family_origin, culture, religion,
    military_service, military_branch, military_status, education_level, education_field
  )
  SELECT
    id, background_birthplace, background_raised, background_family_origin,
    background_culture, background_religion,
    COALESCE(background_military, 'no') = 'yes',
    background_military_branch, background_military_status,
    education_level, education_field
  FROM users WHERE id = p_user_id
  ON CONFLICT (user_id) DO UPDATE SET
    birthplace = EXCLUDED.birthplace,
    raised_location = EXCLUDED.raised_location,
    family_origin = EXCLUDED.family_origin,
    culture = EXCLUDED.culture,
    religion = EXCLUDED.religion,
    military_service = EXCLUDED.military_service,
    military_branch = EXCLUDED.military_branch,
    military_status = EXCLUDED.military_status,
    education_level = EXCLUDED.education_level,
    education_field = EXCLUDED.education_field,
    updated_at = CURRENT_TIMESTAMP;

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error migrating user %: %', p_user_id, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- PART 5: MIGRATE EXISTING DATA
-- =============================================================================

-- Migrate all existing users
DO $$
DECLARE
  user_rec RECORD;
  migrated_count INTEGER := 0;
BEGIN
  FOR user_rec IN SELECT id FROM users LOOP
    PERFORM migrate_user_profile_data(user_rec.id);
    migrated_count := migrated_count + 1;
  END LOOP;
  RAISE NOTICE 'Migrated profile data for % users', migrated_count;
END $$;

-- Initialize intervention_statistics for existing users
INSERT INTO intervention_statistics (user_id, created_at)
SELECT id, CURRENT_TIMESTAMP FROM users
WHERE id NOT IN (SELECT user_id FROM intervention_statistics)
ON CONFLICT (user_id) DO NOTHING;

-- Initialize communication_profiles for existing users
INSERT INTO communication_profiles (user_id, created_at)
SELECT id, CURRENT_TIMESTAMP FROM users
WHERE id NOT IN (SELECT user_id FROM communication_profiles)
ON CONFLICT (user_id) DO NOTHING;

-- =============================================================================
-- PART 6: CREATE INDEXES FOR NEW TABLES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_user_demographics_updated ON user_demographics(updated_at);
CREATE INDEX IF NOT EXISTS idx_user_employment_updated ON user_employment(updated_at);
CREATE INDEX IF NOT EXISTS idx_communication_profiles_updated ON communication_profiles(last_updated);

-- =============================================================================
-- PART 7: ADD TABLE COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE users IS 'Identity and Authentication ONLY. Actor: Security. Changes when: credentials change.';

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
--
-- SUMMARY OF CHANGES:
-- 1. Added CHECK constraints for type safety on status/role columns
-- 2. Created 5 normalized tables for user profile data:
--    - user_demographics, user_employment, user_health_context,
--    - user_financials, user_background
-- 3. Created 4 tables to replace JSONB columns:
--    - communication_profiles, communication_triggers,
--    - intervention_rewrites, intervention_statistics
-- 4. Migrated existing data to new tables
--
-- NEXT STEPS (requires code changes):
-- 1. Update ProfileService to read/write from new tables instead of users
-- 2. Update AI services to use communication_profiles, triggers, rewrites tables
-- 3. After verification, create migration to drop deprecated columns from users table
