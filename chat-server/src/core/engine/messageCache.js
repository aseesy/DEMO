/**
 * Message Cache
 *
 * Hybrid cache for AI message analysis results (Redis + in-memory fallback).
 * Reduces redundant API calls for similar messages.
 * Uses Redis for multi-instance support, falls back to in-memory if Redis unavailable.
 *
 * @module liaizen/core/messageCache
 */

const crypto = require('crypto');
const { CACHE } = require('../../infrastructure/config/constants');
const { cacheGet, cacheSet, isRedisAvailable } = require('../../infrastructure/database/redisClient');

// In-memory fallback cache (used when Redis unavailable)
const memoryCache = new Map();
const maxAge = CACHE.MESSAGE_CACHE_TTL_MS;
const maxSize = CACHE.MESSAGE_CACHE_MAX_SIZE;
const ttlSeconds = Math.floor(maxAge / 1000); // Convert to seconds for Redis

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
 * Tries Redis first, falls back to in-memory cache
 *
 * @param {string} hash - Message hash
 * @returns {Promise<Object|null>} Cached result or null if not found/expired
 */
async function get(hash) {
  // Try Redis first (for multi-instance support)
  if (isRedisAvailable()) {
    try {
      const cached = await cacheGet(`message:${hash}`);
      if (cached) {
        // Also update in-memory cache for faster subsequent access
        memoryCache.set(hash, {
          result: cached,
          timestamp: Date.now(),
        });
        return cached;
      }
    } catch (error) {
      console.warn('[MessageCache] Redis get failed, falling back to memory:', error.message);
    }
  }

  // Fallback to in-memory cache
  const cached = memoryCache.get(hash);
  if (!cached) {
    return null;
  }

  // Check if cache entry is still valid
  const age = Date.now() - cached.timestamp;
  if (age > maxAge) {
    memoryCache.delete(hash);
    return null;
  }

  return cached.result;
}

/**
 * Store analysis result in cache
 * Stores in both Redis (for multi-instance) and in-memory (for fast access)
 *
 * @param {string} hash - Message hash
 * @param {Object} result - Analysis result to cache
 * @returns {Promise<void>}
 */
async function set(hash, result) {
  // Store in Redis first (for multi-instance support)
  if (isRedisAvailable()) {
    try {
      await cacheSet(`message:${hash}`, result, ttlSeconds);
    } catch (error) {
      console.warn('[MessageCache] Redis set failed, using memory only:', error.message);
    }
  }

  // Also store in in-memory cache (for fast access and fallback)
  // Enforce max cache size (LRU-like: remove oldest if at limit)
  if (memoryCache.size >= maxSize) {
    let oldestKey = null;
    let oldestTime = Infinity;

    for (const [key, value] of memoryCache.entries()) {
      if (value.timestamp < oldestTime) {
        oldestTime = value.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      memoryCache.delete(oldestKey);
    }
  }

  memoryCache.set(hash, {
    result,
    timestamp: Date.now(),
  });
}

/**
 * Clear expired entries from in-memory cache
 * (Redis handles expiration automatically)
 */
function clearExpired() {
  const now = Date.now();
  for (const [key, value] of memoryCache.entries()) {
    if (now - value.timestamp > maxAge) {
      memoryCache.delete(key);
    }
  }
}

/**
 * Clear entire cache (both Redis and in-memory)
 * @returns {Promise<void>}
 */
async function clear() {
  memoryCache.clear();
  
  if (isRedisAvailable()) {
    try {
      const { cacheDeletePattern } = require('../../infrastructure/database/redisClient');
      await cacheDeletePattern('message:*');
    } catch (error) {
      console.warn('[MessageCache] Failed to clear Redis cache:', error.message);
    }
  }
}

/**
 * Get cache statistics
 * @returns {Promise<Object>} { size, maxSize, maxAge, redisAvailable }
 */
async function getStats() {
  const stats = {
    memorySize: memoryCache.size,
    maxSize,
    maxAgeMs: maxAge,
    redisAvailable: isRedisAvailable(),
  };

  // Try to get Redis cache size (approximate)
  if (isRedisAvailable()) {
    try {
      const { cacheDeletePattern } = require('../../infrastructure/database/redisClient');
      // This is approximate - Redis doesn't have a direct count for pattern
      stats.redisAvailable = true;
    } catch (error) {
      // Ignore
    }
  }

  return stats;
}

module.exports = {
  generateHash,
  get,
  set,
  clearExpired,
  clear,
  getStats,
};
