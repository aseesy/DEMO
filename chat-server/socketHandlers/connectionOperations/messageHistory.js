/**
 * Message History Operations
 *
 * Handles fetching and formatting message history for rooms.
 */

const { buildUserObject } = require('../utils');
const { defaultLogger } = require('../../src/infrastructure/logging/logger');

/**
 * Message history result
 * @typedef {Object} MessageHistoryResult
 * @property {Array} messages
 * @property {boolean} hasMore
 * @property {number} total
 * @property {number} offset
 */

/**
 * Get room message history with pagination support
 *
 * NAMING: Using `get*` for consistency with codebase data retrieval convention.
 *
 * @param {string} roomId - Room ID
 * @param {Object} dbPostgres - Database connection
 * @param {number} limit - Maximum messages to fetch
 * @param {number} offset - Offset for pagination
 * @returns {Promise<MessageHistoryResult>}
 */
async function getMessageHistory(roomId, dbPostgres, limit = 500, offset = 0) {
  const logger = defaultLogger.child({ function: 'getMessageHistory' });
  
  // CRITICAL: Validate roomId before proceeding
  if (!roomId || typeof roomId !== 'string' || roomId.trim() === '') {
    const error = new Error('Invalid roomId: roomId is required and must be a non-empty string');
    logger.error('Invalid roomId provided', error, {
      type: typeof roomId,
      isNull: roomId === null,
      isUndefined: roomId === undefined,
      // Don't log roomId value - may contain sensitive data
    });
    throw error;
  }

  logger.debug('Loading message history', {
    roomId: roomId.substring(0, 8) + '...', // Partial ID for debugging
    limit,
    offset,
  });

  // Get total count of user messages (exclude system messages)
  const totalMessages = await getTotalMessageCount(roomId, dbPostgres);
  logger.debug('Message count retrieved', { totalMessages });

  // Get room members for receiver resolution
  const { roomMembers, success: roomMembersQuerySucceeded } = await getRoomMembers(
    roomId,
    dbPostgres
  );

  // Get messages with user data
  const result = await fetchMessages(roomId, dbPostgres, limit, offset, logger);
  logger.debug('Messages retrieved from database', { count: result.rows.length });

  // Sort to chronological order and format messages
  const sortedRows = sortMessageRows(result.rows);
  const messages = formatMessages(sortedRows, roomMembers, roomMembersQuerySucceeded, roomId, logger);

  // Log sample of messages
  logMessageSample(messages, roomId, logger);

  return {
    messages,
    hasMore: totalMessages > offset + limit,
    total: totalMessages,
    offset,
    limit,
  };
}

/**
 * Get total count of user messages in room
 */
async function getTotalMessageCount(roomId, dbPostgres) {
  const countResult = await dbPostgres.query(
    `SELECT COUNT(*) as total FROM messages
     WHERE room_id = $1
     AND (type IS NULL OR type != 'system')
     AND text NOT LIKE '%joined the chat%'
     AND text NOT LIKE '%left the chat%'`,
    [roomId]
  );
  return parseInt(countResult.rows[0]?.total || 0, 10);
}

/**
 * Get room members for receiver resolution
 */
async function getRoomMembers(roomId, dbPostgres) {
  const logger = defaultLogger.child({ function: 'getRoomMembers' });
  try {
    const membersQuery = `
      SELECT rm.user_id, u.email, u.first_name, u.last_name
      FROM room_members rm
      JOIN users u ON rm.user_id = u.id
      WHERE rm.room_id = $1
    `;
    const membersResult = await dbPostgres.query(membersQuery, [roomId]);
    logger.debug('Room members retrieved', {
      roomId: roomId.substring(0, 8) + '...',
      count: membersResult.rows.length,
      // Don't log emails - PII
    });
    return { roomMembers: membersResult.rows, success: true };
  } catch (membersError) {
    logger.error('Error getting room members', membersError, {
      roomId: roomId.substring(0, 8) + '...',
      errorCode: membersError.code,
    });
    return { roomMembers: [], success: false };
  }
}

/**
 * Fetch messages from database
 */
async function fetchMessages(roomId, dbPostgres, limit, offset, logger = defaultLogger.child({ function: 'fetchMessages' })) {
  const historyQuery = `
    SELECT m.id, m.type, m.user_email, m.text, m.timestamp, m.room_id, m.thread_id,
           m.edited, m.edited_at, m.reactions, m.user_flagged_by,
           u.id as user_id, u.first_name, u.last_name, u.email as user_email_from_join
    FROM messages m
    LEFT JOIN users u ON m.user_email IS NOT NULL AND LOWER(m.user_email) = LOWER(u.email)
    WHERE m.room_id = $1
      AND (m.type IS NULL OR m.type != 'system')
      AND m.text NOT LIKE '%joined the chat%'
      AND m.text NOT LIKE '%left the chat%'
    ORDER BY m.timestamp DESC NULLS LAST, m.id DESC
    LIMIT $2 OFFSET $3
  `;

  try {
    return await dbPostgres.query(historyQuery, [roomId, limit, offset]);
  } catch (queryError) {
    logger.error('Database query error', queryError, {
      roomId: roomId.substring(0, 8) + '...',
      limit,
      offset,
      errorCode: queryError.code,
    });
    throw queryError;
  }
}

/**
 * Sort message rows to chronological order
 */
function sortMessageRows(rows) {
  return rows.sort((a, b) => {
    const timeA = new Date(a.timestamp || 0).getTime();
    const timeB = new Date(b.timestamp || 0).getTime();
    if (timeA === timeB) {
      return (a.id || '').localeCompare(b.id || '');
    }
    return timeA - timeB;
  });
}

