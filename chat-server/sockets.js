/**
 * Socket.io Event Handlers - Modular Entry Point
 *
 * REFACTORED: No longer creates global mutable state (activeUsers, messageHistory).
 * Uses UserSessionService for session management.
 * Handlers access services directly - no prop drilling.
 *
 * Security features:
 * - JWT authentication on connection
 * - Per-socket, per-event rate limiting
 * - Payload size validation
 */
const { registerMessageHandlers } = require('./socketHandlers/messageHandler');
const { registerThreadHandlers } = require('./socketHandlers/threadHandler');
const { registerFeedbackHandlers } = require('./socketHandlers/feedbackHandler');
const { registerNavigationHandlers } = require('./socketHandlers/navigationHandler');
const { registerContactHandlers } = require('./socketHandlers/contactHandler');
const { registerConnectionHandlers } = require('./socketHandlers/connectionHandler');
const { registerCoachingHandlers } = require('./socketHandlers/coachingHandler');
const {
  authMiddleware,
  rateLimitMiddleware,
  payloadValidationMiddleware,
} = require('./socketHandlers/socketMiddleware');

/**
 * Initialize Socket.io handlers
 *
 * @param {Object} io - Socket.io server instance
 * @param {Object} services - Service container (includes userSessionService, messageStore, etc.)
 */
