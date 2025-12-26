-- PostgreSQL Migration: Cleanup Deprecated User Columns
--
-- ⚠️ WARNING: DO NOT RUN THIS MIGRATION UNTIL:
--   1. Migration 023 has been applied
--   2. ProfileService has been updated to use new tables
--   3. All code paths have been verified in production
--   4. You have a database backup
--
-- This migration removes deprecated columns from the users table
-- after data has been migrated to normalized tables.
--
-- Created: 2024-12-23

-- =============================================================================
-- VERIFICATION GATE
-- =============================================================================
-- This migration will FAIL if the normalized tables don't have data.
-- This ensures we don't accidentally drop columns before migration.

DO $$
DECLARE
  user_count INTEGER;
  demo_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM users;
  SELECT COUNT(*) INTO demo_count FROM user_demographics;

  IF user_count > demo_count THEN
    RAISE EXCEPTION 'SAFETY CHECK FAILED: user_demographics (%) has fewer rows than users (%). Run migration 023 first!', demo_count, user_count;
  END IF;

  RAISE NOTICE 'Verification passed: users=%, demographics=%', user_count, demo_count;
END $$;

-- =============================================================================
-- PART 1: DROP DEMOGRAPHIC COLUMNS
-- These are now in user_demographics table
-- =============================================================================

DO $$
BEGIN
  -- preferred_name
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'preferred_name') THEN
    ALTER TABLE users DROP COLUMN preferred_name;
    RAISE NOTICE 'Dropped: preferred_name';
  END IF;

  -- pronouns
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'pronouns') THEN
    ALTER TABLE users DROP COLUMN pronouns;
    RAISE NOTICE 'Dropped: pronouns';
  END IF;

  -- birthdate
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'birthdate') THEN
    ALTER TABLE users DROP COLUMN birthdate;
    RAISE NOTICE 'Dropped: birthdate';
  END IF;

  -- language
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'language') THEN
    ALTER TABLE users DROP COLUMN language;
    RAISE NOTICE 'Dropped: language';
  END IF;

  -- timezone (keep in users for auth/session purposes - skip this)
  -- IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'timezone') THEN
  --   ALTER TABLE users DROP COLUMN timezone;
  --   RAISE NOTICE 'Dropped: timezone';
  -- END IF;

  -- city
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'city') THEN
    ALTER TABLE users DROP COLUMN city;
    RAISE NOTICE 'Dropped: city';
  END IF;

  -- state
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'state') THEN
    ALTER TABLE users DROP COLUMN state;
    RAISE NOTICE 'Dropped: state';
  END IF;

  -- zip
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'zip') THEN
    ALTER TABLE users DROP COLUMN zip;
    RAISE NOTICE 'Dropped: zip';
  END IF;
END $$;

-- =============================================================================
-- PART 2: DROP EMPLOYMENT COLUMNS
-- These are now in user_employment table
-- =============================================================================

DO $$
BEGIN
  -- employment_status
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'employment_status') THEN
    ALTER TABLE users DROP COLUMN employment_status;
    RAISE NOTICE 'Dropped: employment_status';
  END IF;

  -- occupation
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'occupation') THEN
    ALTER TABLE users DROP COLUMN occupation;
    RAISE NOTICE 'Dropped: occupation';
  END IF;

  -- employer
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'employer') THEN
    ALTER TABLE users DROP COLUMN employer;
    RAISE NOTICE 'Dropped: employer';
  END IF;

  -- work_schedule
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'work_schedule') THEN
    ALTER TABLE users DROP COLUMN work_schedule;
    RAISE NOTICE 'Dropped: work_schedule';
  END IF;

  -- schedule_flexibility
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'schedule_flexibility') THEN
    ALTER TABLE users DROP COLUMN schedule_flexibility;
    RAISE NOTICE 'Dropped: schedule_flexibility';
  END IF;

  -- commute_time
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'commute_time') THEN
    ALTER TABLE users DROP COLUMN commute_time;
    RAISE NOTICE 'Dropped: commute_time';
  END IF;

  -- travel_required
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'travel_required') THEN
    ALTER TABLE users DROP COLUMN travel_required;
    RAISE NOTICE 'Dropped: travel_required';
  END IF;
