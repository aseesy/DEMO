/**
 * Script to find a user by email or username
 * Usage: node find-user.js yashir91lora@gmail.com
 */

require('dotenv').config({ override: true });
const dbSafe = require('./dbSafe');

async function findUser(emailOrUsername) {
  try {
    const searchTerm = emailOrUsername.trim().toLowerCase();
    console.log(`🔍 Searching for user: ${searchTerm}`);

    // Try by email first
    let result = await dbSafe.safeSelect('users', { email: searchTerm }, { limit: 10 });
    let users = result;

    if (users.length === 0) {
      // Try by username
      result = await dbSafe.safeSelect('users', { username: searchTerm }, { limit: 10 });
      users = result;
    }

    if (users.length === 0) {
      // Try partial match on email
      const allUsers = await dbSafe.safeSelect('users', {}, { limit: 1000 });
      users = allUsers.filter(u => 
        (u.email && u.email.toLowerCase().includes(searchTerm)) ||
        (u.username && u.username.toLowerCase().includes(searchTerm))
      );
    }

    if (users.length === 0) {
      console.log(`❌ No user found with email or username containing: ${searchTerm}`);
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

const searchTerm = process.argv[2];

if (!searchTerm) {
  console.log('Usage: node find-user.js <email-or-username>');
  console.log('Example: node find-user.js yashir91lora@gmail.com');
  process.exit(1);
}

findUser(searchTerm);

