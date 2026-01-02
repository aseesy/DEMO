/**
 * Message Handlers
 *
 * Centralized exports for all message-related socket handlers.
 */

const { registerSendMessageHandler } = require('./sendMessageHandler');
const { registerEditMessageHandler } = require('./editMessageHandler');
const { registerDeleteMessageHandler } = require('./deleteMessageHandler');
const { registerReactionHandler } = require('./reactionHandler');

/**
 * Register all message handlers
 *
 * @param {Object} socket - Socket instance
 * @param {Object} io - Socket.io server instance
 * @param {Object} services - Service dependencies
 */
function registerMessageHandlers(socket, io, services) {
  registerSendMessageHandler(socket, io, services);
  registerEditMessageHandler(socket, io, services);
  registerDeleteMessageHandler(socket, io, services);
  registerReactionHandler(socket, io, services);
}

module.exports = {
  registerMessageHandlers,
};
