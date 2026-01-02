/**
 * Socket Thread Handlers
 *
 * Architecture:
 * - Emits delta updates (not full lists) to reduce bandwidth
 * - Server decides when to analyze (not client)
 * - Message counts use atomic database increments
 */

// Note: autoThreading is no longer imported here to break dependency cycle
// Embedding generation is handled by ThreadCreated/SubThreadCreated event listeners

function registerThreadHandlers(socket, io, services) {
  // Phase 2: No longer receives activeUsers
  // Services manage their own state via UserSessionService
  const { threadManager, userSessionService } = services;

  // create_thread handler - emits delta (new thread only)
  socket.on('create_thread', async ({ roomId, title, messageId, category }) => {
    try {
      const user = userSessionService.getUserBySocketId(socket.id);
      if (!user) {
        socket.emit('error', { message: 'You must join before creating threads.' });
        return;
      }

      const userEmail = user.email || user.username; // Fallback for backward compatibility
      const threadId = await threadManager.createThread(roomId, title, userEmail, messageId, category);

      // Note: Embedding generation is now handled by ThreadCreated event listener
      // No need to call autoThreading directly here - decoupled via domain events

      if (messageId) {
        await threadManager.addMessageToThread(messageId, threadId);
      }

      // Get the newly created thread for delta update
      const newThread = await threadManager.getThread(threadId);

      // DELTA UPDATE: Emit only the new thread, not the full list
      io.to(roomId).emit('thread_created', { thread: newThread });

      socket.emit('thread_created_success', { threadId, title });
    } catch (error) {
      console.error('Error creating thread:', error);
      socket.emit('error', { message: 'Failed to create thread.' });
    }
  });

  // get_threads handler - only time we fetch full list
  socket.on('get_threads', async ({ roomId }) => {
    try {
      const user = userSessionService.getUserBySocketId(socket.id);
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
      const user = userSessionService.getUserBySocketId(socket.id);
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

  // add_to_thread handler - emits delta (count change only)
  socket.on('add_to_thread', async ({ messageId, threadId }) => {
    try {
      const user = userSessionService.getUserBySocketId(socket.id);
      if (!user) {
        socket.emit('error', { message: 'You must join before adding to thread.' });
        return;
      }

      // Add message and get updated count atomically
      const result = await threadManager.addMessageToThread(messageId, threadId);

      if (user && user.roomId) {
        // DELTA UPDATE: Emit only the count change, not the full list
        io.to(user.roomId).emit('thread_message_count_changed', {
          threadId,
          messageCount: result.messageCount,
          lastMessageAt: result.lastMessageAt,
        });
      }

      socket.emit('message_added_to_thread', { messageId, threadId });
    } catch (error) {
      console.error('Error adding to thread:', error);
      socket.emit('error', { message: 'Failed to add message to thread.' });
    }
  });

  // remove_from_thread handler - emits delta (count change only)
  socket.on('remove_from_thread', async ({ messageId }) => {
    try {
      const user = userSessionService.getUserBySocketId(socket.id);
      if (!user) {
        socket.emit('error', { message: 'You must join before removing from thread.' });
        return;
      }

      const result = await threadManager.removeMessageFromThread(messageId);

      if (user && user.roomId && result.threadId) {
        // DELTA UPDATE: Emit only the count change, not the full list
        io.to(user.roomId).emit('thread_message_count_changed', {
          threadId: result.threadId,
          messageCount: result.messageCount,
        });
      }

      socket.emit('message_removed_from_thread', { messageId });
    } catch (error) {
      console.error('Error removing from thread:', error);
      socket.emit('error', { message: 'Failed to remove message from thread.' });
    }
  });

  // ============================================================================
  // HIERARCHICAL THREAD HANDLERS
  // ============================================================================

  // create_sub_thread handler - create a sub-thread spawned from a message
  socket.on('create_sub_thread', async ({ roomId, title, parentThreadId, parentMessageId }) => {
    try {
      const user = userSessionService.getUserBySocketId(socket.id);
      if (!user) {
        socket.emit('error', { message: 'You must join before creating sub-threads.' });
        return;
      }

      if (!parentThreadId) {
        socket.emit('error', { message: 'Parent thread ID is required for sub-threads.' });
        return;
      }

      const userEmail = user.email || user.username; // Fallback for backward compatibility
      const threadId = await threadManager.createSubThread(
        roomId,
        title,
        userEmail,
        parentThreadId,
        parentMessageId || null
      );

      // Generate embedding for sub-thread title
      if (autoThreading) {
        setImmediate(() => {
          autoThreading
            .ensureThreadEmbedding(threadId, roomId, title)
            .catch(err =>
              console.error('[AutoThreading] Error creating sub-thread embedding:', err.message)
            );
        });
      }

      // Get the newly created sub-thread for delta update
      const newThread = await threadManager.getThread(threadId);

      // DELTA UPDATE: Emit only the new sub-thread
      io.to(roomId).emit('sub_thread_created', {
        thread: newThread,
        parentThreadId,
      });

      socket.emit('sub_thread_created_success', { threadId, title, parentThreadId });
    } catch (error) {
      console.error('Error creating sub-thread:', error);
      socket.emit('error', { message: 'Failed to create sub-thread.' });
    }
  });

  // get_thread_ancestors handler - get parent chain up to root
  socket.on('get_thread_ancestors', async ({ threadId }) => {
    try {
      const user = userSessionService.getUserBySocketId(socket.id);
      if (!user) {
        socket.emit('error', { message: 'You must join before getting thread ancestors.' });
        return;
      }

      const ancestors = await threadManager.getThreadAncestors(threadId);
      socket.emit('thread_ancestors', { threadId, ancestors });
    } catch (error) {
      console.error('Error getting thread ancestors:', error);
      socket.emit('error', { message: 'Failed to get thread ancestors.' });
    }
  });

  // get_sub_threads handler - get direct child threads
  socket.on('get_sub_threads', async ({ threadId }) => {
    try {
      const user = userSessionService.getUserBySocketId(socket.id);
      if (!user) {
        socket.emit('error', { message: 'You must join before getting sub-threads.' });
        return;
      }

      const subThreads = await threadManager.getSubThreads(threadId);
      socket.emit('sub_threads_list', { parentThreadId: threadId, subThreads });
    } catch (error) {
      console.error('Error getting sub-threads:', error);
      socket.emit('error', { message: 'Failed to get sub-threads.' });
    }
  });

  // get_thread_hierarchy handler - get full tree of descendants
  socket.on('get_thread_hierarchy', async ({ threadId }) => {
    try {
      const user = userSessionService.getUserBySocketId(socket.id);
      if (!user) {
        socket.emit('error', { message: 'You must join before getting thread hierarchy.' });
        return;
      }

      const hierarchy = await threadManager.getThreadHierarchy(threadId);
      socket.emit('thread_hierarchy', { rootThreadId: threadId, hierarchy });
    } catch (error) {
      console.error('Error getting thread hierarchy:', error);
      socket.emit('error', { message: 'Failed to get thread hierarchy.' });
    }
  });

  // analyze_conversation_history handler
  // NOTE: This should primarily be triggered by server on join, not client
  socket.on('analyze_conversation_history', async ({ roomId, limit }) => {
    try {
      const user = userSessionService.getUserBySocketId(socket.id);
      if (!user) {
        socket.emit('error', { message: 'You must join before analyzing conversation history.' });
        return;
      }

      const result = await threadManager.analyzeConversationHistory(roomId, limit || 100);

      // If threads were created, emit each as a delta update
      if (result.createdThreads && result.createdThreads.length > 0) {
        for (const created of result.createdThreads) {
          const thread = await threadManager.getThread(created.threadId);
          if (thread) {
            io.to(roomId).emit('thread_created', { thread });
          }
        }
      }

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

/**
 * Server-side analysis trigger - called from connectionHandler on join
 * Checks if room needs analysis and triggers it automatically
 *
 * @param {Object} io - Socket.io server instance
 * @param {string} roomId - Room ID to analyze
 * @param {Object} threadManager - Thread manager service
 */
async function maybeAnalyzeRoomOnJoin(io, roomId, threadManager) {
  try {
    // Check if room has any threads already
    const existingThreads = await threadManager.getThreadsForRoom(roomId, false, 1);

    if (existingThreads.length > 0) {
      console.log(`[ThreadHandler] Room ${roomId} already has threads, skipping analysis`);
      return;
    }

    // Check if room has enough messages to analyze
    const messageStore = require('../messageStore');
    const recentMessages = await messageStore.getMessagesByRoom(roomId, 10);

    if (recentMessages.length < 5) {
      console.log(`[ThreadHandler] Room ${roomId} has only ${recentMessages.length} messages, skipping analysis`);
      return;
    }

    console.log(`[ThreadHandler] Room ${roomId} has no threads and ${recentMessages.length}+ messages, triggering analysis`);

    // Trigger analysis in background (don't block join)
    setImmediate(async () => {
      try {
        const result = await threadManager.analyzeConversationHistory(roomId, 100);

        if (result.createdThreads && result.createdThreads.length > 0) {
          console.log(`[ThreadHandler] Created ${result.createdThreads.length} threads for room ${roomId}`);

          // Emit each created thread as delta
          for (const created of result.createdThreads) {
            const thread = await threadManager.getThread(created.threadId);
            if (thread) {
              io.to(roomId).emit('thread_created', { thread });
            }
          }
        }
      } catch (err) {
        console.error(`[ThreadHandler] Auto-analysis failed for room ${roomId}:`, err.message);
      }
    });
  } catch (err) {
    console.error(`[ThreadHandler] maybeAnalyzeRoomOnJoin error:`, err.message);
  }
}

module.exports = { registerThreadHandlers, maybeAnalyzeRoomOnJoin };
