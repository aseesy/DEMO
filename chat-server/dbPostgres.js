const pg = require('pg');

const { DATABASE_URL } = process.env;

let db;
let connectionReady = false;

if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set. PostgreSQL client cannot be initialized.');
    // Dummy client that throws on queries
    db = {
        query: async () => {
            throw new Error('DATABASE_URL not configured');
        },
    };
} else {
    // Create pool with connection timeout and retry settings
    const pool = new pg.Pool({ 
        connectionString: DATABASE_URL,
        connectionTimeoutMillis: 5000, // 5 second timeout
        idleTimeoutMillis: 30000,
        max: 10,
        // Don't fail on startup if connection is slow
        allowExitOnIdle: true
    });
    
    pool.on('connect', () => {
        console.log('✅ PostgreSQL pool connected');
        connectionReady = true;
    });
    
    pool.on('error', (err) => {
        console.error('❌ PostgreSQL pool error:', err.message);
        // Don't crash - just log the error
        connectionReady = false;
    });
    
    // Test connection in background (non-blocking)
    pool.query('SELECT 1').then(() => {
        console.log('✅ PostgreSQL connection test passed');
        connectionReady = true;
    }).catch(err => {
        console.warn('⚠️  PostgreSQL connection test failed (will retry on first query):', err.message);
        connectionReady = false;
    });
    
    db = pool;
}

// Export with connection status
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
    }
});
