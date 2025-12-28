/**
 * Error Handling Strategy
 * 
 * Determines how to handle errors based on classification.
 * Implements fail-open vs fail-closed decision logic.
 */

import { ErrorCategory, classifyError } from './ErrorClassificationService.js';

export const HandlingStrategy = {
  FAIL_CLOSED: 'fail_closed',  // Block message
  FAIL_OPEN: 'fail_open',      // Allow message
  RETRY: 'retry',              // Retry with backoff
};

/**
 * Determine handling strategy for an error
 * 
 * @param {Error} error - The error to handle
 * @param {number} retryCount - Current retry attempt (0-based)
 * @returns {{ strategy: string, notifyUser: boolean, message?: string, retryAfter?: number, logError?: boolean }}
 */
export function determineStrategy(error, retryCount = 0) {
  const { category, retryable } = classifyError(error);

  // Critical errors: always fail-closed
  if (category === ErrorCategory.CRITICAL) {
    return {
      strategy: HandlingStrategy.FAIL_CLOSED,
      notifyUser: true,
      message: 'Message blocked due to safety check failure. Please try again.',
      logError: true,
    };
  }

  // Validation errors: fail-closed
  if (category === ErrorCategory.VALIDATION) {
    return {
      strategy: HandlingStrategy.FAIL_CLOSED,
      notifyUser: true,
      message: error.message || 'Invalid message format. Please check your message.',
      logError: true,
    };
  }

  // Retryable errors: retry up to 3 times
  if (retryable && retryCount < 3) {
    return {
      strategy: HandlingStrategy.RETRY,
      retryAfter: calculateBackoff(retryCount),
      notifyUser: false,
      logError: false,
    };
  }

  // After retries or non-retryable: fail-open with warning
  return {
    strategy: HandlingStrategy.FAIL_OPEN,
    notifyUser: true,
    message: 'Analysis temporarily unavailable. Message will be sent without analysis.',
    logError: true,
  };
}

/**
 * Calculate exponential backoff delay
 * 
 * @param {number} retryCount - Current retry attempt (0-based)
 * @returns {number} Delay in milliseconds
 */
function calculateBackoff(retryCount) {
  // Exponential backoff: 1s, 2s, 4s
  return Math.pow(2, retryCount) * 1000;
}

