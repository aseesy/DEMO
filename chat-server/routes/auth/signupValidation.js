/**
 * Signup Validation - Pure validation logic
 *
 * These functions validate input without handling HTTP responses.
 * Error handling is done by the caller.
 */

const { getPasswordError, getPasswordRequirements } = require('../../libs/password-validator');
const { isValidEmail } = require('./utils');

/**
 * Validation result type
 * @typedef {Object} ValidationResult
 * @property {boolean} valid
 * @property {number} [status] - HTTP status code for error
 * @property {Object} [error] - Error response body
 * @property {Object} [cleanData] - Cleaned/validated data
 */

/**
 * Validate signup input
 * @param {Object} body - Request body
 * @returns {ValidationResult}
 */
function validateSignupInput(body) {
  const { email, password, firstName, lastName } = body;

  // Required fields
  if (!email || !password) {
    return {
      valid: false,
      status: 400,
      error: { error: 'Email and password are required' },
    };
  }

  // First and last name required
  if (!firstName || !lastName) {
    return {
      valid: false,
      status: 400,
      error: { error: 'First name and last name are required' },
    };
  }

  // Clean and validate email
  const cleanEmail = email.trim().toLowerCase();
  if (!isValidEmail(cleanEmail)) {
    return {
      valid: false,
      status: 400,
      error: { error: 'Invalid email address' },
    };
  }

  // Validate password
  const passwordError = getPasswordError(password);
  if (passwordError) {
    return {
      valid: false,
      status: 400,
      error: { error: passwordError, requirements: getPasswordRequirements() },
    };
  }

  return {
    valid: true,
    cleanData: {
      email: cleanEmail,
      password,
      firstName: firstName?.trim() || '',
      lastName: lastName?.trim() || '',
    },
  };
}

/**
 * Validate registration with invitation input
 * @param {Object} body - Request body
 * @returns {ValidationResult}
 */
function validateRegisterInput(body) {
  const { email, password, firstName, lastName, coParentEmail } = body;

  // Required fields
  if (!email || !password || !coParentEmail) {
    return {
      valid: false,
      status: 400,
      error: { error: 'Missing required fields' },
    };
  }

  // First and last name required
  if (!firstName || !lastName) {
    return {
      valid: false,
      status: 400,
      error: { error: 'First name and last name are required' },
    };
  }

  // Clean emails
  const cleanEmail = email.trim().toLowerCase();
  const cleanCoParentEmail = coParentEmail.trim().toLowerCase();

  // Validate emails
  if (!isValidEmail(cleanEmail) || !isValidEmail(cleanCoParentEmail)) {
    return {
      valid: false,
      status: 400,
      error: { error: 'Invalid email address' },
    };
  }

  // Cannot invite self
  if (cleanEmail === cleanCoParentEmail) {
    return {
      valid: false,
      status: 400,
      error: { error: 'Cannot invite yourself' },
    };
  }

  // Validate password
  const passwordError = getPasswordError(password);
  if (passwordError) {
    return {
      valid: false,
      status: 400,
      error: { error: passwordError, requirements: getPasswordRequirements() },
    };
  }

  return {
    valid: true,
    cleanData: {
      email: cleanEmail,
      password,
      firstName: firstName?.trim() || '',
      lastName: lastName?.trim() || '',
      coParentEmail: cleanCoParentEmail,
    },
  };
}

/**
 * Error classification for signup operations
 */
const SignupErrorType = {
  EMAIL_EXISTS: 'EMAIL_EXISTS',
  INTERNAL: 'INTERNAL',
};

/**
 * Classify a signup error
 * @param {Error} error - The error to classify
 * @returns {{ type: string, status: number, body: Object }}
 */
function classifySignupError(error) {
  // Check for email exists error - check both message and code
  if (error.message === 'Email already exists' || error.code === 'REG_001') {
    return {
      type: SignupErrorType.EMAIL_EXISTS,
      status: 409,
      body: { error: 'Email already exists', code: 'REG_001' },
    };
  }

  return {
    type: SignupErrorType.INTERNAL,
    status: 500,
    body: { error: error.message },
  };
}

module.exports = {
  validateSignupInput,
  validateRegisterInput,
  classifySignupError,
  SignupErrorType,
};
