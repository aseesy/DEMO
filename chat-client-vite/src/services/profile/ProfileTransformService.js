/**
 * ProfileTransformService - Application Layer
 *
 * Responsibility: Transform profile data between API format and display format.
 *
 * This service encapsulates business rules for:
 * - How profile fields are mapped from API to UI
 * - Default values for missing fields
 * - Data normalization rules
 *
 * Why this exists:
 * - Separates business rules from UI hooks/components
 * - Reusable across multiple hooks/components
 * - Testable independently
 * - Single source of truth for field mapping logic
 */

import { logUserTransform } from '../../utils/dataTransformDebug.js';

/**
 * Transform profile from API format to display format
 *
 * Business Rule: Maps 70+ API fields to UI format with appropriate defaults.
 *
 * @param {Object} data - Raw profile data from API
 * @param {string} username - Fallback username if not in data
 * @returns {Object} Transformed profile for display
 */
export function transformProfileFromApi(data, username) {
  if (!data) {
    return null;
  }

  const profileData = {
    // Core fields
    username: data.username || username,
    email: data.email || '',

    // Personal Information
    first_name: data.first_name || '',
    last_name: data.last_name || '',
    display_name: data.display_name || '',
    preferred_name: data.preferred_name || '',
    pronouns: data.pronouns || '',
    birthdate: data.birthdate || '',
    language: data.language || 'en',
    timezone: data.timezone || '',
    phone: data.phone || '',
    city: data.city || '',
    state: data.state || '',
    zip: data.zip || '',
    address: data.address || '',

    // Work & Schedule
    employment_status: data.employment_status || '',
    employer: data.employer || '',
    work_schedule: data.work_schedule || '',
    schedule_flexibility: data.schedule_flexibility || '',
    commute_time: data.commute_time || '',
    travel_required: data.travel_required || '',

    // Health & Wellbeing
    health_physical_conditions: data.health_physical_conditions || '',
    health_physical_limitations: data.health_physical_limitations || '',
    health_mental_conditions: data.health_mental_conditions || '',
    health_mental_treatment: data.health_mental_treatment || '',
    health_mental_history: data.health_mental_history || '',
    health_substance_history: data.health_substance_history || '',
    health_in_recovery: data.health_in_recovery || '',
    health_recovery_duration: data.health_recovery_duration || '',

    // Financial Context
    finance_income_level: data.finance_income_level || '',
    finance_income_stability: data.finance_income_stability || '',
    finance_employment_benefits: data.finance_employment_benefits || '',
    finance_housing_status: data.finance_housing_status || '',
    finance_housing_type: data.finance_housing_type || '',
    finance_vehicles: data.finance_vehicles || '',
    finance_debt_stress: data.finance_debt_stress || '',
    finance_support_paying: data.finance_support_paying || '',
    finance_support_receiving: data.finance_support_receiving || '',

    // Background & Education
    background_birthplace: data.background_birthplace || '',
    background_raised: data.background_raised || '',
    background_family_origin: data.background_family_origin || '',
    background_culture: data.background_culture || '',
    background_religion: data.background_religion || '',
    background_military: data.background_military || '',
    background_military_branch: data.background_military_branch || '',
    background_military_status: data.background_military_status || '',
    education_level: data.education_level || '',
    education_field: data.education_field || '',

    // Existing fields
    additional_context: data.additional_context || '',
    profile_picture: data.profile_picture || '',
    household_members: data.household_members || '',
    communication_style: data.communication_style || '',
    communication_triggers: data.communication_triggers || '',
    communication_goals: data.communication_goals || '',

    // Metadata
    profile_completion_percentage: data.profile_completion_percentage || 0,
    profile_last_updated: data.profile_last_updated || null,
  };

  // Debug logging for user/profile data transformation
  logUserTransform(data, profileData);

  return profileData;
}

/**
 * Transform profile from display format to API format
 *
 * Business Rule: Maps UI fields back to API format for submission.
 *
 * @param {Object} profileData - Profile in display format
 * @returns {Object} Profile in API format
 */
export function transformProfileForApi(profileData) {
  if (!profileData) {
    return null;
  }

  // Return as-is (API expects same structure)
  // If transformations are needed, add them here
  return {
    ...profileData,
  };
}
