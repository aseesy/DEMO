/**
 * OAuth Management Logic
 */
const dbSafe = require('../dbSafe');
const { getUser, createUser } = require('./user');

async function getOrCreateGoogleUser(googleId, email, name, picture = null) {
  const googleUserResult = await dbSafe.safeSelect('users', { google_id: googleId }, { limit: 1 });
  const googleUsers = dbSafe.parseResult(googleUserResult);

  if (googleUsers.length > 0) {
    const user = googleUsers[0];
    await dbSafe.safeUpdate('users', { last_login: new Date().toISOString() }, { id: user.id });
    return await getUser(user.username);
  }

  if (email) {
    const emailLower = email.trim().toLowerCase();
    const emailUserResult = await dbSafe.safeSelect('users', { email: emailLower }, { limit: 1 });
    const emailUsers = dbSafe.parseResult(emailUserResult);

    if (emailUsers.length > 0) {
      const user = emailUsers[0];
      await dbSafe.safeUpdate(
        'users',
        {
          google_id: googleId,
          oauth_provider: 'google',
          last_login: new Date().toISOString(),
        },
        { id: user.id }
      );
      return await getUser(user.username);
    }
  }

  let username = name || email?.split('@')[0] || `user${Date.now()}`;
  username = username
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 20);

  let uniqueUsername = username;
  let counter = 1;
  while (true) {
    const existing = await dbSafe.safeSelect('users', { username: uniqueUsername }, { limit: 1 });
    if (dbSafe.parseResult(existing).length === 0) break;
    uniqueUsername = `${username}${counter}`.substring(0, 20);
    counter++;
  }

  return await createUser(uniqueUsername, null, {}, email, googleId, 'google', {
    firstName: name,
    displayName: name,
  });
}

async function getUserByGoogleId(googleId) {
  const result = await dbSafe.safeSelect('users', { google_id: googleId }, { limit: 1 });
  const users = dbSafe.parseResult(result);
  if (users.length === 0) return null;
  return await getUser(users[0].username);
}

module.exports = {
  getOrCreateGoogleUser,
  getUserByGoogleId,
};

