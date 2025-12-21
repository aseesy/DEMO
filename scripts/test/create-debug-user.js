require('dotenv').config({ path: '/Users/athenasees/Desktop/chat/chat-server/.env' });
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createDebugUser() {
  try {
    const email = 'debug@test.com';
    const password = 'password123456';
    const username = 'debuguser';
    const passwordHash = await bcrypt.hash(password, 10);

    await pool.query(
      'INSERT INTO users (email, username, password_hash, created_at, display_name, first_name) VALUES ($1, $2, $3, NOW(), $4, $5)',
      [email, username, passwordHash, 'Debug User', 'Debug']
    );
    console.log('✅ Debug user created');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

createDebugUser();
