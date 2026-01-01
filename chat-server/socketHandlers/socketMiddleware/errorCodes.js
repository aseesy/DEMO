/**
 * Socket Error Codes
 *
 * Standardized error codes for client retry logic.
 */

const SocketErrorCodes = {
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  AUTH_INVALID: 'AUTH_INVALID',
  AUTH_EXPIRED: 'AUTH_EXPIRED',
  RATE_LIMITED: 'RATE_LIMITED',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
  NOT_IN_ROOM: 'NOT_IN_ROOM',
  ROOM_MEMBERSHIP_INVALID: 'ROOM_MEMBERSHIP_INVALID',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
};

/**
 * Emit error with code for client retry logic
 * @param {Object} socket - Socket.io socket
 * @param {string} code - Error code from SocketErrorCodes
 * @param {string} message - Human-readable message
 * @param {Object} details - Additional error details
 */
function emitSocketError(socket, code, message, details = {}) {
  socket.emit('error', {
    code,
    message,
    ...details,
    timestamp: Date.now(),
  });
}

module.exports = {
  SocketErrorCodes,
  emitSocketError,
};
