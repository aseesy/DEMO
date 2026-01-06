/**
 * Domain Model Module
 *
 * Public API for domain model layer.
 * Exports all value objects and entities.
 *
 * @module domain
 */

const { Email, Username, RoomId, MessageId } = require('./valueObjects');
const { User, Room, Message, Task, Contact } = require('./entities');

module.exports = {
  // Value Objects
  Email,
  Username,
  RoomId,
  MessageId,
  // Entities
  User,
  Room,
  Message,
  Task,
  Contact,
};

