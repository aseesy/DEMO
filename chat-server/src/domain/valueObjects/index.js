/**
 * Value Objects Module
 *
 * Exports all value object classes for domain model.
 *
 * @module domain/valueObjects
 */

const Email = require('./Email');
const Username = require('./Username');
const RoomId = require('./RoomId');
const MessageId = require('./MessageId');

module.exports = {
  Email,
  Username,
  RoomId,
  MessageId,
};
