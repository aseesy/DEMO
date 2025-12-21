/**
 * Shared Error Handlers
 *
 * Centralized error handling for route handlers.
 * Maps service errors to HTTP responses.
 */

const {
  ValidationError,
  NotFoundError,
  ConflictError,
  ExpiredError,
  ExternalServiceError,
  AuthenticationError,
  AuthorizationError,
} = require('../src/services');

/**
 * Error to HTTP status code mapping
 */
const ERROR_STATUS_MAP = new Map([
  [ValidationError, 400],
  [ExpiredError, 400],
  [AuthenticationError, 401],
  [AuthorizationError, 403],
  [NotFoundError, 404],
  [ConflictError, 409],
  [ExternalServiceError, 503],
]);

/**
 * Convert service errors to HTTP responses
 *
 * @param {Error} error - The error to handle
 * @param {Response} res - Express response object
 * @param {Object} options - Optional configuration
 * @param {boolean} options.includeField - Include field property for validation errors
 * @param {boolean} options.includeCode - Include error code in response
 * @returns {Response} Express response
 */
function handleServiceError(error, res, options = {}) {
  const { includeField = true, includeCode = true } = options;

  console.error('Service error:', error.message);

  // Find matching error type
  for (const [ErrorClass, status] of ERROR_STATUS_MAP) {
    if (error instanceof ErrorClass) {
      const body = { error: error.message };

      // Add field for validation errors
      if (includeField && error.field) {
        body.field = error.field;
      }

      // Add code for certain errors
      if (includeCode && error.code) {
        body.code = error.code;
      }

      // Special handling for ExpiredError
      if (error instanceof ExpiredError && includeCode) {
        body.code = 'EXPIRED';
      }

      return res.status(status).json(body);
    }
  }

  // Handle legacy error messages (backward compatibility)
  if (error.message.includes('Invalid') || error.message.includes('expired')) {
    return res.status(400).json({ error: error.message });
  }

  // Default to 500 for unknown errors
  return res.status(500).json({ error: error.message });
}

/**
 * Async route handler wrapper
 * Automatically catches errors and passes to handleServiceError
 *
 * @param {Function} fn - Async route handler
 * @returns {Function} Wrapped handler
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(error => {
      handleServiceError(error, res);
    });
  };
}

module.exports = {
  handleServiceError,
  asyncHandler,
  ERROR_STATUS_MAP,
};
