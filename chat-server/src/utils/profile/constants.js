/**
 * Profile Constants
 *
 * Shared constants used across profile modules.
 * Single source of truth for field definitions and default settings.
 */

/**
 * Fields that require encryption at rest.
 * These contain sensitive health and financial information.
 */
const SENSITIVE_FIELDS = [
  'health_physical_conditions',
  'health_physical_limitations',
  'health_mental_conditions',
  'health_mental_treatment',
  'health_mental_history',
  'health_substance_history',
  'health_in_recovery',
  'health_recovery_duration',
  'finance_income_level',
  'finance_debt_stress',
  'finance_support_paying',
  'finance_support_receiving',
];

/**
 * Fields by section for completion calculation
 */
const PROFILE_SECTIONS = {
  personal: [
    'first_name',
    'last_name',
    'preferred_name',
    'pronouns',
    'birthdate',
    'language',
    'timezone',
    'phone',
    'city',
    'state',
    'zip',
  ],
  work: [
    'employment_status',
    'occupation',
    'employer',
    'work_schedule',
    'schedule_flexibility',
    'commute_time',
    'travel_required',
  ],
  health: [
    'health_physical_conditions',
    'health_physical_limitations',
    'health_mental_conditions',
    'health_mental_treatment',
    'health_mental_history',
    'health_substance_history',
    'health_in_recovery',
    'health_recovery_duration',
  ],
  financial: [
    'finance_income_level',
    'finance_income_stability',
    'finance_employment_benefits',
    'finance_housing_status',
    'finance_housing_type',
    'finance_vehicles',
    'finance_debt_stress',
    'finance_support_paying',
    'finance_support_receiving',
  ],
  background: [
    'background_birthplace',
    'background_raised',
    'background_family_origin',
    'background_culture',
    'background_religion',
    'background_military',
    'background_military_branch',
    'background_military_status',
    'education_level',
    'education_field',
  ],
};

/**
 * Default privacy settings - health and financial are ALWAYS private
 */
const DEFAULT_PRIVACY_SETTINGS = {
  personal_visibility: 'shared',
  work_visibility: 'private',
  health_visibility: 'private', // Immutable - always private
  financial_visibility: 'private', // Immutable - always private
  background_visibility: 'shared',
  field_overrides: '{}',
};

module.exports = {
  SENSITIVE_FIELDS,
  PROFILE_SECTIONS,
  DEFAULT_PRIVACY_SETTINGS,
};