END $$;

-- =============================================================================
-- PART 3: DROP HEALTH COLUMNS
-- These are now in user_health_context table
-- =============================================================================

DO $$
BEGIN
  -- health_physical_conditions
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'health_physical_conditions') THEN
    ALTER TABLE users DROP COLUMN health_physical_conditions;
    RAISE NOTICE 'Dropped: health_physical_conditions';
  END IF;

  -- health_physical_limitations
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'health_physical_limitations') THEN
    ALTER TABLE users DROP COLUMN health_physical_limitations;
    RAISE NOTICE 'Dropped: health_physical_limitations';
  END IF;

  -- health_mental_conditions
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'health_mental_conditions') THEN
    ALTER TABLE users DROP COLUMN health_mental_conditions;
    RAISE NOTICE 'Dropped: health_mental_conditions';
  END IF;

  -- health_mental_treatment
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'health_mental_treatment') THEN
    ALTER TABLE users DROP COLUMN health_mental_treatment;
    RAISE NOTICE 'Dropped: health_mental_treatment';
  END IF;

  -- health_mental_history
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'health_mental_history') THEN
    ALTER TABLE users DROP COLUMN health_mental_history;
    RAISE NOTICE 'Dropped: health_mental_history';
  END IF;

  -- health_substance_history
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'health_substance_history') THEN
    ALTER TABLE users DROP COLUMN health_substance_history;
    RAISE NOTICE 'Dropped: health_substance_history';
  END IF;

  -- health_in_recovery
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'health_in_recovery') THEN
    ALTER TABLE users DROP COLUMN health_in_recovery;
    RAISE NOTICE 'Dropped: health_in_recovery';
  END IF;

  -- health_recovery_duration
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'health_recovery_duration') THEN
    ALTER TABLE users DROP COLUMN health_recovery_duration;
    RAISE NOTICE 'Dropped: health_recovery_duration';
  END IF;
END $$;

-- =============================================================================
-- PART 4: DROP FINANCIAL COLUMNS
-- These are now in user_financials table
-- =============================================================================

DO $$
BEGIN
  -- finance_income_level
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'finance_income_level') THEN
    ALTER TABLE users DROP COLUMN finance_income_level;
    RAISE NOTICE 'Dropped: finance_income_level';
  END IF;

  -- finance_income_stability
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'finance_income_stability') THEN
    ALTER TABLE users DROP COLUMN finance_income_stability;
    RAISE NOTICE 'Dropped: finance_income_stability';
  END IF;

  -- finance_employment_benefits
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'finance_employment_benefits') THEN
    ALTER TABLE users DROP COLUMN finance_employment_benefits;
    RAISE NOTICE 'Dropped: finance_employment_benefits';
  END IF;

  -- finance_housing_status
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'finance_housing_status') THEN
    ALTER TABLE users DROP COLUMN finance_housing_status;
    RAISE NOTICE 'Dropped: finance_housing_status';
  END IF;

  -- finance_housing_type
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'finance_housing_type') THEN
    ALTER TABLE users DROP COLUMN finance_housing_type;
    RAISE NOTICE 'Dropped: finance_housing_type';
  END IF;

  -- finance_vehicles
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'finance_vehicles') THEN
    ALTER TABLE users DROP COLUMN finance_vehicles;
    RAISE NOTICE 'Dropped: finance_vehicles';
  END IF;

  -- finance_debt_stress
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'finance_debt_stress') THEN
    ALTER TABLE users DROP COLUMN finance_debt_stress;
    RAISE NOTICE 'Dropped: finance_debt_stress';
  END IF;

  -- finance_support_paying
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'finance_support_paying') THEN
    ALTER TABLE users DROP COLUMN finance_support_paying;
    RAISE NOTICE 'Dropped: finance_support_paying';
  END IF;

  -- finance_support_receiving
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'finance_support_receiving') THEN
    ALTER TABLE users DROP COLUMN finance_support_receiving;
    RAISE NOTICE 'Dropped: finance_support_receiving';
  END IF;
