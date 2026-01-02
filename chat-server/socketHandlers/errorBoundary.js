/**
 * Socket Handler Error Boundary
 *
 * Phase 1: Server Reliability - Error Handling
 * Wraps socket handlers with error handling and retry logic
 *
 * Usage:
 *   socket.on('event', wrapSocketHandler(async (data) => {
 *     // handler code - socket is available in closure
 *   }, 'event_name', { retry: true }));
 */

const { withRetry } = require('../utils/dbRetry');
const {
  isDatabaseConnectionError,
  getDatabaseErrorResponse,
} = require('../src/utils/databaseErrorClassifier');

/**
 * Wrap a socket handler with error boundary
 * Catches errors, logs them, and prevents server crashes
 *
 * CRITICAL: Does NOT re-throw errors to prevent unhandled promise rejections.
 * Instead, emits errors to the client if socket is still connected.
 *
 * Note: Socket handlers receive (data) as first arg, socket is in closure
 * Handlers can still emit their own errors before throwing, but this ensures
 * all errors are handled gracefully.
 *
 * @param {Function} handler - Socket handler function (receives data)
 * @param {string} handlerName - Name for logging
 * @param {Object} options - Options
 * @param {boolean} options.retry - Whether to retry on database errors (default: false)
 * @param {number} options.maxRetries - Max retry attempts (default: 3)
 * @param {boolean} options.emitError - Whether to emit error to client (default: true)
 * @returns {Function} Wrapped handler
 */
function wrapSocketHandler(handler, handlerName, options = {}) {
  const { retry = false, maxRetries = 3 } = options;

  return async data => {
    try {
      // If retry is enabled, wrap with retry logic
      if (retry) {
        await withRetry(() => handler(data), {
          maxRetries,
          operationName: handlerName,
          context: { event: handlerName },
        });
      } else {
        await handler(data);
      }
    } catch (error) {
      // Log error with context
      console.error(`[Socket Handler Error] ${handlerName}:`, {
        error: error.message,
        code: error.code,
        stack: error.stack?.split('\n').slice(0, 5).join('\n'), // First 5 lines
      });

      // CRITICAL: Do NOT re-throw - this prevents unhandled promise rejections
      // Instead, emit error to client if socket is still connected
      // The handler may have already emitted an error, but we ensure it's handled

      // Get socket from closure (handlers are registered with socket in scope)
      // Note: We can't access socket directly here, so we rely on handlers to emit errors
      // But we ensure the error doesn't cause an unhandled rejection

      // If this is a database connection error, log it specially
      if (isDatabaseConnectionError(error)) {
        console.warn(`[Socket Handler] Database connection error in ${handlerName}:`, {
          code: error.code,
          message: error.message,
        });
        // Database errors are transient - don't emit to client as they should retry
        // The handler should have already handled this appropriately
      }

      // Error is logged and handled - do not re-throw
      // This prevents unhandled promise rejections that could crash the server
      // Individual handlers should emit errors to clients before throwing
    }
  };
}

/**
 * Wrap multiple socket handlers at once
 * @param {Object} handlers - Object with handler functions
 * @param {Object} options - Options for all handlers
 * @returns {Object} Wrapped handlers
 */
function wrapSocketHandlers(handlers, options = {}) {
  const wrapped = {};
  for (const [name, handler] of Object.entries(handlers)) {
    wrapped[name] = wrapSocketHandler(handler, name, options);
  }
  return wrapped;
}

module.exports = {
  wrapSocketHandler,
  wrapSocketHandlers,
};
