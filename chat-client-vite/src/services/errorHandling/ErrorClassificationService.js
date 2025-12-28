/**
 * Error Classification Service
 * 
 * Categorizes errors to determine appropriate handling strategy.
 * 
 * Error Categories:
 * - CRITICAL: Must fail-closed (safety risk)
 * - NETWORK: Retryable network errors
 * - RATE_LIMIT: Retryable with backoff
 * - VALIDATION: Fail-closed (invalid input)
 * - SYSTEM: Fail-open with logging
 */

export const ErrorCategory = {
  CRITICAL: 'critical',      // Must fail-closed (safety risk)
  NETWORK: 'network',        // Retryable
  RATE_LIMIT: 'rate_limit',  // Retryable with backoff
  VALIDATION: 'validation',  // Fail-closed
  SYSTEM: 'system',         // Fail-open with logging
};

/**
 * Classify an error to determine handling strategy
 * 
 * @param {Error} error - The error to classify
 * @returns {{ category: string, retryable: boolean }} Classification result
 */
export function classifyError(error) {
  // Network errors
  if (
    error.name === 'NetworkError' ||
    error.message.includes('fetch') ||
    error.message.includes('network') ||
    error.message.includes('Failed to fetch')
  ) {
    return { category: ErrorCategory.NETWORK, retryable: true };
  }

  // Rate limit errors
  if (
    error.status === 429 ||
    error.message.includes('rate limit') ||
    error.message.includes('too many requests')
  ) {
    return { category: ErrorCategory.RATE_LIMIT, retryable: true };
  }

  // Validation errors
  if (
    error.status === 400 ||
    error.name === 'ValidationError' ||
    error.message.includes('validation') ||
    error.message.includes('invalid')
  ) {
    return { category: ErrorCategory.VALIDATION, retryable: false };
  }

  // Critical safety errors (if we add them)
  if (
    error.code === 'SAFETY_CHECK_FAILED' ||
    error.message.includes('safety check') ||
    error.message.includes('critical error')
  ) {
    return { category: ErrorCategory.CRITICAL, retryable: false };
  }

  // 5xx server errors - retryable
  if (error.status >= 500 && error.status < 600) {
    return { category: ErrorCategory.NETWORK, retryable: true };
  }

  // Default: system error
  return { category: ErrorCategory.SYSTEM, retryable: false };
}

