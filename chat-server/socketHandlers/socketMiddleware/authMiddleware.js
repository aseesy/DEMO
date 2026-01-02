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
  // Only log in development to avoid noise in production
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Socket Auth] Middleware called for socket ${socket.id}`);
    console.log(`[Socket Auth] Handshake auth:`, socket.handshake.auth);
  }

  try {
    // CRITICAL: Token MUST be in auth object
    // Client should send: io(url, { auth: { token: '...' } })
    // No fallbacks - this is the single source of truth
    const token = socket.handshake.auth?.token;

    if (!token) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[Socket Auth] ❌ No token in auth object for socket ${socket.id}`);
        console.warn(`[Socket Auth] Handshake auth:`, socket.handshake.auth);
        console.warn(
          `[Socket Auth] Client must send token in auth object: { auth: { token: '...' } }`
        );
      }
      const err = new Error('Authentication required');
      err.data = { code: SocketErrorCodes.AUTH_REQUIRED };
      return next(err);
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach user info to socket
    socket.user = {
      id: decoded.id || decoded.userId,
      email: decoded.email,
      // Add token expiry for reconnection validation
      tokenExp: decoded.exp,
    };

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Socket Auth] ✅ Authenticated: ${socket.user.email} (socket: ${socket.id})`);
    }
    next();
  } catch (err) {
    // Only log in development
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[Socket Auth] ❌ Authentication failed for socket ${socket.id}:`, err.message);
    }

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
