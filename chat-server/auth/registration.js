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
    console.log(`Created user: ${user.id} (${emailLower})`);
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
 */
async function createUserWithEmailNoRoom(email, password, firstName = null, lastName = null, context = {}) {
  const emailLower = email.trim().toLowerCase();

  // Check if email already exists
  const existing = await dbSafe.safeSelect('users', { email: emailLower }, { limit: 1 });
  if (dbSafe.parseResult(existing).length > 0) {
    throw createRegistrationError(RegistrationError.EMAIL_EXISTS);
  }

  const hashedPassword = password ? await hashPassword(password) : null;
  const now = new Date().toISOString();

  const displayName = firstName && lastName 
    ? `${firstName.trim()} ${lastName.trim()}` 
    : firstName?.trim() || lastName?.trim() || null;

  const userData = {
    password_hash: hashedPassword,
    email: emailLower,
    first_name: firstName?.trim() || null,
    last_name: lastName?.trim() || null,
    display_name: displayName,
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
    console.warn('Could not create user context:', err.message);
  }

  // Create Neo4j node (using email instead of username)
  neo4jClient
    .createUserNode(userId, emailLower, emailLower, displayName || emailLower)
    .catch(() => {});

  return {
    id: userId,
    email: emailLower,
    displayName: displayName || emailLower,
    firstName: userData.first_name,
    lastName: userData.last_name,
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
          inviterName: firstName || user.first_name || user.display_name || user.email.split('@')[0],
          invitationId: invitationResult.invitation.id,
          invitationToken: invitationResult.token,
        },
        db
      );
    } catch (err) {
      console.error('Notification error:', err);
    }
  }

  return {
    user: { 
      ...user, 
      firstName: firstName || user.first_name,
      lastName: lastName || user.last_name,
      displayName: firstName && lastName ? `${firstName} ${lastName}` : firstName || user.first_name || user.display_name || user.email.split('@')[0]
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

  const existingEmail = await dbSafe.safeSelect('users', { email: emailLower }, { limit: 1 });
  if (existingEmail.length > 0) throw createRegistrationError(RegistrationError.EMAIL_EXISTS);

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

  const inviterCheck = await dbSafe.safeSelect(
    'users',
    { id: invitation.inviter_id },
    { limit: 1 }
  );
  if (inviterCheck.length === 0) throw createRegistrationError(RegistrationError.INVITER_GONE);

  const result = await dbSafe.withTransaction(async client => {
    const now = new Date().toISOString();
    const passwordHash = await hashPassword(password);

    // Insert user with email as primary identifier (no username)
    const displayName = firstName && lastName 
      ? `${firstName.trim()} ${lastName.trim()}` 
      : firstName?.trim() || lastName?.trim() || null;
    
    let userId;
    try {
      const res = await client.query(
        `INSERT INTO "users" ("email", "password_hash", "first_name", "last_name", "display_name", "created_at") VALUES ($1, $2, $3, $4, $5, $6) RETURNING "id"`,
        [emailLower, passwordHash, firstName?.trim() || null, lastName?.trim() || null, displayName, now]
      );
      userId = res.rows[0].id;
    } catch (err) {
      if (err.code === '23505' && err.constraint?.includes('email')) {
        throw createRegistrationError(RegistrationError.EMAIL_EXISTS);
      }
      throw err;
    }

    await client.query(
      `UPDATE "invitations" SET "status" = 'accepted', "invitee_id" = $1, "accepted_at" = $2 WHERE "id" = $3`,
      [userId, now, invitation.id]
    );

    const roomId = `room_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const roomName = `${validation.inviterName || 'Co-Parent'} & ${displayName}`;

    await client.query(
      `INSERT INTO "rooms" ("id", "name", "created_by", "is_private", "created_at") VALUES ($1, $2, $3, $4, $5)`,
      [roomId, roomName, invitation.inviter_id, 1, now]
    );
    await client.query(
      `INSERT INTO "room_members" ("room_id", "user_id", "role", "joined_at") VALUES ($1, $2, 'owner', $3)`,
      [roomId, invitation.inviter_id, now]
    );
    await client.query(
      `INSERT INTO "room_members" ("room_id", "user_id", "role", "joined_at") VALUES ($1, $2, 'member', $3)`,
      [roomId, userId, now]
    );

    await dbSafe.safeInsertTx(client, 'contacts', {
      user_id: userId,
      contact_name: validation.inviterName || 'Co-Parent',
      contact_email: validation.inviterEmail || null,
      relationship: 'co-parent',
      linked_user_id: invitation.inviter_id,
      created_at: now,
    });
    // Use first_name for contact name (prefer first_name, fallback to displayName)
    const contactName = firstName?.trim() || displayName || emailLower.split('@')[0];

    await dbSafe.safeInsertTx(client, 'contacts', {
      user_id: invitation.inviter_id,
      contact_name: contactName,
      contact_email: emailLower,
      relationship: 'co-parent',
      linked_user_id: userId,
      created_at: now,
    });

    return {
      user: { 
        id: userId, 
        email: emailLower, 
        firstName: firstName?.trim() || null,
        lastName: lastName?.trim() || null,
        displayName: displayName 
      },
      coParent: { id: invitation.inviter_id, displayName: validation.inviterName },
      room: { id: roomId, name: roomName },
      sync: {
        contactsCreated: true,
        roomJoined: true,
      },
    };
  });

  await createWelcomeAndOnboardingTasks(result.user.id, result.user.email);
  neo4jClient
    .createUserNode(
      result.user.id,
      result.user.email,
      result.user.email,
      result.user.displayName
    )
    .catch(() => {});
  if (result.room && result.coParent)
    neo4jClient
      .createCoParentRelationship(
        result.coParent.id,
        result.user.id,
        result.room.id,
        result.room.name
      )
      .catch(() => {});

  return result;
}

module.exports = {
  createUserWithEmail,
  createUserWithEmailNoRoom,
  registerWithInvitation,
  registerFromInvitation,
};
