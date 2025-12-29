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
    return await getUser(user.email);
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
      return await getUser(user.email);
    }
  }

  // Create new user with email (no username needed)
  if (!email) {
    throw new Error('Email is required for OAuth user creation');
  }

  // Parse Google name into first_name and last_name
  // Google provides full name as a single string, so we split it
  let firstName = '';
  let lastName = '';
  let displayName = name || '';

  if (name) {
    const nameParts = name.trim().split(/\s+/);
    if (nameParts.length === 1) {
      // Only one name provided - use as first name
      firstName = nameParts[0];
    } else if (nameParts.length >= 2) {
      // Multiple parts - first is first name, rest is last name
      firstName = nameParts[0];
      lastName = nameParts.slice(1).join(' ');
    }
    // displayName is already set to full name
  }

  return await createUser(email, null, {}, googleId, 'google', {
    firstName: firstName || null,
    lastName: lastName || null,
    displayName: displayName || null,
  });
}

async function getUserByGoogleId(googleId) {
  const result = await dbSafe.safeSelect('users', { google_id: googleId }, { limit: 1 });
  const users = dbSafe.parseResult(result);
  if (users.length === 0) return null;
  return await getUser(users[0].email);
}

module.exports = {
  getOrCreateGoogleUser,
  getUserByGoogleId,
};

