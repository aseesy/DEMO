/**
 * User Service
 *
 * Shared user lookup and verification functions.
 * Eliminates repeated user queries across routes.
 *
 * @module services/userService
 */

const dbSafe = require('../dbSafe');

/**
 * Custom error class for service-level errors
 */
class ServiceError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
    this.name = 'ServiceError';
  }
}

/**
 * Get user ID by username
 *
 * @param {string} username - Username to look up
 * @returns {Promise<number>} User ID
 * @throws {ServiceError} If username missing or user not found
 */
async function getUserIdByUsername(username) {
  if (!username) {
    throw new ServiceError('Username is required', 400);
  }

  const userResult = await dbSafe.safeSelect(
    'users',
    { username: username.toLowerCase() },
    { limit: 1 }
  );
  const users = dbSafe.parseResult(userResult);

  if (users.length === 0) {
    throw new ServiceError('User not found', 404);
  }

  return users[0].id;
}

/**
 * Get full user record by username
 *
 * @param {string} username - Username to look up
 * @returns {Promise<Object>} User record
 * @throws {ServiceError} If user not found
 */
async function getUserByUsername(username) {
  if (!username) {
    throw new ServiceError('Username is required', 400);
  }

  const userResult = await dbSafe.safeSelect(
    'users',
    { username: username.toLowerCase() },
    { limit: 1 }
  );
  const users = dbSafe.parseResult(userResult);

  if (users.length === 0) {
    throw new ServiceError('User not found', 404);
  }

  return users[0];
}

/**
 * Get user by ID
 *
 * @param {number} userId - User ID
 * @returns {Promise<Object>} User record
 * @throws {ServiceError} If user not found
 */
async function getUserById(userId) {
  if (!userId) {
    throw new ServiceError('User ID is required', 400);
  }

  const userResult = await dbSafe.safeSelect('users', { id: userId }, { limit: 1 });
  const users = dbSafe.parseResult(userResult);

  if (users.length === 0) {
    throw new ServiceError('User not found', 404);
  }

  return users[0];
}

module.exports = {
  ServiceError,
  getUserIdByUsername,
  getUserByUsername,
  getUserById,
};
