/**
 * Socket Coaching Handlers
 */

const { defaultLogger } = require('../src/infrastructure/logging/logger');
const { emitError } = require('./utils');

function registerCoachingHandlers(socket, io, services) {
  const { proactiveCoach, dbSafe, dbPostgres, userSessionService } = services;
  const logger = defaultLogger.child({ handler: 'coaching' });

  // analyze_draft handler
  socket.on('analyze_draft', async ({ draftText }) => {
    try {
      const user = await userSessionService.getUserBySocketId(socket.id);
      if (!user) {
        socket.emit('error', { message: 'You must join before analyzing drafts.' });
        return;
      }

      // Get recent messages for context
      const messagesQuery = `SELECT * FROM messages WHERE room_id = $1 ORDER BY timestamp DESC LIMIT 10`;
      const messagesResult = await dbPostgres.query(messagesQuery, [user.roomId]);
      const recentMessages = messagesResult.rows.length > 0 ? messagesResult.rows.reverse() : [];

      // Get user context
      const userResult = await dbSafe.safeSelect(
        'users',
        { username: user.username.toLowerCase() },
        { limit: 1 }
      );
      const userContext = userResult.length > 0 ? userResult[0] : {};

      // Get contact context
      const contactsResult = await dbSafe.safeSelect('contacts', { user_id: userContext.id });
      const contacts = dbSafe.parseResult(contactsResult);
      const contactContext =
        contacts.length > 0
          ? contacts.map(c => `${c.contact_name} (${c.relationship || 'contact'})`).join(', ')
          : null;

      // Get flagged messages for context
      const flagsResult = await dbSafe.safeSelect(
        'message_flags',
        { flagged_by_username: user.username },
        { limit: 5 }
      );
      const flaggedMessages = []; // Simplified for length

      const coaching = await proactiveCoach.analyzeDraftMessage(
        draftText,
        recentMessages,
        userContext,
        contactContext,
        flaggedMessages
      );

      if (coaching) {
        socket.emit('draft_analysis', coaching);
      }
    } catch (error) {
      logger.error('Error analyzing draft', error, {
        errorCode: error.code,
        hasUser: !!user,
        roomId: user?.roomId,
      });
      emitError(socket, 'Failed to analyze draft message.', error, 'analyze_draft');
    }
  });
}

module.exports = { registerCoachingHandlers };

