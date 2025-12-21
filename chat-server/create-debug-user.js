require('dotenv').config();
const auth = require('./auth');
const db = require('./dbPostgres');

async function createDebugUser() {
  try {
    const email = 'debug@test.com';
    const password = 'password123456';
    const context = {};
    const nameData = { firstName: 'Debug', displayName: 'Debug User' };

    // Check if user exists
    const existing = await auth.getUser('debuguser');
    if (existing) {
      console.log('✅ Debug user already exists');
      return;
    }

    const user = await auth.createUserWithEmail(email, password, context, null, null, nameData);
    console.log('✅ Debug user created:', user.id);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    process.exit(0);
  }
}

createDebugUser();
