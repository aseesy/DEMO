/**
 * Script to create a new user account
 * Usage: node create-user.js yashir91lora@gmail.com 1234512345
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const dbSafe = require('./dbSafe');
const { generateUniqueUsername } = require('./auth/user');

async function createUser(email, password) {
  try {
    const emailLower = email.trim().toLowerCase();
    console.log(`🔍 Creating user with email: ${emailLower}`);

    // Check if user already exists
    const existingResult = await dbSafe.safeSelect('users', { email: emailLower }, { limit: 1 });
    const existingUsers = existingResult;

    if (existingUsers.length > 0) {
      console.log(`❌ User already exists with email: ${emailLower}`);
      console.log(`   Username: ${existingUsers[0].username}`);
      console.log(`   ID: ${existingUsers[0].id}`);
      return;
    }

    // Generate unique username
    console.log(`\n📝 Generating unique username...`);
    const username = await generateUniqueUsername(emailLower);
    console.log(`✅ Username: ${username}`);

    // Hash the password
    console.log(`\n🔐 Hashing password...`);
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    console.log(`✅ Password hashed successfully`);

    // Create user
    console.log(`\n💾 Creating user in database...`);
    const userData = {
      username: username,
      email: emailLower,
      password_hash: passwordHash,
      created_at: new Date().toISOString(),
    };

    const insertResult = await dbSafe.safeInsert('users', userData);
    const userId = insertResult.id || insertResult[0]?.id;
    
    console.log(`✅ User created successfully!`);
    console.log(`   Username: ${username}`);
    console.log(`   Email: ${emailLower}`);
    console.log(`   ID: ${userId}`);

    // Verify the password works
    console.log(`\n🔍 Verifying password...`);
    const isValid = await bcrypt.compare(password, passwordHash);

    if (isValid) {
      console.log(`\n✅✅✅ USER CREATED SUCCESSFULLY! ✅✅✅`);
      console.log(`\n📝 You can now log in with:`);
      console.log(`   Email: ${emailLower}`);
      console.log(`   Password: ${password}`);
    } else {
      console.log(`\n❌ Verification failed (this shouldn't happen!)`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log('Usage: node create-user.js <email> <password>');
  console.log('Example: node create-user.js yashir91lora@gmail.com 1234512345');
  process.exit(1);
}

createUser(email, password);

