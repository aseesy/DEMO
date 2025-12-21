/**
 * Shared Auth Route Utilities
 */
const { rateLimit } = require('../../middleware/spamProtection');

// Email validation regex - single source of truth
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email format
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim());
}

const signupRateLimit = rateLimit({
  windowMs: 3600000,
  maxRequests: 5000,
  message: 'Too many signup attempts. Please try again later.',
});

const loginRateLimit = rateLimit({
  windowMs: 900000,
  maxRequests: 5000,
  message: 'Too many login attempts. Please try again in a few minutes.',
});

module.exports = {
  isValidEmail,
  signupRateLimit,
  loginRateLimit,
};
