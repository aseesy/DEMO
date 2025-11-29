-- Migration 014: Co-Parent Financial and Work Fields
-- Adds child support, income comparison, and work-related fields for co-parent contacts
-- Created: 2025-11-29

-- Financial fields
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS coparent_pays_child_support TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS coparent_receives_child_support TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS coparent_income_comparison TEXT;

-- Work fields
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS coparent_occupation TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS coparent_work_schedule TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS coparent_work_flexibility TEXT;
