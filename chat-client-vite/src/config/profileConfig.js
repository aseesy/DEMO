/**
 * Profile Configuration
 *
 * Centralized configuration for profile forms.
 * Pure data - no React dependencies.
 */

/**
 * Profile tabs configuration
 */
export const PROFILE_TABS = [
  { id: 'personal', label: 'Personal' },
  { id: 'motivations', label: 'Motivations' },
  { id: 'background', label: 'Background' },
];

/**
 * Core values options for multi-select
 */
export const CORE_VALUES_OPTIONS = [
  { value: 'honesty', label: 'Honesty' },
  { value: 'integrity', label: 'Integrity' },
  { value: 'fairness', label: 'Fairness' },
  { value: 'responsibility', label: 'Responsibility' },
  { value: 'respect', label: 'Respect' },
  { value: 'compassion', label: 'Compassion' },
  { value: 'justice', label: 'Justice' },
  { value: 'kindness', label: 'Kindness' },
  { value: 'empathy', label: 'Empathy' },
  { value: 'loyalty', label: 'Loyalty' },
  { value: 'cooperation', label: 'Cooperation' },
  { value: 'tolerance', label: 'Tolerance' },
  { value: 'gratitude', label: 'Gratitude' },
  { value: 'self_discipline', label: 'Self-discipline' },
  { value: 'humility', label: 'Humility' },
  { value: 'courage', label: 'Courage' },
  { value: 'patience', label: 'Patience' },
  { value: 'perseverance', label: 'Perseverance' },
  { value: 'authenticity', label: 'Authenticity' },
  { value: 'reliability', label: 'Reliability' },
  { value: 'professionalism', label: 'Professionalism' },
  { value: 'accountability', label: 'Accountability' },
  { value: 'innovation', label: 'Innovation' },
  { value: 'teamwork', label: 'Teamwork' },
];

/**
 * Schedule flexibility options
 */
export const SCHEDULE_FLEXIBILITY_OPTIONS = [
  { value: '', label: 'Select...' },
  { value: 'high', label: 'High - I can adjust easily' },
  { value: 'medium', label: 'Medium - Some flexibility' },
  { value: 'low', label: 'Low - Fixed schedule' },
];

/**
 * Education level options
 */
export const EDUCATION_LEVEL_OPTIONS = [
  { value: '', label: 'Select...' },
  { value: 'high_school', label: 'High School' },
  { value: 'some_college', label: 'Some College' },
  { value: 'associates', label: "Associate's Degree" },
  { value: 'bachelors', label: "Bachelor's Degree" },
  { value: 'masters', label: "Master's Degree" },
  { value: 'doctorate', label: 'Doctorate' },
  { value: 'trade_school', label: 'Trade/Vocational School' },
];

/**
 * Mental health treatment options
 */
export const TREATMENT_OPTIONS = [
  { value: '', label: 'Select...' },
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

/**
 * Substance history options
 */
export const SUBSTANCE_HISTORY_OPTIONS = [
  { value: '', label: 'Select...' },
  { value: 'none', label: 'None' },
  { value: 'past', label: 'Past history' },
  { value: 'current', label: 'Currently dealing with' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

/**
 * Recovery status options
 */
export const RECOVERY_OPTIONS = [
  { value: '', label: 'Select...' },
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

/**
 * Image upload constraints
 */
export const IMAGE_UPLOAD_CONFIG = {
  maxSizeBytes: 5 * 1024 * 1024, // 5MB
  maxSizeMB: 5,
  acceptedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  acceptAttribute: 'image/*',
};

/**
 * Additional context field constraints
 */
export const ADDITIONAL_CONTEXT_CONFIG = {
  maxLength: 1000,
};

/**
 * Parse comma-separated values string to array
 * @param {string} valuesString - Comma-separated values
 * @returns {string[]} Array of values
 */
export function parseMultiSelectValues(valuesString) {
  if (!valuesString || typeof valuesString !== 'string') {
    return [];
  }
  return valuesString.split(',').filter(Boolean);
}

/**
 * Convert array of values to comma-separated string
 * @param {string[]} valuesArray - Array of values
 * @returns {string} Comma-separated string
 */
export function serializeMultiSelectValues(valuesArray) {
  if (!Array.isArray(valuesArray)) {
    return '';
  }
  return valuesArray.filter(Boolean).join(',');
}

/**
 * Toggle a value in a multi-select string
 * @param {string} currentValues - Current comma-separated values
 * @param {string} valueToToggle - Value to add or remove
 * @returns {string} Updated comma-separated values
 */
export function toggleMultiSelectValue(currentValues, valueToToggle) {
  const values = parseMultiSelectValues(currentValues);
  const isSelected = values.includes(valueToToggle);

  const newValues = isSelected
    ? values.filter(v => v !== valueToToggle)
    : [...values, valueToToggle];

  return serializeMultiSelectValues(newValues);
}
