/**
 * Redis Client
 *
 * Singleton Redis client for distributed locking, rate limiting, caching, and pub/sub.
 * Uses ioredis for stability and better connection handling.
 *
 * Features:
 * - Distributed locking (prevents "split brain" problem)
 * - Rate limiting with TTL (persists across restarts)
 * - Key-value caching with TTL
 * - Pub/Sub for multi-instance coordination
 * - User presence tracking
 * - Query result caching
 * - Graceful fallback if Redis is unavailable
 */

const Redis = require('ioredis');

// Configuration from environment
// Railway provides: REDIS_URL, REDISHOST, REDISPORT, REDISUSER, REDISPASSWORD
// Support both REDIS_URL (preferred) and individual variables
const REDIS_URL = process.env.REDIS_URL;
const REDIS_HOST = process.env.REDISHOST || process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDISPORT || process.env.REDIS_PORT || '6379', 10);
const REDIS_USER = process.env.REDISUSER || process.env.REDIS_USER;
const REDIS_PASSWORD = process.env.REDISPASSWORD || process.env.REDIS_PASSWORD;

// Build REDIS_URL from individual variables if not provided (Railway pattern)
// Skip REDIS_URL if it contains Railway template syntax (e.g., ${{REDISUSER}}) - those are for Railway only
// Also skip if REDIS_URL is incomplete (just "redis://" without host/port)
let effectiveRedisUrl = REDIS_URL;
if (effectiveRedisUrl && effectiveRedisUrl.includes('${{')) {
  // Railway template syntax detected - ignore REDIS_URL and use individual variables instead
  console.log(
    '⚠️  Redis: REDIS_URL contains Railway template syntax, using individual variables for local dev'
  );
  effectiveRedisUrl = null;
}
// Check if REDIS_URL is incomplete (just "redis://" or "rediss://" without host)
if (
  effectiveRedisUrl &&
  (effectiveRedisUrl === 'redis://' ||
    effectiveRedisUrl === 'rediss://' ||
    effectiveRedisUrl.match(/^redis(s)?:\/\/$/))
) {
  console.log('⚠️  Redis: REDIS_URL is incomplete, constructing from individual variables');
  effectiveRedisUrl = null;
}
if (!effectiveRedisUrl && REDIS_HOST && REDIS_PORT) {
  // Construct Redis URL from individual components
  const auth =
    REDIS_USER && REDIS_PASSWORD
      ? `${REDIS_USER}:${REDIS_PASSWORD}@`
      : REDIS_PASSWORD
        ? `:${REDIS_PASSWORD}@`
        : '';
  effectiveRedisUrl = `redis://${auth}${REDIS_HOST}:${REDIS_PORT}`;
}

// Check if Redis is configured
const isRedisConfigured = !!(effectiveRedisUrl || (REDIS_HOST && REDIS_PORT));

// Create client instance (lazy initialization)
let redisClient = null;
let isAvailable = false;

/**
 * Get or create the Redis client instance
 * @returns {Redis|null} Redis client instance or null if not configured
 */
