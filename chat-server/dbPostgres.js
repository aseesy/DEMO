const pg = require('pg');

const { DATABASE_URL } = process.env;

let db;
let connectionReady = false;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set. PostgreSQL is required in all environments.');
  console.error('💡 In production: Add PostgreSQL service in Railway dashboard');
  console.error('💡 In development: Set DATABASE_URL environment variable');
  console.error('💡 Example: DATABASE_URL=postgresql://user:password@localhost:5432/dbname');
  // Dummy client that throws on queries with clear error
  db = {
    query: async () => {
      throw new Error('DATABASE_URL not configured. PostgreSQL is required in all environments.');
    },
  };
} else {
  console.log('🔄 Initializing PostgreSQL connection pool...');

  // Create pool with connection timeout and retry settings
  const pool = new pg.Pool({
    connectionString: DATABASE_URL,
    connectionTimeoutMillis: 10000, // 10 second timeout
    idleTimeoutMillis: 30000,
    max: 10,
    // Don't fail on startup if connection is slow
    allowExitOnIdle: true,
  });

  // Only log errors, not every connection (connect event fires for every new connection)
  pool.on('error', err => {
    console.error('❌ PostgreSQL pool error:', err.message);
    // Don't crash - just log the error
    connectionReady = false;
  });

  // Test connection in background (non-blocking)
  // This will log once when the pool is ready
  pool
    .query('SELECT 1')
    .then(() => {
      console.log('✅ PostgreSQL connection test passed');
      connectionReady = true;
    })
    .catch(err => {
      console.warn(
        '⚠️  PostgreSQL connection test failed (will retry on first query):',
        err.message
      );
      connectionReady = false;
    });

  db = pool;
}

// Export with connection status and compatibility functions
module.exports = Object.assign(db, {
  isReady: () => connectionReady,
  testConnection: async () => {
    if (!DATABASE_URL) return false;
    try {
      await db.query('SELECT 1');
      return true;
    } catch (err) {
      return false;
    }
  },
  // Compatibility functions for migration from SQLite
  getDb: async () => db, // Return the PostgreSQL pool
  saveDatabase: () => {
    // PostgreSQL auto-commits transactions, no manual save needed
    // This is a no-op for compatibility with old SQLite code
    return Promise.resolve();
  },
});
