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

  let username = await generateUniqueUsername(emailLower);
  if (!username) throw createRegistrationError(RegistrationError.USERNAME_FAILED);

  const hashedPassword = password ? await hashPassword(password) : null;

  // Try to create user, retry once with new username if there's a race condition
  try {
    const user = await createUser(
      username,
      hashedPassword,
      context,
      emailLower,
      googleId,
      oauthProvider,
      nameData
    );
    console.log(`Created user: ${user.id} (${emailLower})`);
    return user;
  } catch (err) {
    // If username conflict (race condition), retry once with a new username
    if (err.code === 'USERNAME_CONFLICT') {
      username = await generateUniqueUsername(emailLower);
      if (!username) throw createRegistrationError(RegistrationError.USERNAME_FAILED);
      const user = await createUser(
        username,
        hashedPassword,
        context,
        emailLower,
        googleId,
        oauthProvider,
        nameData
      );
      console.log(`Created user: ${user.id} (${emailLower})`);
      return user;
    }
    throw err;
  }
}

/**
 * Create a user with email - NO automatic room creation
 * Use this when accepting invites (a shared room will be created separately)
 */
async function createUserWithEmailNoRoom(email, password, displayName = null, context = {}) {
  const emailLower = email.trim().toLowerCase();

  // Generate unique username
  const baseName = emailLower
    .split('@')[0]
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();
  let username = baseName.substring(0, 15);
  let attempts = 0;

  while (attempts < 10) {
    const check = await dbSafe.safeSelect('users', { username }, { limit: 1 });
    if (dbSafe.parseResult(check).length === 0) break;
    username = `${baseName.substring(0, 10)}${generateUsernameSuffix()}`;
    attempts++;
  }

  if (attempts >= 10) {
    throw createRegistrationError(RegistrationError.USERNAME_FAILED);
  }

  const hashedPassword = password ? await hashPassword(password) : null;
  const now = new Date().toISOString();

  const userData = {
    username: username.toLowerCase(),
    password_hash: hashedPassword,
    email: emailLower,
    display_name: displayName || null,
    first_name: displayName || null,
    created_at: now,
  };

  let userId;
  try {
    userId = await dbSafe.safeInsert('users', userData);
  } catch (err) {
    if (err.code === '23505') {
      if (err.constraint?.includes('username')) throw new Error('Username already exists');
      if (err.constraint?.includes('email'))
        throw createRegistrationError(RegistrationError.EMAIL_EXISTS);
    }
    throw err;
  }

  // Create user context (but NOT a room)
  try {
    const userContextData = {
      user_id: userId,
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

  // Create Neo4j node
  neo4jClient.createUserNode(userId, username, emailLower, displayName).catch(() => {});

  return {
    id: userId,
    username: username.toLowerCase(),
    email: emailLower,
    displayName: displayName || username,
    room: null, // No room created
  };
}

async function registerWithInvitation(
  { email, password, displayName, coParentEmail, context },
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

  const user = await createUserWithEmail(emailLower, password, context);
  if (displayName)
    await dbSafe.safeUpdate('users', { display_name: displayName.trim() }, { id: user.id });

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
          inviterName: displayName || user.username,
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
    user: { ...user, displayName: displayName || user.username },
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
  const { token, email, password, displayName } = params;
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
    let baseUsername = emailLower
      .split('@')[0]
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 15);
    if (baseUsername.length < 3) baseUsername = 'user';

    let username = baseUsername;
    let userId = null;
    let attempts = 0;

    while (attempts < 10) {
      try {
        const res = await client.query(
          `INSERT INTO "users" ("username", "email", "password_hash", "display_name", "created_at") VALUES ($1, $2, $3, $4, $5) RETURNING "id", "username"`,
          [username, emailLower, passwordHash, displayName?.trim() || null, now]
        );
        userId = res.rows[0].id;
        username = res.rows[0].username;
        break;
      } catch (err) {
        if (err.code === '23505' && err.constraint?.includes('username')) {
          attempts++;
          username = `${baseUsername}${Math.random().toString(36).substring(2, 6)}`.substring(
            0,
            20
          );
        } else throw err;
      }
    }

    if (!userId) throw createRegistrationError(RegistrationError.USERNAME_FAILED);

    await client.query(
      `UPDATE "invitations" SET "status" = 'accepted', "invitee_id" = $1, "accepted_at" = $2 WHERE "id" = $3`,
      [userId, now, invitation.id]
    );

    const roomId = `room_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const roomName = `${validation.inviterName || 'Co-Parent'} & ${displayName || username}`;

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
    await dbSafe.safeInsertTx(client, 'contacts', {
      user_id: invitation.inviter_id,
      contact_name: displayName || username,
      contact_email: emailLower,
      relationship: 'co-parent',
      linked_user_id: userId,
      created_at: now,
    });

    return {
      user: { id: userId, username, email: emailLower, displayName: displayName || username },
      coParent: { id: invitation.inviter_id, displayName: validation.inviterName },
      room: { id: roomId, name: roomName },
      sync: {
        contactsCreated: true,
        roomJoined: true,
      },
    };
  });

  await createWelcomeAndOnboardingTasks(result.user.id, result.user.username);
  neo4jClient
    .createUserNode(
      result.user.id,
      result.user.username,
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
