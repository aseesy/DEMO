/**
 * Query Cache
 *
 * Redis-backed cache for database query results.
 * Reduces database load by caching frequently accessed data.
 *
 * @module liaizen/infrastructure/cache/queryCache
 */

const {
  cacheGet,
  cacheSet,
  cacheDelete,
  cacheDeletePattern,
  isRedisAvailable,
} = require('../database/redisClient');

const { defaultLogger: defaultLogger } = require('../logging/logger');

const logger = defaultLogger.child({
  module: 'queryCache',
});

const DEFAULT_TTL = 300; // 5 minutes
const CACHE_PREFIX = 'query:';

/**
 * Generate cache key from query parameters
 * @param {string} queryName - Query identifier (e.g., 'threads:room')
 * @param {Object} params - Query parameters
 * @returns {string} Cache key
 */
function generateKey(queryName, params = {}) {
  const paramString = JSON.stringify(params);
  const hash = require('crypto').createHash('md5').update(paramString).digest('hex');
  return `${CACHE_PREFIX}${queryName}:${hash}`;
}

/**
 * Get cached query result
 * @param {string} queryName - Query identifier
 * @param {Object} params - Query parameters
 * @returns {Promise<any|null>} Cached result or null if not found
 */
async function get(queryName, params = {}) {
  if (!isRedisAvailable()) {
    return null;
  }

  try {
    const key = generateKey(queryName, params);
    return await cacheGet(key);
  } catch (error) {
    logger.warn('Log message', {
      arg0: `[QueryCache] Failed to get cache for ${queryName}:`,
      message: error.message,
    });
    return null;
  }
}

/**
 * Cache query result
 * @param {string} queryName - Query identifier
 * @param {Object} params - Query parameters
 * @param {any} result - Query result to cache
 * @param {number} ttlSeconds - Time to live in seconds (default: 5 minutes)
 * @returns {Promise<boolean>} True if cached successfully
 */
async function set(queryName, params = {}, result, ttlSeconds = DEFAULT_TTL) {
  if (!isRedisAvailable()) {
    return false;
  }

  try {
    const key = generateKey(queryName, params);
    return await cacheSet(key, result, ttlSeconds);
  } catch (error) {
    logger.warn('Log message', {
      arg0: `[QueryCache] Failed to cache ${queryName}:`,
      message: error.message,
    });
    return false;
  }
}

/**
 * Invalidate cache for a specific query pattern
 * @param {string} queryPattern - Query pattern (e.g., 'threads:room:*')
 * @returns {Promise<number>} Number of keys deleted
 */
async function invalidate(queryPattern) {
  if (!isRedisAvailable()) {
    return 0;
  }

  try {
    const pattern = `${CACHE_PREFIX}${queryPattern}`;
    return await cacheDeletePattern(pattern);
  } catch (error) {
    logger.warn('Log message', {
      arg0: `[QueryCache] Failed to invalidate ${queryPattern}:`,
      message: error.message,
    });
    return 0;
  }
}

/**
 * Invalidate all caches for a specific query name
 * @param {string} queryName - Query identifier
 * @returns {Promise<number>} Number of keys deleted
 */
async function invalidateQuery(queryName) {
  return invalidate(`${queryName}:*`);
}

/**
 * Invalidate all caches for a room
 * Useful when room data changes (new messages, threads, etc.)
 * @param {string} roomId - Room ID
 * @returns {Promise<number>} Number of keys deleted
 */
async function invalidateRoom(roomId) {
  if (!isRedisAvailable()) {
    return 0;
  }

  try {
    // Invalidate all queries that might include this room
    const patterns = [
      `threads:room:*${roomId}*`,
      `messages:room:*${roomId}*`,
      `users:room:*${roomId}*`,
    ];

    let totalDeleted = 0;
    for (const pattern of patterns) {
      const deleted = await invalidate(pattern);
      totalDeleted += deleted;
    }

    return totalDeleted;
  } catch (error) {
    logger.warn('Log message', {
      arg0: `[QueryCache] Failed to invalidate room ${roomId}:`,
      message: error.message,
    });
    return 0;
  }
}

module.exports = {
  get,
  set,
  invalidate,
  invalidateQuery,
  invalidateRoom,
};
