/**
 * ProfileTransformService - Application Layer
 *
 * Transforms profile data between API and display formats.
 * Uses defaults for missing fields.
 */

import { logUserTransform } from '../../utils/dataTransformDebug.js';

// Default values for all profile fields
const PROFILE_DEFAULTS = {
  // Core
  username: '',
  email: '',
  // Personal
  first_name: '',
  last_name: '',
  display_name: '',
  preferred_name: '',
  pronouns: '',
  birthdate: '',
  language: 'en',
  timezone: '',
  phone: '',
  city: '',
  state: '',
  zip: '',
  address: '',
  // Work & Schedule
  employment_status: '',
  employer: '',
  work_schedule: '',
  schedule_flexibility: '',
  commute_time: '',
  travel_required: '',
  // Health & Wellbeing
  health_physical_conditions: '',
  health_physical_limitations: '',
  health_mental_conditions: '',
  health_mental_treatment: '',
  health_mental_history: '',
  health_substance_history: '',
  health_in_recovery: '',
  health_recovery_duration: '',
  // Financial
  finance_income_level: '',
  finance_income_stability: '',
  finance_employment_benefits: '',
  finance_housing_status: '',
  finance_housing_type: '',
  finance_vehicles: '',
  finance_debt_stress: '',
  finance_support_paying: '',
  finance_support_receiving: '',
  // Background & Education
  background_birthplace: '',
  background_raised: '',
  background_family_origin: '',
  background_culture: '',
  background_religion: '',
  background_military: '',
  background_military_branch: '',
  background_military_status: '',
  education_level: '',
  education_field: '',
  // Other
  additional_context: '',
  profile_picture: '',
  household_members: '',
  communication_style: '',
  communication_triggers: '',
  communication_goals: '',
  // Metadata
  profile_completion_percentage: 0,
  profile_last_updated: null,
};

/**
 * Transform profile from API format to display format
 * @param {Object} data - Raw profile data from API
 * @param {string} username - Fallback username if not in data
 * @returns {Object} Transformed profile with defaults applied
 */
export function transformProfileFromApi(data, username) {
  if (!data) return null;

  // Apply defaults, then overlay API data, then ensure username
  const profileData = {
    ...PROFILE_DEFAULTS,
    ...data,
    username: data.username || username,
  };

  logUserTransform(data, profileData);
  return profileData;
}

/**
 * Transform profile from display format to API format
 * @param {Object} profileData - Profile in display format
 * @returns {Object} Profile in API format (currently identical)
 */
export function transformProfileForApi(profileData) {
  return profileData || null;
}
