/**
 * Route Handler Helper
 * 
 * Reduces boilerplate in route handlers by wrapping service calls
 */

const { handleServiceError } = require('./errorHandlers');

/**
 * Wrap async route handler with error handling
 * @param {Function} handler - Async route handler function
 * @returns {Function} Express route handler
 */
function asyncHandler(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      handleServiceError(error, res);
    }
  };
}

module.exports = { asyncHandler };

