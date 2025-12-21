/**
 * Room Management Module - Modular Entry Point
 */
const {
  LIAIZEN_WELCOME_MESSAGE,
  generateRoomId,
  generateInviteCode,
  sendWelcomeMessage,
} = require('./roomManager/utils');
const { createPrivateRoom, getUserRoom, getRoom } = require('./roomManager/room');
const { getRoomMembers, addUserToRoom, removeUserFromRoom } = require('./roomManager/member');
const { ensureContactsForRoomMembers } = require('./roomManager/contact');
const { createCoParentRoom } = require('./roomManager/coParent');

module.exports = {
  // Constants & Utils
  LIAIZEN_WELCOME_MESSAGE,
  generateRoomId,
  generateInviteCode,
  sendWelcomeMessage,

  // Core Room Management
  createPrivateRoom,
  getUserRoom,
  getRoom,

  // Member Management
  getRoomMembers,
  addUserToRoom,
  removeUserFromRoom,

  // Contact Management
  ensureContactsForRoomMembers,

  // Specialized Room Creation
  createCoParentRoom,
};
