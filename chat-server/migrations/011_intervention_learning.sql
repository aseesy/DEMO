-- PostgreSQL Migration: Intervention Learning System
-- Adds intervention_learning column to user_context table
-- for tracking intervention outcomes and learning user preferences
--
-- Feature: Contextual Awareness Improvements - Phase 2
-- Created: 2025-12-08

-- Add intervention_learning column to user_context table
-- Stores JSONB data with successful/unsuccessful interventions, user preferences, and pattern success rates
ALTER TABLE user_context ADD COLUMN IF NOT EXISTS intervention_learning JSONB DEFAULT '{}'::jsonb;

-- Create index for efficient queries (if needed in future)
-- Note: JSONB columns are already indexed efficiently in PostgreSQL

COMMENT ON COLUMN user_context.intervention_learning IS 'Tracks intervention outcomes, user preferences, and pattern success rates for adaptive coaching';












































