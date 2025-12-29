/**
 * Shared Socket Helper Functions
 */

/**
 * Emit error to socket with consistent logging
 * @param {Object} socket - Socket.io socket instance
 * @param {string} message - User-facing error message
 * @param {Error|null} error - Optional error for logging
 * @param {string} context - Context string for logging
 */
function emitError(socket, message, error = null, context = '') {
  if (error) {
    console.error(`Error in ${context}:`, error);
  }
  socket.emit('error', { message });
}

/**
 * Get user display name: first_name + last_name > first_name > display_name > email
 * Supports both email lookup (legacy) and user object (new)
 */
async function getUserDisplayName(emailOrUser, dbSafe = null) {
  // If it's already a user object (new structure)
  if (typeof emailOrUser === 'object' && emailOrUser !== null) {
    if (emailOrUser.first_name && emailOrUser.last_name) {
      return `${emailOrUser.first_name} ${emailOrUser.last_name}`;
    }
    return emailOrUser.first_name || emailOrUser.display_name || emailOrUser.email || 'Co-parent';
  }

  // Legacy: email string lookup
  if (typeof emailOrUser === 'string' && dbSafe) {
    try {
      const emailLower = emailOrUser.trim().toLowerCase();
      const userResult = await dbSafe.safeSelect('users', { email: emailLower }, { limit: 1 });
      const users = dbSafe.parseResult(userResult);
      if (users.length > 0) {
        const user = users[0];
        // Prefer first_name + last_name, then first_name, then display_name, then email
        if (user.first_name && user.last_name) {
          return `${user.first_name} ${user.last_name}`;
        }
        return user.first_name || user.display_name || emailOrUser;
      }
    } catch (err) {
      console.error(`Error getting display name for ${emailOrUser}:`, err);
    }
    return emailOrUser;
  }

  return 'Co-parent';
}

/**
 * Build sender/receiver object from user data (normalized)
 * @param {Object} userData - User data from database JOIN
 * @param {boolean} includeEmail - Whether to include email (privacy consideration)
 * @returns {Object|null} User object with uuid, first_name, last_name, email (optional)
 */
function buildUserObject(userData, includeEmail = true) {
  if (!userData || !userData.id) {
    return null;
  }

  return {
    uuid: userData.id, // Use users.id as UUID
    first_name: userData.first_name || null,
    last_name: userData.last_name || null,
    email: includeEmail ? userData.email || null : null, // Privacy-aware
  };
}

/**
 * Get receiver for a message (other participant in room)
 * @param {string} senderEmail - Sender's email
 * @param {string} roomId - Room ID
 * @param {Object} dbSafe - Database connection
 * @returns {Promise<Object|null>} Receiver user object or null
 */
async function getReceiverForMessage(senderEmail, roomId, dbSafe) {
  if (!dbSafe || !roomId || !senderEmail) {
    return null;
  }

  try {
    // Get room members
    const roomMembersResult = await dbSafe.safeSelect('room_members', { room_id: roomId }, {});
    const roomMembers = dbSafe.parseResult(roomMembersResult);

    if (roomMembers.length === 0) {
      return null;
    }

    // Get user IDs for room members
    const userIds = roomMembers.map(rm => rm.user_id);

    // Get user details for all room members
    const usersResult = await dbSafe.safeSelect('users', { id: userIds }, {});
    const users = dbSafe.parseResult(usersResult);

    // Find the other participant (not the sender)
    const senderEmailLower = senderEmail.toLowerCase();
    const otherUser = users.find(u => u.email && u.email.toLowerCase() !== senderEmailLower);

    if (!otherUser) {
      return null;
    }

    return buildUserObject(otherUser);
  } catch (err) {
    console.warn('[getReceiverForMessage] Error getting receiver:', err);
    return null;
  }
}

module.exports = {
  emitError,
  getUserDisplayName,
  buildUserObject,
  getReceiverForMessage,
};
