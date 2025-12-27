/**
 * One-off password reset script
 * This script will be executed by Railway and uses Railway's DATABASE_URL
 * Run with: railway run node scripts/reset-password-oneoff.js
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

// Railway automatically provides DATABASE_URL in the environment
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('❌ DATABASE_URL not set');
  process.exit(1);
}

// Hardcoded values for this one-off execution
const email = 'yashir91lora@gmail.com';
const newPassword = '1234512345';

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
    console.log(`\n🔐 Hashing new password...`);
    const passwordHash = await bcrypt.hash(newPassword, 12);
    console.log(`✅ Password hashed`);

    // Update password
    console.log(`\n💾 Updating password in database...`);
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [passwordHash, user.id]
    );
    console.log(`✅ Password updated successfully!`);

    // Verify
    const isValid = await bcrypt.compare(newPassword, passwordHash);
    if (isValid) {
      console.log(`\n✅✅✅ PASSWORD RESET SUCCESSFUL! ✅✅✅`);
      console.log(`\n📝 Login credentials:`);
      console.log(`   Email: ${emailLower}`);
      console.log(`   Password: ${newPassword}`);
    }

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    await pool.end();
    process.exit(1);
  }
}

resetPassword();

