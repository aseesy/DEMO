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

/**
 * Initialize Socket.io handlers
 */
function setupSockets(io, services) {
  const { messageStore } = services;

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
