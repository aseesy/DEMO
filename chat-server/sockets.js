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
  const { messageStore } = services;

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

  // In-memory storage for active connections
  const activeUsers = new Map(); // socketId -> user data
  const messageHistory = []; // In-memory cache of recent messages

  // Load messages from database on startup
  (async () => {
    try {
      if (messageStore) {
        const recentMessages = await messageStore.getRecentMessages(MAX_MESSAGE_HISTORY);
        messageHistory.push(...recentMessages);
        console.log(`✅ Sockets: Loaded ${recentMessages.length} messages from database`);
      }
    } catch (err) {
      console.error('❌ Sockets: Error loading messages:', err);
    }
  })();

  io.on('connection', socket => {
    console.log(`New connection: ${socket.id}`);

    // Register modular handlers
    registerConnectionHandlers(socket, io, services, activeUsers, messageHistory);
    registerMessageHandlers(socket, io, services, activeUsers, messageHistory);
    registerThreadHandlers(socket, io, services, activeUsers);
    registerFeedbackHandlers(socket, io, services, activeUsers);
    registerNavigationHandlers(socket, io, services, activeUsers);
    registerContactHandlers(socket, io, services, activeUsers);
    registerCoachingHandlers(socket, io, services, activeUsers);

    // Global error handler
    socket.on('error', error => {
      console.error(`Socket error (${socket.id}):`, error);
    });
  });

  return { activeUsers, messageHistory };
}

module.exports = { setupSockets };
