/**
 * Script to check password for a user
 * Usage: node check-password.js mom@test.com 123123
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const dbSafe = require('./dbSafe');

async function checkPassword(email, password) {
  try {
    const emailLower = email.trim().toLowerCase();
    console.log(`🔍 Checking password for: ${emailLower}`);
    
    // Get user
    const result = await dbSafe.safeSelect('users', { email: emailLower }, { limit: 1 });
    const users = result;
    
    if (users.length === 0) {
      console.log(`❌ No user found with email: ${emailLower}`);
      return;
    }
    
    const user = users[0];
    console.log(`✅ User found: ${user.username} (id: ${user.id})`);
    console.log(`📧 Email: ${user.email}`);
    console.log(`🔑 Password hash exists: ${!!user.password_hash}`);
    
    if (!user.password_hash) {
      console.log(`❌ User has no password_hash`);
      return;
    }
    
    // Check hash type
    const isBcryptHash = /^\$2[ayb]\$/.test(user.password_hash);
    console.log(`🔑 Hash type: ${isBcryptHash ? 'bcrypt' : 'legacy SHA-256'}`);
    console.log(`🔑 Hash preview: ${user.password_hash.substring(0, 20)}...`);
    
    // Test password
    let isValid = false;
    
    if (isBcryptHash) {
      console.log(`\n🔐 Testing with bcrypt...`);
      isValid = await bcrypt.compare(password, user.password_hash);
      console.log(`✅ Bcrypt comparison result: ${isValid ? 'VALID' : 'INVALID'}`);
    } else {
      console.log(`\n🔐 Testing with SHA-256 (legacy)...`);
      const crypto = require('crypto');
      const sha256Hash = crypto.createHash('sha256').update(password).digest('hex');
      isValid = sha256Hash === user.password_hash;
      console.log(`✅ SHA-256 comparison result: ${isValid ? 'VALID' : 'INVALID'}`);
      console.log(`   Input hash: ${sha256Hash.substring(0, 20)}...`);
      console.log(`   Stored hash: ${user.password_hash.substring(0, 20)}...`);
    }
    
    if (isValid) {
      console.log(`\n✅✅✅ PASSWORD IS CORRECT! ✅✅✅`);
    } else {
      console.log(`\n❌❌❌ PASSWORD IS INCORRECT ❌❌❌`);
      console.log(`\n💡 Possible issues:`);
      console.log(`   - Password might be different than expected`);
      console.log(`   - Hash might be corrupted`);
      console.log(`   - Try resetting the password`);
    }
    
    process.exit(isValid ? 0 : 1);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Get args
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log('Usage: node check-password.js <email> <password>');
  console.log('Example: node check-password.js mom@test.com 123123');
  process.exit(1);
}

checkPassword(email, password);

