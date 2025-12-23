/**
 * Structured Logger for Production
 *
 * Features:
 * - Log levels (error, warn, info, debug)
 * - Structured JSON output in production
 * - Context injection (request ID, user, operation)
 * - Error categorization
 */

const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
};

const ERROR_TYPES = {
  RETRYABLE: 'retryable',
  FATAL: 'fatal',
  OPERATIONAL: 'operational',
};

class Logger {
  constructor(context = {}) {
    this.context = context;
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  /**
   * Create child logger with additional context
   */
  child(additionalContext) {
    return new Logger({ ...this.context, ...additionalContext });
  }

  /**
   * Log error with full context
   */
  error(message, error, metadata = {}) {
    const logEntry = {
      level: LOG_LEVELS.ERROR,
      message,
      timestamp: new Date().toISOString(),
      ...this.context,
      ...metadata,
    };

    if (error) {
      logEntry.error = {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code,
        type: this._categorizeError(error),
      };
    }

    this._output(logEntry);
    return logEntry;
  }

  /**
   * Log warning
   */
  warn(message, metadata = {}) {
    this._output({
      level: LOG_LEVELS.WARN,
      message,
      timestamp: new Date().toISOString(),
      ...this.context,
      ...metadata,
    });
  }

  /**
   * Log info
   */
  info(message, metadata = {}) {
    this._output({
      level: LOG_LEVELS.INFO,
      message,
      timestamp: new Date().toISOString(),
      ...this.context,
      ...metadata,
    });
  }

  /**
   * Log debug (only in development)
   */
  debug(message, metadata = {}) {
    if (!this.isProduction) {
      this._output({
        level: LOG_LEVELS.DEBUG,
        message,
        timestamp: new Date().toISOString(),
        ...this.context,
        ...metadata,
      });
    }
  }

  /**
   * Categorize error type
   */
  _categorizeError(error) {
    // Network/timeout errors are retryable
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return ERROR_TYPES.RETRYABLE;
    }

    // Rate limit errors are retryable
    if (error.status === 429) {
      return ERROR_TYPES.RETRYABLE;
    }

    // Auth errors are fatal
    if (error.status === 401 || error.status === 403) {
      return ERROR_TYPES.FATAL;
    }

    // Validation errors are operational
    if (error.name === 'ValidationError' || error.status === 400) {
      return ERROR_TYPES.OPERATIONAL;
    }

    // Server errors (5xx) are retryable
    if (error.status >= 500) {
      return ERROR_TYPES.RETRYABLE;
    }

    // Default to operational
    return ERROR_TYPES.OPERATIONAL;
  }

  /**
   * Output log entry
   */
  _output(entry) {
    if (this.isProduction) {
      // JSON structured logging for production
      console.log(JSON.stringify(entry));
    } else {
      // Pretty print for development
      const emoji =
        {
          error: '❌',
          warn: '⚠️',
          info: '✅',
          debug: '🔍',
        }[entry.level] || '📝';
      console.log(`${emoji} [${entry.level.toUpperCase()}] ${entry.message}`, entry);
    }
  }
}

// Create default logger instance
const defaultLogger = new Logger({
  service: 'chat-server',
  environment: process.env.NODE_ENV || 'development',
});

module.exports = {
  Logger,
  defaultLogger,
  ERROR_TYPES,
  LOG_LEVELS,
};
