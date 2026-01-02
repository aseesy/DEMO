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
    // Priority order: auth object (preferred) > query > headers > _query
    // The normalization middleware should have already copied query token to auth
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.query?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '') ||
      socket.handshake._query?.token ||
      socket.request?._query?.token;

    if (!token) {
      console.warn(`[Socket Auth] ❌ No token provided for socket ${socket.id}`);
      console.warn(`[Socket Auth] Handshake auth:`, socket.handshake.auth);
      console.warn(`[Socket Auth] Handshake query:`, socket.handshake.query);
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
