/**
 * Socket Thread Handlers
 */

// Auto-threading service for embedding generation
let autoThreading = null;
try {
  autoThreading = require('../services/autoThreading');
} catch (err) {
  console.warn('⚠️  Auto-threading service not available:', err.message);
}

function registerThreadHandlers(socket, io, services, activeUsers) {
  const { threadManager } = services;

  // create_thread handler
  socket.on('create_thread', async ({ roomId, title, messageId }) => {
    try {
      const user = activeUsers.get(socket.id);
      if (!user) {
        socket.emit('error', { message: 'You must join before creating threads.' });
        return;
      }

      const threadId = await threadManager.createThread(roomId, title, user.username, messageId);

      // Generate embedding for thread title (for semantic matching)
      if (autoThreading) {
        setImmediate(() => {
          autoThreading
            .ensureThreadEmbedding(threadId, roomId, title)
            .catch(err =>
              console.error('[AutoThreading] Error creating thread embedding:', err.message)
            );
        });
      }

      if (messageId) {
        await threadManager.addMessageToThread(messageId, threadId);
      }

      const threads = await threadManager.getThreadsForRoom(roomId);
      io.to(roomId).emit('threads_updated', threads);

      socket.emit('thread_created', { threadId, title });
    } catch (error) {
      console.error('Error creating thread:', error);
      socket.emit('error', { message: 'Failed to create thread.' });
    }
  });

  // get_threads handler
  socket.on('get_threads', async ({ roomId }) => {
    try {
      const user = activeUsers.get(socket.id);
      if (!user) {
        socket.emit('error', { message: 'You must join before getting threads.' });
        return;
      }

      const threads = await threadManager.getThreadsForRoom(roomId);
      socket.emit('threads_list', threads);
    } catch (error) {
      console.error('Error getting threads:', error);
      socket.emit('error', { message: 'Failed to get threads.' });
    }
  });

  // get_thread_messages handler
  socket.on('get_thread_messages', async ({ threadId }) => {
    try {
      const user = activeUsers.get(socket.id);
      if (!user) {
        socket.emit('error', { message: 'You must join before getting thread messages.' });
        return;
      }

      const messages = await threadManager.getThreadMessages(threadId);
      socket.emit('thread_messages', { threadId, messages });
    } catch (error) {
      console.error('Error getting thread messages:', error);
      socket.emit('error', { message: 'Failed to get thread messages.' });
    }
  });

  // add_to_thread handler
  socket.on('add_to_thread', async ({ messageId, threadId }) => {
    try {
      const user = activeUsers.get(socket.id);
      if (!user) {
        socket.emit('error', { message: 'You must join before adding to thread.' });
        return;
      }

      await threadManager.addMessageToThread(messageId, threadId);

      const userObj = activeUsers.get(socket.id);
      if (userObj) {
        const threads = await threadManager.getThreadsForRoom(userObj.roomId);
        io.to(userObj.roomId).emit('threads_updated', threads);
      }

      socket.emit('message_added_to_thread', { messageId, threadId });
    } catch (error) {
      console.error('Error adding to thread:', error);
      socket.emit('error', { message: 'Failed to add message to thread.' });
    }
  });

  // remove_from_thread handler
  socket.on('remove_from_thread', async ({ messageId }) => {
    try {
      const user = activeUsers.get(socket.id);
      if (!user) {
        socket.emit('error', { message: 'You must join before removing from thread.' });
        return;
      }

      await threadManager.removeMessageFromThread(messageId);

      const userObj = activeUsers.get(socket.id);
      if (userObj) {
        const threads = await threadManager.getThreadsForRoom(userObj.roomId);
        io.to(userObj.roomId).emit('threads_updated', threads);
      }

      socket.emit('message_removed_from_thread', { messageId });
    } catch (error) {
      console.error('Error removing from thread:', error);
      socket.emit('error', { message: 'Failed to remove message from thread.' });
    }
  });

  // analyze_conversation_history handler
  socket.on('analyze_conversation_history', async ({ roomId, limit }) => {
    try {
      const user = activeUsers.get(socket.id);
      if (!user) {
        socket.emit('error', { message: 'You must join before analyzing conversation history.' });
        return;
      }

      const result = await threadManager.analyzeConversationHistory(roomId, limit || 100);

      // If threads were created, refresh the threads list for all room members
      if (result.createdThreads && result.createdThreads.length > 0) {
        const threads = await threadManager.getThreadsForRoom(roomId);
        io.to(roomId).emit('threads_updated', threads);
      }

      socket.emit('conversation_analysis', {
        roomId,
        suggestions: result.suggestions || [],
        createdThreads: result.createdThreads || [],
      });

      // Also emit completion event for consistency
      socket.emit('conversation_analysis_complete', {
        roomId,
        createdThreadsCount: result.createdThreads?.length || 0,
      });
    } catch (error) {
      console.error('Error analyzing conversation history:', error);
      socket.emit('error', { message: 'Failed to analyze conversation history.' });
    }
  });
}

module.exports = { registerThreadHandlers };
