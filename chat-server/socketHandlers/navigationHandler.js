/**
 * Socket Navigation and Search Handlers
 */

const { defaultLogger } = require('../src/infrastructure/logging/logger');

const logger = defaultLogger.child({
  module: 'navigationHandler',
});

function registerNavigationHandlers(socket, io, services) {
  const { dbPostgres, userSessionService } = services;

  // load_older_messages handler
  socket.on('load_older_messages', async ({ beforeTimestamp, limit = 50 }) => {
    const user = await userSessionService.getUserBySocketId(socket.id);
    if (!user) {
      socket.emit('error', { message: 'You must join before loading messages.' });
      return;
    }

    try {
      // Exclude system messages (join/leave) when loading older messages
      const query = `
        SELECT m.*, u.display_name, u.first_name
        FROM messages m
        LEFT JOIN users u ON LOWER(m.user_email) = LOWER(u.email) OR LOWER(m.username) = LOWER(u.email)
        WHERE m.room_id = $1
          AND m.timestamp < $2
          AND (m.type IS NULL OR m.type != 'system')
          AND m.text NOT LIKE '%joined the chat%'
          AND m.text NOT LIKE '%left the chat%'
        ORDER BY m.timestamp DESC
        LIMIT $3
      `;

      const result = await dbPostgres.query(query, [user.roomId, beforeTimestamp, limit]);

      const olderMessages = result.rows
        .map(msg => {
          const displayName = msg.first_name || msg.display_name || msg.username;
          return {
            id: msg.id,
            type: msg.type,
            username: msg.username,
            displayName: displayName,
            text: msg.text,
            timestamp: msg.timestamp,
            threadId: msg.thread_id || null,
            edited: msg.edited === 1 || msg.edited === '1',
            editedAt: msg.edited_at || null,
            reactions: JSON.parse(msg.reactions || '{}'),
            user_flagged_by: JSON.parse(msg.user_flagged_by || '[]'),
          };
        })
        .reverse();

      socket.emit('older_messages', {
        messages: olderMessages,
        hasMore: result.rows.length === limit,
      });
    } catch (error) {
      logger.error('Error loading older messages', {
        error: error,
      });
      socket.emit('error', { message: 'Failed to load older messages.' });
    }
  });

  // search_messages handler
  socket.on('search_messages', async ({ query, limit = 50, offset = 0 }) => {
    const user = await userSessionService.getUserBySocketId(socket.id);
    if (!user) {
      socket.emit('error', { message: 'You must join before searching.' });
      return;
    }

    if (!query || query.trim().length < 2) {
      socket.emit('search_results', { messages: [], total: 0, query });
      return;
    }

    try {
      const countQuery = `SELECT COUNT(*) as total FROM messages WHERE room_id = $1 AND type IN ('message', 'user') AND text ILIKE $2`;
      const countResult = await dbPostgres.query(countQuery, [user.roomId, `%${query}%`]);
      const total = parseInt(countResult.rows[0].total, 10);

      const searchQuery = `
        SELECT m.*, u.display_name, u.first_name
        FROM messages m
        LEFT JOIN users u ON LOWER(m.user_email) = LOWER(u.email) OR LOWER(m.username) = LOWER(u.email)
        WHERE m.room_id = $1 AND m.type IN ('message', 'user') AND text ILIKE $2
        ORDER BY m.timestamp DESC
        LIMIT $3 OFFSET $4
      `;

      const result = await dbPostgres.query(searchQuery, [
        user.roomId,
        `%${query}%`,
        limit,
        offset,
      ]);

      const searchResults = result.rows.map(msg => {
        const displayName = msg.first_name || msg.display_name || msg.username;
        return {
          id: msg.id,
          type: msg.type,
          username: msg.username,
          displayName: displayName,
          text: msg.text,
          timestamp: msg.timestamp,
        };
      });

      socket.emit('search_results', {
        messages: searchResults,
        total,
        query,
        hasMore: offset + result.rows.length < total,
      });
    } catch (error) {
      logger.error('Error searching messages', {
        error: error,
      });
      socket.emit('error', { message: 'Failed to search messages.' });
    }
  });

  // jump_to_message handler
  socket.on('jump_to_message', async ({ messageId }) => {
    const user = await userSessionService.getUserBySocketId(socket.id);
    if (!user) return;

    try {
      const targetQuery = `SELECT timestamp FROM messages WHERE id = $1 AND room_id = $2`;
      const targetResult = await dbPostgres.query(targetQuery, [messageId, user.roomId]);

      if (targetResult.rows.length === 0) {
        socket.emit('error', { message: 'Message not found.' });
        return;
      }

      const targetTimestamp = targetResult.rows[0].timestamp;

      const contextQuery = `
        (SELECT m.*, u.display_name, u.first_name FROM messages m LEFT JOIN users u ON LOWER(m.username) = LOWER(u.username)
         WHERE m.room_id = $1 AND m.timestamp <= $2 ORDER BY m.timestamp DESC LIMIT 26)
        UNION ALL
        (SELECT m.*, u.display_name, u.first_name FROM messages m LEFT JOIN users u ON LOWER(m.username) = LOWER(u.username)
         WHERE m.room_id = $1 AND m.timestamp > $2 ORDER BY m.timestamp ASC LIMIT 25)
        ORDER BY timestamp ASC
      `;

      const result = await dbPostgres.query(contextQuery, [user.roomId, targetTimestamp]);

      const contextMessages = result.rows.map(msg => {
        const displayName = msg.first_name || msg.display_name || msg.username;
        return {
          id: msg.id,
          type: msg.type,
          username: msg.username,
          displayName: displayName,
          text: msg.text,
          timestamp: msg.timestamp,
          threadId: msg.thread_id || null,
          reactions: JSON.parse(msg.reactions || '{}'),
          user_flagged_by: JSON.parse(msg.user_flagged_by || '[]'),
        };
      });

      socket.emit('jump_to_message_result', {
        messages: contextMessages,
        targetMessageId: messageId,
      });
    } catch (error) {
      logger.error('Error jumping to message', {
        error: error,
      });
      socket.emit('error', { message: 'Failed to load message context.' });
    }
  });
}

module.exports = { registerNavigationHandlers };
