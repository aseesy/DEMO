/**
 * Connection Operations - Modular Entry Point
 *
 * Pure business logic for connection handling.
 * Re-exports from submodules for backward compatibility.
 */

const {
  validateUserInput,
  getUserByEmail,
  getUserByUsername,
  lookupUser,
} = require('./connectionOperations/userLookup');

const {
  getExistingUserRoom,
  resolveOrCreateUserRoom,
  resolveUserRoom,
  findUserRoom,
} = require('./connectionOperations/roomResolution');

const {
  disconnectDuplicateConnections,
  registerActiveUser,
  getRoomUsers,
} = require('./connectionOperations/sessionManagement');

const {
  getMessageHistory,
  fetchMessageHistory,
} = require('./connectionOperations/messageHistory');

const {
  createSystemMessage,
  saveSystemMessage,
} = require('./connectionOperations/systemMessages');

module.exports = {
  // User Lookup
  validateUserInput,
  getUserByEmail,
  getUserByUsername, // Deprecated
  lookupUser, // Deprecated alias

  // Room Resolution
  getExistingUserRoom,
  findUserRoom, // Deprecated alias
  resolveOrCreateUserRoom,
  resolveUserRoom, // Deprecated

  // Session Management
  disconnectDuplicateConnections,
  registerActiveUser,
  getRoomUsers,

  // Message History
  getMessageHistory,
  fetchMessageHistory, // Deprecated alias

  // System Messages
  createSystemMessage,
  saveSystemMessage,
};