/**
 * Format messages with sender and receiver info
 */
function formatMessages(sortedRows, roomMembers, roomMembersQuerySucceeded, roomId, logger = defaultLogger.child({ function: 'formatMessages' })) {
  return sortedRows.map(msg => {
    const senderData = buildSenderData(msg);
    const sender = buildSender(senderData, msg, roomId, logger);
    const receiver = buildReceiver(senderData, roomMembers, roomMembersQuerySucceeded, roomId, logger);

    return {
      id: msg.id,
      type: msg.type || 'user_message',
      sender,
      receiver,
      user_email: msg.user_email || msg.email || null,
      text: msg.text,
      timestamp: msg.timestamp || msg.created_at,
      threadId: msg.thread_id || null,
      edited: msg.edited === 1 || msg.edited === '1',
      reactions: parseJsonField(msg.reactions),
      user_flagged_by: parseJsonField(msg.user_flagged_by, []),
    };
  });
}

/**
 * Build sender data from message
 */
function buildSenderData(msg) {
  return {
    id: msg.user_id || null,
    email: msg.user_email || null,
    first_name: msg.first_name || null,
    last_name: msg.last_name || null,
  };
}

/**
 * Build sender object with fallbacks
 */
function buildSender(senderData, msg, roomId, logger = defaultLogger.child({ function: 'buildSender' })) {
  if (!senderData.email) {
    logger.warn('Message missing user_email', {
      messageId: msg.id,
      roomId: roomId.substring(0, 8) + '...',
      hasUserEmail: !!msg.user_email,
      hasEmail: !!msg.email,
    });
  }

  let sender = buildUserObject(senderData);

  // Fallback for missing user records
  if (!sender && senderData.email) {
    const canUseId =
      msg.user_id &&
      msg.user_email_from_join &&
      msg.user_email_from_join.toLowerCase() === senderData.email.toLowerCase();

    logger.warn('User lookup failed, creating minimal sender from user_email', {
      user_id: senderData.id,
      roomId: roomId.substring(0, 8) + '...',
      messageId: msg.id,
      canUseId,
      // Don't log email - PII
    });

    sender = {
      uuid: canUseId ? senderData.id : null,
      first_name: senderData.first_name || null,
      last_name: senderData.last_name || null,
      email: senderData.email,
    };
  }

  if (!sender) {
    logger.warn('Message has no sender object and no email', {
      messageId: msg.id,
      user_id: msg.user_id,
      roomId: roomId.substring(0, 8) + '...',
      // Don't log user_email - PII
    });
  }

  return sender;
}

/**
 * Build receiver object from room members
 */
function buildReceiver(senderData, roomMembers, roomMembersQuerySucceeded, roomId, logger = defaultLogger.child({ function: 'buildReceiver' })) {
  if (!roomMembersQuerySucceeded || roomMembers.length < 2 || !senderData.email) {
    if (roomMembers.length < 2) {
      logger.warn('Room has fewer than 2 members', {
        roomId: roomId.substring(0, 8) + '...',
        roomMemberCount: roomMembers.length,
      });
    }
    return null;
  }

  const senderEmailLower = senderData.email.toLowerCase();
  const otherMember = roomMembers.find(
    member => member.email && member.email.toLowerCase() !== senderEmailLower
  );

  if (!otherMember) {
    logger.warn('Could not find receiver in room members', {
      roomId: roomId.substring(0, 8) + '...',
      roomMemberCount: roomMembers.length,
      // Don't log emails - PII
    });
    return null;
  }

  return buildUserObject({
    id: otherMember.user_id,
    email: otherMember.email,
    first_name: otherMember.first_name || null,
    last_name: otherMember.last_name || null,
  });
}

/**
 * Parse JSON field with fallback
 */
function parseJsonField(value, fallback = {}) {
  if (!value) return fallback;
  try {
    return typeof value === 'string' ? JSON.parse(value) : value;
  } catch {
    return fallback;
  }
}

/**
 * Log sample of messages for debugging
 */
function logMessageSample(messages, roomId, logger = defaultLogger.child({ function: 'logMessageSample' })) {
  if (messages.length === 0) return;

  const messagesWithNullSender = messages.filter(m => !m.sender);
  const messagesWithNullSenderEmail = messages.filter(m => !m.sender?.email && !m.user_email);

  logger.debug('Message history sample', {
    firstTextPreview: messages[0]?.text?.substring(0, 30),
    lastTextPreview: messages[messages.length - 1]?.text?.substring(0, 30),
    count: messages.length,
    hasFirstSenderEmail: !!(messages[0]?.sender?.email || messages[0]?.user_email),
    messagesWithNullSender: messagesWithNullSender.length,
    messagesWithNullSenderEmail: messagesWithNullSenderEmail.length,
    // Don't log email addresses - PII
  });

  if (messagesWithNullSender.length > 0) {
    logger.warn('Messages with null sender detected', {
      count: messagesWithNullSender.length,
      sampleIds: messagesWithNullSender.slice(0, 3).map(m => m.id),
      // Don't log user_email or senderEmail - PII
    });
  }
}

module.exports = {
  getMessageHistory,
  // Deprecated alias
  fetchMessageHistory: getMessageHistory,
  // Helper functions exported for testing
  getTotalMessageCount,
  getRoomMembers,
  fetchMessages,
  sortMessageRows,
  formatMessages,
  parseJsonField,
};
