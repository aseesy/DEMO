const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function reset() {
  const email = 'dad@test.com';
  const password = 'TestPass123!';

  const hash = await bcrypt.hash(password, 10);
  console.log('Generated hash:', hash.substring(0, 30) + '...');

  const result = await pool.query(
    'UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING id, email',
    [hash, email]
  );

  if (result.rows.length > 0) {
    console.log('Updated user:', result.rows[0].email);

    // Verify it worked
    const check = await pool.query('SELECT password_hash FROM users WHERE email = $1', [email]);
    const matches = await bcrypt.compare(password, check.rows[0].password_hash);
    console.log('Verification:', matches ? 'SUCCESS' : 'FAILED');
  } else {
    console.log('User not found');
  }

  await pool.end();
}

reset();
