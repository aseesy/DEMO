/**
 * Password Migration Script
 * 
 * This script migrates existing SHA-256 password hashes to bcrypt.
 * 
 * IMPORTANT: This script requires users to reset their passwords or
 * you'll need to contact users to provide their passwords for migration.
 * 
 * Since SHA-256 is a one-way hash, we cannot automatically convert
 * existing hashes to bcrypt. Users will need to log in with their
 * current password, which will then be hashed with bcrypt on next login.
 * 
 * Alternatively, you can:
 * 1. Force password reset for all users
 * 2. Set a temporary password and require users to change it
 * 3. Let users log in normally - their password will be re-hashed on next login
 * 
 * Usage: node migrate-passwords.js
 */

require('dotenv').config();
const db = require('./dbPostgres');
const auth = require('./auth');
const dbSafe = require('./dbSafe');

async function migratePasswords() {
  console.log('🔐 Password Migration Script');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Get all users from PostgreSQL
    const usersResult = await dbSafe.safeSelect('users', {}, {});
    const users = dbSafe.parseResult(usersResult);

    console.log(`Found ${users.length} users in database\n`);

    if (users.length === 0) {
      console.log('✅ No users to migrate.');
      return;
    }

    console.log('⚠️  IMPORTANT: SHA-256 hashes cannot be automatically converted to bcrypt.');
    console.log('   Users will need to log in with their current password.');
    console.log('   On successful login, their password will be re-hashed with bcrypt.\n');

    // Check which users have bcrypt hashes (start with $2a$, $2b$, or $2y$)
    const bcryptPattern = /^\$2[ayb]\$/;
    let bcryptCount = 0;
    let sha256Count = 0;

    users.forEach(user => {
      if (bcryptPattern.test(user.password_hash)) {
        bcryptCount++;
      } else {
        sha256Count++;
      }
    });

    console.log(`📊 Current Status:`);
    console.log(`   - Users with bcrypt: ${bcryptCount}`);
    console.log(`   - Users with SHA-256: ${sha256Count}\n`);

    if (bcryptCount === users.length) {
      console.log('✅ All users already have bcrypt hashes!');
      return;
    }

    console.log('💡 Migration Strategy:');
    console.log('   1. Users with SHA-256 hashes will be migrated on next login');
    console.log('   2. The authenticateUser function now uses bcrypt.compare()');
    console.log('   3. When a user logs in, their password is checked against SHA-256');
    console.log('   4. If valid, their password is re-hashed with bcrypt and stored');
    console.log('   5. This happens automatically - no action needed from users\n');

    console.log('⚠️  Note: This script does NOT modify existing passwords.');
    console.log('   Passwords will be migrated automatically on next successful login.\n');

    console.log('✅ Migration setup complete!');
    console.log('   The authentication system will handle password migration automatically.');

  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  }
}

// Run migration
migratePasswords()
  .then(() => {
    console.log('\n✅ Migration script completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });

