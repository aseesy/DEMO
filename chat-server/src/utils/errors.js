/**
 * Custom Error Classes and Error Handling Utilities
 */

const { ERROR_TYPES } = require('./logger');

/**
 * Base application error
 */
class AppError extends Error {
  constructor(message, code, type = ERROR_TYPES.OPERATIONAL, metadata = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.type = type;
    this.metadata = metadata;
    this.retryable = type === ERROR_TYPES.RETRYABLE;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        type: this.type,
        retryable: this.retryable,
        context: this.metadata,
        timestamp: this.timestamp,
      },
    };
  }
}

/**
 * Retryable errors (network, rate limits, temporary failures)
 */
class RetryableError extends AppError {
  constructor(message, code, metadata = {}) {
    super(message, code, ERROR_TYPES.RETRYABLE, metadata);
  }
}

/**
 * Fatal errors (auth, configuration, validation)
 */
class FatalError extends AppError {
  constructor(message, code, metadata = {}) {
    super(message, code, ERROR_TYPES.FATAL, metadata);
  }
}

/**
 * Operational errors (expected errors like not found, validation)
 */
class OperationalError extends AppError {
  constructor(message, code, metadata = {}) {
    super(message, code, ERROR_TYPES.OPERATIONAL, metadata);
  }
}

/**
 * Wrap async function with error handling
 */
function withErrorHandling(fn, context = {}) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      // Log error with context
      const logger = require('./logger').defaultLogger.child(context);
      logger.error(`Error in ${fn.name || 'async function'}`, error, {
        args: args.map(arg =>
          typeof arg === 'object' ? JSON.stringify(arg).substring(0, 100) : String(arg)
        ),
      });

      // Re-throw if it's already an AppError
      if (error instanceof AppError) {
        throw error;
      }

      // Wrap unknown errors
      throw new OperationalError(
        error.message || 'An unexpected error occurred',
        'INTERNAL_ERROR',
        { originalError: error.name }
      );
    }
  };
}

module.exports = {
  AppError,
  RetryableError,
  FatalError,
  OperationalError,
  withErrorHandling,
};
