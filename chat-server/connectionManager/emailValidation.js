/**
 * Email Validation
 *
 * Handles email validation and user lookup by email.
 */

const dbSafe = require('../dbSafe');

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email format
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim().toLowerCase());
}

/**
 * Check if email exists in database
 * @param {string} email - Email to check
 * @returns {Promise<boolean>} True if email exists
 */
async function emailExists(email) {
  if (!validateEmail(email)) {
    return false;
  }

  const emailLower = email.trim().toLowerCase();
  const result = await dbSafe.safeSelect('users', { email: emailLower }, { limit: 1 });
  return dbSafe.parseResult(result).length > 0;
}

/**
 * Get user by email
 * @param {string} email - Email to look up
 * @returns {Promise<Object|null>} User object or null if not found
 */
async function getUserByEmail(email) {
  if (!validateEmail(email)) {
    return null;
  }

  const emailLower = email.trim().toLowerCase();
  const result = await dbSafe.safeSelect('users', { email: emailLower }, { limit: 1 });
  const users = dbSafe.parseResult(result);

  if (users.length === 0) {
    return null;
  }

  const user = users[0];
  return {
    id: user.id,
    username: user.username,
    email: user.email,
  };
}

module.exports = {
  validateEmail,
  emailExists,
  getUserByEmail,
};
