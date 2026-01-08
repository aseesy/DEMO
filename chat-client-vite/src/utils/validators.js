/**
 * 🔒 SEALED FILE - DO NOT MODIFY WITHOUT APPROVAL
 * 
 * validators.js
 * 
 * ⚠️ CRITICAL: This file is PARTIALLY SEALED - must match server-side validation.
 * Validation rules are shared between client and server for security.
 * 
 * RULES FOR AI ASSISTANTS:
 * - ❌ DO NOT change validation rules without coordinating with backend
 * - ❌ DO NOT modify password requirements without server update
 * - ❌ DO NOT alter email format rules without server update
 * - ✅ CAN add new validation functions (if needed)
 * - ✅ CAN update error messages (user-facing text)
 * 
 * Before modifying: Check docs/AUTH_FLOW_SEALED.md and coordinate with backend team.
 * 
 * Pure validation functions with no React/DOM dependencies.
 * All business rules for form validation extracted from hooks.
 * 
 * See: docs/AUTH_FLOW_SEALED.md for complete sealing documentation.
 */

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Minimum password length requirement
const MIN_PASSWORD_LENGTH = 10;

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid email format
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Validate password meets minimum requirements
 * @param {string} password - Password to validate
 * @returns {boolean} True if password meets requirements
 */
export function isValidPassword(password) {
  if (!password || typeof password !== 'string') return false;
  return password.trim().length >= MIN_PASSWORD_LENGTH;
}

/**
 * Validate username/display name is not empty
 * @param {string} username - Username to validate
 * @returns {boolean} True if username is valid
 */
export function isValidUsername(username) {
  if (!username || typeof username !== 'string') return false;
  return username.trim().length > 0;
}

/**
 * Validate login credentials
 * Returns validation result with specific error messages
 * @param {string} email - Email address
 * @param {string} password - Password
 * @returns {{ valid: boolean, errors: { email?: string, password?: string } }}
 */
export function validateLoginCredentials(email, password) {
  const errors = {};

  const cleanEmail = email?.trim().toLowerCase() || '';
  const cleanPassword = password?.trim() || '';

  if (!isValidEmail(cleanEmail)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!isValidPassword(cleanPassword)) {
    errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    cleanEmail,
    cleanPassword,
  };
}

/**
 * Validate signup form data
 * @param {string} email - Email address
 * @param {string} password - Password
 * @param {string} username - Display name (optional for basic signup)
 * @returns {{ valid: boolean, errors: object, cleanData: object }}
 */
export function validateSignupCredentials(email, password, firstName = '', lastName = '') {
  const errors = {};

  const cleanEmail = email?.trim().toLowerCase() || '';
  const cleanPassword = password?.trim() || '';
  const cleanFirstName = firstName?.trim() || '';
  const cleanLastName = lastName?.trim() || '';

  if (!cleanEmail) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(cleanEmail)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!isValidPassword(cleanPassword)) {
    errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }

  if (!cleanFirstName) {
    errors.firstName = 'First name is required';
  }

  if (!cleanLastName) {
    errors.lastName = 'Last name is required';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    cleanData: {
      email: cleanEmail,
      password: cleanPassword,
      firstName: cleanFirstName,
      lastName: cleanLastName,
    },
  };
}

/**
 * Validate registration form with co-parent invitation
 * @param {object} params - Registration parameters
 * @param {string} params.email - User's email
 * @param {string} params.password - User's password
 * @param {string} params.firstName - User's first name
 * @param {string} params.lastName - User's last name
 * @param {string} params.coParentEmail - Co-parent's email to invite
 * @returns {{ valid: boolean, errors: object, cleanData: object }}
 */
export function validateRegistrationWithInvite({ email, password, firstName, lastName, coParentEmail }) {
  const errors = {};

  const cleanEmail = email?.trim().toLowerCase() || '';
  const cleanPassword = password?.trim() || '';
  const cleanFirstName = firstName?.trim() || '';
  const cleanLastName = lastName?.trim() || '';
  const cleanCoParentEmail = coParentEmail?.trim().toLowerCase() || '';

  // First name required for registration
  if (!cleanFirstName) {
    errors.firstName = 'First name is required';
  }

  // Last name required for registration
  if (!cleanLastName) {
    errors.lastName = 'Last name is required';
  }

  // Email validation
  if (!cleanEmail) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(cleanEmail)) {
    errors.email = 'Please enter a valid email address';
  }

  // Password validation
  if (!isValidPassword(cleanPassword)) {
    errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }

  // Co-parent email validation
  if (!cleanCoParentEmail) {
    errors.coParentEmail = 'Co-parent email is required';
  } else if (!isValidEmail(cleanCoParentEmail)) {
    errors.coParentEmail = 'Please enter a valid email for your co-parent';
  } else if (cleanCoParentEmail === cleanEmail) {
    errors.coParentEmail = 'You cannot invite yourself as a co-parent';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    cleanData: {
      email: cleanEmail,
      password: cleanPassword,
      firstName: cleanFirstName,
      lastName: cleanLastName,
      coParentEmail: cleanCoParentEmail,
    },
  };
}

/**
 * Get the first error message from validation errors object
 * @param {object} errors - Errors object from validation
 * @returns {string|null} First error message or null
 */
export function getFirstError(errors) {
  if (!errors || typeof errors !== 'object') return null;
  const keys = Object.keys(errors);
  return keys.length > 0 ? errors[keys[0]] : null;
}

/**
 * Validate email for invitation purposes
 * Returns user-friendly error messages for invite flows
 * @param {string} email - Email to validate
 * @returns {{ valid: boolean, error: string | null }}
 */
export function validateInviteEmail(email) {
  if (!email?.trim()) {
    return { valid: false, error: "Please enter your co-parent's email address" };
  }

  if (!isValidEmail(email)) {
    return { valid: false, error: 'Please enter a valid email address' };
  }

  return { valid: true, error: null };
}

// Export constants for external use
export const VALIDATION_RULES = {
  MIN_PASSWORD_LENGTH,
  EMAIL_REGEX,
};
