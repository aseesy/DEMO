const dbModule = require('./db');
const dbSafe = require('./dbSafe');

/**
 * Save a message to the database
 */
async function saveMessage(message) {
  // Don't save private or flagged messages to database
  if (message.private || message.flagged) {
    return;
  }

  const id = message.id || `${Date.now()}-${message.socketId}`;
  const messageData = {
    id: id,
    type: message.type || 'user',
    username: message.username,
    text: message.text || '',
    timestamp: message.timestamp || new Date().toISOString(),
    socket_id: message.socketId || '',
    room_id: message.roomId || message.room_id || null, // Include room_id for persistence
    private: message.private ? 1 : 0,
    flagged: message.flagged ? 1 : 0,
    validation: message.validation || '',
    tip1: message.tip1 || '',
    tip2: message.tip2 || '',
    rewrite: message.rewrite || '',
    original_message: message.originalMessage ? JSON.stringify(message.originalMessage) : ''
  };

  try {
    // Use safe insert - INSERT OR REPLACE requires a different approach
    // First check if exists, then insert or update
    const existing = await dbSafe.safeSelect('messages', { id: id }, { limit: 1 });
    if (dbSafe.parseResult(existing).length > 0) {
      await dbSafe.safeUpdate('messages', messageData, { id: id });
    } else {
      await dbSafe.safeInsert('messages', messageData);
    }
  } catch (err) {
    console.error('Error saving message to database:', err);
  }
}

/**
 * Get recent messages from database (last N messages)
 */
async function getRecentMessages(limit = 50) {
  try {
    // Use safeExec for query with ORDER BY and LIMIT (limit is integer, safe)
    const db = await dbModule.getDb();
    const limitInt = parseInt(limit) || 50;
    const query = `
      SELECT * FROM messages 
      WHERE private = 0 AND flagged = 0 
      ORDER BY timestamp DESC 
      LIMIT ${limitInt}
    `;
    
    const result = db.exec(query);
    const messages = dbSafe.parseResult(result);

    // Convert to message format
    return messages.map(message => {
      const msg = {
        id: message.id,
        type: message.type,
        username: message.username,
        text: message.text,
        timestamp: message.timestamp,
        socketId: message.socket_id,
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
 * Clean old messages (keep only last N messages)
 */
async function cleanOldMessages(keepCount = 1000) {
  try {
    // Use safeExec for complex DELETE query (keepCount is integer, safe)
    const db = await dbModule.getDb();
    const keepCountInt = parseInt(keepCount) || 1000;
    const query = `
      DELETE FROM messages 
      WHERE id NOT IN (
        SELECT id FROM messages 
        WHERE private = 0 AND flagged = 0 
        ORDER BY timestamp DESC 
        LIMIT ${keepCountInt}
      )
    `;
    db.exec(query);
    dbModule.saveDatabase();
  } catch (err) {
    console.error('Error cleaning old messages:', err);
  }
}

module.exports = {
  saveMessage,
  getRecentMessages,
  cleanOldMessages
};

