/**
 * Authentication Middleware
 *
 * JWT authentication for Socket.io connections.
 */

const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../../config');
const { SocketErrorCodes } = require('./errorCodes');

const { defaultLogger: defaultLogger } = require('../../src/infrastructure/logging/logger');

const logger = defaultLogger.child({
  module: 'authMiddleware',
});

/**
 * Socket.io authentication middleware
 * Verifies JWT token from handshake auth or query parameters
 *
 * PROPER Socket.io pattern: Uses handshake.auth (preferred) and handshake.query (backwards compatibility)
 * Socket.io automatically populates handshake.query from URL query parameters - no engine.io hacks needed!
 *
 * @param {Object} socket - Socket.io socket
 * @param {Function} next - Next middleware
 */
function authMiddleware(socket, next) {
  // ALWAYS log the first line to verify middleware is called
  logger.debug('Log message', {
    value: `[Socket Auth] >>> MIDDLEWARE INVOKED for socket ${socket.id}`,
  });

  // Only log details in development to avoid noise in production
  if (process.env.NODE_ENV !== 'production') {
    logger.debug('Log message', {
      arg0: `[Socket Auth] Handshake auth:`,
      auth: socket.handshake.auth,
    });
    logger.debug('Log message', {
      arg0: `[Socket Auth] Handshake query:`,
      query: socket.handshake.query,
    });
  }

  try {
    // PROPER Socket.io pattern: Check auth object first (preferred), then query (backwards compatibility)
    // Socket.io automatically populates handshake.query from URL query parameters
    // No need to hack into engine.io - Socket.io handles this for us!
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;

    if (!token) {
      if (process.env.NODE_ENV !== 'production') {
        logger.warn('Log message', {
          value: `[Socket Auth] ❌ No token found for socket ${socket.id}`,
        });
        logger.warn('Log message', {
          arg0: `[Socket Auth] Handshake auth:`,
          auth: socket.handshake.auth,
        });
        logger.warn('Log message', {
          arg0: `[Socket Auth] Handshake query:`,
          query: socket.handshake.query,
        });
        logger.warn('Log message', {
          value: `[Socket Auth] Client should send token in auth object: { auth: { token: '...' } }`,
        });
      }
      const err = new Error('Authentication required');
      err.data = { code: SocketErrorCodes.AUTH_REQUIRED };
      return next(err);
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // SINGLE SOURCE OF TRUTH: Attach user info to socket
    // Middleware is the ONLY place that sets authentication data
    // All handlers can trust that if connection event fires, socket.user exists
    const authenticatedUser = {
      id: decoded.id || decoded.userId,
      email: decoded.email,
      // Add token expiry for reconnection validation
      tokenExp: decoded.exp,
    };

    // Set on socket.user (primary) and socket.data.authenticatedUser (for backwards compatibility)
    socket.user = authenticatedUser;
    socket.data = socket.data || {};
    socket.data.authenticatedUser = authenticatedUser;

    if (process.env.NODE_ENV !== 'production') {
      logger.debug('Log message', {
        value: `[Socket Auth] ✅ Authenticated: ${socket.user.email} (socket: ${socket.id})`,
      });
    }
    next();
  } catch (err) {
    // Only log in development
    if (process.env.NODE_ENV !== 'production') {
      logger.warn('Log message', {
        arg0: `[Socket Auth] ❌ Authentication failed for socket ${socket.id}:`,
        message: err.message,
      });
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
