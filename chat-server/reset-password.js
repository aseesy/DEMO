/**
 * Script to reset password for a user
 * Usage: node reset-password.js mom@test.com 123123
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const dbSafe = require('./dbSafe');

async function resetPassword(email, newPassword) {
  try {
    const emailLower = email.trim().toLowerCase();
    console.log(`🔍 Resetting password for: ${emailLower}`);

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

    // Hash the new password
    console.log(`\n🔐 Hashing new password...`);
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    console.log(`✅ Password hashed successfully`);
    console.log(`🔑 Hash preview: ${passwordHash.substring(0, 30)}...`);

    // Update password
    console.log(`\n💾 Updating password in database...`);
    await dbSafe.safeUpdate('users', { password_hash: passwordHash }, { id: user.id });
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

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Get args
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log('Usage: node reset-password.js <email> <new-password>');
  console.log('Example: node reset-password.js mom@test.com 123123');
  process.exit(1);
}

resetPassword(email, password);
