/**
 * User Management Logic
 */
const dbSafe = require('../dbSafe');
const neo4jClient = require('../src/utils/neo4jClient');
const { generateUsernameSuffix, createRegistrationError, RegistrationError } = require('./utils');
const { setupUserContextAndRoom } = require('./context');
const { createWelcomeAndOnboardingTasks } = require('./tasks');

async function getUser(username) {
  try {
    const userResult = await dbSafe.safeSelect(
      'users',
      { username: username.toLowerCase() },
      { limit: 1 }
    );
    const users = dbSafe.parseResult(userResult);
    if (users.length === 0) return null;

    const user = users[0];
    
    // Get user context
    const contextResult = await dbSafe.safeSelect('user_context', { user_id: String(user.id) }, { limit: 1 });
    const contextRows = dbSafe.parseResult(contextResult);
    
    const defaultContext = {
      coParentName: '',
      children: [],
      concerns: [],
      newPartner: { name: '', livesWith: false },
    };

    if (contextRows.length > 0) {
      const data = contextRows[0];
      try {
        user.context = {
          coParentName: data.co_parent || '',
          children: typeof data.children === 'string' ? JSON.parse(data.children) : data.children || [],
          concerns: typeof data.contacts === 'string' ? JSON.parse(data.contacts) : data.contacts || [],
          newPartner: { name: '', livesWith: false },
        };
      } catch (err) {
        console.error('Error parsing user context:', err);
        user.context = defaultContext;
      }
    } else {
      user.context = defaultContext;
    }

    // Get room
    const roomResult = await dbSafe.safeSelect('room_members', { user_id: user.id }, { limit: 1 });
    const roomMembers = dbSafe.parseResult(roomResult);

    if (roomMembers.length > 0) {
      const roomRes = await dbSafe.safeSelect(
        'rooms',
        { id: roomMembers[0].room_id },
        { limit: 1 }
      );
      const rooms = dbSafe.parseResult(roomRes);
      if (rooms.length > 0) {
        user.room = { roomId: rooms[0].id, roomName: rooms[0].name };
      }
    }
    return user;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

async function userExists(username) {
  const usernameLower = username.toLowerCase();
  const result = await dbSafe.safeSelect('users', { username: usernameLower }, { limit: 1 });
  const users = dbSafe.parseResult(result);
  return users.length > 0;
}

async function generateUniqueUsername(baseEmail) {
  const baseName = baseEmail
    .split('@')[0]
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();
  let username = baseName.substring(0, 15);
  let attempts = 0;

  while (attempts < 10) {
    const check = await dbSafe.safeSelect('users', { username }, { limit: 1 });
    if (dbSafe.parseResult(check).length === 0) return username;
    username = `${baseName.substring(0, 10)}${generateUsernameSuffix()}`;
    attempts++;
  }
  return null;
}

async function createUser(
  username,
  password,
  context = {},
  email = null,
  googleId = null,
  oauthProvider = null,
  nameData = {}
) {
  const usernameLower = username.toLowerCase();
  const now = new Date().toISOString();

  const userData = {
    username: usernameLower,
    password_hash: password,
    email: email ? email.trim().toLowerCase() : null,
    google_id: googleId,
    created_at: now,
    first_name: nameData.firstName || null,
    display_name: nameData.displayName || nameData.firstName || null,
  };

  if (oauthProvider) userData.oauth_provider = oauthProvider;

  let userId;
  try {
    userId = await dbSafe.safeInsert('users', userData);
  } catch (err) {
    if (err.code === '23505') {
      if (err.constraint?.includes('username')) {
        const usernameError = new Error('Username already exists');
        usernameError.code = 'USERNAME_CONFLICT';
        throw usernameError;
      }
      if (err.constraint?.includes('email'))
        throw createRegistrationError(RegistrationError.EMAIL_EXISTS);
    }
    throw err;
  }

  const { context: contextData, room } = await setupUserContextAndRoom(
    userId,
    usernameLower,
    context
  );
  await createWelcomeAndOnboardingTasks(userId, usernameLower);

  neo4jClient
    .createUserNode(userId, usernameLower, userData.email, userData.display_name)
    .catch(() => {});

  return {
    id: userId,
    username: usernameLower,
    email: userData.email,
    context: contextData,
    room,
    firstName: userData.first_name,
    displayName: userData.display_name,
  };
}

module.exports = {
  getUser,
  userExists,
  generateUniqueUsername,
  createUser,
};
