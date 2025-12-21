/**
 * Message Cache
 *
 * LRU-style cache for AI message analysis results.
 * Reduces redundant API calls for similar messages.
 *
 * @module liaizen/core/messageCache
 */

const crypto = require('crypto');
const { CACHE } = require('../../utils/constants');

// Cache storage
const cache = new Map();
const maxAge = CACHE.MESSAGE_CACHE_TTL_MS;
const maxSize = CACHE.MESSAGE_CACHE_MAX_SIZE;

/**
 * Generate a hash for message caching
 * Based on message text and sender/receiver context
 *
 * @param {string} messageText - The message content
 * @param {string} senderId - Sender identifier
 * @param {string} receiverId - Receiver identifier
 * @returns {string} MD5 hash
 */
function generateHash(messageText, senderId, receiverId) {
  const hashInput = `${messageText.toLowerCase().trim()}|${senderId}|${receiverId}`;
  return crypto.createHash('md5').update(hashInput).digest('hex');
}

/**
 * Get cached analysis result
 *
 * @param {string} hash - Message hash
 * @returns {Object|null} Cached result or null if not found/expired
 */
function get(hash) {
  const cached = cache.get(hash);

  if (!cached) {
    return null;
  }

  // Check if cache entry is still valid
  const age = Date.now() - cached.timestamp;
  if (age > maxAge) {
    cache.delete(hash);
    return null;
  }

  return cached.result;
}

/**
 * Store analysis result in cache
 *
 * @param {string} hash - Message hash
 * @param {Object} result - Analysis result to cache
 */
function set(hash, result) {
  // Enforce max cache size (LRU-like: remove oldest if at limit)
  if (cache.size >= maxSize) {
    let oldestKey = null;
    let oldestTime = Infinity;

    for (const [key, value] of cache.entries()) {
      if (value.timestamp < oldestTime) {
        oldestTime = value.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      cache.delete(oldestKey);
    }
  }

  cache.set(hash, {
    result,
    timestamp: Date.now(),
  });
}

/**
 * Clear expired entries from cache
 */
function clearExpired() {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > maxAge) {
      cache.delete(key);
    }
  }
}

/**
 * Clear entire cache
 */
function clear() {
  cache.clear();
}

/**
 * Get cache statistics
 * @returns {Object} { size, maxSize, maxAge }
 */
function getStats() {
  return {
    size: cache.size,
    maxSize,
    maxAgeMs: maxAge,
  };
}

module.exports = {
  generateHash,
  get,
  set,
  clearExpired,
  clear,
  getStats,
};
