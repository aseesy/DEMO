/**
 * Socket Message Handlers - Facade
 *
 * REFACTORED: This file is now a facade that delegates to focused handler modules.
 *
 * The original monolithic file (452 lines, 4 event handlers) has been split into:
 * - messageHandlers/sendMessageHandler.js - send_message events
 * - messageHandlers/editMessageHandler.js - edit_message events
 * - messageHandlers/deleteMessageHandler.js - delete_message events
 * - messageHandlers/reactionHandler.js - add_reaction events
 * - messageHandlers/messagePersistence.js - Message persistence helper
 *
 * This facade maintains backward compatibility - all existing imports continue to work.
 */

const { registerMessageHandlers } = require('./messageHandlers');

module.exports = { registerMessageHandlers };
