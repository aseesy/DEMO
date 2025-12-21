/**
 * Global Error Handler for LiaiZen
 * Integrates with analytics to track errors and exceptions
 * Enhanced with error code mapping, retry logic, and user-friendly messages
 */

import {
  trackError,
  trackAPIError,
  trackConnectionError,
  trackFormError,
} from './analyticsEnhancements.js';

// ============================================================================
// ERROR CODE MAPPINGS
// ============================================================================

/**
 * Registration Error Codes (REG_*)
 */
const REGISTRATION_ERRORS = {
  REG_001: {
    message: 'This email is already registered',
    userMessage: 'This email is already registered. Would you like to sign in instead?',
    action: 'sign_in',
    retryable: false,
  },
  REG_002: {
    message: 'Invalid invitation token',
    userMessage:
      'This invitation link is not valid. Please check the link or request a new invitation.',
    action: 'request_new_invite',
    retryable: false,
  },
  REG_003: {
    message: 'Invitation has expired',
    userMessage: 'This invitation has expired. Please ask your co-parent to send a new invitation.',
    action: 'request_new_invite',
    retryable: false,
  },
  REG_004: {
    message: 'Invitation already accepted',
    userMessage:
      'This invitation has already been accepted. If you already have an account, please sign in.',
    action: 'sign_in',
    retryable: false,
  },
  REG_005: {
    message: 'Could not create chat room',
    userMessage:
      'We had trouble setting up your chat room. Your account was created successfully. Please try again in a moment.',
    action: 'retry',
    retryable: true,
  },
  REG_006: {
    message: 'Could not create contacts',
    userMessage: 'Your account was created successfully. Contact information can be added later.',
    action: 'continue',
    retryable: false,
  },
  REG_007: {
    message: 'Database error occurred',
    userMessage: 'We encountered a temporary issue. Please try again in a moment.',
    action: 'retry',
    retryable: true,
  },
  REG_008: {
    message: 'Inviter account no longer exists',
    userMessage:
      'The person who sent this invitation no longer has an account. Please contact support if you need assistance.',
    action: 'contact_support',
    retryable: false,
  },
  REG_009: {
    message: 'Could not generate unique username',
    userMessage: 'We had trouble creating your username. Please try again.',
    action: 'retry',
    retryable: true,
  },
};

/**
 * Invitation Error Codes
 */
const INVITATION_ERRORS = {
  TOKEN_REQUIRED: {
    message: 'Token is required',
    userMessage:
      'This invitation link is missing required information. Please check your message for the correct link.',
    action: 'check_link',
    retryable: false,
  },
  INVALID_TOKEN: {
    message: 'Invalid invitation token',
    userMessage: 'This invitation link is not valid. It may have been entered incorrectly.',
    action: 'request_new_invite',
    retryable: false,
  },
  INVALID_CODE: {
    message: 'Invalid invite code',
    userMessage: 'This invitation code is not valid. Please check the code and try again.',
    action: 'check_code',
    retryable: false,
  },
  EXPIRED: {
    message: 'Invitation has expired',
    userMessage:
      'This invitation has expired. Invitations are valid for 7 days. Please ask your co-parent to send a new invitation.',
    action: 'request_new_invite',
    retryable: false,
  },
  ALREADY_ACCEPTED: {
    message: 'Invitation already accepted',
    userMessage:
      'This invitation has already been accepted. If you already have an account, please sign in.',
    action: 'sign_in',
    retryable: false,
  },
  CANCELLED: {
    message: 'Invitation was cancelled',
    userMessage:
      'This invitation was cancelled by the sender. Please contact your co-parent if you believe this is a mistake.',
    action: 'contact_coparent',
    retryable: false,
  },
  DECLINED: {
    message: 'Invitation was declined',
    userMessage:
      "You previously declined this invitation. If you'd like to accept it now, please ask your co-parent to send a new invitation.",
    action: 'request_new_invite',
    retryable: false,
  },
  ALREADY_CONNECTED: {
    message: 'Users already connected',
    userMessage: 'You are already connected with this co-parent!',
    action: 'go_to_dashboard',
    retryable: false,
  },
  COPARENT_LIMIT: {
    message: 'Co-parent limit reached',
    userMessage:
      'You already have a co-parent connection. Please manage your existing connection first.',
    action: 'manage_connections',
    retryable: false,
  },
  ALREADY_PAIRED: {
    message: 'You already have an active co-parent connection',
    userMessage:
      'You are already connected with a co-parent. Please check your dashboard or settings.',
    action: 'go_to_dashboard',
    retryable: false,
  },
};

