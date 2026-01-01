const dbSafe = require('./dbSafe');
const dbPostgres = require('./dbPostgres');

/**
 * Save a message to the database (PostgreSQL)
 * Includes retry logic for transient errors and proper error logging.
 */
async function saveMessage(message) {
  // Don't save private, flagged, or pending_original messages to database
  // pending_original messages are temporary UI-only messages that should never be persisted
  if (message.private || message.flagged || message.type === 'pending_original') {
    console.log('[saveMessage] Skipping save - message is private/flagged/pending_original:', {
      private: message.private,
      flagged: message.flagged,
      type: message.type,
    });
    return;
  }

  // Validate required fields (user_email required, text can be empty for system messages)
  // Support both email and username for backward compatibility during migration
  let userEmail = message.user_email || message.email;
  if (!userEmail && message.username) {
    // Look up email from username for backward compatibility
    try {
      const userResult = await dbSafe.safeSelect('users', { username: message.username.toLowerCase() }, { limit: 1 });
      const users = dbSafe.parseResult(userResult);
      if (users.length > 0) {
        userEmail = users[0].email;
      }
    } catch (err) {
      console.error('Error looking up email from username:', err);
    }
  }
  
  if (!userEmail) {
    console.error('❌ Invalid message data: user_email or email is required', { message });
    return;
  }

  const id = message.id || `${Date.now()}-${message.socketId}`;

  // Core fields that always exist in the messages table
  const coreData = {
    id: id,
    type: message.type || 'user',
    user_email: userEmail.trim().toLowerCase(),
    text: message.text || '',
    timestamp: message.timestamp || new Date().toISOString(),
    room_id: message.roomId || message.room_id || null,
    thread_id: message.threadId || message.thread_id || null,
  };

  // Extended fields (added in migration 006)
  const extendedData = {
    socket_id: message.socketId || null,
    private: message.private ? 1 : 0,
    flagged: message.flagged ? 1 : 0,
    validation: message.validation || null,
    tip1: message.tip1 || null,
    tip2: message.tip2 || null,
    rewrite: message.rewrite || null,
    original_message: message.originalMessage ? JSON.stringify(message.originalMessage) : null,
    edited: message.edited ? 1 : 0,
    edited_at: message.editedAt || null,
    reactions: message.reactions ? JSON.stringify(message.reactions) : '{}',
    user_flagged_by: message.user_flagged_by ? JSON.stringify(message.user_flagged_by) : '[]',
  };

  const fullData = { ...coreData, ...extendedData };

  /**
   * Attempt to save or update the message with retry logic
   */
  const saveWithRetry = async (data, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const existing = await dbSafe.safeSelect('messages', { id: id }, { limit: 1 });
        if (dbSafe.parseResult(existing).length > 0) {
          await dbSafe.safeUpdate('messages', data, { id: id });
          console.log(`💾 Updated message ${id} in database (room: ${coreData.room_id || 'none'})`);
        } else {
          await dbSafe.safeInsert('messages', data);
          console.log(
            `💾 Saved new message ${id} to database (room: ${coreData.room_id || 'none'})`
          );
        }
        return true; // Success
      } catch (err) {
        const isRetryable =
          err.code === 'ECONNRESET' ||
          err.code === 'ETIMEDOUT' ||
          err.message?.includes('connection');

        if (attempt < maxRetries && isRetryable) {
          const delay = 1000 * attempt; // Exponential backoff
          console.warn(
            `⚠️ Attempt ${attempt}/${maxRetries} failed, retrying in ${delay}ms...`,
            err.message
          );
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw err; // Final attempt failed or non-retryable error
        }
      }
    }
  };

  try {
    // Try with all fields first (after migration 006)
    await saveWithRetry(fullData);

    // Sync relationship metadata to Neo4j (non-blocking, async) - only after successful save
    if (coreData.room_id) {
      setImmediate(() => {
        try {
          const relationshipSync = require('./src/services/sync/relationshipSync');
          relationshipSync.syncRoomMetadata(coreData.room_id).catch(() => {
            // Silently fail - sync is optional and will retry periodically
          });
        } catch (err) {
          // relationshipSync not available or Neo4j not configured - that's okay
        }
      });
    }

    // Store message in Neo4j for semantic threading (non-blocking, async)
    if (coreData.room_id && coreData.text && coreData.text.trim().length > 0) {
      setImmediate(() => {
        try {
          const neo4jClient = require('./src/infrastructure/database/neo4jClient');
          if (neo4jClient && neo4jClient.isAvailable()) {
            neo4jClient
              .createOrUpdateMessageNode(
                id,
                coreData.room_id,
                coreData.text,
                coreData.user_email,
                coreData.timestamp
              )
              .catch(err => {
                // Silently fail - Neo4j storage is optional
                console.warn('⚠️  Failed to store message in Neo4j (non-fatal):', err.message);
              });
          }
        } catch (err) {
          // Neo4j client not available - that's okay
        }
      });
    }
  } catch (err) {
    // If extended columns don't exist, try with just core data
    if (err.message && err.message.includes('does not exist')) {
      console.warn('⚠️ Extended message columns not available, saving core data only');
      try {
        await saveWithRetry(coreData);
        return;
      } catch (fallbackErr) {
        console.error('❌ Error saving message (fallback):', fallbackErr.message);
      }
    }
    console.error('❌ Error saving message to database:', {
      error: err.message,
      messageId: id,
      roomId: coreData.room_id,
      user_email: coreData.user_email,
    });
  }
}

