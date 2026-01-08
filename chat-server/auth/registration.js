/**
 * User Registration Flows
 */
const dbSafe = require('../dbSafe');
const invitationManager = require('../libs/invitation-manager');
const notificationManager = require('../libs/notification-manager');
const neo4jClient = require('../src/infrastructure/database/neo4jClient');
const {
  hashPassword,
  createRegistrationError,
  RegistrationError,
  generateUsernameSuffix,
} = require('./utils');
const { createUser, generateUniqueUsername } = require('./user');
const { createWelcomeAndOnboardingTasks } = require('./tasks');
const { createCoParentRoom } = require('../roomManager/coParent');
const { defaultLogger } = require('../src/infrastructure/logging/logger');

/**
 * Create a user with email - includes automatic private room creation
 * Use this for standalone signups (not accepting invites)
 */
async function createUserWithEmail(
  email,
  password,
  context = {},
  googleId = null,
  oauthProvider = null,
  nameData = {}
) {
  const emailLower = email.trim().toLowerCase();

  // Check if email already exists
  const existing = await dbSafe.safeSelect('users', { email: emailLower }, { limit: 1 });
  if (dbSafe.parseResult(existing).length > 0) {
    throw createRegistrationError(RegistrationError.EMAIL_EXISTS);
  }

  const hashedPassword = password ? await hashPassword(password) : null;

  // Create user with email (no username needed)
  try {
    const user = await createUser(
      emailLower,
      hashedPassword,
      context,
      googleId,
      oauthProvider,
      nameData
    );
    // Don't log email (PII) - log user creation only
    const logger = defaultLogger.child({ function: 'createUserWithEmail', userId: user.id });
    logger.info('User created successfully');
    return user;
  } catch (err) {
    // If email conflict (race condition), throw error
    if (err.code === 'EMAIL_EXISTS' || err.message?.includes('email')) {
      throw createRegistrationError(RegistrationError.EMAIL_EXISTS);
    }
    throw err;
  }
}

/**
 * Create a user with email - NO automatic room creation
 * Use this when accepting invites (a shared room will be created separately)
 *
 * @param {string} email - User's email address
 * @param {string} password - User's password (will be hashed)
 * @param {string|null} displayName - Display name (will be parsed into firstName/lastName if possible)
 * @param {Object} context - User context data
 */
async function createUserWithEmailNoRoom(email, password, displayName = null, context = {}) {
  const emailLower = email.trim().toLowerCase();

  // Check if email already exists
  const existing = await dbSafe.safeSelect('users', { email: emailLower }, { limit: 1 });
  if (dbSafe.parseResult(existing).length > 0) {
    throw createRegistrationError(RegistrationError.EMAIL_EXISTS);
  }

  const hashedPassword = password ? await hashPassword(password) : null;
  const now = new Date().toISOString();

  // Parse displayName into firstName and lastName if possible
  let firstName = null;
  let lastName = null;
  let finalDisplayName = displayName?.trim() || null;

  if (finalDisplayName) {
    // Try to split displayName into firstName and lastName
    const parts = finalDisplayName.split(/\s+/).filter(p => p.length > 0);
    if (parts.length > 0) {
      firstName = parts[0];
      lastName = parts.length > 1 ? parts.slice(1).join(' ') : null;
    }
  }

  const userData = {
    password_hash: hashedPassword,
    email: emailLower,
    first_name: firstName || null,
    last_name: lastName || null,
    display_name: finalDisplayName,
    created_at: now,
  };

  let userId;
  try {
    userId = await dbSafe.safeInsert('users', userData);
  } catch (err) {
    if (err.code === '23505') {
      if (err.constraint?.includes('email'))
        throw createRegistrationError(RegistrationError.EMAIL_EXISTS);
    }
    throw err;
  }

  // Assign default 'user' role for RBAC
  const logger = defaultLogger.child({ function: 'createUserWithEmailNoRoom', userId });
  try {
    const { permissionService } = require('../src/services');
    await permissionService.ensureDefaultRole(userId);
  } catch (error) {
    // Non-fatal - log but don't fail user creation
    logger.warn('Failed to assign default role', { error: error.message, errorCode: error.code });
  }

  // Create user context (but NOT a room) - using email instead of username
  try {
    const userContextData = {
      user_email: emailLower,
      co_parent: context.coParentName || null,
      children: context.children ? JSON.stringify(context.children) : null,
      contacts: context.contacts ? JSON.stringify(context.contacts) : null,
      triggers: context.triggers ? JSON.stringify(context.triggers) : null,
      updated_at: now,
    };
    await dbSafe.safeInsert('user_context', userContextData);

    // Update comprehensive profile fields in users table
    const userUpdates = {};
    if (context.communicationStyle) userUpdates.communication_style = context.communicationStyle;
    if (context.communicationTriggers)
      userUpdates.communication_triggers = context.communicationTriggers;
    if (context.communicationGoals) userUpdates.communication_goals = context.communicationGoals;

    if (Object.keys(userUpdates).length > 0) {
      await dbSafe.safeUpdate('users', userUpdates, { id: userId });
    }
  } catch (err) {
    logger.warn('Could not create user context', { error: err.message, errorCode: err.code });
  }

  // Create Neo4j node (using email instead of username) - log errors instead of swallowing
  neo4jClient.createUserNode(userId).catch(err => {
    logger.warn('Neo4j createUserNode failed', { error: err.message, errorCode: err.code });
  });

  return {
    id: userId,
    email: emailLower,
    first_name: firstName,
    last_name: lastName,
    displayName: finalDisplayName || emailLower,
    firstName: firstName,
    lastName: lastName,
    room: null, // No room created
  };
}

