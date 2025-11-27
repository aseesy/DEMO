/**
 * Validation Utilities
 *
 * Generic, stateless validation functions that can be reused
 * across the entire codebase.
 *
 * @module src/utils/validators
 */

/**
 * Email validation regex pattern
 * Matches standard email format: local@domain.tld
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate an email address format
 *
 * @param {string} email - Email address to validate
 * @returns {boolean} True if email format is valid
 *
 * @example
 * isValidEmail('user@example.com') // true
 * isValidEmail('invalid-email') // false
 * isValidEmail('') // false
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Validate a phone number (basic format check)
 * Accepts various formats: (123) 456-7890, 123-456-7890, +1234567890
 *
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if phone format appears valid
 *
 * @example
 * isValidPhone('(555) 123-4567') // true
 * isValidPhone('555-123-4567') // true
 * isValidPhone('+15551234567') // true
 */
function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  // Remove all non-digit characters and check length
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

/**
 * Validate that a string is non-empty after trimming
 *
 * @param {string} str - String to validate
 * @returns {boolean} True if string has content
 *
 * @example
 * isNonEmpty('hello') // true
 * isNonEmpty('  ') // false
 * isNonEmpty('') // false
 */
function isNonEmpty(str) {
  if (!str || typeof str !== 'string') {
    return false;
  }
  return str.trim().length > 0;
}

/**
 * Validate a URL format
 *
 * @param {string} url - URL to validate
 * @returns {boolean} True if URL format is valid
 *
 * @example
 * isValidUrl('https://example.com') // true
 * isValidUrl('http://localhost:3000') // true
 * isValidUrl('not-a-url') // false
 */
function isValidUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate a username format
 * Allows letters, numbers, underscores, and hyphens
 * Must be 3-30 characters
 *
 * @param {string} username - Username to validate
 * @returns {boolean} True if username format is valid
 *
 * @example
 * isValidUsername('john_doe') // true
 * isValidUsername('ab') // false (too short)
 */
function isValidUsername(username) {
  if (!username || typeof username !== 'string') {
    return false;
  }
  const trimmed = username.trim();
  if (trimmed.length < 3 || trimmed.length > 30) {
    return false;
  }
  return /^[a-zA-Z0-9_-]+$/.test(trimmed);
}

/**
 * Sanitize a string by removing potentially dangerous characters
 * Useful for display names, titles, etc.
 *
 * @param {string} str - String to sanitize
 * @param {number} maxLength - Maximum length (default: 255)
 * @returns {string} Sanitized string
 *
 * @example
 * sanitizeString('<script>alert("xss")</script>') // 'scriptalertxssscript'
 */
function sanitizeString(str, maxLength = 255) {
  if (!str || typeof str !== 'string') {
    return '';
  }
  return str
    .replace(/[<>'"&]/g, '') // Remove HTML-dangerous chars
    .trim()
    .substring(0, maxLength);
}

module.exports = {
  EMAIL_REGEX,
  isValidEmail,
  isValidPhone,
  isNonEmpty,
  isValidUrl,
  isValidUsername,
  sanitizeString,
};