/**
 * OAuth Error Codes
 */
const OAUTH_ERRORS = {
  popup_blocked: {
    message: 'Popup blocked by browser',
    userMessage:
      'Your browser blocked the sign-in popup. Please allow popups for this site and try again.',
    action: 'allow_popups',
    retryable: true,
  },
  access_denied: {
    message: 'Access denied by user',
    userMessage: 'You cancelled the sign-in. You can try again or use email/password instead.',
    action: 'try_again',
    retryable: true,
  },
  server_error: {
    message: 'OAuth server error',
    userMessage:
      'Google sign-in is temporarily unavailable. Please try again in a moment or use email/password.',
    action: 'retry_or_email',
    retryable: true,
  },
  invalid_request: {
    message: 'Invalid OAuth request',
    userMessage: 'There was a problem with the sign-in request. Please try again.',
    action: 'retry',
    retryable: true,
  },
  invalid_client: {
    message: 'Invalid OAuth client',
    userMessage: 'Sign-in configuration error. Please contact support.',
    action: 'contact_support',
    retryable: false,
  },
  invalid_grant: {
    message: 'Invalid OAuth grant',
    userMessage: 'The sign-in session expired. Please try again.',
    action: 'retry',
    retryable: true,
  },
  unauthorized_client: {
    message: 'Unauthorized OAuth client',
    userMessage: 'Sign-in configuration error. Please contact support.',
    action: 'contact_support',
    retryable: false,
  },
  unsupported_response_type: {
    message: 'Unsupported OAuth response type',
    userMessage: 'Sign-in configuration error. Please contact support.',
    action: 'contact_support',
    retryable: false,
  },
  invalid_scope: {
    message: 'Invalid OAuth scope',
    userMessage: 'Sign-in configuration error. Please contact support.',
    action: 'contact_support',
    retryable: false,
  },
};

/**
 * HTTP Status Code Mappings
 */
const HTTP_ERRORS = {
  400: {
    message: 'Bad request',
    userMessage: 'There was a problem with your request. Please check your input and try again.',
    retryable: false,
  },
  401: {
    message: 'Unauthorized',
    userMessage: 'Your session has expired. Please sign in again.',
    action: 'sign_in',
    retryable: false,
  },
  403: {
    message: 'Forbidden',
    userMessage: "You don't have permission to perform this action.",
    retryable: false,
  },
  404: {
    message: 'Not found',
    userMessage: 'The requested resource was not found.',
    retryable: false,
  },
  409: {
    message: 'Conflict',
    userMessage: 'This action conflicts with an existing resource or state.',
    action: 'check_status',
    retryable: false,
  },
  429: {
    message: 'Too many requests',
    userMessage: 'Too many requests. Please wait a moment and try again.',
    action: 'wait_and_retry',
    retryable: true,
  },
  500: {
    message: 'Internal server error',
    userMessage: 'We encountered an unexpected error. Please try again in a moment.',
    action: 'retry',
    retryable: true,
  },
  502: {
    message: 'Bad gateway',
    userMessage: 'Service temporarily unavailable. Please try again in a moment.',
    action: 'retry',
    retryable: true,
  },
  503: {
    message: 'Service unavailable',
    userMessage: 'Service temporarily unavailable. Please try again in a moment.',
    action: 'retry',
    retryable: true,
  },
  504: {
    message: 'Gateway timeout',
    userMessage: 'Request timed out. Please try again.',
    action: 'retry',
    retryable: true,
  },
};

// ============================================================================
// ERROR CATEGORIZATION
// ============================================================================

export const ErrorCategory = {
  NETWORK: 'network',
  VALIDATION: 'validation',
  SERVER: 'server',
  AUTHENTICATION: 'authentication',
  BUSINESS_LOGIC: 'business_logic',
};

/**
 * Categorize an error
 */
export function categorizeError(error, statusCode = null) {
  // Network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return ErrorCategory.NETWORK;
  }
  if (error.message?.includes('network') || error.message?.includes('connection')) {
    return ErrorCategory.NETWORK;
  }

  // HTTP status codes
  if (statusCode) {
    if (statusCode >= 500) return ErrorCategory.SERVER;
    if (statusCode === 401 || statusCode === 403) return ErrorCategory.AUTHENTICATION;
    if (statusCode === 400 || statusCode === 422) return ErrorCategory.VALIDATION;
  }

  // Registration/invitation errors are business logic
  // Check if code is a string before calling startsWith
  const errorCode = typeof error.code === 'string' ? error.code : null;
  if (errorCode?.startsWith('REG_') || errorCode?.startsWith('INV_')) {
    return ErrorCategory.BUSINESS_LOGIC;
  }

  // OAuth errors are authentication
  if (errorCode && OAUTH_ERRORS[errorCode]) {
    return ErrorCategory.AUTHENTICATION;
  }

  return ErrorCategory.SERVER;
}

