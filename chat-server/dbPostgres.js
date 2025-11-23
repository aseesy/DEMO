const pg = require('pg');

const { DATABASE_URL } = process.env;

let db;
if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set. PostgreSQL client cannot be initialized.');
    // Dummy client that throws on queries
    db = {
        query: async () => {
            throw new Error('DATABASE_URL not configured');
        },
    };
} else {
    const pool = new pg.Pool({ connectionString: DATABASE_URL });
    pool.on('connect', () => console.log('✅ PostgreSQL pool connected'));
    db = pool;
}

module.exports = db;
