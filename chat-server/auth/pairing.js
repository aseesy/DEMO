/**
 * Pairing Code Registration Logic
 *
 * Handles registration flows for users accepting invitations via:
 * - Short codes (LZ-XXXX) from invitation system
 * - Pairing tokens from pairing system
 * - Pairing codes from pairing system
 *
 * IMPORTANT: These functions create users WITHOUT private rooms,
 * because a shared co-parent room will be created during acceptance.
 */
const dbSafe = require('../dbSafe');
const dbPostgres = require('../dbPostgres');
const roomManager = require('../roomManager');
const pairingManager = require('../libs/pairing-manager');
const invitationManager = require('../libs/invitation-manager');
const notificationManager = require('../libs/notification-manager');
const { createWelcomeAndOnboardingTasks } = require('./tasks');
const { createUserWithEmailNoRoom } = require('./registration');
const { createRegistrationError, RegistrationError } = require('./utils');
const { getUser } = require('./user');

/**
 * Register a new user from an invitation short code (LZ-XXXX)
 * Uses the invitation system (invitations table)
 *
 * @param {object} params - Registration parameters
 * @param {string} params.shortCode - Short code like "LZ-ABC123"
 * @param {string} params.email - User's email
 * @param {string} params.password - User's password
 * @param {string} params.displayName - Optional display name
 * @param {object} params.context - Optional context
 * @param {object} db - Database connection
 */
async function registerFromShortCode(params, db) {
  const { shortCode, email, password, displayName, context } = params;
  const emailLower = email.trim().toLowerCase();

  // Validate the short code
  const validation = await invitationManager.validateByShortCode(shortCode, db);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid invitation code');
  }

  // Check if email already exists
  const existing = await dbSafe.safeSelect('users', { email: emailLower }, { limit: 1 });
  if (existing.length > 0) {
    throw new Error('Email already exists');
  }

  // Create the user WITHOUT a private room (shared room will be created)
  const user = await createUserWithEmailNoRoom(emailLower, password, displayName, context || {});

  // Accept the invitation (this creates the shared room)
  const acceptResult = await invitationManager.acceptByShortCode(shortCode, user.id, db);
  let targetRoomId = acceptResult.roomId;

  // If no room was created during acceptance, create one now
  if (!targetRoomId) {
    try {
      // Get inviter email by ID (getUser requires email, not ID)
      const inviterResult = await dbPostgres.query('SELECT email FROM users WHERE id = $1', [
        acceptResult.inviterId,
      ]);
      if (inviterResult.rows.length > 0 && inviterResult.rows[0].email) {
        const inviterUser = await getUser(inviterResult.rows[0].email);
        if (inviterUser) {
          const sharedRoom = await roomManager.createCoParentRoom(
            acceptResult.inviterId,
            user.id,
            inviterUser.displayName || inviterUser.first_name || inviterUser.email,
            displayName || user.first_name || user.email
          );
          targetRoomId = sharedRoom.roomId;
        }
      }
    } catch (err) {
      console.error('Error creating shared room:', err);
    }
  } else {
    // Add user to existing room if they're not already a member
    try {
      await roomManager.addUserToRoom(targetRoomId, user.id);
    } catch (err) {
      // Ignore if already a member
      if (!err.message?.includes('already')) {
        console.error('Error adding user to room:', err);
      }
    }
  }

  // Get the room info
  let sharedRoom = null;
  if (targetRoomId) {
    sharedRoom = await roomManager.getRoom(targetRoomId);
  }

  // Create mutual contacts
  const now = new Date().toISOString();
  try {
    await dbSafe.safeInsert('contacts', {
      user_id: user.id,
      contact_name: validation.inviterName || 'Co-Parent',
      contact_email: validation.inviterEmail || null,
      relationship: 'co-parent',
      linked_user_id: acceptResult.inviterId,
      created_at: now,
    });
  } catch (err) {
    if (!err.message?.includes('duplicate'))
      console.error('Error creating contact for new user:', err);
  }

  try {
    // Get first_name for contact name (prefer first_name over displayName/username)
    const newUserResult = await dbPostgres.query(
      'SELECT first_name, display_name FROM users WHERE id = $1 LIMIT 1',
      [user.id]
    );
    const newUser = newUserResult.rows[0];
    const contactName = newUser?.first_name || displayName || user.email;

    await dbSafe.safeInsert('contacts', {
      user_id: acceptResult.inviterId,
      contact_name: contactName,
      contact_email: user.email,
      relationship: 'co-parent',
      linked_user_id: user.id,
      created_at: now,
    });
  } catch (err) {
    if (!err.message?.includes('duplicate'))
      console.error('Error creating contact for inviter:', err);
  }

  // Send notification to inviter
  try {
    await notificationManager.createInvitationAcceptedNotification(
      {
        userId: acceptResult.inviterId,
        inviteeName: displayName || user.first_name || user.email,
        invitationId: validation.invitation.id,
        roomId: targetRoomId,
      },
      db
    );
  } catch (err) {
    console.warn('Failed to send acceptance notification:', err.message);
  }

  // Create onboarding tasks
  await createWelcomeAndOnboardingTasks(user.id, user.email);

  return {
    user: { ...user, displayName: displayName || user.first_name || user.email },
    coParent: { id: acceptResult.inviterId, name: validation.inviterName },
    sharedRoom: sharedRoom
      ? { id: sharedRoom.roomId || sharedRoom.id, name: sharedRoom.roomName || sharedRoom.name }
      : null,
  };
}

