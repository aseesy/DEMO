/**
 * Payload Validation
 *
 * Validates payload size for Socket.io events.
 */

const { SocketErrorCodes, emitSocketError } = require('./errorCodes');

const { defaultLogger: defaultLogger } = require('../../src/infrastructure/logging/logger');

const logger = defaultLogger.child({
  module: 'payloadValidation',
});

const MAX_PAYLOAD_SIZE = 100000; // 100KB max payload

/**
 * Validate payload size middleware
 * @param {Object} socket - Socket.io socket
 */
function payloadValidationMiddleware(socket) {
  socket.use(([event, data, ...rest], next) => {
    if (data) {
      try {
        const payloadSize = JSON.stringify(data).length;
        if (payloadSize > MAX_PAYLOAD_SIZE) {
          logger.warn('Log message', {
            value: `[Payload] Socket ${socket.id} sent oversized payload: ${payloadSize} bytes for ${event}`,
          });
          emitSocketError(
            socket,
            SocketErrorCodes.PAYLOAD_TOO_LARGE,
            'Payload too large. Maximum size is 100KB.',
            { size: payloadSize, maxSize: MAX_PAYLOAD_SIZE }
          );
          return; // Drop the event
        }
      } catch (err) {
        // JSON stringify failed - let it through, handler will deal with it
      }
    }
    next();
  });
}

module.exports = {
  MAX_PAYLOAD_SIZE,
  payloadValidationMiddleware,
};
