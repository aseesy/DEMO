/**
 * Profile Privacy Module
 *
 * Single Responsibility: Filter profile data based on privacy settings.
 *
 * Handles visibility rules, field-level overrides, and co-parent view filtering.
 */

const { PROFILE_SECTIONS, DEFAULT_PRIVACY_SETTINGS } = require('./constants');
const { decryptSensitiveFields } = require('./encryption');

/**
 * Filter profile data based on privacy settings
 *
 * @param {Object} profile - Full profile data
 * @param {Object} privacySettings - Privacy settings object
 * @param {boolean} isOwnProfile - Whether this is the user viewing their own profile
 * @returns {Object} Filtered profile data
 */
function filterProfileByPrivacy(profile, privacySettings, isOwnProfile) {
  if (!profile) return profile;

  // Own profile - return decrypted data
  if (isOwnProfile) {
    return decryptSensitiveFields(profile);
  }

  // Co-parent view - apply privacy filtering
  const settings = privacySettings || DEFAULT_PRIVACY_SETTINGS;
  const result = { ...profile };

  // Parse field overrides if present
  let fieldOverrides = {};
  try {
    if (settings.field_overrides) {
      fieldOverrides =
        typeof settings.field_overrides === 'string'
          ? JSON.parse(settings.field_overrides)
          : settings.field_overrides;
    }
  } catch (e) {
    fieldOverrides = {};
  }

  // ALWAYS remove health fields from co-parent view (non-negotiable)
  for (const field of PROFILE_SECTIONS.health) {
    delete result[field];
  }

  // ALWAYS remove financial fields from co-parent view (non-negotiable)
  for (const field of PROFILE_SECTIONS.financial) {
    delete result[field];
  }

  // Apply visibility settings for other sections
  if (settings.personal_visibility === 'private') {
    // Remove personal fields except name (name is always visible)
    for (const field of PROFILE_SECTIONS.personal) {
      if (field !== 'first_name' && field !== 'last_name' && field !== 'preferred_name') {
        delete result[field];
      }
    }
  }

  if (settings.work_visibility === 'private') {
    for (const field of PROFILE_SECTIONS.work) {
      delete result[field];
    }
  }

  if (settings.background_visibility === 'private') {
    for (const field of PROFILE_SECTIONS.background) {
      delete result[field];
    }
  }

  // Apply field-level overrides
  for (const [field, visibility] of Object.entries(fieldOverrides)) {
    if (visibility === 'private') {
      delete result[field];
    }
  }

  return result;
}

/**
 * Get default privacy settings for a new user
 *
 * @returns {Object} Default privacy settings
 */
function getDefaultPrivacySettings() {
  return { ...DEFAULT_PRIVACY_SETTINGS };
}

module.exports = {
  filterProfileByPrivacy,
  getDefaultPrivacySettings,
};
