/**
 * Database Initialization
 *
 * Single Responsibility: Initialize database connections.
 *
 * Handles:
 * - PostgreSQL connection initialization
 * - Connection status reporting
 * - Error handling (non-blocking)
 */

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
    require('../../dbPostgres');
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

  return { dbConnected, dbError };
}

module.exports = {
  initDatabase,
};
