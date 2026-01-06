/**
 * Socket.io Event Handlers - Modular Entry Point
 */
const { MAX_MESSAGE_HISTORY } = require('./utils');
const { registerMessageHandlers } = require('./socketHandlers/messageHandler');
const { registerThreadHandlers } = require('./socketHandlers/threadHandler');
const { registerFeedbackHandlers } = require('./socketHandlers/feedbackHandler');
const { registerNavigationHandlers } = require('./socketHandlers/navigationHandler');
const { registerContactHandlers } = require('./socketHandlers/contactHandler');
const { registerConnectionHandlers } = require('./socketHandlers/connectionHandler');
const { registerCoachingHandlers } = require('./socketHandlers/coachingHandler');
const { setupTopicsHandler } = require('./socketHandlers/topicsHandler');
const { authMiddleware, rateLimitMiddleware } = require('./socketHandlers/socketMiddleware');

/**
 * Initialize Socket.io handlers
 */
function setupSockets(io, services) {
  const { messageStore, auth, roomManager, userSessionService, threadManager } = services;

  // Configure RoomService for socket join operations
  const { roomService } = require('./src/services');
  roomService.setAuth(auth);
  roomService.setRoomManager(roomManager);
  roomService.setUserSessionService(userSessionService);
  // Pass threadManager so it can be used for automatic analysis
  if (threadManager) {
    roomService.setThreadManager(threadManager);
  }

  // SINGLE SOURCE OF TRUTH: Authentication happens ONLY in middleware
  // Middleware runs during handshake processing, before 'connection' event fires
  // If connection event fires, socket.user is guaranteed to exist - TRUST THE MIDDLEWARE
  console.log('[setupSockets] Registering Socket.io middleware...');

  // Register authentication middleware - THIS IS THE ONLY PLACE AUTH HAPPENS
  // Client MUST send token in auth object: { auth: { token: '...' } }
  // No fallbacks - fail fast if token is missing or invalid
  io.use((socket, next) => {
    console.log('[setupSockets] >>> Middleware wrapper START for:', socket.id);
    try {
      authMiddleware(socket, next);
      console.log('[setupSockets] >>> Middleware wrapper END (sync) for:', socket.id);
    } catch (err) {
      console.error('[setupSockets] >>> Middleware SYNC ERROR:', err);
      next(err);
    }
  });
  console.log('[setupSockets] ✅ Socket.io middleware registered');

  // Phase 2: Event-Driven Architecture
  // No longer passing activeUsers/messageHistory - services use UserSessionService and EventBus
  // Handlers now subscribe to events instead of receiving state directly

  // TRUST THE MIDDLEWARE: If connection event fires, authentication succeeded
  // socket.user is guaranteed to exist - no need to check again
  io.on('connection', socket => {
    // Assert that middleware worked (development only)
    if (process.env.NODE_ENV !== 'production' && !socket.user) {
      console.error('[setupSockets] CRITICAL: Connection event fired but socket.user is missing!');
      console.error(
        '[setupSockets] This should never happen - middleware should have rejected this connection'
      );
      socket.disconnect(true);
      return;
    }

    console.log(`New connection: ${socket.id} (user: ${socket.user?.email || 'unknown'})`);

    // Apply per-socket rate limiting middleware
    // This intercepts all events and rate limits per event type
    rateLimitMiddleware(socket);

    // Register modular handlers (no state passing - services handle their own state)
    registerConnectionHandlers(socket, io, services);
    registerMessageHandlers(socket, io, services);
    registerThreadHandlers(socket, io, services);
    registerFeedbackHandlers(socket, io, services);
    registerNavigationHandlers(socket, io, services);
    registerContactHandlers(socket, io, services);
    registerCoachingHandlers(socket, io, services);
    setupTopicsHandler(socket, io);

    // Global error handler
    socket.on('error', error => {
      console.error(`Socket error (${socket.id}):`, error);
    });
  });

  // Phase 2: Return empty object (backward compatibility)
  // Services manage their own state via UserSessionService and EventBus
  return {};
}

module.exports = { setupSockets };
