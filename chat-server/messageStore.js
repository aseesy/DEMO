const dbSafe = require('./dbSafe');
const dbPostgres = require('./dbPostgres');

/**
 * Save a message to the database (PostgreSQL)
 */
async function saveMessage(message) {
  // Don't save private, flagged, or pending_original messages to database
  // pending_original messages are temporary UI-only messages that should never be persisted
  if (message.private || message.flagged || message.type === 'pending_original') {
    return;
  }

  const id = message.id || `${Date.now()}-${message.socketId}`;

  // Core fields that always exist in the messages table
  const coreData = {
    id: id,
    type: message.type || 'user',
    username: message.username,
    text: message.text || '',
    timestamp: message.timestamp || new Date().toISOString(),
    room_id: message.roomId || message.room_id || null,
    thread_id: message.threadId || message.thread_id || null
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
    user_flagged_by: message.user_flagged_by ? JSON.stringify(message.user_flagged_by) : '[]'
  };

  try {
    // Try with all fields first (after migration 006)
    const fullData = { ...coreData, ...extendedData };

    // Check if message exists
    const existing = await dbSafe.safeSelect('messages', { id: id }, { limit: 1 });
    if (dbSafe.parseResult(existing).length > 0) {
      // Update existing message
      await dbSafe.safeUpdate('messages', fullData, { id: id });
      console.log(`💾 Updated message ${id} in database (room: ${coreData.room_id || 'none'})`);
    } else {
      // Insert new message
      await dbSafe.safeInsert('messages', fullData);
      console.log(`💾 Saved new message ${id} to database (room: ${coreData.room_id || 'none'})`);
      
      // Sync relationship metadata to Neo4j (non-blocking, async)
      if (coreData.room_id) {
        setImmediate(() => {
          try {
            const relationshipSync = require('./src/utils/relationshipSync');
            relationshipSync.syncRoomMetadata(coreData.room_id).catch(err => {
              // Silently fail - sync is optional and will retry periodically
            });
          } catch (err) {
            // relationshipSync not available or Neo4j not configured - that's okay
          }
        });
      }
    }
  } catch (err) {
    // If extended columns don't exist, try with just core data
    if (err.message && err.message.includes('does not exist')) {
      console.warn('⚠️ Extended message columns not available, saving core data only');
      try {
        const existing = await dbSafe.safeSelect('messages', { id: id }, { limit: 1 });
        if (dbSafe.parseResult(existing).length > 0) {
          await dbSafe.safeUpdate('messages', coreData, { id: id });
          console.log(`💾 Updated message ${id} with core data only`);
        } else {
          await dbSafe.safeInsert('messages', coreData);
          console.log(`💾 Saved new message ${id} with core data only`);
        }
        return;
      } catch (fallbackErr) {
        console.error('❌ Error saving message (fallback):', fallbackErr);
      }
    }
    console.error('❌ Error saving message to database:', err);
    console.error('Message ID:', id);
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
    return messages.map(message => {
      const msg = {
        id: message.id,
        type: message.type,
        username: message.username,
        text: message.text,
        timestamp: message.timestamp,
        socketId: message.socket_id,
        threadId: message.thread_id || null,
        private: message.private === 1,
        flagged: message.flagged === 1
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
    }).reverse(); // Return in chronological order (oldest first)
  } catch (err) {
    console.error('Error loading messages from database:', err);
    return [];
  }
}

/**
 * Get messages for a specific room - PostgreSQL
 */
async function getMessagesByRoom(roomId, limit = 500) {
  try {
    const limitInt = parseInt(limit) || 500;

    const query = `
      SELECT * FROM messages
      WHERE room_id = $1
      ORDER BY timestamp ASC
      LIMIT $2
    `;

    const result = await dbPostgres.query(query, [roomId, limitInt]);
    return result.rows.map(message => {
      const msg = {
        id: message.id,
        type: message.type,
        username: message.username,
        text: message.text,
        timestamp: message.timestamp,
        socketId: message.socket_id,
        threadId: message.thread_id || null,
        roomId: message.room_id
      };

      // Add extended fields if present
      if (message.validation) msg.validation = message.validation;
      if (message.tip1) msg.tip1 = message.tip1;
      if (message.tip2) msg.tip2 = message.tip2;
      if (message.rewrite) msg.rewrite = message.rewrite;
      if (message.edited) msg.edited = message.edited === 1;
      if (message.edited_at) msg.editedAt = message.edited_at;
      if (message.reactions) {
        try { msg.reactions = JSON.parse(message.reactions); } catch (e) { msg.reactions = {}; }
      }
      if (message.user_flagged_by) {
        try { msg.user_flagged_by = JSON.parse(message.user_flagged_by); } catch (e) { msg.user_flagged_by = []; }
      }
      if (message.original_message) {
        try { msg.originalMessage = JSON.parse(message.original_message); } catch (e) { /* ignore */ }
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
  cleanOldMessages
};

