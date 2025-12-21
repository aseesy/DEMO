// Quick script to create a test user for login testing
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createTestUser() {
  try {
    const email = 'test@example.com';
    const password = 'testpassword123';
    const username = 'testuser';

    // Check if user exists
    const checkResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (checkResult.rows.length > 0) {
      console.log('✅ Test user already exists');
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (email, username, password_hash, created_at) 
       VALUES ($1, $2, $3, NOW()) 
       RETURNING id, username, email`,
      [email, username, passwordHash]
    );

    console.log('✅ Test user created:');
    console.log(`   Email: ${email}`);
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);
    console.log(`   ID: ${result.rows[0].id}`);
  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
  } finally {
    await pool.end();
  }
}

createTestUser();
