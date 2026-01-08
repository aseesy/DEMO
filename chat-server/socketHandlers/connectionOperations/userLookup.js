/**
 * User Lookup Operations
 *
 * Handles user validation and lookup by email/username.
 */

const { defaultLogger } = require('../../../src/infrastructure/logging/logger');

const logger = defaultLogger.child({
  module: 'userLookup',
});

/**
 * Validation result type
 * @typedef {Object} ValidationResult
 * @property {boolean} valid
 * @property {string} [error]
 * @property {string} [cleanEmail]
 */

/**
 * Validate and sanitize email
 * @param {string} email - Raw email input
 * @returns {ValidationResult}
 */
function validateUserInput(email) {
  if (!email || typeof email !== 'string') {
    return {
      valid: false,
      error: 'Email is required.',
    };
  }

  const cleanEmail = email.trim().toLowerCase();

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return {
      valid: false,
      error: 'Invalid email format.',
    };
  }

  return { valid: true, cleanEmail };
}

/**
 * Get user by email
 *
 * NAMING: Using `get*` for consistency with codebase data retrieval convention.
 *
 * @param {string} cleanEmail - Sanitized email
 * @param {Object} auth - Auth service
 * @returns {Promise<Object|null>} User object or null
 */
async function getUserByEmail(cleanEmail, auth) {
  return auth.getUser(cleanEmail);
}

/**
 * @deprecated Keep for backward compatibility during migration
 * Use getUserByEmail with email instead
 */
async function getUserByUsername(cleanUsername, auth) {
  // Try to get user by email first (if it's an email)
  if (cleanUsername.includes('@')) {
    return auth.getUser(cleanUsername);
  }
  // Fallback: try to find user by old username field (for migration period)
  logger.warn('[getUserByUsername] Deprecated: Use getUserByEmail with email instead');
  return null;
}

module.exports = {
  validateUserInput,
  getUserByEmail,
  getUserByUsername,
  // Deprecated alias
  lookupUser: getUserByEmail,
};