function setupSockets(io, services) {
  console.log('[setupSockets] ========================================');
  console.log('[setupSockets] Starting Socket.io setup...');
  console.log('[setupSockets] io object:', !!io, typeof io);
  console.log('[setupSockets] services:', !!services);
  
  const { userSessionService, messageStore } = services;

  if (!userSessionService) {
    console.error('❌ Sockets: userSessionService not available!');
    throw new Error('userSessionService is required for socket setup');
  }

  console.log('[setupSockets] Registering Socket.io middleware...');
  console.log('[HYPOTHESIS_D] About to register io.use() middleware...');
  console.log('[HYPOTHESIS_D] io object:', typeof io, !!io, io?.constructor?.name);

  // ==========================================================================
  // SOCKET AUTHENTICATION MIDDLEWARE
  // Verifies JWT token before allowing connection
  // ==========================================================================
  // TEST: Add a simple middleware first to verify middleware is being called
  console.log('[HYPOTHESIS_D] Registering TEST middleware...');
  io.use((socket, next) => {
    console.log(`[HYPOTHESIS_D] ✅✅✅ TEST Middleware CALLED for socket ${socket.id} ✅✅✅`);
    console.log(`[TEST Middleware] Handshake:`, {
      query: socket.handshake.query,
      _query: socket.handshake._query,
      auth: socket.handshake.auth,
      url: socket.request?.url,
    });
    next(); // Always continue to next middleware
  });
  
  // Wrap auth middleware to log when it's called and extract token from URL if needed
  console.log('[HYPOTHESIS_D] Registering Auth Wrapper middleware...');
  io.use((socket, next) => {
    console.log(`[HYPOTHESIS_D] ✅✅✅ Auth Wrapper Middleware CALLED for socket ${socket.id} ✅✅✅`);
    
    // Extract token from URL if not already in handshake
    const req = socket.request;
    let tokenFromUrl = null;
    if (req && req.url) {
      try {
        const urlParams = new URL(req.url, `http://${req.headers?.host || 'localhost'}`).searchParams;
        tokenFromUrl = urlParams.get('token');
        console.log(`[Socket Auth Wrapper] Token from URL: ${tokenFromUrl ? 'FOUND' : 'NOT FOUND'}`);
        
        if (tokenFromUrl) {
          // Initialize handshake.query if needed
          if (!socket.handshake.query) {
            socket.handshake.query = {};
          }
          if (!socket.handshake._query) {
            socket.handshake._query = {};
          }
          // Set token in handshake.query
          socket.handshake.query.token = tokenFromUrl;
          socket.handshake._query.token = tokenFromUrl;
          console.log(`[Socket Auth Wrapper] ✅ Set token in handshake.query for socket ${socket.id}`);
        }
      } catch (err) {
        console.warn(`[Socket Auth Wrapper] Error extracting token from URL:`, err.message);
      }
    }
    
    // #region agent log
    const handshakeAuth = socket.handshake.auth || {};
    const hasAuthToken = !!handshakeAuth.token;
    const hasHeaderAuth = !!socket.handshake.headers?.authorization;
    const hasQueryToken = !!(socket.handshake.query?.token || socket.handshake._query?.token);
    fetch('http://127.0.0.1:7242/ingest/83e2bb31-7602-4e5a-bb5a-bc4e122570f2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'sockets.js:44',message:'Auth middleware wrapper called',data:{socketId:socket.id,hasAuthToken,hasHeaderAuth,hasQueryToken,tokenFromUrl:!!tokenFromUrl,handshakeAuthKeys:Object.keys(handshakeAuth),queryKeys:Object.keys(socket.handshake.query||{}),queryKeys2:Object.keys(socket.handshake._query||{})},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    console.log(`[Socket Auth Wrapper] Middleware state for socket ${socket.id}:`, {
      auth: socket.handshake.auth,
      query: socket.handshake.query,
      _query: socket.handshake._query,
      headers: socket.handshake.headers?.authorization ? 'Present' : 'Missing',
      tokenFromUrl: !!tokenFromUrl,
    });
    // Call the actual auth middleware
    authMiddleware(socket, next);
  });

  // #region agent log
  console.log('[HYPOTHESIS_D] Registering io.on(\'connection\') handler...');
  io.on('connection', socket => {
    console.log(`[HYPOTHESIS_D] ✅✅✅ Socket.io Connection event FIRED for socket ${socket.id} ✅✅✅`);
    fetch('http://127.0.0.1:7242/ingest/83e2bb31-7602-4e5a-bb5a-bc4e122570f2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'sockets.js:64',message:'Socket.io connection event',data:{socketId:socket.id,hasUser:!!socket.user,userEmail:socket.user?.email,hasQueryToken:!!(socket.handshake.query?.token || socket.handshake._query?.token)},timestamp:Date.now(),sessionId:'debug-session',runId:'run5',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    
    // CRITICAL: If middleware didn't run (which seems to be the case), authenticate here
    // Extract token from handshake.query (populated by engine.io handler)
    const token = socket.handshake.query?.token || socket.handshake._query?.token || socket.handshake.auth?.token;
    
    if (!token && !socket.user) {
      console.warn(`[Socket.io Connection] ⚠️ No token found for socket ${socket.id}, disconnecting...`);
      console.warn(`[Socket.io Connection] Handshake:`, {
        query: socket.handshake.query,
        _query: socket.handshake._query,
        auth: socket.handshake.auth,
        url: socket.request?.url?.substring(0, 150),
      });
      socket.disconnect(true);
      return;
    }
    
    // If token found but user not set (middleware didn't run), authenticate now
    if (token && !socket.user) {
      try {
        const jwt = require('jsonwebtoken');
        const { JWT_SECRET } = require('../config');
        const decoded = jwt.verify(token, JWT_SECRET);
        socket.user = {
          id: decoded.id || decoded.userId,
          email: decoded.email,
          tokenExp: decoded.exp,
        };
        console.log(`[Socket.io Connection] ✅ Authenticated socket ${socket.id} in connection handler (user: ${socket.user.email})`);
      } catch (err) {
        console.warn(`[Socket.io Connection] ❌ Token verification failed for socket ${socket.id}:`, err.message);
        socket.disconnect(true);
        return;
      }
    }
    
    // User is authenticated at this point (either by middleware or connection handler)
    console.log(`✅ Authenticated connection: ${socket.id} (user: ${socket.user?.email})`);
    console.log(`[Socket Connection] Socket connected, handshake:`, {
      id: socket.id,
      auth: socket.handshake.auth,
      query: socket.handshake.query,
      headers: socket.handshake.headers?.authorization ? 'Present' : 'Missing',
      user: socket.user,
    });

    // ==========================================================================
    // PER-SOCKET MIDDLEWARE
    // Applied to all events on this socket
    // ==========================================================================
    rateLimitMiddleware(socket);
    payloadValidationMiddleware(socket);

    // Attach authenticated user info to socket.data for handlers
    socket.data = socket.data || {};
    socket.data.authenticatedUser = socket.user;

    // Register modular handlers
    // Services are passed, not mutable state structures
    // Handlers access userSessionService directly - no prop drilling
    registerConnectionHandlers(socket, io, services);
    registerMessageHandlers(socket, io, services);
    registerThreadHandlers(socket, io, services);
    registerFeedbackHandlers(socket, io, services);
    registerNavigationHandlers(socket, io, services);
    registerContactHandlers(socket, io, services);
    registerCoachingHandlers(socket, io, services);

    // Global error handler
    socket.on('error', error => {
      console.error(`Socket error (${socket.id}):`, error);
    });

    // Cleanup on disconnect
    socket.on('disconnect', reason => {
      console.log(`Socket disconnected: ${socket.id} (reason: ${reason})`);
      // Clear socket.data to help garbage collection
      socket.data = {};
    });

    // Note: Additional disconnect handling is done in connectionHandler.js
    // which saves system messages, broadcasts to room, and cleans up session
  });

  // Return service reference for external access (e.g., admin/debugging)
  return { userSessionService };
}

module.exports = { setupSockets };
