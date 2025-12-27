/**
 * Socket Contact Handlers
 */

function registerContactHandlers(socket, io, services) {
  const { dbSafe, aiMediator, userSessionService } = services;

  // contact_suggestion_response handler
  socket.on('contact_suggestion_response', async ({ response, detectedName, relationship }) => {
    try {
      const user = userSessionService.getUserBySocketId(socket.id);
      if (!user || !socket.data || !socket.data.pendingContactSuggestion) return;

      const pending = socket.data.pendingContactSuggestion;

      if (response === 'yes') {
        if (!relationship) {
          socket.emit('new_message', {
            id: `contact-relationship-${Date.now()}`,
            type: 'contact_relationship_prompt',
            username: 'AI Assistant',
            text: `What is ${pending.detectedName}'s relationship to you?`,
            detectedName: pending.detectedName,
            timestamp: new Date().toISOString(),
          });
          return;
        }

        const userResult = await dbSafe.safeSelect(
          'users',
          { username: user.username.toLowerCase() },
          { limit: 1 }
        );
        if (userResult.length > 0) {
          const now = new Date().toISOString();
          await dbSafe.safeInsert('contacts', {
            user_id: userResult[0].id,
            contact_name: pending.detectedName,
            relationship: relationship || null,
            notes: `Mentioned in chat: ${pending.messageContext}`,
            created_at: now,
            updated_at: now,
          });

          socket.emit('new_message', {
            id: `contact-added-${Date.now()}`,
            type: 'system',
            username: 'AI Assistant',
            text: `✅ ${pending.detectedName} has been added to your contacts!`,
            timestamp: new Date().toISOString(),
          });
        }
      }
      delete socket.data.pendingContactSuggestion;
    } catch (error) {
      console.error('Error handling contact suggestion response:', error);
    }
  });

  // contact_relationship handler
  socket.on('contact_relationship', async ({ detectedName, relationship }) => {
    try {
      const user = userSessionService.getUserBySocketId(socket.id);
      if (!user || !socket.data || !socket.data.pendingContactSuggestion) return;

      const userResult = await dbSafe.safeSelect(
        'users',
        { username: user.username.toLowerCase() },
        { limit: 1 }
      );
      if (userResult.length > 0) {
        const pending = socket.data.pendingContactSuggestion;
        const now = new Date().toISOString();
        await dbSafe.safeInsert('contacts', {
          user_id: userResult[0].id,
          contact_name: detectedName || pending.detectedName,
          relationship: relationship || null,
          notes: `Mentioned in chat: ${pending.messageContext}`,
          created_at: now,
          updated_at: now,
        });

        socket.emit('new_message', {
          id: `contact-added-${Date.now()}`,
          type: 'system',
          username: 'AI Assistant',
          text: `✅ ${detectedName || pending.detectedName} has been added to your contacts as ${relationship || 'a contact'}!`,
          timestamp: new Date().toISOString(),
        });
        delete socket.data.pendingContactSuggestion;
      }
    } catch (error) {
      console.error('Error handling contact relationship:', error);
    }
  });

  // flag_message handler
  socket.on('flag_message', async ({ messageId, reason }) => {
    try {
      const user = userSessionService.getUserBySocketId(socket.id);
      if (!user) return;

      const messageResult = await services.dbPostgres.query(
        `SELECT * FROM messages WHERE id = $1 AND room_id = $2 LIMIT 1`,
        [messageId, user.roomId]
      );
      if (messageResult.rows.length === 0) return;

      const message = messageResult.rows[0];
      if (message.username?.toLowerCase() === user.username?.toLowerCase()) {
        socket.emit('error', { message: 'You cannot flag your own messages.' });
        return;
      }

      let flaggedBy = JSON.parse(message.user_flagged_by || '[]');
      const isCurrentlyFlagged = flaggedBy.includes(user.username);

      if (isCurrentlyFlagged) {
        flaggedBy = flaggedBy.filter(u => u !== user.username);
      } else {
        flaggedBy.push(user.username);
        if (reason?.trim()) {
          await dbSafe.safeInsert('message_flags', {
            message_id: messageId,
            flagged_by_username: user.username,
            reason: reason.trim(),
            created_at: new Date().toISOString(),
          });
        }
      }

      await dbSafe.safeUpdate(
        'messages',
        { user_flagged_by: JSON.stringify(flaggedBy) },
        { id: messageId }
      );
      io.to(user.roomId).emit('message_flagged', { messageId, flaggedBy, roomId: user.roomId });
    } catch (error) {
      console.error('Error flagging message:', error);
    }
  });
}

module.exports = { registerContactHandlers };

