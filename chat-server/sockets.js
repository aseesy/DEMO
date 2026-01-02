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
const { authMiddleware } = require('./socketHandlers/socketMiddleware');

/**
 * Initialize Socket.io handlers
 */
function setupSockets(io, services) {
  const { messageStore, auth, roomManager, userSessionService } = services;

  // Configure RoomService for socket join operations
  const { roomService } = require('./src/services');
  roomService.setAuth(auth);
  roomService.setRoomManager(roomManager);
  roomService.setUserSessionService(userSessionService);

  // CRITICAL: Register Socket.io middleware BEFORE connection handler
  // Middleware runs during handshake processing, before 'connection' event fires
  console.log('[setupSockets] Registering Socket.io middleware...');
  console.log('[setupSockets] io.engine exists:', !!io.engine);
  console.log('[setupSockets] io._nsps:', [...io._nsps.keys()]);

  io.use((socket, next) => {
    console.log(`[setupSockets] ✅✅✅ TEST Middleware CALLED for socket ${socket.id} ✅✅✅`);
    console.log(`[setupSockets] Handshake:`, {
      query: socket.handshake.query,
      _query: socket.handshake._query,
      auth: socket.handshake.auth,
      url: socket.request?.url,
    });

    // CRITICAL: If token is in req._query but not in handshake.query, copy it
    if (socket.request?._query?.token && !socket.handshake.query?.token) {
      console.log(
        `[setupSockets] ⚠️ Token found in req._query but not in handshake.query - copying it`
      );
      if (!socket.handshake.query) {
        socket.handshake.query = {};
      }
      if (!socket.handshake._query) {
        socket.handshake._query = {};
      }
      socket.handshake.query.token = socket.request._query.token;
      socket.handshake._query.token = socket.request._query.token;
      console.log(`[setupSockets] ✅ Copied token from req._query to handshake.query`);
    }

    next(); // Continue to auth middleware
  });

  // Register authentication middleware
  io.use(authMiddleware);
  console.log('[setupSockets] ✅ Socket.io middleware registered');

  // Phase 2: Event-Driven Architecture
  // No longer passing activeUsers/messageHistory - services use UserSessionService and EventBus
  // Handlers now subscribe to events instead of receiving state directly

  io.on('connection', socket => {
    console.log(`New connection: ${socket.id}`);

    // Register modular handlers (no state passing - services handle their own state)
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
  });

  // Phase 2: Return empty object (backward compatibility)
  // Services manage their own state via UserSessionService and EventBus
  return {};
}

module.exports = { setupSockets };
