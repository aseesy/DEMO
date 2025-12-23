/**
 * Database Retry Utility
 *
 * Provides retry logic for transient database errors.
 * Used by services to ensure data persistence during temporary connectivity issues.
 */

/**
 * Check if an error is retryable (transient)
 * @param {Error} err - The error to check
 * @returns {boolean} True if the error is transient and worth retrying
 */
function isRetryableError(err) {
  if (!err) return false;

  // Connection-related error codes
  const retryableCodes = ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'EPIPE'];
  if (retryableCodes.includes(err.code)) return true;

  // PostgreSQL-specific transient errors
  const pgTransientCodes = [
    '08000', // connection_exception
    '08003', // connection_does_not_exist
    '08006', // connection_failure
    '57P01', // admin_shutdown
    '57P02', // crash_shutdown
    '57P03', // cannot_connect_now
  ];
  if (pgTransientCodes.includes(err.code)) return true;

  // Message-based detection
  const message = err.message?.toLowerCase() || '';
  if (
    message.includes('connection') ||
    message.includes('timeout') ||
    message.includes('econnreset') ||
    message.includes('socket')
  ) {
    return true;
  }

  return false;
}

/**
 * Execute a database operation with retry logic
 *
 * @param {Function} operation - Async function to execute
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum retry attempts (default: 3)
 * @param {number} options.baseDelay - Base delay in ms (default: 1000)
 * @param {string} options.operationName - Name for logging (default: 'database operation')
 * @param {Object} options.context - Additional context for error logging
 * @returns {Promise<any>} Result of the operation
 */
async function withRetry(operation, options = {}) {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    operationName = 'database operation',
    context = {},
  } = options;

  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (err) {
      lastError = err;

      if (attempt < maxRetries && isRetryableError(err)) {
        const delay = baseDelay * attempt; // Exponential backoff
        console.warn(
          `⚠️ ${operationName} failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`,
          {
            error: err.message,
            code: err.code,
            ...context,
          }
        );
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        // Final attempt or non-retryable error
        console.error(`❌ ${operationName} failed:`, {
          error: err.message,
          code: err.code,
          attempts: attempt,
          ...context,
        });
        throw err;
      }
    }
  }

  throw lastError;
}

module.exports = {
  withRetry,
  isRetryableError,
};
