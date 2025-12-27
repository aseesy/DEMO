/**
 * Socket.io Event Handlers - Modular Entry Point
 *
 * REFACTORED: No longer creates global mutable state (activeUsers, messageHistory).
 * Uses UserSessionService for session management.
 * Handlers access services directly - no prop drilling.
 */
const { registerMessageHandlers } = require('./socketHandlers/messageHandler');
const { registerThreadHandlers } = require('./socketHandlers/threadHandler');
const { registerFeedbackHandlers } = require('./socketHandlers/feedbackHandler');
const { registerNavigationHandlers } = require('./socketHandlers/navigationHandler');
const { registerContactHandlers } = require('./socketHandlers/contactHandler');
const { registerConnectionHandlers } = require('./socketHandlers/connectionHandler');
const { registerCoachingHandlers } = require('./socketHandlers/coachingHandler');

/**
 * Initialize Socket.io handlers
 *
 * @param {Object} io - Socket.io server instance
 * @param {Object} services - Service container (includes userSessionService, messageStore, etc.)
 */
function setupSockets(io, services) {
  const { userSessionService, messageStore } = services;

  if (!userSessionService) {
    console.error('❌ Sockets: userSessionService not available!');
    throw new Error('userSessionService is required for socket setup');
  }

  io.on('connection', socket => {
    console.log(`New connection: ${socket.id}`);

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

    // Note: Disconnect handling is done in connectionHandler.js
    // which saves system messages, broadcasts to room, and cleans up session
  });

  // Return service reference for external access (e.g., admin/debugging)
  return { userSessionService };
}

module.exports = { setupSockets };