/**
 * Register a new user from a pairing token
 * Uses the pairing system (pairing_sessions table)
 *
 * @param {object} params - Registration parameters
 * @param {string} params.token - Long invitation token
 * @param {string} params.email - User's email
 * @param {string} params.password - User's password
 * @param {string} params.displayName - Optional display name
 * @param {object} params.context - Optional context
 * @param {object} db - Database connection
 */
async function registerFromPairing(params, db) {
  const { token, email, password, displayName, context } = params;
  const emailLower = email.trim().toLowerCase();

  // Check if email already exists
  const existing = await dbSafe.safeSelect('users', { email: emailLower }, { limit: 1 });
  if (existing.length > 0) {
    throw createRegistrationError(RegistrationError.EMAIL_EXISTS);
  }

  // Validate the token
  const validation = await pairingManager.validateToken(token, db);
  if (!validation.valid) {
    if (validation.code === 'EXPIRED') throw createRegistrationError(RegistrationError.EXPIRED);
    if (validation.code === 'ALREADY_ACCEPTED')
      throw createRegistrationError(RegistrationError.ALREADY_ACCEPTED);
    throw createRegistrationError(RegistrationError.INVALID_TOKEN, validation.error);
  }

  // Create the user WITHOUT a private room
  const user = await createUserWithEmailNoRoom(emailLower, password, displayName, context || {});

  // Accept the pairing (this creates the shared room)
  const acceptResult = await pairingManager.acceptByToken(token, user.id, db, roomManager);

  // Create onboarding tasks
  await createWelcomeAndOnboardingTasks(user.id, user.email);

  return {
    success: true,
    user: { ...user, displayName: displayName || user.first_name || user.email },
    coParent: { id: acceptResult.initiatorId, displayName: validation.initiatorName },
    sharedRoom: acceptResult.sharedRoomId
      ? {
          id: acceptResult.sharedRoomId,
          name: `${validation.initiatorName} & ${displayName || user.first_name || user.email}`,
        }
      : null,
  };
}

/**
 * Register a new user from a pairing code (LZ-XXXX)
 * Uses the pairing system (pairing_sessions table)
 *
 * @param {object} params - Registration parameters
 * @param {string} params.code - Pairing code like "LZ-842396"
 * @param {string} params.email - User's email
 * @param {string} params.password - User's password
 * @param {string} params.displayName - Optional display name
 * @param {object} params.context - Optional context
 * @param {object} db - Database connection
 */
async function registerFromPairingCode(params, db) {
  const { code, email, password, displayName, context } = params;
  const emailLower = email.trim().toLowerCase();

  // Check if email already exists
  const existing = await dbSafe.safeSelect('users', { email: emailLower }, { limit: 1 });
  if (existing.length > 0) {
    throw createRegistrationError(RegistrationError.EMAIL_EXISTS);
  }

  // Validate the code
  const validation = await pairingManager.validateCode(code, db);
  if (!validation.valid) {
    if (validation.code === 'EXPIRED') throw createRegistrationError(RegistrationError.EXPIRED);
    if (validation.code === 'ALREADY_ACCEPTED')
      throw createRegistrationError(RegistrationError.ALREADY_ACCEPTED);
    throw createRegistrationError(RegistrationError.INVALID_TOKEN, validation.error);
  }

  // Create the user WITHOUT a private room
  const user = await createUserWithEmailNoRoom(emailLower, password, displayName, context || {});

  // Accept the pairing by code (this creates the shared room)
  const acceptResult = await pairingManager.acceptByCode(code, user.id, db, roomManager);

  // Create onboarding tasks
  await createWelcomeAndOnboardingTasks(user.id, user.email);

  return {
    success: true,
    user: { ...user, displayName: displayName || user.first_name || user.email },
    coParent: { id: acceptResult.initiatorId, displayName: validation.initiatorName },
    sharedRoom: acceptResult.sharedRoomId
      ? {
          id: acceptResult.sharedRoomId,
          name: `${validation.initiatorName} & ${displayName || user.first_name || user.email}`,
        }
      : null,
  };
}

module.exports = {
  registerFromShortCode,
  registerFromPairing,
  registerFromPairingCode,
};
