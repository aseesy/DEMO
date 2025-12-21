/**
 * Auth Helper Functions
 *
 * Pure functions for authentication-related logic.
 * Easily testable without React.
 */

/**
 * Error action types that can be shown to users
 */
export const ErrorActionType = {
  SIGN_IN: 'sign_in',
  CREATE_ACCOUNT: 'create_account',
  GOOGLE_SIGNIN: 'google_signin',
  NONE: 'none',
};

/**
 * Determine what action to suggest based on an error message
 *
 * @param {string} errorMessage - The error message to analyze
 * @returns {string} - One of ErrorActionType values
 */
export function getErrorAction(errorMessage) {
  if (!errorMessage || typeof errorMessage !== 'string') {
    return ErrorActionType.NONE;
  }

  const lowerMessage = errorMessage.toLowerCase();

  // User trying to sign up but account exists
  if (lowerMessage.includes('already registered')) {
    return ErrorActionType.SIGN_IN;
  }

  // User trying to log in but no account found
  if (lowerMessage.includes('no account found') || lowerMessage.includes('account found')) {
    return ErrorActionType.CREATE_ACCOUNT;
  }

  // Account was created with Google OAuth
  if (lowerMessage.includes('google sign-in')) {
    return ErrorActionType.GOOGLE_SIGNIN;
  }

  return ErrorActionType.NONE;
}

/**
 * Get the label text for an error action button
 *
 * @param {string} actionType - One of ErrorActionType values
 * @returns {string} - Button label text
 */
export function getErrorActionLabel(actionType) {
  switch (actionType) {
    case ErrorActionType.SIGN_IN:
      return 'Sign in instead';
    case ErrorActionType.CREATE_ACCOUNT:
      return 'Create account';
    case ErrorActionType.GOOGLE_SIGNIN:
      return 'Sign in with Google';
    default:
      return '';
  }
}

/**
 * Password validation rules
 */
export const PASSWORD_MIN_LENGTH = 10;

/**
 * Validate password meets minimum requirements
 *
 * @param {string} password - Password to validate
 * @returns {{ valid: boolean, message: string | null }}
 */
export function validatePassword(password) {
  if (!password) {
    return { valid: false, message: 'Password is required' };
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      valid: false,
      message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
    };
  }

  return { valid: true, message: null };
}

/**
 * Validate email format
 *
 * @param {string} email - Email to validate
 * @returns {{ valid: boolean, message: string | null }}
 */
export function validateEmail(email) {
  if (!email) {
    return { valid: false, message: 'Email is required' };
  }

  // Simple email regex - allows most valid emails
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, message: 'Please enter a valid email address' };
  }

  return { valid: true, message: null };
}

/**
 * Validate username/display name
 *
 * @param {string} username - Username to validate
 * @returns {{ valid: boolean, message: string | null }}
 */
export function validateUsername(username) {
  if (!username) {
    return { valid: false, message: 'Name is required' };
  }

  if (username.trim().length < 2) {
    return { valid: false, message: 'Name must be at least 2 characters' };
  }

  return { valid: true, message: null };
}

/**
 * Validate form data for signup
 *
 * @param {{ email: string, password: string, username: string }} data
 * @returns {{ valid: boolean, errors: Object }}
 */
export function validateSignupForm({ email, password, username }) {
  const errors = {};

  const emailResult = validateEmail(email);
  if (!emailResult.valid) {
    errors.email = emailResult.message;
  }

  const passwordResult = validatePassword(password);
  if (!passwordResult.valid) {
    errors.password = passwordResult.message;
  }

  const usernameResult = validateUsername(username);
  if (!usernameResult.valid) {
    errors.username = usernameResult.message;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate form data for login
 *
 * @param {{ email: string, password: string }} data
 * @returns {{ valid: boolean, errors: Object }}
 */
export function validateLoginForm({ email, password }) {
  const errors = {};

  const emailResult = validateEmail(email);
  if (!emailResult.valid) {
    errors.email = emailResult.message;
  }

  if (!password) {
    errors.password = 'Password is required';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
