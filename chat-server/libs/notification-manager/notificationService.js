/**
 * Notification Service
 *
 * Creates and manages in-app notifications for users.
 * Used for co-parent invitation notifications to existing users.
 *
 * Feature: 003-account-creation-coparent-invitation
 * Constitutional Compliance:
 *   - Principle I (Library-First): Standalone module
 *   - Principle III (Contract-First): Clear interface definitions
 */

/**
 * Notification types
 */
const NOTIFICATION_TYPES = {
  COPARENT_INVITATION: 'coparent_invitation',
  INVITATION_ACCEPTED: 'invitation_accepted',
  INVITATION_DECLINED: 'invitation_declined',
  WELCOME: 'welcome',
  SYSTEM: 'system',
};

/**
 * Action types that can be taken on notifications
 */
const NOTIFICATION_ACTIONS = {
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  DISMISSED: 'dismissed',
};

/**
 * Create a new notification
 * @param {object} params - Notification parameters
 * @param {string} params.userId - User who receives the notification
 * @param {string} params.type - Notification type (from NOTIFICATION_TYPES)
 * @param {string} params.title - Notification title
 * @param {string} [params.message] - Optional notification message
 * @param {object} [params.data] - Additional data (invitation_id, action URLs, etc.)
 * @param {number} [params.invitationId] - Related invitation ID
 * @param {object} db - Database connection
 * @returns {Promise<object>} Created notification
 */
async function createNotification(params, db) {
  const {
    userId,
    type,
    title,
    message = null,
    data = {},
    invitationId = null,
  } = params;

  // Validation
  if (!userId) {
    throw new Error('userId is required');
  }
  if (!type) {
    throw new Error('type is required');
  }
  if (!title) {
    throw new Error('title is required');
  }
  if (!db) {
    throw new Error('database connection is required');
  }

  const result = await db.query(
    `INSERT INTO in_app_notifications (
      user_id, type, title, message, data, invitation_id
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`,
    [userId, type, title, message, JSON.stringify(data), invitationId]
  );

  return result.rows[0];
}

/**
 * Create co-parent invitation notification
 * @param {object} params - Notification parameters
 * @param {string} params.userId - Existing user receiving the invitation
 * @param {string} params.inviterName - Name of the person who sent the invitation
 * @param {number} params.invitationId - Related invitation ID
 * @param {string} params.invitationToken - Token for accepting/declining
 * @param {object} db - Database connection
 * @returns {Promise<object>} Created notification
 */
async function createInvitationNotification(params, db) {
  const { userId, inviterName, invitationId, invitationToken } = params;

  if (!userId || !inviterName || !invitationId) {
    throw new Error('userId, inviterName, and invitationId are required');
  }

  return createNotification({
    userId,
    type: NOTIFICATION_TYPES.COPARENT_INVITATION,
    title: 'Co-Parent Invitation',
    message: `${inviterName} has invited you to connect as co-parents on LiaiZen.`,
    data: {
      inviter_name: inviterName,
      invitation_token: invitationToken,
      action_required: true,
      actions: ['accept', 'decline'],
    },
    invitationId,
  }, db);
}

/**
 * Create invitation accepted notification (for the inviter)
 * @param {object} params - Notification parameters
 * @param {string} params.userId - Inviter user ID
 * @param {string} params.inviteeName - Name of the person who accepted
 * @param {number} params.invitationId - Related invitation ID
 * @param {string} params.roomId - Room ID for the co-parent chat
 * @param {object} db - Database connection
 * @returns {Promise<object>} Created notification
 */
async function createInvitationAcceptedNotification(params, db) {
  const { userId, inviteeName, invitationId, roomId } = params;

  if (!userId || !inviteeName) {
    throw new Error('userId and inviteeName are required');
  }

  return createNotification({
    userId,
    type: NOTIFICATION_TYPES.INVITATION_ACCEPTED,
    title: 'Invitation Accepted',
    message: `${inviteeName} has accepted your invitation to connect as co-parents!`,
    data: {
      invitee_name: inviteeName,
      room_id: roomId,
      action_required: false,
    },
    invitationId,
  }, db);
}

/**
 * Create invitation declined notification (for the inviter)
 * @param {object} params - Notification parameters
 * @param {string} params.userId - Inviter user ID
 * @param {string} params.inviteeName - Name of the person who declined
 * @param {number} params.invitationId - Related invitation ID
 * @param {object} db - Database connection
 * @returns {Promise<object>} Created notification
 */
async function createInvitationDeclinedNotification(params, db) {
  const { userId, inviteeName, invitationId } = params;

  if (!userId) {
    throw new Error('userId is required');
  }

  return createNotification({
    userId,
    type: NOTIFICATION_TYPES.INVITATION_DECLINED,
    title: 'Invitation Declined',
    message: inviteeName
      ? `${inviteeName} has declined your invitation.`
      : 'Your invitation has been declined.',
    data: {
      invitee_name: inviteeName,
      action_required: false,
    },
    invitationId,
  }, db);
}

