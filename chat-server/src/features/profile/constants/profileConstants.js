/**
 * Profile Constants
 *
 * Centralized constants for the user profile system.
 * Used across encryption, privacy, completion, and validation.
 *
 * @module src/utils/profileConstants
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

/**
 * Valid values for enum-type profile fields
 */
const VALID_FIELD_VALUES = {
  pronouns: ['he/him', 'she/her', 'they/them', 'other', ''],
  employment_status: [
    'employed',
    'self_employed',
    'unemployed',
    'student',
    'retired',
    'disability',
    'homemaker',
    '',
  ],
  schedule_flexibility: ['high', 'medium', 'low', ''],
  income_level: ['under_25k', '25_50k', '50_75k', '75_100k', 'over_100k', 'prefer_not_say', ''],
  debt_stress: ['none', 'manageable', 'significant', 'overwhelming', ''],
};

/**
 * Field length limits
 */
const FIELD_LIMITS = {
  shortText: 500, // preferred_name, city, etc.
  longText: 2000, // work_schedule, health_mental_history, etc.
};

/**
 * Short text fields (500 char limit)
 */
const SHORT_TEXT_FIELDS = [
  'preferred_name',
  'employer',
  'city',
  'state',
  'zip',
  'phone',
  'background_birthplace',
  'background_raised',
  'education_field',
];

/**
 * Long text fields (2000 char limit)
 */
const LONG_TEXT_FIELDS = [
  'work_schedule',
  'health_physical_limitations',
  'health_mental_history',
  'background_family_origin',
];

module.exports = {
  SENSITIVE_FIELDS,
  PROFILE_SECTIONS,
  DEFAULT_PRIVACY_SETTINGS,
  VALID_FIELD_VALUES,
  FIELD_LIMITS,
  SHORT_TEXT_FIELDS,
  LONG_TEXT_FIELDS,
};
