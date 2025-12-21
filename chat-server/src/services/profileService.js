/**
 * Profile Service
 *
 * Business logic for profile privacy filtering and completion calculation.
 * Pure functions - no database operations.
 *
 * @module src/services/profileService
 */

const { PROFILE_SECTIONS, DEFAULT_PRIVACY_SETTINGS } = require('../utils/profileConstants');
const { decryptSensitiveFields } = require('../utils/crypto');

// ============================================================================
// PRIVACY FILTERING
// ============================================================================

/**
 * Get own profile with decrypted sensitive fields
 * Use this when a user is viewing their own profile.
 *
 * @param {Object} profile - Full profile data
 * @returns {Object} Profile with decrypted sensitive fields
 */
function getOwnProfile(profile) {
  if (!profile) return profile;
  return decryptSensitiveFields(profile);
}

/**
 * Filter profile for co-parent view with privacy settings applied
 * Use this when viewing another user's profile.
 *
 * @param {Object} profile - Full profile data
 * @param {Object} privacySettings - Privacy settings object (optional, uses defaults)
 * @returns {Object} Privacy-filtered profile data
 */
function filterProfileForCoParent(profile, privacySettings) {
  if (!profile) return profile;

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
 * Filter profile data based on privacy settings
 *
 * @deprecated Use getOwnProfile() or filterProfileForCoParent() instead.
 * This function uses a flag argument which makes intent unclear.
 *
 * @param {Object} profile - Full profile data
 * @param {Object} privacySettings - Privacy settings object
 * @param {boolean} isOwnProfile - Whether this is the user viewing their own profile
 * @returns {Object} Filtered profile data
 */
function filterProfileByPrivacy(profile, privacySettings, isOwnProfile) {
  if (isOwnProfile) {
    return getOwnProfile(profile);
  }
  return filterProfileForCoParent(profile, privacySettings);
}

/**
 * Get default privacy settings for a new user
 *
 * @returns {Object} Default privacy settings
 */
function getDefaultPrivacySettings() {
  return { ...DEFAULT_PRIVACY_SETTINGS };
}

// ============================================================================
// PROFILE COMPLETION
// ============================================================================

/**
 * Calculate profile completion percentage
 * Each section contributes 20% to the total (5 sections)
 *
 * @param {Object} profile - Profile data
 * @returns {number} Completion percentage (0-100)
 */
function calculateProfileCompletion(profile) {
  if (!profile) return 0;

  let totalScore = 0;

  for (const [sectionName, fields] of Object.entries(PROFILE_SECTIONS)) {
    const filledFields = fields.filter(field => {
      const value = profile[field];
      return value && value.toString().trim().length > 0;
    });

    // Each section is worth 20%
    const sectionScore = (filledFields.length / fields.length) * 20;
    totalScore += sectionScore;
  }

  return Math.round(totalScore);
}

/**
 * Get section completion details
 *
 * @param {Object} profile - Profile data
 * @returns {Object} Section-by-section completion details
 */
function getSectionCompletion(profile) {
  if (!profile) {
    return {
      personal: 0,
      work: 0,
      health: 0,
      financial: 0,
      background: 0,
      overall: 0,
    };
  }

  const result = {};

  for (const [sectionName, fields] of Object.entries(PROFILE_SECTIONS)) {
    const filledFields = fields.filter(field => {
      const value = profile[field];
      return value && value.toString().trim().length > 0;
    });

    result[sectionName] = Math.round((filledFields.length / fields.length) * 100);
  }

  result.overall = calculateProfileCompletion(profile);

  return result;
}

/**
 * Get next suggested section to complete
 *
 * @param {Object} profile - Profile data
 * @returns {string|null} Section name or null if all complete
 */
function getNextSuggestedSection(profile) {
  const completion = getSectionCompletion(profile);

  // Priority order: personal > work > background > health > financial
  const priority = ['personal', 'work', 'background', 'health', 'financial'];

  for (const section of priority) {
    if (completion[section] < 50) {
      return section;
    }
  }

  // Find any incomplete section
  for (const section of priority) {
    if (completion[section] < 100) {
      return section;
    }
  }

  return null;
}

module.exports = {
  // Privacy - New clean functions (prefer these)
  getOwnProfile,
  filterProfileForCoParent,
  getDefaultPrivacySettings,

  // Privacy - Deprecated (kept for backwards compatibility)
  filterProfileByPrivacy,

  // Completion
  calculateProfileCompletion,
  getSectionCompletion,
  getNextSuggestedSection,
};