/**
 * Get notifications for a user
 * @param {string} userId - User ID
 * @param {object} db - Database connection
 * @param {object} options - Query options
 * @returns {Promise<object[]>} Array of notifications
 */
async function getNotifications(userId, db, options = {}) {
  if (!userId || !db) {
    throw new Error('userId and db are required');
  }

  const {
    unreadOnly = false,
    type = null,
    limit = 50,
    offset = 0,
  } = options;

  let query = `
    SELECT n.*, i.status as invitation_status, i.invitee_email
    FROM in_app_notifications n
    LEFT JOIN invitations i ON n.invitation_id = i.id
    WHERE n.user_id = $1
  `;
  const params = [userId];
  let paramIndex = 2;

  if (unreadOnly) {
    query += ` AND n.read = FALSE`;
  }

  if (type) {
    query += ` AND n.type = $${paramIndex}`;
    params.push(type);
    paramIndex++;
  }

  query += ` ORDER BY n.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  const result = await db.query(query, params);
  return result.rows;
}

/**
 * Get unread notification count for a user
 * @param {string} userId - User ID
 * @param {object} db - Database connection
 * @returns {Promise<number>} Unread count
 */
async function getUnreadCount(userId, db) {
  // More lenient check - allow 0 as valid userId, but check for null/undefined
  if (userId === null || userId === undefined) {
    throw new Error('userId is required');
  }
  
  if (!db || typeof db.query !== 'function') {
    throw new Error('db with query method is required');
  }

  const result = await db.query(
    'SELECT COUNT(*) as count FROM in_app_notifications WHERE user_id = $1 AND read = FALSE',
    [userId]
  );

  return parseInt(result.rows[0].count, 10);
}

/**
 * Mark notification as read
 * @param {number} notificationId - Notification ID
 * @param {string} userId - User ID (for authorization)
 * @param {object} db - Database connection
 * @returns {Promise<object>} Updated notification
 */
async function markAsRead(notificationId, userId, db) {
  if (!notificationId || !userId || !db) {
    throw new Error('notificationId, userId, and db are required');
  }

  const result = await db.query(
    `UPDATE in_app_notifications
     SET read = TRUE, read_at = CURRENT_TIMESTAMP
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [notificationId, userId]
  );

  if (result.rows.length === 0) {
    throw new Error('Notification not found');
  }

  return result.rows[0];
}

/**
 * Mark all notifications as read for a user
 * @param {string} userId - User ID
 * @param {object} db - Database connection
 * @returns {Promise<number>} Number of updated notifications
 */
async function markAllAsRead(userId, db) {
  if (!userId || !db) {
    throw new Error('userId and db are required');
  }

  const result = await db.query(
    `UPDATE in_app_notifications
     SET read = TRUE, read_at = CURRENT_TIMESTAMP
     WHERE user_id = $1 AND read = FALSE`,
    [userId]
  );

  return result.rowCount || 0;
}

/**
 * Record action taken on a notification
 * @param {number} notificationId - Notification ID
 * @param {string} userId - User ID (for authorization)
 * @param {string} action - Action taken (from NOTIFICATION_ACTIONS)
 * @param {object} db - Database connection
 * @returns {Promise<object>} Updated notification
 */
async function recordAction(notificationId, userId, action, db) {
  if (!notificationId || !userId || !action || !db) {
    throw new Error('notificationId, userId, action, and db are required');
  }

  const result = await db.query(
    `UPDATE in_app_notifications
     SET action_taken = $1, action_at = CURRENT_TIMESTAMP, read = TRUE, read_at = CURRENT_TIMESTAMP
     WHERE id = $2 AND user_id = $3
     RETURNING *`,
    [action, notificationId, userId]
  );

  if (result.rows.length === 0) {
    throw new Error('Notification not found');
  }

  return result.rows[0];
}

/**
 * Delete old notifications (maintenance function)
 * @param {number} daysOld - Delete notifications older than this many days
 * @param {object} db - Database connection
 * @returns {Promise<number>} Number of deleted notifications
 */
async function deleteOldNotifications(daysOld, db) {
  if (!daysOld || !db) {
    throw new Error('daysOld and db are required');
  }

  const result = await db.query(
    `DELETE FROM in_app_notifications
     WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '1 day' * $1
     AND read = TRUE`,
    [daysOld]
  );

  return result.rowCount || 0;
}

module.exports = {
  createNotification,
  createInvitationNotification,
  createInvitationAcceptedNotification,
  createInvitationDeclinedNotification,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  recordAction,
  deleteOldNotifications,
  NOTIFICATION_TYPES,
  NOTIFICATION_ACTIONS,
};
