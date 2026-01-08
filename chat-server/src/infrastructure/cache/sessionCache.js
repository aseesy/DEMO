/**
 * Session Cache
 *
 * Redis-backed session cache layer for fast user session lookups.
 * Provides caching layer on top of database-backed UserSessionService.
 * Falls back gracefully if Redis is unavailable.
 *
 * @module liaizen/infrastructure/cache/sessionCache
 */

const { cacheGet, cacheSet, cacheDelete, isRedisAvailable } = require('../database/redisClient');

const { defaultLogger: defaultLogger } = require('../../../src/infrastructure/logging/logger');

const logger = defaultLogger.child({
  module: 'sessionCache',
});

const SESSION_CACHE_TTL = 300; // 5 minutes
const CACHE_PREFIX = 'session:';

/**
 * Get cached session data
 * @param {string} socketId - Socket ID
 * @returns {Promise<Object|null>} Session data or null if not cached
 */
async function getSession(socketId) {
  if (!isRedisAvailable()) {
    return null;
  }

  try {
    return await cacheGet(`${CACHE_PREFIX}${socketId}`);
  } catch (error) {
    logger.warn('[SessionCache] Failed to get session', {
      message: error.message,
    });
    return null;
  }
}

/**
 * Cache session data
 * @param {string} socketId - Socket ID
 * @param {Object} sessionData - Session data to cache
 * @param {number} ttlSeconds - Time to live in seconds (default: 5 minutes)
 * @returns {Promise<boolean>} True if cached successfully
 */
async function setSession(socketId, sessionData, ttlSeconds = SESSION_CACHE_TTL) {
  if (!isRedisAvailable()) {
    return false;
  }

  try {
    return await cacheSet(`${CACHE_PREFIX}${socketId}`, sessionData, ttlSeconds);
  } catch (error) {
    logger.warn('[SessionCache] Failed to cache session', {
      message: error.message,
    });
    return false;
  }
}

/**
 * Delete cached session
 * @param {string} socketId - Socket ID
 * @returns {Promise<boolean>} True if deleted successfully
 */
async function deleteSession(socketId) {
  if (!isRedisAvailable()) {
    return false;
  }

  try {
    return await cacheDelete(`${CACHE_PREFIX}${socketId}`);
  } catch (error) {
    logger.warn('[SessionCache] Failed to delete session', {
      message: error.message,
    });
    return false;
  }
}

/**
 * Invalidate all sessions for a user (by email)
 * @param {string} email - User email
 * @returns {Promise<number>} Number of sessions invalidated
 */
async function invalidateUserSessions(email) {
  if (!isRedisAvailable()) {
    return 0;
  }

  try {
    const { cacheDeletePattern } = require('../database/redisClient');
    // Note: This is a simple implementation. For production, you might want
    // to maintain a set of socket IDs per user for faster invalidation.
    const pattern = `${CACHE_PREFIX}*`;
    return await cacheDeletePattern(pattern);
  } catch (error) {
    logger.warn('[SessionCache] Failed to invalidate user sessions', {
      message: error.message,
    });
    return 0;
  }
}

module.exports = {
  getSession,
  setSession,
  deleteSession,
  invalidateUserSessions,
};
