/**
 * Authentication Middleware
 *
 * JWT authentication for Socket.io connections.
 */

const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../../config');
const { SocketErrorCodes } = require('./errorCodes');

/**
 * Socket.io authentication middleware
 * Verifies JWT token from handshake auth or headers
 * @param {Object} socket - Socket.io socket
 * @param {Function} next - Next middleware
 */
function authMiddleware(socket, next) {
  console.log(`[Socket Auth] Middleware called for socket ${socket.id}`);
  console.log(`[Socket Auth] Handshake auth:`, socket.handshake.auth);
  console.log(
    `[Socket Auth] Handshake headers auth:`,
    socket.handshake.headers?.authorization ? 'Present' : 'Missing'
  );

  try {
    // Get token from auth object, authorization header, or query parameters (for polling transport)
    // Socket.io's query option populates socket.handshake.query
    // Engine.io also exposes req._query which becomes socket.handshake._query
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '') ||
      socket.handshake.query?.token ||
      socket.handshake._query?.token ||
      socket.request?._query?.token; // Also check raw request query

    if (!token) {
      console.warn(`[Socket Auth] ❌ No token provided for socket ${socket.id}`);
      console.warn(`[Socket Auth] Handshake auth:`, socket.handshake.auth);
      console.warn(
        `[Socket Auth] Handshake headers:`,
        socket.handshake.headers?.authorization ? 'Present' : 'Missing'
      );
      const err = new Error('Authentication required');
      err.data = { code: SocketErrorCodes.AUTH_REQUIRED };
      return next(err);
    }

    console.log(`[Socket Auth] Token found, verifying...`);
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log(`[Socket Auth] Token verified for user:`, decoded.email);

    // Attach user info to socket
    socket.user = {
      id: decoded.id || decoded.userId,
      email: decoded.email,
      // Add token expiry for reconnection validation
      tokenExp: decoded.exp,
    };

    console.log(`[Socket Auth] Authenticated: ${socket.user.email} (socket: ${socket.id})`);
    next();
  } catch (err) {
    console.warn(`[Socket Auth] Authentication failed for socket ${socket.id}:`, err.message);

    const error = new Error('Authentication failed');
    if (err.name === 'TokenExpiredError') {
      error.data = { code: SocketErrorCodes.AUTH_EXPIRED };
    } else {
      error.data = { code: SocketErrorCodes.AUTH_INVALID };
    }
    next(error);
  }
}

module.exports = {
  authMiddleware,
};
