/**
 * PostgreSQL Repository Implementations
 *
 * Central export point for all PostgreSQL repository implementations.
 * These are the concrete implementations that should be injected into services.
 *
 * @module repositories/postgres
 */

const { PostgresGenericRepository } = require('./PostgresGenericRepository');
const { PostgresUserRepository } = require('./PostgresUserRepository');
const { PostgresRoomRepository } = require('./PostgresRoomRepository');
const { PostgresTaskRepository } = require('./PostgresTaskRepository');
const { PostgresContactRepository } = require('./PostgresContactRepository');
const { PostgresInvitationRepository, invitationRepository } = require('./PostgresInvitationRepository');
const { PostgresPairingRepository, pairingRepository } = require('./PostgresPairingRepository');

module.exports = {
  PostgresGenericRepository,
  PostgresUserRepository,
  PostgresRoomRepository,
  PostgresTaskRepository,
  PostgresContactRepository,
  PostgresInvitationRepository,
  invitationRepository,
  PostgresPairingRepository,
  pairingRepository,
};