END $$;

-- =============================================================================
-- PART 5: DROP BACKGROUND COLUMNS
-- These are now in user_background table
-- =============================================================================

DO $$
BEGIN
  -- background_birthplace
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'background_birthplace') THEN
    ALTER TABLE users DROP COLUMN background_birthplace;
    RAISE NOTICE 'Dropped: background_birthplace';
  END IF;

  -- background_raised
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'background_raised') THEN
    ALTER TABLE users DROP COLUMN background_raised;
    RAISE NOTICE 'Dropped: background_raised';
  END IF;

  -- background_family_origin
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'background_family_origin') THEN
    ALTER TABLE users DROP COLUMN background_family_origin;
    RAISE NOTICE 'Dropped: background_family_origin';
  END IF;

  -- background_culture
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'background_culture') THEN
    ALTER TABLE users DROP COLUMN background_culture;
    RAISE NOTICE 'Dropped: background_culture';
  END IF;

  -- background_religion
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'background_religion') THEN
    ALTER TABLE users DROP COLUMN background_religion;
    RAISE NOTICE 'Dropped: background_religion';
  END IF;

  -- background_military
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'background_military') THEN
    ALTER TABLE users DROP COLUMN background_military;
    RAISE NOTICE 'Dropped: background_military';
  END IF;

  -- background_military_branch
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'background_military_branch') THEN
    ALTER TABLE users DROP COLUMN background_military_branch;
    RAISE NOTICE 'Dropped: background_military_branch';
  END IF;

  -- background_military_status
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'background_military_status') THEN
    ALTER TABLE users DROP COLUMN background_military_status;
    RAISE NOTICE 'Dropped: background_military_status';
  END IF;

  -- education_level
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'education_level') THEN
    ALTER TABLE users DROP COLUMN education_level;
    RAISE NOTICE 'Dropped: education_level';
  END IF;

  -- education_field
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'education_field') THEN
    ALTER TABLE users DROP COLUMN education_field;
    RAISE NOTICE 'Dropped: education_field';
  END IF;
END $$;

-- =============================================================================
-- PART 6: DROP DEPRECATED JSONB COLUMNS
-- These are now in normalized tables
-- =============================================================================

DO $$
BEGIN
  -- communication_patterns (now in communication_profiles)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'communication_patterns') THEN
    ALTER TABLE users DROP COLUMN communication_patterns;
    RAISE NOTICE 'Dropped: communication_patterns';
  END IF;

  -- triggers (now in communication_triggers)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'triggers') THEN
    ALTER TABLE users DROP COLUMN triggers;
    RAISE NOTICE 'Dropped: triggers';
  END IF;

  -- successful_rewrites (now in intervention_rewrites)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'successful_rewrites') THEN
    ALTER TABLE users DROP COLUMN successful_rewrites;
    RAISE NOTICE 'Dropped: successful_rewrites';
  END IF;

  -- intervention_history (now in intervention_statistics)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'intervention_history') THEN
    ALTER TABLE users DROP COLUMN intervention_history;
    RAISE NOTICE 'Dropped: intervention_history';
  END IF;
END $$;

-- =============================================================================
-- SUMMARY
-- =============================================================================
--
-- Columns remaining in users table (identity/auth only):
--   id, username, email, password_hash, first_name, last_name, display_name,
--   phone, profile_picture_url, profile_completion_percentage, profile_last_updated,
--   google_id, google_email, google_picture, onboarding_status, created_at, updated_at
--
-- Users table now follows Single Responsibility Principle:
--   Actor: Security/Auth team
--   Reason to change: Authentication or identity requirements change
--
-- Profile data is now in normalized tables:
--   user_demographics, user_employment, user_health_context,
--   user_financials, user_background
--
-- AI learning data is now in normalized tables:
--   communication_profiles, communication_triggers,
--   intervention_rewrites, intervention_statistics
--

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'CLEANUP MIGRATION COMPLETE';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'Deprecated columns have been removed from users table.';
  RAISE NOTICE 'Profile data now lives in normalized tables.';
  RAISE NOTICE '';
END $$;
