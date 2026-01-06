/**
 * User Management Logic
 */
const dbSafe = require('../dbSafe');
const neo4jClient = require('../src/infrastructure/database/neo4jClient');
const { generateUsernameSuffix, createRegistrationError, RegistrationError } = require('./utils');
const { setupUserContextAndRoom } = require('./context');
const { createWelcomeAndOnboardingTasks } = require('./tasks');

async function getUser(email) {
  try {
    const emailLower = email.trim().toLowerCase();
    console.log('[getUser] Looking up user by email:', emailLower);
    const userResult = await dbSafe.safeSelect('users', { email: emailLower }, { limit: 1 });
    console.log('[getUser] Query result:', userResult);
    const users = dbSafe.parseResult(userResult);
    console.log('[getUser] Parsed users:', users.length > 0 ? 'found' : 'NOT FOUND');
    if (users.length === 0) return null;

    const user = users[0];

    // Get user context (using email instead of username)
    const contextResult = await dbSafe.safeSelect(
      'user_context',
      { user_email: emailLower },
      { limit: 1 }
    );
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
          children:
            typeof data.children === 'string' ? JSON.parse(data.children) : data.children || [],
          concerns:
            typeof data.contacts === 'string' ? JSON.parse(data.contacts) : data.contacts || [],
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

/**
 * Check if a user exists by email
 *
 * @param {string} email - Email address
 * @returns {Promise<boolean>} True if user exists
 */
async function userExists(email) {
  if (!email) return false;

  const emailLower = email.trim().toLowerCase();
  const result = await dbSafe.safeSelect('users', { email: emailLower }, { limit: 1 });
  const users = dbSafe.parseResult(result);
  return users.length > 0;
}

// Deprecated: No longer needed since we use email as primary identifier
// Keeping for backward compatibility during migration
async function generateUniqueUsername(baseEmail) {
  // Return null to indicate username generation is no longer used
  // Email is now the primary identifier
  return null;
}

async function createUser(
  email,
  password,
  context = {},
  googleId = null,
  oauthProvider = null,
  nameData = {}
) {
  if (!email) {
    throw new Error('Email is required');
  }

  const emailLower = email.trim().toLowerCase();
  const now = new Date().toISOString();

  // Create user with email as primary identifier (no username)
  const userData = {
    password_hash: password,
    email: emailLower,
    google_id: googleId,
    created_at: now,
    first_name: nameData.firstName || null,
    last_name: nameData.lastName || null,
    display_name: nameData.displayName || nameData.firstName || null,
  };

  if (oauthProvider) userData.oauth_provider = oauthProvider;

  let userId;
  try {
    userId = await dbSafe.safeInsert('users', userData);
  } catch (err) {
    if (err.code === '23505') {
      if (err.constraint?.includes('email')) {
        throw createRegistrationError(RegistrationError.EMAIL_EXISTS);
      }
    }
    throw err;
  }

  const { context: contextData, room } = await setupUserContextAndRoom(userId, emailLower, context);
  await createWelcomeAndOnboardingTasks(userId, emailLower);

  // Assign default 'user' role for RBAC
  try {
    const { permissionService } = require('../src/services');
    await permissionService.ensureDefaultRole(userId);
  } catch (error) {
    // Non-fatal - log but don't fail user creation
    console.warn(`[createUser] Failed to assign default role to user ${userId}:`, error.message);
  }

  const displayName =
    nameData.displayName ||
    (nameData.firstName && nameData.lastName
      ? `${nameData.firstName} ${nameData.lastName}`
      : nameData.firstName || emailLower);

  neo4jClient.createUserNode(userId).catch(() => {});

  return {
    id: userId,
    email: emailLower,
    context: contextData,
    room,
    firstName: nameData.firstName || null,
    lastName: nameData.lastName || null,
    displayName: displayName,
  };
}

module.exports = {
  getUser,
  userExists,
  generateUniqueUsername,
  createUser,
};
