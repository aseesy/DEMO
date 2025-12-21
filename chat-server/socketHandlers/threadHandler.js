/**
 * Socket Thread Handlers
 */

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
}

module.exports = { registerThreadHandlers };
