require('dotenv').config();
const bcrypt = require('bcrypt');
const dbSafe = require('./dbSafe');

async function runTest() {
  const password = '1234512345';
  const saltRounds = 10;
  const generatedHash = await bcrypt.hash(password, saltRounds);
  console.log('Generated Hash:', generatedHash);

  // Create a temporary table for testing
  await dbSafe.safeInsert('users', {
    username: 'tempuser',
    email: 'temp@test.com',
    password_hash: generatedHash,
  });
  console.log('Inserted hash into temporary table');

  // Retrieve the hash
  const userResult = await dbSafe.safeSelect('users', { email: 'temp@test.com' }, { limit: 1 });
  const users = dbSafe.parseResult(userResult);
  const retrievedHash = users.length > 0 ? users[0].password_hash : 'User not found';
  console.log('Retrieved Hash:', retrievedHash);

  // Compare the hashes
  const isMatch = await bcrypt.compare(password, retrievedHash);
  console.log('Password comparison result:', isMatch);

  // Clean up: delete the temporary user
  await dbSafe.safeDelete('users', { email: 'temp@test.com' });
  console.log('Cleaned up temporary user');
}
runTest();
