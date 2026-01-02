/**
 * Room Use Cases
 *
 * Centralized exports for all room-related use cases.
 */

const { execute: joinSocketRoom } = require('./JoinSocketRoomUseCase');
const { checkRoomMembers, checkSharedRoom } = require('./RoomMembershipUseCase');

module.exports = {
  joinSocketRoom,
  checkRoomMembers,
  checkSharedRoom,
};
