/**
 * Profile Helpers Module - Facade
 *
 * REFACTORED: This file is now a facade that re-exports from focused modules.
 *
 * The original monolithic file (994 lines, 7 responsibilities) has been split into:
 * - profile/constants.js - Shared constants
 * - profile/encryption.js - Encryption/decryption (SRP: encryption only)
 * - profile/privacy.js - Privacy filtering (SRP: privacy rules only)
 * - profile/validation.js - Field validation (SRP: validation only)
 * - profile/completion.js - Completion calculation (SRP: completion metrics only)
 * - profile/audit.js - Audit logging (SRP: audit trails only)
 * - profile/transform.js - AI context building (SRP: data transformation only)
 *
 * This facade maintains backward compatibility - all existing imports continue to work.
 *
 * @deprecated Direct imports from this file still work, but new code should import
 * from the specific modules (e.g., require('./profile/encryption'))
 */

// Re-export constants
const {
  SENSITIVE_FIELDS,
  PROFILE_SECTIONS,
  DEFAULT_PRIVACY_SETTINGS,
} = require('./profile/constants');

// Re-export encryption functions
const {
  encrypt,
  decrypt,
  encryptSensitiveFields,
  decryptSensitiveFields,
} = require('./profile/encryption');

// Re-export privacy functions
const { filterProfileByPrivacy, getDefaultPrivacySettings } = require('./profile/privacy');

// Re-export completion functions
const {
  calculateProfileCompletion,
  getSectionCompletion,
  getNextSuggestedSection,
} = require('./profile/completion');

// Re-export audit functions
const { logProfileView, logProfileChanges, logPrivacyChange } = require('./profile/audit');

// Re-export validation functions
const { validateProfileFields } = require('./profile/validation');

// Re-export transform functions
const { buildProfileContextForAI, buildDualProfileContext } = require('./profile/transform');

// Export everything for backward compatibility
module.exports = {
  // Constants
  SENSITIVE_FIELDS,
  PROFILE_SECTIONS,
  DEFAULT_PRIVACY_SETTINGS,

  // Encryption
  encrypt,
  decrypt,
  encryptSensitiveFields,
  decryptSensitiveFields,

  // Privacy
  filterProfileByPrivacy,
  getDefaultPrivacySettings,

  // Completion
  calculateProfileCompletion,
  getSectionCompletion,
  getNextSuggestedSection,

  // Audit Logging
  logProfileView,
  logProfileChanges,
  logPrivacyChange,

  // Validation
  validateProfileFields,

  // AI Context Building
  buildProfileContextForAI,
  buildDualProfileContext,
};
