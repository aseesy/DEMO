const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function clearDatabase() {
  let client;
  try {
    client = await pool.connect();
    console.log('🗑️  Clearing database...');

    const tables = [
      'notifications',
      'activities',
      'contacts',
      'tasks',
      'expenses',
      'agreements',
      'messages',
      'room_members',
      'rooms',
      'invitations',
      'users',
    ];

    // Truncate all tables with CASCADE to handle foreign keys
    const query = `TRUNCATE TABLE ${tables.join(', ')} CASCADE;`;

    await client.query(query);

    console.log('✅ Database cleared successfully!');
  } catch (err) {
    console.error('❌ Error clearing database:', err);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

clearDatabase();
