/**
 * API Response Transformation Utilities
 *
 * Converts snake_case API responses to camelCase for frontend consistency
 * This layer sits between API calls and component usage
 */

/**
 * Convert snake_case string to camelCase
 * @param {string} str - snake_case string
 * @returns {string} - camelCase string
 */
function snakeToCamel(str) {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert camelCase string to snake_case
 * @param {string} str - camelCase string
 * @returns {string} - snake_case string
 */
function camelToSnake(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

// Note: Generic toCamelCase and toSnakeCase functions removed - unused
// Specific transformers (transformPrivacySettings) remain and are used

/**
 * Transform privacy settings from API format (snake_case) to frontend format (camelCase)
 * @param {Object} privacySettings - Privacy settings from API
 * @returns {Object} - Transformed privacy settings
 */
export function transformPrivacySettings(privacySettings) {
  if (!privacySettings) return privacySettings;

  return {
    personalVisibility:
      privacySettings.personal_visibility || privacySettings.personalVisibility || 'shared',
    workVisibility: privacySettings.work_visibility || privacySettings.workVisibility || 'private',
    healthVisibility:
      privacySettings.health_visibility || privacySettings.healthVisibility || 'private',
    financialVisibility:
      privacySettings.financial_visibility || privacySettings.financialVisibility || 'private',
    backgroundVisibility:
      privacySettings.background_visibility || privacySettings.backgroundVisibility || 'shared',
    fieldOverrides:
      typeof privacySettings.field_overrides === 'string'
        ? JSON.parse(privacySettings.field_overrides || '{}')
        : privacySettings.field_overrides || privacySettings.fieldOverrides || {},
  };
}

/**
 * Transform privacy settings from frontend format (camelCase) to API format (snake_case)
 * @param {Object} privacySettings - Privacy settings from frontend
 * @returns {Object} - Transformed privacy settings for API
 */
export function transformPrivacySettingsForAPI(privacySettings) {
  if (!privacySettings) return privacySettings;

  return {
    personal_visibility:
      privacySettings.personalVisibility || privacySettings.personal_visibility || 'shared',
    work_visibility: privacySettings.workVisibility || privacySettings.work_visibility || 'private',
    health_visibility:
      privacySettings.healthVisibility || privacySettings.health_visibility || 'private',
    financial_visibility:
      privacySettings.financialVisibility || privacySettings.financial_visibility || 'private',
    background_visibility:
      privacySettings.backgroundVisibility || privacySettings.background_visibility || 'shared',
    field_overrides:
      typeof privacySettings.fieldOverrides === 'object'
        ? JSON.stringify(privacySettings.fieldOverrides || {})
        : privacySettings.fieldOverrides || privacySettings.field_overrides || '{}',
  };
}

export default {
  transformPrivacySettings,
  transformPrivacySettingsForAPI,
};
