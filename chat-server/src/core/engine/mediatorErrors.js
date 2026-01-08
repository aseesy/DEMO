/**
 * Mediator Error Handling
 *
 * Centralized error handling for the AI mediator.
 * Separates error classification from business logic.
 */

const { RetryableError } = require('../../infrastructure/errors/errors');
const { defaultLogger } = require('../../infrastructure/logging/logger');

const logger = defaultLogger.child({ module: 'mediatorErrors' });

/**
 * Error categories for AI mediation
 */
const ErrorCategory = {
  RATE_LIMIT: 'rate_limit',
  NETWORK: 'network',
  API_ERROR: 'api_error',
  VALIDATION: 'validation',
  UNKNOWN: 'unknown',
};

/**
 * Categorize an error for appropriate handling
 * @param {Error} error - The error to categorize
 * @returns {{ category: string, retryable: boolean }}
 */
function categorizeError(error) {
  // Rate limiting
  if (error.status === 429) {
    return { category: ErrorCategory.RATE_LIMIT, retryable: true };
  }

  // Network errors
  if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    return { category: ErrorCategory.NETWORK, retryable: true };
  }

  // API errors
  if (error.status >= 500 && error.status < 600) {
    return { category: ErrorCategory.API_ERROR, retryable: true };
  }

  // Client errors (non-retryable)
  if (error.status >= 400 && error.status < 500) {
    return { category: ErrorCategory.API_ERROR, retryable: false };
  }

  return { category: ErrorCategory.UNKNOWN, retryable: false };
}

/**
 * Handle analysis errors with proper logging and error transformation
 * @param {Error} error - The error that occurred
 * @param {Object} context - Context for logging
 * @param {Object} logger - Logger instance
 * @returns {{ shouldFailOpen: boolean, error?: Error }}
 */
function handleAnalysisError(error, context, logger = null) {
  const log = logger || defaultLogger;
  const { category, retryable } = categorizeError(error);

  // Log the error with context
  log.error('AI mediator analysis failed', error, {
    errorCategory: category,
    retryable,
    ...context,
  });

  // For retryable errors, throw a RetryableError
  if (retryable && category === ErrorCategory.RATE_LIMIT) {
    return {
      shouldFailOpen: false,
      error: new RetryableError(
        'AI analysis temporarily unavailable, please try again',
        'AI_RATE_LIMIT',
        context
      ),
    };
  }

  if (retryable && category === ErrorCategory.NETWORK) {
    return {
      shouldFailOpen: false,
      error: new RetryableError(
        'Unable to reach AI service, please try again',
        'AI_NETWORK_ERROR',
        context
      ),
    };
  }

  // For non-retryable errors, fail open (allow message through)
  log.warn('AI mediator failed, allowing message through (fail open)', {
    errorType: error.name,
    errorCode: error.code,
    errorCategory: category,
    ...context,
  });

  return { shouldFailOpen: true };
}

/**
 * Result type for withErrorHandling
 * @typedef {Object} ErrorHandlingResult
 * @property {boolean} success - Whether the operation succeeded
 * @property {*} [result] - The result if successful
 * @property {Error} [error] - The error if failed
 * @property {boolean} [failOpen] - Whether to fail open (continue on error)
 */

/**
 * Wrap an async operation with standardized error handling
 * @param {Function} operation - Async operation to execute
 * @param {Object} context - Context for error handling
 * @param {Object} options - Options for error handling
 * @returns {Promise<ErrorHandlingResult>}
 */
async function withErrorHandling(operation, context, options = {}) {
  const { logger, operationName = 'unknown' } = options;

  try {
    const result = await operation();
    return { success: true, result };
  } catch (error) {
    const handling = handleAnalysisError(error, { ...context, operation: operationName }, logger);

    if (handling.shouldFailOpen) {
      return { success: false, failOpen: true };
    }

    return { success: false, error: handling.error };
  }
}

/**
 * Safe execution wrapper for non-critical operations
 * Logs errors but doesn't affect main flow
 * @param {Function} operation - Async operation to execute
 * @param {string} operationName - Name for logging
 * @param {*} defaultValue - Value to return on failure
 * @returns {Promise<*>}
 */
async function safeExecute(operation, operationName, defaultValue = null) {
  try {
    return await operation();
  } catch (error) {
    logger.warn('Operation failed, continuing with default value', {
      operation: operationName,
      error: error.message,
      defaultValue: defaultValue !== null ? typeof defaultValue : 'null',
    });
    return defaultValue;
  }
}

module.exports = {
  ErrorCategory,
  categorizeError,
  handleAnalysisError,
  withErrorHandling,
  safeExecute,
};
