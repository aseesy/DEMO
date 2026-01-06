/**
 * Database Initialization
 *
 * Single Responsibility: Initialize database connections.
 *
 * Handles:
 * - PostgreSQL connection initialization
 * - Redis connection initialization (optional)
 * - Connection status reporting
 * - Error handling (non-blocking)
 */

/**
 * Initialize Redis connection (optional)
 *
 * @returns {Promise<Object>} { redisConnected: boolean, redisError: string|null }
 */
async function initRedis() {
  let redisConnected = false;
  let redisError = null;

  try {
    const { getClient, isRedisAvailable } = require('../../database/redisClient');
    const client = getClient();

    if (!client) {
      // Redis not configured - this is OK, it's optional
      console.log('ℹ️  Redis: Not configured (optional for distributed locking and rate limiting)');
      return { redisConnected: false, redisError: null };
    }

    // Try to connect and verify
    if (client.status === 'ready') {
      redisConnected = true;
      console.log('✅ Redis: Connected and ready');
    } else {
      // Client exists but not ready - will connect asynchronously
      // Wait a moment to see if connection succeeds
      await new Promise(resolve => setTimeout(resolve, 500));
      if (isRedisAvailable()) {
        redisConnected = true;
        console.log('✅ Redis: Connected and ready');
      } else {
        console.log('⚠️  Redis: Connection in progress (will be available when ready)');
        // Don't mark as error - connection might succeed later
      }
    }
  } catch (err) {
    redisError = err.message;
    console.warn('⚠️  Redis: Initialization warning (non-fatal):', err.message);
    // Don't throw - Redis is optional
  }

  return { redisConnected, redisError };
}

/**
 * Initialize PostgreSQL connection
 *
 * @returns {Promise<Object>} { dbConnected: boolean, dbError: string|null }
 */
async function initDatabase() {
  let dbConnected = false;
  let dbError = null;

  if (!process.env.DATABASE_URL) {
    console.error('❌ WARNING: DATABASE_URL not set!');
    console.error('⚠️  PostgreSQL is required for full functionality.');
    console.error('💡 Add PostgreSQL service in Railway dashboard to get DATABASE_URL');
    // Don't return error - allow server to start without database
    // Database will be unavailable but server can still respond to health checks
    return { dbConnected: false, dbError: 'DATABASE_URL not configured' };
  }

  console.log('🐘 PostgreSQL mode: DATABASE_URL detected');

  try {
    // Initialize PostgreSQL client (non-blocking)
    // Connection pool is created but connection test happens asynchronously
    // Path: from src/infrastructure/initialization/ -> ../../../dbPostgres (chat-server root)
    require('../../../dbPostgres');
    // Mark as connected immediately - actual connection test happens in background
    // This allows server to start even if database is slow to connect
    dbConnected = true;
    console.log('📊 Using PostgreSQL database (connection testing in background)');
  } catch (err) {
    dbError = err.message;
    console.error('❌ Database initialization error:', err.message);
    // Don't throw - allow server to start even if database fails
    // Health check will report database status but server stays up
  }

  // Initialize Redis (optional, non-blocking)
  const { redisConnected, redisError } = await initRedis();

  return {
    dbConnected,
    dbError,
    redisConnected,
    redisError,
  };
}

module.exports = {
  initDatabase,
};
