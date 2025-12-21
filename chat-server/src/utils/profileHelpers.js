/**
 * Profile Helpers Module
 * Feature 010: Comprehensive User Profile System
 *
 * THIS FILE IS A BACKWARD-COMPATIBILITY SHIM.
 * Functions have been refactored into focused modules:
 *
 * - Constants       → src/utils/profileConstants.js
 * - Encryption      → src/utils/crypto.js
 * - Privacy/Completion → src/services/profileService.js
 * - Audit Logging   → src/services/auditService.js
 * - Validation      → src/utils/validators.js
 * - AI Context      → src/liaizen/context/profileContext.js
 *
 * Import from the new locations for new code.
 * This file re-exports everything for existing imports.
 *
 * @module src/utils/profileHelpers
 * @deprecated Import from specific modules instead
 */

// Constants
const {
  SENSITIVE_FIELDS,
  PROFILE_SECTIONS,
  DEFAULT_PRIVACY_SETTINGS,
} = require('./profileConstants');

// Encryption
const { encrypt, decrypt, encryptSensitiveFields, decryptSensitiveFields } = require('./crypto');

// Privacy & Completion
const {
  getOwnProfile,
  filterProfileForCoParent,
  filterProfileByPrivacy,
  getDefaultPrivacySettings,
  calculateProfileCompletion,
  getSectionCompletion,
  getNextSuggestedSection,
} = require('../services/profileService');

// Audit Logging
const { logProfileView, logProfileChanges, logPrivacyChange } = require('../services/auditService');

// Validation
const { validateProfileFields } = require('./validators');

// AI Context Building
const {
  buildProfileContextForAI,
  buildDualProfileContext,
} = require('../liaizen/context/profileContext');

// Re-export everything for backward compatibility
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