// ============================================================================
// ERROR CODE MAPPING
// ============================================================================

/**
 * Get user-friendly error message from error code
 */
export function getErrorMessage(error, context = {}) {
  const errorCode = error?.code || error?.error?.code;
  const statusCode = error?.status || error?.response?.status || context?.statusCode;
  // Handle various server response formats:
  // - { message: "..." } - standard format
  // - { error: "..." } - common API format (e.g., pairing routes)
  // - { error: { message: "..." } } - nested format
  const errorMessage =
    error?.message ||
    (typeof error?.error === 'string' ? error.error : error?.error?.message) ||
    'An unexpected error occurred';

  // Check registration errors
  if (errorCode && REGISTRATION_ERRORS[errorCode]) {
    return {
      ...REGISTRATION_ERRORS[errorCode],
      code: errorCode,
      originalMessage: errorMessage,
    };
  }

  // Check invitation errors
  if (errorCode && INVITATION_ERRORS[errorCode]) {
    return {
      ...INVITATION_ERRORS[errorCode],
      code: errorCode,
      originalMessage: errorMessage,
    };
  }

  // Fallback check for common error message strings
  if (errorMessage?.includes('already have an active co-parent connection')) {
    return {
      ...INVITATION_ERRORS.ALREADY_PAIRED,
      code: 'ALREADY_PAIRED',
      originalMessage: errorMessage,
    };
  }

  // Check OAuth errors
  if (errorCode && OAUTH_ERRORS[errorCode]) {
    return {
      ...OAUTH_ERRORS[errorCode],
      code: errorCode,
      originalMessage: errorMessage,
    };
  }

  // Check HTTP status codes
  if (statusCode && HTTP_ERRORS[statusCode]) {
    return {
      ...HTTP_ERRORS[statusCode],
      code: `HTTP_${statusCode}`,
      originalMessage: errorMessage,
    };
  }

  // Default error message
  return {
    message: errorMessage,
    userMessage: 'An unexpected error occurred. Please try again.',
    action: 'retry',
    retryable: true,
    code: errorCode || 'UNKNOWN_ERROR',
    originalMessage: errorMessage,
  };
}

// ============================================================================
// RETRY LOGIC
// ============================================================================

/**
 * Check if an error is retryable
 */
export function isRetryableError(error, statusCode = null) {
  const errorInfo = getErrorMessage(error, { statusCode });

  // Explicitly marked as not retryable
  if (errorInfo.retryable === false) {
    return false;
  }

  // Network errors are retryable
  const category = categorizeError(error, statusCode);
  if (category === ErrorCategory.NETWORK) {
    return true;
  }

  // 5xx server errors are retryable
  if (statusCode && statusCode >= 500 && statusCode < 600) {
    return true;
  }

  // Rate limit errors are retryable
  if (statusCode === 429) {
    return true;
  }

  // Explicitly marked as retryable
  if (errorInfo.retryable === true) {
    return true;
  }

  return false;
}

/**
 * Calculate retry delay using exponential backoff
 * @param {number} attempt - Current attempt number (0-indexed)
 * @returns {number} Delay in milliseconds
 */
export function calculateRetryDelay(attempt) {
  // Exponential backoff: 1s, 2s, 4s
  return Math.min(1000 * Math.pow(2, attempt), 4000);
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {Object} options - Retry options
 * @returns {Promise} Result of the function
 */
export async function retryWithBackoff(fn, options = {}) {
  const { maxRetries = 3, onRetry = null, shouldRetry = isRetryableError } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();

      // Check if result is a response object
      if (result && typeof result.ok !== 'undefined') {
        // It's a fetch response
        if (result.ok) {
          return result;
        }

        // Check if we should retry this error
        const errorData = await result
          .clone()
          .json()
          .catch(() => ({ error: result.statusText }));
        const error = { ...errorData, status: result.status };

        if (attempt < maxRetries && shouldRetry(error, result.status)) {
          const delay = calculateRetryDelay(attempt);
          if (onRetry) onRetry(attempt + 1, delay, error);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        // Don't retry, return the error response
        return result;
      }

      // Not a response object, return as-is
      return result;
    } catch (error) {
      lastError = error;

      // Check if we should retry
      if (attempt < maxRetries && shouldRetry(error)) {
        const delay = calculateRetryDelay(attempt);
        if (onRetry) onRetry(attempt + 1, delay, error);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // Don't retry, throw the error
      throw error;
    }
  }

  throw lastError;
}

// ============================================================================
// ERROR LOGGING
// ============================================================================

/**
 * Log error with context
 */
export function logError(error, context = {}) {
  const errorInfo = getErrorMessage(error, context);
  const category = categorizeError(error, context.statusCode);

  const logData = {
    timestamp: new Date().toISOString(),
    code: errorInfo.code,
    message: errorInfo.message,
    userMessage: errorInfo.userMessage,
    category,
    originalMessage: errorInfo.originalMessage,
    context: {
      endpoint: context.endpoint,
      userId: context.userId,
      username: context.username,
      ...context,
    },
    stack: error?.stack,
  };

  // Track with analytics
  trackError(error, `error_${category}`, true);

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error logged:', logData);
  }

  return logData;
}