/**
 * Get recent messages from database (last N messages) - PostgreSQL
 */
async function getRecentMessages(limit = 50) {
  try {
    const limitInt = parseInt(limit) || 50;

    // Use PostgreSQL query with parameterized limit
    const query = `
      SELECT * FROM messages
      WHERE (private IS NULL OR private = 0) AND (flagged IS NULL OR flagged = 0)
      ORDER BY timestamp DESC
      LIMIT $1
    `;

    const result = await dbPostgres.query(query, [limitInt]);
    const messages = result.rows;

    // Convert to message format
    return messages
      .map(message => {
        const msg = {
          id: message.id,
          type: message.type,
          username: message.user_email || message.username, // Support both for backward compatibility
          user_email: message.user_email || message.username,
          text: message.text,
          timestamp: message.timestamp,
          socketId: message.socket_id,
          threadId: message.thread_id || null,
          private: message.private === 1,
          flagged: message.flagged === 1,
        };

        // Add AI intervention fields if present
        if (message.validation) msg.validation = message.validation;
        if (message.tip1) msg.tip1 = message.tip1;
        if (message.tip2) msg.tip2 = message.tip2;
        if (message.rewrite) msg.rewrite = message.rewrite;
        if (message.original_message) {
          try {
            msg.originalMessage = JSON.parse(message.original_message);
          } catch (err) {
            // Ignore parse errors
          }
        }

        return msg;
      })
      .reverse(); // Return in chronological order (oldest first)
  } catch (err) {
    console.error('Error loading messages from database:', err);
    return [];
  }
}

/**
 * Get messages for a specific room - PostgreSQL
 * Returns messages in chronological order (oldest first for display)
 * Uses subquery to get the MOST RECENT messages, then orders them chronologically
 */
async function getMessagesByRoom(roomId, limit = 500) {
  try {
    const limitInt = parseInt(limit) || 500;

    // FIXED: Get most recent messages first, then order chronologically
    // This prevents returning ancient messages from 2020-2021
    // PERFORMANCE: Uses idx_messages_room_timestamp index (created in migration 031/034)
    //              Outer query reorders results in memory (small dataset after LIMIT)
    const query = `
      SELECT * FROM (
        SELECT * FROM messages
        WHERE room_id = $1
        ORDER BY timestamp DESC
        LIMIT $2
      ) AS recent_messages
      ORDER BY timestamp ASC
    `;

    const result = await dbPostgres.query(query, [roomId, limitInt]);
    return result.rows.map(message => {
      const msg = {
        id: message.id,
        type: message.type,
        username: message.user_email || message.username, // Support both for backward compatibility
        user_email: message.user_email || message.username,
        text: message.text,
        timestamp: message.timestamp,
        socketId: message.socket_id,
        threadId: message.thread_id || null,
        roomId: message.room_id,
      };

      // Add extended fields if present
      if (message.validation) msg.validation = message.validation;
      if (message.tip1) msg.tip1 = message.tip1;
      if (message.tip2) msg.tip2 = message.tip2;
      if (message.rewrite) msg.rewrite = message.rewrite;
      if (message.edited) msg.edited = message.edited === 1;
      if (message.edited_at) msg.editedAt = message.edited_at;
      if (message.reactions) {
        try {
          msg.reactions = JSON.parse(message.reactions);
        } catch (e) {
          msg.reactions = {};
        }
      }
      if (message.user_flagged_by) {
        try {
          msg.user_flagged_by = JSON.parse(message.user_flagged_by);
        } catch (e) {
          msg.user_flagged_by = [];
        }
      }
      if (message.original_message) {
        try {
          msg.originalMessage = JSON.parse(message.original_message);
        } catch (e) {
          /* ignore */
        }
      }

      return msg;
    });
  } catch (err) {
    console.error('Error loading room messages from database:', err);
    return [];
  }
}

/**
 * Clean old messages (keep only last N messages) - PostgreSQL
 */
async function cleanOldMessages(keepCount = 1000) {
  try {
    const keepCountInt = parseInt(keepCount) || 1000;

    // PostgreSQL version of the cleanup query
    const query = `
      DELETE FROM messages
      WHERE id NOT IN (
        SELECT id FROM messages
        WHERE (private IS NULL OR private = 0) AND (flagged IS NULL OR flagged = 0)
        ORDER BY timestamp DESC
        LIMIT $1
      )
    `;

    await dbPostgres.query(query, [keepCountInt]);
    console.log(`🧹 Cleaned old messages, keeping last ${keepCountInt}`);
  } catch (err) {
    console.error('Error cleaning old messages:', err);
  }
}

module.exports = {
  saveMessage,
  getRecentMessages,
  getMessagesByRoom,
  cleanOldMessages,
};
