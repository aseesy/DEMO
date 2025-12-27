/**
 * Password reset script for Railway
 * Run with: railway run node scripts/reset-password-railway.js <email> <password>
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log('Usage: railway run node scripts/reset-password-railway.js <email> <password>');
  process.exit(1);
}

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('❌ DATABASE_URL not set');
  process.exit(1);
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: dbUrl.includes('railway') || dbUrl.includes('rlwy.net') 
    ? { rejectUnauthorized: false } 
    : false,
});

async function resetPassword() {
  try {
    const emailLower = email.trim().toLowerCase();
    console.log(`🔍 Resetting password for: ${emailLower}\n`);

    // Get user
    const result = await pool.query(
      'SELECT id, username, email FROM users WHERE LOWER(email) = $1 LIMIT 1',
      [emailLower]
    );

    if (result.rows.length === 0) {
      console.log(`❌ No user found with email: ${emailLower}`);
      await pool.end();
      process.exit(1);
    }

    const user = result.rows[0];
    console.log(`✅ User found: ${user.username} (id: ${user.id})`);

    // Hash the new password
    const passwordHash = await bcrypt.hash(password, 12);

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [passwordHash, user.id]
    );
    console.log(`✅ Password updated successfully!`);

    // Verify
    const isValid = await bcrypt.compare(password, passwordHash);
    if (isValid) {
      console.log(`\n✅✅✅ PASSWORD RESET SUCCESSFUL! ✅✅✅`);
      console.log(`\n📝 Login credentials:`);
      console.log(`   Email: ${emailLower}`);
      console.log(`   Password: ${password}`);
    }

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

resetPassword();

