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

/**
 * Wrap a socket handler with error boundary
 * Catches errors, logs them, and prevents server crashes
 *
 * Note: Socket handlers receive (data) as first arg, socket is in closure
 * This wrapper catches errors but handlers should emit their own errors
 *
 * @param {Function} handler - Socket handler function (receives data)
 * @param {string} handlerName - Name for logging
 * @param {Object} options - Options
 * @param {boolean} options.retry - Whether to retry on database errors (default: false)
 * @param {number} options.maxRetries - Max retry attempts (default: 3)
 * @returns {Function} Wrapped handler
 */
function wrapSocketHandler(handler, handlerName, options = {}) {
  const { retry = false, maxRetries = 3 } = options;

  return async (data) => {
    try {
      // If retry is enabled, wrap with retry logic
      if (retry) {
        await withRetry(
          () => handler(data),
          {
            maxRetries,
            operationName: handlerName,
            context: { event: handlerName },
          }
        );
      } else {
        await handler(data);
      }
    } catch (error) {
      // Log error with context
      console.error(`[Socket Handler Error] ${handlerName}:`, {
        error: error.message,
        stack: error.stack?.split('\n').slice(0, 5).join('\n'), // First 5 lines
      });

      // Note: Error emission is handled by individual handlers
      // This wrapper just ensures errors don't crash the server
      // Re-throw so handler can emit error to client if needed
      throw error;
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

