/**
 * Pure Query/Command Functions for Authentication
 *
 * These functions handle API calls without managing React state.
 * Use these for CQS-compliant code where queries are separated from state management.
 */

import { apiPost } from '../apiClient.js';
import {
  getErrorMessage,
  logError,
  retryWithBackoff,
  isRetryableError,
} from './errorHandler.jsx';
import {
  validateLoginCredentials,
  validateSignupCredentials,
  validateRegistrationWithInvite,
  getFirstError,
} from './validators.js';

/**
 * Retry configuration for auth requests
 */
const AUTH_RETRY_CONFIG = {
  maxRetries: 3,
  shouldRetry: (error, statusCode) => {
    // Don't retry client errors (except rate limiting)
    if (statusCode && statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
      return false;
    }
    return isRetryableError(error, statusCode);
  },
};

/**
 * Command: Perform email/password login
 * @param {Object} params - Login parameters
 * @param {string} params.email - User email
 * @param {string} params.password - User password
 * @param {string} params.honeypotValue - Spam protection field
 * @returns {Promise<Object>} Login result
 */
export async function commandLogin({ email, password, honeypotValue = '' }) {
  // Validate input
  const validation = validateLoginCredentials(email, password);
  if (!validation.valid) {
    return {
      success: false,
      validationError: true,
      error: getFirstError(validation.errors),
    };
  }

  const { cleanEmail, cleanPassword } = validation;

  try {
    const response = await retryWithBackoff(
      () =>
        apiPost('/api/auth/login', {
          email: cleanEmail,
          password: cleanPassword,
          website: honeypotValue,
        }),
      AUTH_RETRY_CONFIG
    );

    const data = await response.json();

    if (!response.ok) {
      const errorInfo = getErrorMessage(data, {
        statusCode: response.status,
        endpoint: '/api/auth/login',
      });
      logError(data, { endpoint: '/api/auth/login', operation: 'login', email: cleanEmail });

      // Handle specific error codes
      if (data.code === 'ACCOUNT_NOT_FOUND' || response.status === 404) {
        return {
          success: false,
          error: 'No account found with this email. Would you like to create an account?',
          action: 'create_account',
          errorInfo,
        };
      }

      if (data.code === 'OAUTH_ONLY_ACCOUNT' || response.status === 403) {
        return {
          success: false,
          error: data.error || 'This account uses Google sign-in. Please sign in with Google.',
          action: 'use_google',
          errorInfo,
        };
      }

      if (
        data.code === 'INVALID_PASSWORD' ||
        (response.status === 401 && data.error?.includes('password'))
      ) {
        return {
          success: false,
          error: 'Incorrect password. Please try again.',
          errorInfo,
        };
      }

      return { success: false, error: errorInfo.userMessage, errorInfo };
    }

    return {
      success: true,
      user: data.user,
      token: data.token,
      cleanEmail,
    };
  } catch (err) {
    const errorInfo = getErrorMessage(err, { statusCode: 0, endpoint: '/api/auth/login' });
    logError(err, { endpoint: '/api/auth/login', operation: 'login', email: cleanEmail });
    return { success: false, error: errorInfo.userMessage, errorInfo };
  }
}

/**
 * Command: Perform signup
 * @param {Object} params - Signup parameters
 * @param {string} params.email - User email
 * @param {string} params.password - User password
 * @param {string} params.username - Display name
 * @param {string} params.honeypotValue - Spam protection field
 * @returns {Promise<Object>} Signup result
 */
export async function commandSignup({ email, password, username, honeypotValue = '' }) {
  // Validate input
  const validation = validateSignupCredentials(email, password, username);
  if (!validation.valid) {
    return {
      success: false,
      validationError: true,
      error: getFirstError(validation.errors),
    };
  }

  const { email: cleanEmail, password: cleanPassword } = validation.cleanData;

  try {
    const response = await retryWithBackoff(
      () =>
        apiPost('/api/auth/signup', {
          email: cleanEmail,
          password: cleanPassword,
          displayName: username.trim(),
          context: {},
          website: honeypotValue,
        }),
      AUTH_RETRY_CONFIG
    );

    const data = await response.json();

    if (!response.ok) {
      const errorInfo = getErrorMessage(data, {
        statusCode: response.status,
        endpoint: '/api/auth/signup',
      });
      logError(data, { endpoint: '/api/auth/signup', operation: 'signup', email: cleanEmail });

      if (
        data.code === 'REG_001' ||
        data.error?.includes('already') ||
        data.error?.includes('exists')
      ) {
        return { success: false, error: errorInfo.userMessage, action: 'sign_in', errorInfo };
      }

      return { success: false, error: errorInfo.userMessage, errorInfo };
    }

    return {
      success: true,
      user: data.user,
      token: data.token,
      cleanEmail,
    };
  } catch (err) {
    const errorInfo = getErrorMessage(err, { statusCode: 0, endpoint: '/api/auth/signup' });
    logError(err, { endpoint: '/api/auth/signup', operation: 'signup', email: cleanEmail });
    return { success: false, error: errorInfo.userMessage, errorInfo };
  }
}

/**
 * Command: Register with co-parent invitation
 * @param {Object} params - Registration parameters
 * @param {string} params.email - User email
 * @param {string} params.password - User password
 * @param {string} params.username - Display name
 * @param {string} params.coParentEmail - Co-parent's email to invite
 * @returns {Promise<Object>} Registration result
 */
export async function commandRegister({ email, password, username, coParentEmail }) {
  // Validate input
  const validation = validateRegistrationWithInvite({
    email,
    password,
    username,
    coParentEmail,
  });

  if (!validation.valid) {
    return {
      success: false,
      validationError: true,
      error: getFirstError(validation.errors),
    };
  }

  const {
    email: cleanEmail,
    password: cleanPassword,
    username: cleanUsername,
    coParentEmail: cleanCoParentEmail,
  } = validation.cleanData;

  try {
    const response = await retryWithBackoff(
      () =>
        apiPost('/api/auth/register', {
          email: cleanEmail,
          password: cleanPassword,
          displayName: cleanUsername,
          coParentEmail: cleanCoParentEmail,
          context: {},
        }),
      AUTH_RETRY_CONFIG
    );

    const data = await response.json();

    if (!response.ok) {
      const errorInfo = getErrorMessage(data, {
        statusCode: response.status,
        endpoint: '/api/auth/register',
      });
      logError(data, {
        endpoint: '/api/auth/register',
        operation: 'register',
        email: cleanEmail,
      });

      if (
        data.code === 'REG_001' ||
        data.error?.includes('already') ||
        data.error?.includes('exists')
      ) {
        return { success: false, error: errorInfo.userMessage, action: 'sign_in', errorInfo };
      }

      return { success: false, error: errorInfo.userMessage, errorInfo };
    }

    return {
      success: true,
      user: data.user,
      token: data.token,
      invitation: data.invitation,
      cleanEmail,
    };
  } catch (err) {
    const errorInfo = getErrorMessage(err, { statusCode: 0, endpoint: '/api/auth/register' });
    logError(err, { endpoint: '/api/auth/register', operation: 'register', email: cleanEmail });
    return { success: false, error: errorInfo.userMessage, errorInfo };
  }
}
