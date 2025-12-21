/**
 * Validation Utilities
 *
 * Generic, stateless validation functions that can be reused
 * across the entire codebase.
 *
 * @module src/utils/validators
 */

const {
  VALID_FIELD_VALUES,
  SHORT_TEXT_FIELDS,
  LONG_TEXT_FIELDS,
  FIELD_LIMITS,
} = require('./profileConstants');

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

// ============================================================================
// PROFILE FIELD VALIDATION
// ============================================================================

/**
 * Validate profile field values
 *
 * @param {Object} data - Profile data to validate
 * @returns {Object} { valid: boolean, error: string|null }
 *
 * @example
 * validateProfileFields({ email: 'invalid' })
 * // { valid: false, error: 'Invalid email format' }
 */
function validateProfileFields(data) {
  if (!data) {
    return { valid: true };
  }

  // Email validation
  if (data.email && !EMAIL_REGEX.test(data.email)) {
    return { valid: false, error: 'Invalid email format' };
  }

  // Birthdate validation (ISO format YYYY-MM-DD)
  if (data.birthdate) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.birthdate)) {
      return { valid: false, error: 'Invalid birthdate format (use YYYY-MM-DD)' };
    }

    // Age validation (must be 18+)
    const birthDate = new Date(data.birthdate);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    if (age < 18) {
      return { valid: false, error: 'User must be at least 18 years old' };
    }
  }

  // Short text field length validation
  for (const field of SHORT_TEXT_FIELDS) {
    if (data[field] && data[field].length > FIELD_LIMITS.shortText) {
      return {
        valid: false,
        error: `${field} must be less than ${FIELD_LIMITS.shortText} characters`,
      };
    }
  }

  // Long text field validation
  for (const field of LONG_TEXT_FIELDS) {
    if (data[field] && data[field].length > FIELD_LIMITS.longText) {
      return {
        valid: false,
        error: `${field} must be less than ${FIELD_LIMITS.longText} characters`,
      };
    }
  }

  // Pronouns validation
  if (data.pronouns && !VALID_FIELD_VALUES.pronouns.includes(data.pronouns)) {
    return { valid: false, error: 'Invalid pronouns value' };
  }

  // Employment status validation
  if (
    data.employment_status &&
    !VALID_FIELD_VALUES.employment_status.includes(data.employment_status)
  ) {
    return { valid: false, error: 'Invalid employment status' };
  }

  // Schedule flexibility validation
  if (
    data.schedule_flexibility &&
    !VALID_FIELD_VALUES.schedule_flexibility.includes(data.schedule_flexibility)
  ) {
    return { valid: false, error: 'Invalid schedule flexibility value' };
  }

  // Income level validation
  if (
    data.finance_income_level &&
    !VALID_FIELD_VALUES.income_level.includes(data.finance_income_level)
  ) {
    return { valid: false, error: 'Invalid income level value' };
  }

  // Debt stress validation
  if (
    data.finance_debt_stress &&
    !VALID_FIELD_VALUES.debt_stress.includes(data.finance_debt_stress)
  ) {
    return { valid: false, error: 'Invalid debt stress value' };
  }

  return { valid: true };
}

module.exports = {
  // Regex patterns
  EMAIL_REGEX,

  // Basic validators
  isValidEmail,
  isValidPhone,
  isNonEmpty,
  isValidUrl,
  isValidUsername,
  sanitizeString,

  // Profile validation
  validateProfileFields,
};