function getClient() {
  if (!isRedisConfigured) {
    return null;
  }

  if (!redisClient) {
    try {
      // Build options object with lazyConnect to prevent auto-connection
      // This ensures error handlers are attached before connection attempts
      const baseOptions = {
        lazyConnect: true, // CRITICAL: Don't connect immediately
        retryStrategy: times => {
          // Exponential backoff: 50ms, 100ms, 200ms, 400ms, max 3s
          const delay = Math.min(times * 50, 3000);
          return delay;
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        connectionName: 'main-redis-client',
      };

      // If we have a URL, pass it as first arg with options as second
      // If no URL, use options object with host/port/etc
      if (effectiveRedisUrl) {
        // ioredis accepts: new Redis(url, options)
        redisClient = new Redis(effectiveRedisUrl, baseOptions);
      } else {
        // Use individual connection parameters
        redisClient = new Redis({
          ...baseOptions,
          host: REDIS_HOST,
          port: REDIS_PORT,
          username: REDIS_USER,
          password: REDIS_PASSWORD,
        });
      }

      // CRITICAL: Attach error handlers IMMEDIATELY after creation
      // This must happen before any connection attempt
      redisClient.on('error', err => {
        isAvailable = false;
        // Only log if error message exists (prevents empty error logs)
        if (err && err.message) {
          console.error('❌ Redis: Connection error:', err.message);
        }
        // Don't crash - Redis is optional for graceful degradation
      });

      redisClient.on('connect', () => {
        console.log('🔄 Redis: Connecting...');
      });

      redisClient.on('ready', () => {
        isAvailable = true;
        console.log('✅ Redis: Connected and ready');
      });

      redisClient.on('close', () => {
        isAvailable = false;
        console.log('⚠️  Redis: Connection closed');
      });

      redisClient.on('reconnecting', () => {
        console.log('🔄 Redis: Reconnecting...');
      });

      // Attempt to connect (non-blocking)
      redisClient.connect().catch(err => {
        console.warn('⚠️  Redis: Failed to connect (will retry):', err.message || 'Unknown error');
        isAvailable = false;
      });
    } catch (error) {
      console.error('❌ Redis: Failed to create client:', error.message);
      isAvailable = false;
      return null;
    }
  }

  return redisClient;
}

/**
 * Check if Redis is available and connected
 * @returns {boolean} True if Redis is available
 */
function isRedisAvailable() {
  return isAvailable && redisClient && redisClient.status === 'ready';
}

/**
 * Acquire a distributed lock
 * @param {string} key - Lock key (e.g., 'lock:message:123')
 * @param {number} ttlSeconds - Time to live in seconds (default: 30)
 * @returns {Promise<boolean>} True if lock was acquired, false if already locked
 */
async function acquireLock(key, ttlSeconds = 30) {
  if (!isRedisAvailable()) {
    // Fallback: if Redis is unavailable, allow operation (graceful degradation)
    console.warn(`⚠️  Redis unavailable, skipping lock for ${key}`);
    return true;
  }

  try {
    // SET key value EX ttl NX - only set if not exists, with expiration
    const result = await redisClient.set(`lock:${key}`, '1', 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  } catch (error) {
    console.error(`❌ Redis: Failed to acquire lock for ${key}:`, error.message);
    // Fail-open: if Redis fails, allow operation (better than blocking)
    return true;
  }
}

/**
 * Release a distributed lock
 * @param {string} key - Lock key
 * @returns {Promise<void>}
 */
async function releaseLock(key) {
  if (!isRedisAvailable()) {
    return;
  }

  try {
    await redisClient.del(`lock:${key}`);
  } catch (error) {
    console.error(`❌ Redis: Failed to release lock for ${key}:`, error.message);
    // Non-fatal - lock will expire anyway
  }
}

/**
 * Check rate limit for a key
 * @param {string} key - Rate limit key (e.g., 'rate_limit:room:123')
 * @param {number} maxRequests - Maximum requests allowed
 * @param {number} windowSeconds - Time window in seconds (default: 60)
 * @returns {Promise<{allowed: boolean, remaining: number, resetAt: number}>}
 */
async function checkRateLimit(key, maxRequests, windowSeconds = 60) {
  if (!isRedisAvailable()) {
    // Fallback: if Redis is unavailable, allow operation (graceful degradation)
    console.warn(`⚠️  Redis unavailable, skipping rate limit for ${key}`);
    return { allowed: true, remaining: maxRequests, resetAt: Date.now() + windowSeconds * 1000 };
  }

  try {
    const redisKey = `rate_limit:${key}`;
    const now = Date.now();
    const windowMs = windowSeconds * 1000;

    // Use Redis pipeline for atomic operations
    const pipeline = redisClient.pipeline();

    // Get current count
    pipeline.get(redisKey);

    // Increment and set expiration if key doesn't exist
    pipeline.incr(redisKey);
    pipeline.expire(redisKey, windowSeconds);

    const results = await pipeline.exec();

    if (!results || results.length < 3) {
      throw new Error('Redis pipeline failed');
    }

    // Get current count (before increment)
    const currentCount = parseInt(results[0][1] || '0', 10);
    const newCount = parseInt(results[1][1] || '1', 10);

    // Calculate reset time
    const ttl = await redisClient.ttl(redisKey);
    const resetAt = ttl > 0 ? now + ttl * 1000 : now + windowMs;

    const allowed = newCount <= maxRequests;
    const remaining = Math.max(0, maxRequests - newCount);

    return { allowed, remaining, resetAt, count: newCount };
  } catch (error) {
    console.error(`❌ Redis: Failed to check rate limit for ${key}:`, error.message);
    // Fail-open: if Redis fails, allow operation (better than blocking)
    return { allowed: true, remaining: maxRequests, resetAt: Date.now() + windowSeconds * 1000 };
  }
}

/**
 * Cache a value in Redis with TTL
 * @param {string} key - Cache key (will be prefixed with 'cache:')
 * @param {any} value - Value to cache (will be JSON stringified)
 * @param {number} ttlSeconds - Time to live in seconds (default: 3600 = 1 hour)
 * @returns {Promise<boolean>} True if cached successfully
 */
async function cacheSet(key, value, ttlSeconds = 3600) {
  if (!isRedisAvailable()) {
    return false;
  }

  try {
    const redisKey = `cache:${key}`;
    const serialized = JSON.stringify(value);
    await redisClient.setex(redisKey, ttlSeconds, serialized);
    return true;
  } catch (error) {
    console.error(`❌ Redis: Failed to cache ${key}:`, error.message);
    return false;
  }
}

/**
 * Get a cached value from Redis
 * @param {string} key - Cache key (will be prefixed with 'cache:')
 * @returns {Promise<any|null>} Cached value or null if not found/expired
 */
async function cacheGet(key) {
  if (!isRedisAvailable()) {
    return null;
  }

  try {
    const redisKey = `cache:${key}`;
    const serialized = await redisClient.get(redisKey);
    if (!serialized) {
      return null;
    }
    return JSON.parse(serialized);
  } catch (error) {
    console.error(`❌ Redis: Failed to get cache ${key}:`, error.message);
    return null;
  }
}

/**
 * Delete a cached value from Redis
 * @param {string} key - Cache key (will be prefixed with 'cache:')
 * @returns {Promise<boolean>} True if deleted successfully
 */
async function cacheDelete(key) {
  if (!isRedisAvailable()) {
    return false;
  }

  try {
    const redisKey = `cache:${key}`;
    await redisClient.del(redisKey);
    return true;
  } catch (error) {
    console.error(`❌ Redis: Failed to delete cache ${key}:`, error.message);
    return false;
  }
}

/**
 * Delete multiple cache keys matching a pattern
 * @param {string} pattern - Pattern to match (e.g., 'user:*')
 * @returns {Promise<number>} Number of keys deleted
 */
async function cacheDeletePattern(pattern) {
  if (!isRedisAvailable()) {
    return 0;
  }

  try {
    const fullPattern = `cache:${pattern}`;
    const stream = redisClient.scanStream({
      match: fullPattern,
      count: 100,
    });

    let deletedCount = 0;
    const keys = [];

    return new Promise((resolve, reject) => {
      stream.on('data', chunk => {
        keys.push(...chunk);
      });

      stream.on('end', async () => {
        if (keys.length > 0) {
          deletedCount = await redisClient.del(...keys);
        }
        resolve(deletedCount);
      });

      stream.on('error', reject);
    });
  } catch (error) {
    console.error(`❌ Redis: Failed to delete cache pattern ${pattern}:`, error.message);
    return 0;
  }
}

/**
 * Set user presence (online status)
 * @param {string} userId - User identifier (email or user ID)
 * @param {string} socketId - Socket ID
 * @param {Object} metadata - Optional metadata (roomId, etc.)
 * @param {number} ttlSeconds - Time to live in seconds (default: 300 = 5 minutes)
 * @returns {Promise<boolean>} True if set successfully
 */
async function setPresence(userId, socketId, metadata = {}, ttlSeconds = 300) {
  if (!isRedisAvailable()) {
    return false;
  }

  try {
    const presenceKey = `presence:${userId}:${socketId}`;
    const presenceData = {
      userId,
      socketId,
      ...metadata,
      lastSeen: Date.now(),
    };
    await redisClient.setex(presenceKey, ttlSeconds, JSON.stringify(presenceData));

    // Also maintain a set of all sockets for this user
    const userSocketsKey = `presence:user:${userId}`;
    await redisClient.sadd(userSocketsKey, socketId);
    await redisClient.expire(userSocketsKey, ttlSeconds);

    return true;
  } catch (error) {
    console.error(`❌ Redis: Failed to set presence for ${userId}:`, error.message);
    return false;
  }
}

/**
 * Remove user presence
 * @param {string} userId - User identifier
 * @param {string} socketId - Socket ID
 * @returns {Promise<boolean>} True if removed successfully
 */
async function removePresence(userId, socketId) {
  if (!isRedisAvailable()) {
    return false;
  }

  try {
    const presenceKey = `presence:${userId}:${socketId}`;
    await redisClient.del(presenceKey);

    const userSocketsKey = `presence:user:${userId}`;
    await redisClient.srem(userSocketsKey, socketId);

    // If no more sockets, remove the set
    const count = await redisClient.scard(userSocketsKey);
    if (count === 0) {
      await redisClient.del(userSocketsKey);
    }

    return true;
  } catch (error) {
    console.error(`❌ Redis: Failed to remove presence for ${userId}:`, error.message);
    return false;
  }
}

/**
 * Check if user is online
 * @param {string} userId - User identifier
 * @returns {Promise<boolean>} True if user has any active presence
 */
async function isUserOnline(userId) {
  if (!isRedisAvailable()) {
    return false;
  }

  try {
    const userSocketsKey = `presence:user:${userId}`;
    const count = await redisClient.scard(userSocketsKey);
    return count > 0;
  } catch (error) {
    console.error(`❌ Redis: Failed to check presence for ${userId}:`, error.message);
    return false;
  }
}

/**
 * Get all online users in a room
 * @param {string} roomId - Room ID
 * @returns {Promise<Array>} Array of user IDs who are online in this room
 */
async function getOnlineUsersInRoom(roomId) {
  if (!isRedisAvailable()) {
    return [];
  }

  try {
    const pattern = `presence:*:${roomId}`;
    const stream = redisClient.scanStream({
      match: `presence:*`,
      count: 100,
    });

    const onlineUsers = new Set();

    return new Promise((resolve, reject) => {
      stream.on('data', async chunk => {
        for (const key of chunk) {
          if (key.startsWith('presence:') && !key.startsWith('presence:user:')) {
            try {
              const data = await redisClient.get(key);
              if (data) {
                const presence = JSON.parse(data);
                if (presence.roomId === roomId) {
                  onlineUsers.add(presence.userId);
                }
              }
            } catch (err) {
              // Skip invalid entries
            }
          }
        }
      });

      stream.on('end', () => {
        resolve(Array.from(onlineUsers));
      });

      stream.on('error', reject);
    });
  } catch (error) {
    console.error(`❌ Redis: Failed to get online users for room ${roomId}:`, error.message);
    return [];
  }
}

/**
 * Create a Redis subscriber client for pub/sub
 * @returns {Redis|null} Subscriber client or null if Redis unavailable
 */
function createSubscriber() {
  if (!isRedisConfigured) {
    return null;
  }

  try {
    // Build options object with lazyConnect to prevent auto-connection
    const baseOptions = {
      lazyConnect: true, // CRITICAL: Don't connect immediately
      retryStrategy: times => {
        // Exponential backoff: 50ms, 100ms, 200ms, 400ms, max 3s
        const delay = Math.min(times * 50, 3000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      connectionName: 'redis-subscriber',
    };

    // If we have a URL, pass it as first arg with options as second
    // If no URL, use options object with host/port/etc
    let subscriber;
    if (effectiveRedisUrl) {
      // ioredis accepts: new Redis(url, options)
      subscriber = new Redis(effectiveRedisUrl, baseOptions);
    } else {
      // Use individual connection parameters
      subscriber = new Redis({
        ...baseOptions,
        host: REDIS_HOST,
        port: REDIS_PORT,
        username: REDIS_USER,
        password: REDIS_PASSWORD,
      });
    }

    // CRITICAL: Attach error handlers IMMEDIATELY after creation
    // This must happen before any connection attempt
    subscriber.on('error', err => {
      // Only log if error message exists (prevents empty error logs)
      if (err && err.message) {
        console.error('❌ Redis: Subscriber connection error:', err.message);
      }
      // Don't crash - Redis is optional for graceful degradation
    });

    subscriber.on('close', () => {
      console.log('⚠️  Redis: Subscriber connection closed');
    });

    subscriber.on('reconnecting', () => {
      console.log('🔄 Redis: Subscriber reconnecting...');
    });

    subscriber.on('ready', () => {
      console.log('✅ Redis: Subscriber connected and ready');
    });

    // Attempt to connect (non-blocking)
    subscriber.connect().catch(err => {
      console.warn(
        '⚠️  Redis: Subscriber failed to connect (will retry):',
        err.message || 'Unknown error'
      );
    });

    return subscriber;
  } catch (error) {
    console.error('❌ Redis: Failed to create subscriber:', error.message);
    return null;
  }
}

/**
 * Publish a message to a Redis channel
 * @param {string} channel - Channel name
 * @param {any} message - Message to publish (will be JSON stringified)
 * @returns {Promise<number>} Number of subscribers that received the message
 */
async function publish(channel, message) {
  if (!isRedisAvailable()) {
    return 0;
  }

  try {
    const serialized = JSON.stringify(message);
    const count = await redisClient.publish(channel, serialized);
    return count;
  } catch (error) {
    console.error(`❌ Redis: Failed to publish to ${channel}:`, error.message);
    return 0;
  }
}

/**
 * Close Redis connection gracefully
 * @returns {Promise<void>}
 */
async function close() {
  if (redisClient) {
    try {
      await redisClient.quit();
      isAvailable = false;
      console.log('✅ Redis: Connection closed gracefully');
    } catch (error) {
      console.error('❌ Redis: Error closing connection:', error.message);
    }
  }
}

module.exports = {
  getClient,
  isRedisAvailable,
  acquireLock,
  releaseLock,
  checkRateLimit,
  // Caching utilities
  cacheSet,
  cacheGet,
  cacheDelete,
  cacheDeletePattern,
  // Presence tracking
  setPresence,
  removePresence,
  isUserOnline,
  getOnlineUsersInRoom,
  // Pub/Sub
  createSubscriber,
  publish,
  close,
};
