-- Migration 013: Child Health Fields
-- Adds health-related fields for child contacts (My Child, My Partner's Child, My Co-Parent's Child)
-- Created: 2025-11-28

-- Physical Health
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS child_health_physical_conditions TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS child_health_allergies TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS child_health_medications TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS child_health_doctor TEXT;

-- Mental Health
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS child_health_mental_conditions TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS child_health_mental_diagnosis TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS child_health_mental_treatment TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS child_health_therapist TEXT;

-- Developmental
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS child_health_developmental_delays TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS child_health_developmental_supports TEXT;