// ============================================================================
// EXISTING FUNCTIONS (Enhanced)
// ============================================================================

// Global error handler for unhandled errors
export function setupGlobalErrorHandler() {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', event => {
    const error = event.reason;
    const errorMessage = error?.message || String(error);
    const errorString = String(error);

    // Suppress Safari service worker errors - these are expected and handled
    // Check for various forms of the error message (check both message and string representation)
    const isSafariServiceWorkerError =
      errorMessage.includes('newestWorker is null') ||
      errorString.includes('newestWorker is null') ||
      (errorMessage.includes('InvalidStateError') &&
        (errorMessage.includes('worker') ||
          errorMessage.includes('newestWorker') ||
          errorMessage.includes('installing') ||
          errorMessage.includes('waiting') ||
          errorMessage.includes('null'))) ||
      (errorString.includes('InvalidStateError') &&
        (errorString.includes('worker') ||
          errorString.includes('newestWorker') ||
          errorString.includes('installing') ||
          errorString.includes('waiting') ||
          errorString.includes('null'))) ||
      (error?.name === 'InvalidStateError' &&
        (errorMessage.includes('null') ||
          errorString.includes('null') ||
          errorMessage.includes('worker') ||
          errorString.includes('worker')));

    if (isSafariServiceWorkerError) {
      // Prevent default error handling for Safari service worker errors
      event.preventDefault();
      // Silently suppress - don't even log in production
      if (process.env.NODE_ENV === 'development') {
        console.debug(
          '[errorHandler] Suppressed Safari service worker error (expected):',
          errorMessage
        );
      }
      return;
    }

    logError(error, { type: 'unhandled_promise_rejection' });
    trackError(error, 'unhandled_promise_rejection', false);
    console.error('Unhandled promise rejection:', error);
  });

  // Handle JavaScript errors
  window.addEventListener('error', event => {
    const error = event.error || new Error(event.message);
    logError(error, { type: 'javascript_error' });
    trackError(error, 'javascript_error', true);
    console.error('JavaScript error:', error);
  });
}

// Wrapper for API calls with error tracking and retry
export async function trackAPIRequest(endpoint, requestFn, options = {}) {
  const { retry = true, ...retryOptions } = options;

  const wrappedRequest = async () => {
    try {
      const response = await requestFn();

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        const error = { ...errorData, status: response.status };
        logError(error, { endpoint, statusCode: response.status });
        trackAPIError(endpoint, response.status, errorData.error || response.statusText);
      }

      return response;
    } catch (error) {
      logError(error, { endpoint, statusCode: 0 });
      trackAPIError(endpoint, 0, error.message || 'Network error');
      throw error;
    }
  };

  if (retry) {
    return retryWithBackoff(wrappedRequest, {
      ...retryOptions,
      shouldRetry: (error, statusCode) => {
        // Don't retry 4xx errors (except 429)
        if (statusCode && statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
          return false;
        }
        return isRetryableError(error, statusCode);
      },
    });
  }

  return wrappedRequest();
}

// Wrapper for WebSocket errors
export function trackWebSocketError(error, errorType = 'websocket_error') {
  logError(error, { type: errorType });
  trackConnectionError(errorType, error.message || String(error));
  console.error('WebSocket error:', error);
}

// Wrapper for form validation errors
export function trackFormValidationError(formName, fieldName, errorType) {
  trackFormError(formName, fieldName, errorType);
}

// React Error Boundary component
import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Track React component errors
    trackError(error, 'react_component_error', true);
    console.error('React Error Boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Something went wrong</h2>
            <p className="text-red-600">
              Please refresh the page or contact support if the problem persists.
            </p>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
