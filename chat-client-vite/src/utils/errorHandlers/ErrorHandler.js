/**
 * Error Handler Base Class
 *
 * Base class for all error handlers in the invitation acceptance system.
 * Implements Strategy Pattern for Open-Closed Principle compliance.
 *
 * @module utils/errorHandlers/ErrorHandler
 */

/**
 * Base class for error handlers
 * All error handlers must extend this class and implement getMessage()
 */
class ErrorHandler {
  /**
   * Get error message information
   *
   * @param {string} code - Error code
   * @param {Object} context - Error context (optional)
   * @param {string} [context.inviteError] - Invitation error message
   * @param {string} [context.validationError] - Validation error message
   * @returns {Object} Error info with title, message, suggestion, and optional showLogin flag
   */
  getMessage(code, context = {}) {
    throw new Error('getMessage() must be implemented by subclass');
  }
}

export { ErrorHandler };

