/**
 * Domain Entities Module
 *
 * Exports all domain entity classes.
 *
 * @module domain/entities
 */

const User = require('./User');
const Room = require('./Room');
const Message = require('./Message');
const Task = require('./Task');
const Contact = require('./Contact');

module.exports = {
  User,
  Room,
  Message,
  Task,
  Contact,
};

