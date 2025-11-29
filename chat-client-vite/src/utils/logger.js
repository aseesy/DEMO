/**
 * Centralized logging utility
 * Provides environment-aware logging with different levels
 */

const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

/**
 * Log levels
 */
export const LogLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
};

/**
 * Logger class for consistent logging across the application
 */
class Logger {
  /**
   * Log debug messages (only in development)
   * @param {string} message - Log message
   * @param {any} data - Optional data to log
   */
  debug(message, data = null) {
    if (isDevelopment) {
      if (data) {
        console.log(`[DEBUG] ${message}`, data);
      } else {
        console.log(`[DEBUG] ${message}`);
      }
    }
  }

  /**
   * Log info messages (only in development)
   * @param {string} message - Log message
   * @param {any} data - Optional data to log
   */
  info(message, data = null) {
    if (isDevelopment) {
      if (data) {
        console.log(`[INFO] ${message}`, data);
      } else {
        console.log(`[INFO] ${message}`);
      }
    }
  }

  /**
   * Log warning messages (always shown)
   * @param {string} message - Warning message
   * @param {any} data - Optional data to log
   */
  warn(message, data = null) {
    if (data) {
      console.warn(`[WARN] ${message}`, data);
    } else {
      console.warn(`[WARN] ${message}`);
    }
  }

  /**
   * Log error messages (always shown)
   * @param {string} message - Error message
   * @param {Error|any} error - Error object or data
   */
  error(message, error = null) {
    if (error) {
      if (error instanceof Error) {
        console.error(`[ERROR] ${message}`, error.message, error.stack);
      } else {
        console.error(`[ERROR] ${message}`, error);
      }
    } else {
      console.error(`[ERROR] ${message}`);
    }
  }

  /**
   * Log API errors with context
   * @param {string} endpoint - API endpoint
   * @param {number} status - HTTP status code
   * @param {string} message - Error message
   */
  apiError(endpoint, status, message) {
    this.error(`API Error [${status}] ${endpoint}`, message);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions
export const logDebug = (message, data) => logger.debug(message, data);
export const logInfo = (message, data) => logger.info(message, data);
export const logWarn = (message, data) => logger.warn(message, data);
export const logError = (message, error) => logger.error(message, error);
export const logApiError = (endpoint, status, message) => logger.apiError(endpoint, status, message);

