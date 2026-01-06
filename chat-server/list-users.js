/**
 * Script to list all users in the database
 * Usage: node list-users.js
 */

require('dotenv').config({ override: true });
const dbSafe = require('./dbSafe');

async function listUsers() {
  try {
    console.log(`🔍 Fetching all users...`);

    const result = await dbSafe.safeSelect('users', {}, { limit: 1000 });
    const users = result;

    if (users.length === 0) {
      console.log(`❌ No users found in database`);
      return;
    }

    console.log(`\n✅ Found ${users.length} user(s):\n`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. Username: ${user.username}`);
      console.log(`   Email: ${user.email || '(no email)'}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Has password: ${!!user.password_hash}`);
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

listUsers();

