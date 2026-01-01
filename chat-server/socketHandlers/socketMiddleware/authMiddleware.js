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
  // #region agent log
  const handshakeAuth = socket.handshake.auth || {};
  const hasAuthToken = !!handshakeAuth.token;
  const hasHeaderAuth = !!socket.handshake.headers?.authorization;
  fetch('http://127.0.0.1:7242/ingest/83e2bb31-7602-4e5a-bb5a-bc4e122570f2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'authMiddleware.js:17',message:'Auth middleware called',data:{socketId:socket.id,hasAuthToken,hasHeaderAuth,handshakeAuthKeys:Object.keys(handshakeAuth)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  // #endregion
  console.log(`[Socket Auth] Middleware called for socket ${socket.id}`);
  console.log(`[Socket Auth] Handshake auth:`, socket.handshake.auth);
  console.log(`[Socket Auth] Handshake headers auth:`, socket.handshake.headers?.authorization ? 'Present' : 'Missing');
  
  try {
    // Get token from auth object, authorization header, or query parameters (for polling transport)
    // Socket.io's query option populates socket.handshake.query
    // Engine.io also exposes req._query which becomes socket.handshake._query
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '') ||
      socket.handshake.query?.token ||
      socket.handshake._query?.token ||
      (socket.request?._query?.token); // Also check raw request query

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/83e2bb31-7602-4e5a-bb5a-bc4e122570f2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'authMiddleware.js:28',message:'Token extraction',data:{hasToken:!!token,tokenLength:token?.length,source:handshakeAuth.token?'auth':'header'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    if (!token) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/83e2bb31-7602-4e5a-bb5a-bc4e122570f2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'authMiddleware.js:32',message:'No token found',data:{socketId:socket.id,handshakeAuthKeys:Object.keys(handshakeAuth)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      console.warn(`[Socket Auth] ❌ No token provided for socket ${socket.id}`);
      console.warn(`[Socket Auth] Handshake auth:`, socket.handshake.auth);
      console.warn(`[Socket Auth] Handshake headers:`, socket.handshake.headers?.authorization ? 'Present' : 'Missing');
      const err = new Error('Authentication required');
      err.data = { code: SocketErrorCodes.AUTH_REQUIRED };
      return next(err);
    }

    console.log(`[Socket Auth] Token found, verifying...`);
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/83e2bb31-7602-4e5a-bb5a-bc4e122570f2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'authMiddleware.js:42',message:'Token verified',data:{socketId:socket.id,email:decoded.email},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/83e2bb31-7602-4e5a-bb5a-bc4e122570f2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'authMiddleware.js:55',message:'Auth failed',data:{socketId:socket.id,error:err.message,errorName:err.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
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
