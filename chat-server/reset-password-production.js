/**
 * Script to reset password for a user in PRODUCTION
 * Usage: DATABASE_URL="postgresql://..." node reset-password-production.js yashir91lora@gmail.com 1234512345
 * 
 * To get production DATABASE_URL:
 * 1. Go to Railway Dashboard
 * 2. Click on PostgreSQL service
 * 3. Go to Connect tab
 * 4. Copy the Connection URL (public URL, not internal)
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

// Use DATABASE_URL from environment (should be production URL)
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('❌ DATABASE_URL not set');
  console.log('\n📝 To reset password in production:');
  console.log('   1. Get DATABASE_URL from Railway Dashboard → PostgreSQL → Connect tab');
  console.log('   2. Run: DATABASE_URL="postgresql://..." node reset-password-production.js <email> <password>');
  console.log('\n   Example:');
  console.log('   DATABASE_URL="postgresql://postgres:PASSWORD@autorack.proxy.rlwy.net:38017/railway" \\');
  console.log('   node reset-password-production.js yashir91lora@gmail.com 1234512345');
  process.exit(1);
}

// For Railway internal URLs, we need to use the public URL instead
// Railway CLI injects internal URL which doesn't work from local machine
let connectionString = dbUrl;
if (dbUrl && dbUrl.includes('railway.internal')) {
  console.log('⚠️  Detected Railway internal URL - this won\'t work from local machine');
  console.log('   Please use the public DATABASE_URL from Railway Dashboard');
  console.log('   Or run this script directly on Railway infrastructure');
  process.exit(1);
}

const pool = new Pool({
  connectionString: connectionString,
  ssl: connectionString.includes('railway') || connectionString.includes('rlwy.net') 
    ? { rejectUnauthorized: false } 
    : false,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
});

async function resetPassword(email, newPassword) {
  try {
    const emailLower = email.trim().toLowerCase();
    console.log(`🔍 Resetting password for: ${emailLower}`);
    console.log(`🌐 Database: ${dbUrl.includes('railway') ? 'PRODUCTION (Railway)' : 'Unknown'}\n`);

    // Get user
    const result = await pool.query(
      'SELECT id, username, email, password_hash FROM users WHERE LOWER(email) = $1 LIMIT 1',
      [emailLower]
    );

    if (result.rows.length === 0) {
      console.log(`❌ No user found with email: ${emailLower}`);
      await pool.end();
      return;
    }

    const user = result.rows[0];
    console.log(`✅ User found: ${user.username} (id: ${user.id})`);
    console.log(`📧 Email: ${user.email}`);

    // Hash the new password
    console.log(`\n🔐 Hashing new password...`);
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    console.log(`✅ Password hashed successfully`);
    console.log(`🔑 Hash preview: ${passwordHash.substring(0, 30)}...`);

    // Update password
    console.log(`\n💾 Updating password in database...`);
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [passwordHash, user.id]
    );
    console.log(`✅ Password updated successfully!`);

    // Verify the new password works
    console.log(`\n🔍 Verifying new password...`);
    const isValid = await bcrypt.compare(newPassword, passwordHash);

    if (isValid) {
      console.log(`\n✅✅✅ PASSWORD RESET SUCCESSFUL! ✅✅✅`);
      console.log(`\n📝 You can now log in with:`);
      console.log(`   Email: ${emailLower}`);
      console.log(`   Password: ${newPassword}`);
    } else {
      console.log(`\n❌ Verification failed (this shouldn't happen!)`);
    }

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

// Get args
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log('Usage: DATABASE_URL="..." node reset-password-production.js <email> <new-password>');
  console.log('Example: DATABASE_URL="postgresql://..." node reset-password-production.js yashir91lora@gmail.com 1234512345');
  process.exit(1);
}

resetPassword(email, password);

