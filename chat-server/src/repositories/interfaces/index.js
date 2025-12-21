/**
 * Repository Interfaces
 *
 * Central export point for all repository interfaces.
 * Services should depend on these interfaces, not implementations.
 *
 * @module repositories/interfaces
 */

const { IGenericRepository } = require('./IGenericRepository');
const { IUserRepository } = require('./IUserRepository');
const { IRoomRepository } = require('./IRoomRepository');
const { ITaskRepository } = require('./ITaskRepository');
const { IContactRepository } = require('./IContactRepository');
const { IInvitationRepository } = require('./IInvitationRepository');
const { IPairingRepository } = require('./IPairingRepository');

module.exports = {
  IGenericRepository,
  IUserRepository,
  IRoomRepository,
  ITaskRepository,
  IContactRepository,
  IInvitationRepository,
  IPairingRepository,
};