async function registerWithInvitation(
  { email, password, firstName, lastName, coParentEmail, context },
  db
) {
  // Validate required parameters
  if (!coParentEmail) {
    throw new Error('Co-parent email is required');
  }

  if (!db) {
    throw new Error('Database connection is required');
  }

  const emailLower = email.trim().toLowerCase();
  const coParentEmailLower = coParentEmail.trim().toLowerCase();

  if (emailLower === coParentEmailLower)
    throw new Error('You cannot invite yourself as a co-parent');

  const user = await createUserWithEmail(emailLower, password, context, null, null, {
    firstName,
    lastName,
  });

  const invitationResult = await invitationManager.createInvitation(
    {
      inviterId: user.id,
      inviteeEmail: coParentEmailLower,
      roomId: user.room?.roomId || null,
      invitationType: 'coparent',
    },
    db
  );

  await dbSafe.safeUpdate(
    'users',
    { signup_invitation_sent: true, signup_completed_at: new Date().toISOString() },
    { id: user.id }
  );

  if (invitationResult.isExistingUser && invitationResult.existingUser) {
    try {
      await notificationManager.createInvitationNotification(
        {
          userId: invitationResult.existingUser.id,
          inviterName:
            firstName || user.first_name || user.display_name || user.email.split('@')[0],
          invitationId: invitationResult.invitation.id,
          invitationToken: invitationResult.token,
        },
        db
      );
    } catch (err) {
      const logger = defaultLogger.child({ function: 'registerWithInvitation', userId: user.id });
      logger.warn('Failed to create invitation notification', { 
        error: err.message, 
        errorCode: err.code,
        invitationId: invitationResult.invitation.id,
      });
    }
  }

  return {
    user: {
      ...user,
      firstName: firstName || user.first_name,
      lastName: lastName || user.last_name,
      displayName:
        firstName && lastName
          ? `${firstName} ${lastName}`
          : firstName || user.first_name || user.display_name || user.email.split('@')[0],
    },
    invitation: {
      id: invitationResult.invitation.id,
      token: invitationResult.token,
      inviteeEmail: coParentEmailLower,
      isExistingUser: invitationResult.isExistingUser,
      expiresAt: invitationResult.invitation.expires_at,
    },
  };
}

async function registerFromInvitation(params, db) {
  const { token, email, password, firstName, lastName } = params;
  const emailLower = email.trim().toLowerCase();

  // Check if email already exists
  const existingEmail = await dbSafe.safeSelect('users', { email: emailLower }, { limit: 1 });
  if (existingEmail.length > 0) throw createRegistrationError(RegistrationError.EMAIL_EXISTS);

  // Validate invitation token
  const validation = await invitationManager.validateToken(token, db);
  if (!validation.valid) {
    if (validation.code === 'EXPIRED') throw createRegistrationError(RegistrationError.EXPIRED);
    if (validation.code === 'ALREADY_ACCEPTED')
      throw createRegistrationError(RegistrationError.ALREADY_ACCEPTED);
    throw createRegistrationError(RegistrationError.INVALID_TOKEN, validation.error);
  }

  const invitation = validation.invitation;
  if (invitation.invitee_email.toLowerCase() !== emailLower)
    throw createRegistrationError(RegistrationError.INVALID_TOKEN, 'Email mismatch');

  // Check inviter still exists
  const inviterCheck = await dbSafe.safeSelect(
    'users',
    { id: invitation.inviter_id },
    { limit: 1 }
  );
  if (inviterCheck.length === 0) throw createRegistrationError(RegistrationError.INVITER_GONE);

  // Build display name
  const displayName =
    firstName && lastName
      ? `${firstName.trim()} ${lastName.trim()}`
      : firstName?.trim() || lastName?.trim() || null;

  // Step 1: Create user using canonical function (no room - room created separately)
  // This handles: user record, context, Neo4j node, default role
  const user = await createUserWithEmailNoRoom(emailLower, password, displayName, {});

  // Step 2: Update invitation status
  const now = new Date().toISOString();
  await dbSafe.safeUpdate(
    'invitations',
    { status: 'accepted', invitee_id: user.id, accepted_at: now },
    { id: invitation.id }
  );

  // Step 3: Create co-parent room using canonical function
  // This handles: room creation, welcome message, contacts, Neo4j relationship, child contact sync
  const inviterName = validation.inviterName || 'Co-Parent';
  const inviteeName = displayName || emailLower.split('@')[0];

  const roomResult = await createCoParentRoom(
    invitation.inviter_id,
    user.id,
    inviterName,
    inviteeName
  );

  // Step 4: Create welcome and onboarding tasks
  await createWelcomeAndOnboardingTasks(user.id, user.email);

  return {
    user: {
      id: user.id,
      email: emailLower,
      firstName: firstName?.trim() || null,
      lastName: lastName?.trim() || null,
      displayName: displayName,
    },
    coParent: { id: invitation.inviter_id, displayName: inviterName },
    room: { id: roomResult.roomId, name: roomResult.roomName },
    sync: {
      contactsCreated: true,
      roomJoined: true,
    },
  };
}

module.exports = {
  createUserWithEmail,
  createUserWithEmailNoRoom,
  registerWithInvitation,
  registerFromInvitation,
};
