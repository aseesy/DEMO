/**
 * Socket Thread Handlers
 *
 * Architecture:
 * - Emits delta updates (not full lists) to reduce bandwidth
 * - Server decides when to analyze (not client)
 * - Message counts use atomic database increments
 *
 * New Conversation-Based Threading:
 * - get_conversation_threads: Get threads grouped by category
 * - get_thread_details: Get full thread with messages, decisions, open items
 * - process_room_threads: Trigger thread processing manually
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
      const user = await userSessionService.getUserBySocketId(socket.id);
      if (!user) {
        socket.emit('error', { message: 'You must join before creating threads.' });
        return;
      }

      // Validate input
      if (!roomId || typeof roomId !== 'string') {
        socket.emit('error', { message: 'Invalid roomId: must be a non-empty string.' });
        return;
      }

      if (!title || typeof title !== 'string' || title.trim().length < 3) {
        socket.emit('error', { message: 'Thread title must be at least 3 characters long.' });
        return;
      }

      if (title.trim().length > 100) {
        socket.emit('error', { message: 'Thread title must be 100 characters or less.' });
        return;
      }

      // messageId is optional, but if provided must be string
      if (messageId !== null && messageId !== undefined && typeof messageId !== 'string') {
        socket.emit('error', { message: 'Invalid messageId: must be a string or null.' });
        return;
      }

      const userEmail = user.email || user.username; // Fallback for backward compatibility
      const threadId = await threadManager.createThread(
        roomId,
        title.trim(),
        userEmail,
        messageId || null,
        category
      );

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
      const user = await userSessionService.getUserBySocketId(socket.id);
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

  // get_thread_messages handler - supports pagination
  socket.on('get_thread_messages', async ({ threadId, limit = 50, offset = 0 }) => {
    try {
      const user = await userSessionService.getUserBySocketId(socket.id);
      if (!user) {
        socket.emit('error', { message: 'You must join before getting thread messages.' });
        return;
      }

      // Validate pagination parameters
      const validLimit = Math.min(Math.max(1, parseInt(limit) || 50), 200); // Clamp between 1-200
      const validOffset = Math.max(0, parseInt(offset) || 0);

      const messages = await threadManager.getThreadMessages(threadId, validLimit, validOffset);
      socket.emit('thread_messages', {
        threadId,
        messages,
        limit: validLimit,
        offset: validOffset,
      });
    } catch (error) {
      console.error('Error getting thread messages:', error);
      socket.emit('error', { message: 'Failed to get thread messages.' });
    }
  });

  // add_to_thread handler - emits delta (count change only)
  socket.on('add_to_thread', async ({ messageId, threadId }) => {
    try {
      const user = await userSessionService.getUserBySocketId(socket.id);
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
      const user = await userSessionService.getUserBySocketId(socket.id);
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
      const user = await userSessionService.getUserBySocketId(socket.id);
      if (!user) {
        socket.emit('error', { message: 'You must join before creating sub-threads.' });
        return;
      }

      // Validate input
      if (!roomId || typeof roomId !== 'string') {
        socket.emit('error', { message: 'Invalid roomId: must be a non-empty string.' });
        return;
      }

      if (!title || typeof title !== 'string' || title.trim().length < 3) {
        socket.emit('error', { message: 'Thread title must be at least 3 characters long.' });
        return;
      }

      if (title.trim().length > 100) {
        socket.emit('error', { message: 'Thread title must be 100 characters or less.' });
        return;
      }

      if (!parentThreadId || typeof parentThreadId !== 'string') {
        socket.emit('error', {
          message: 'Parent thread ID is required for sub-threads and must be a string.',
        });
        return;
      }

      // parentMessageId is optional
      if (
        parentMessageId !== null &&
        parentMessageId !== undefined &&
        typeof parentMessageId !== 'string'
      ) {
        socket.emit('error', { message: 'Invalid parentMessageId: must be a string or null.' });
        return;
      }

      const userEmail = user.email || user.username; // Fallback for backward compatibility
      const threadId = await threadManager.createSubThread(
        roomId,
        title.trim(),
        userEmail,
        parentThreadId,
        parentMessageId || null
      );

      // Note: Embedding generation is handled by SubThreadCreated event listener
      // No need to call autoThreading directly here - decoupled via domain events

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
      const user = await userSessionService.getUserBySocketId(socket.id);
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
      const user = await userSessionService.getUserBySocketId(socket.id);
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
      const user = await userSessionService.getUserBySocketId(socket.id);
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

  // reply_in_thread handler - send a message directly in a thread
  socket.on('reply_in_thread', async ({ threadId, text, messageData = {} }) => {
    try {
      const user = await userSessionService.getUserBySocketId(socket.id);
      if (!user) {
        socket.emit('error', { message: 'You must join before replying in threads.' });
        return;
      }

      if (!user.roomId) {
        socket.emit('error', { message: 'You must be in a room to reply in threads.' });
        return;
      }

      // Validate input
      if (!threadId || typeof threadId !== 'string') {
        socket.emit('error', { message: 'Invalid threadId: must be a non-empty string.' });
        return;
      }

      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        socket.emit('error', { message: 'Message text is required and cannot be empty.' });
        return;
      }

      const userEmail = user.email || user.username;
      const result = await threadManager.replyInThread(
        threadId,
        text.trim(),
        userEmail,
        user.roomId,
        messageData
      );

      // Emit thread_message_count_changed for real-time updates
      io.to(user.roomId).emit('thread_message_count_changed', {
        threadId,
        messageCount: result.thread.messageCount,
        lastMessageAt: result.thread.lastMessageAt,
      });

      // Emit message to room (so it appears in real-time)
      io.to(user.roomId).emit('new_message', result.message);

      socket.emit('reply_in_thread_success', {
        threadId,
        messageId: result.message.id,
      });
    } catch (error) {
      console.error('Error replying in thread:', error);
      socket.emit('error', { message: error.message || 'Failed to reply in thread.' });
    }
  });

  // move_message_to_thread handler - move a message between threads
  socket.on('move_message_to_thread', async ({ messageId, targetThreadId, roomId }) => {
    try {
      const user = await userSessionService.getUserBySocketId(socket.id);
      if (!user) {
        socket.emit('error', { message: 'You must join before moving messages.' });
        return;
      }

      // Validate input
      if (!messageId || typeof messageId !== 'string') {
        socket.emit('error', { message: 'Invalid messageId: must be a non-empty string.' });
        return;
      }

      // targetThreadId can be null (to move to main chat), but if provided must be string
      if (
        targetThreadId !== null &&
        targetThreadId !== undefined &&
        typeof targetThreadId !== 'string'
      ) {
        socket.emit('error', { message: 'Invalid targetThreadId: must be a string or null.' });
        return;
      }

      const effectiveRoomId = roomId || user.roomId;
      if (!effectiveRoomId) {
        socket.emit('error', { message: 'Room ID is required. You must be in a room.' });
        return;
      }

      const result = await threadManager.moveMessageToThread(
        messageId,
        targetThreadId || null,
        effectiveRoomId
      );

      // Emit thread_message_count_changed for all affected threads
      for (const affected of result.affectedThreads) {
        io.to(roomId || user.roomId).emit('thread_message_count_changed', {
          threadId: affected.threadId,
          messageCount: affected.messageCount,
        });
      }

      socket.emit('message_moved_to_thread_success', {
        messageId,
        oldThreadId: result.oldThreadId,
        newThreadId: result.newThreadId,
      });
    } catch (error) {
      console.error('Error moving message to thread:', error);
      socket.emit('error', { message: error.message || 'Failed to move message to thread.' });
    }
  });

  // archive_thread handler - archive or unarchive a thread
  socket.on('archive_thread', async ({ threadId, archived = true, cascade = true }) => {
    try {
      const user = await userSessionService.getUserBySocketId(socket.id);
      if (!user) {
        socket.emit('error', { message: 'You must join before archiving threads.' });
        return;
      }

      // Validate input
      if (!threadId || typeof threadId !== 'string') {
        socket.emit('error', { message: 'Invalid threadId: must be a non-empty string.' });
        return;
      }

      // Normalize boolean values
      const shouldArchive = archived === true || archived === 'true' || archived === 1;
      const shouldCascade = cascade === true || cascade === 'true' || cascade === 1;

      // Get thread to verify it exists and get room ID
      const thread = await threadManager.getThread(threadId);
      if (!thread) {
        socket.emit('error', { message: 'Thread not found.' });
        return;
      }

      // Archive/unarchive thread (with cascade support)
      const result = await threadManager.archiveThread(threadId, shouldArchive, shouldCascade);

      // DELTA UPDATE: Emit thread_archived event to all room members
      io.to(thread.room_id).emit('thread_archived', {
        threadId,
        archived: shouldArchive,
        cascade: shouldCascade,
        affectedThreadIds: result.affectedThreadIds,
      });

      socket.emit('thread_archived_success', { threadId, archived: shouldArchive });
    } catch (error) {
      console.error('Error archiving thread:', error);
      socket.emit('error', { message: error.message || 'Failed to archive thread.' });
    }
  });

  // analyze_conversation_history handler
  // NOTE: This should primarily be triggered by server on join, not client
  socket.on('analyze_conversation_history', async ({ roomId, limit }) => {
    try {
      const user = await userSessionService.getUserBySocketId(socket.id);
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

  // ============================================================================
  // CONVERSATION-BASED THREAD HANDLERS (New System)
  // ============================================================================

  // get_conversation_threads - Get threads grouped by category
  socket.on('get_conversation_threads', async ({ roomId, limitPerCategory, includeDetails }) => {
    try {
      const user = await userSessionService.getUserBySocketId(socket.id);
      if (!user) {
        socket.emit('error', { message: 'You must join before getting conversation threads.' });
        return;
      }

      const { getThreadService } = require('../src/services/threads');
      const threadService = getThreadService();

      const threads = await threadService.getThreadsByCategory(roomId, {
        limitPerCategory: limitPerCategory || 5,
        includeDetails: includeDetails || false,
      });

      const totalCount = Object.values(threads).reduce(
        (sum, categoryThreads) => sum + categoryThreads.length,
        0
      );

      socket.emit('conversation_threads', {
        roomId,
        threads,
        categories: Object.keys(threads),
        totalCount,
      });
    } catch (error) {
      console.error('Error getting conversation threads:', error);
      socket.emit('error', { message: 'Failed to get conversation threads.' });
    }
  });

  // get_thread_details - Get full thread with messages, decisions, open items
  socket.on('get_thread_details', async ({ threadId }) => {
    try {
      const user = await userSessionService.getUserBySocketId(socket.id);
      if (!user) {
        socket.emit('error', { message: 'You must join before getting thread details.' });
        return;
      }

      const { getThreadService } = require('../src/services/threads');
      const threadService = getThreadService();

      const thread = await threadService.getThreadWithDetails(threadId);

      if (!thread) {
        socket.emit('error', { message: 'Thread not found.' });
        return;
      }

      socket.emit('thread_details', { thread });
    } catch (error) {
      console.error('Error getting thread details:', error);
      socket.emit('error', { message: 'Failed to get thread details.' });
    }
  });

  // process_room_threads - Trigger thread processing manually
  socket.on('process_room_threads', async ({ roomId }) => {
    try {
      const user = await userSessionService.getUserBySocketId(socket.id);
      if (!user) {
        socket.emit('error', { message: 'You must join before processing threads.' });
        return;
      }

      const { getThreadService } = require('../src/services/threads');
      const threadService = getThreadService();

      console.log(`[ThreadHandler] Processing threads for room ${roomId} (manual trigger)`);
      const result = await threadService.processRoom(roomId);

      // Emit threads_updated event to all room members
      io.to(roomId).emit('threads_updated', {
        roomId,
        created: result.created,
        updated: result.updated,
        skipped: result.skipped || false,
      });

      socket.emit('process_room_threads_complete', {
        roomId,
        ...result,
        message: result.skipped
          ? 'AI not available, processing skipped'
          : `Processed: ${result.created} created, ${result.updated} updated`,
      });
    } catch (error) {
      console.error('Error processing room threads:', error);
      socket.emit('error', { message: 'Failed to process room threads.' });
    }
  });

  // backfill_room_threads - Backfill all historical threads
  socket.on('backfill_room_threads', async ({ roomId, limit, batchSize }) => {
    try {
      const user = await userSessionService.getUserBySocketId(socket.id);
      if (!user) {
        socket.emit('error', { message: 'You must join before backfilling threads.' });
        return;
      }

      const { getThreadService } = require('../src/services/threads');
      const threadService = getThreadService();

      console.log(`[ThreadHandler] Backfilling threads for room ${roomId}`);
      const result = await threadService.backfillRoom(roomId, {
        limit: limit || 500,
        batchSize: batchSize || 10,
      });

      // Emit threads_updated event to all room members
      io.to(roomId).emit('threads_updated', {
        roomId,
        created: result.created,
        updated: 0,
        backfill: true,
      });

      socket.emit('backfill_room_threads_complete', {
        roomId,
        ...result,
        message: `Backfill complete: ${result.created} threads created from ${result.processed} windows`,
      });
    } catch (error) {
      console.error('Error backfilling room threads:', error);
      socket.emit('error', { message: 'Failed to backfill room threads.' });
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
    console.log(`[ThreadHandler] 🔍 DEBUG: maybeAnalyzeRoomOnJoin called for room ${roomId}`);

    const messageStore = require('../messageStore');
    const dbPostgres = require('../dbPostgres');

    // Get recent messages (last 30 days, last 100 messages)
    const recentMessages = await messageStore.getMessagesByRoom(roomId, 100);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Filter to only valid, recent messages
    const validMessages = recentMessages.filter(m => {
      if (!m.text || m.type === 'system' || m.private || m.flagged || !m.username) {
        return false;
      }
      const msgDate = new Date(m.timestamp);
      return msgDate >= thirtyDaysAgo;
    });

    console.log(
      `[ThreadHandler] 🔍 DEBUG: Found ${validMessages.length} valid recent messages (out of ${recentMessages.length} total)`
    );

    // FIXED: Lower threshold for testing and early analysis (was 5, now 2)
    const MIN_MESSAGES_FOR_ANALYSIS = 2;
    if (validMessages.length < MIN_MESSAGES_FOR_ANALYSIS) {
      console.log(
        `[ThreadHandler] Room ${roomId} has only ${validMessages.length} messages (need ${MIN_MESSAGES_FOR_ANALYSIS}+), skipping analysis`
      );
      io.to(roomId).emit('conversation_analysis_complete', {
        roomId,
        createdThreadsCount: 0,
        skipped: true,
        reason: 'insufficient_messages',
      });
      return;
    }

    // FIXED: Check for unthreaded messages instead of just checking if threads exist
    // This allows ongoing analysis even if threads already exist
    const unthreadedCount = await dbPostgres.query(
      `SELECT COUNT(*) as count 
       FROM messages 
       WHERE room_id = $1 
         AND thread_id IS NULL 
         AND type != 'system' 
         AND (private IS NULL OR private = 0)
         AND (flagged IS NULL OR flagged = 0)
         AND text IS NOT NULL 
         AND text != ''
         AND timestamp >= $2`,
      [roomId, thirtyDaysAgo]
    );

    const unthreadedMessageCount = parseInt(unthreadedCount.rows[0].count, 10);
    console.log(
      `[ThreadHandler] 🔍 DEBUG: Found ${unthreadedMessageCount} unthreaded messages in last 30 days`
    );

    // Only skip if there are NO unthreaded messages to analyze
    if (unthreadedMessageCount === 0) {
      const existingThreads = await threadManager.getThreadsForRoom(roomId, false, 1);
      console.log(
        `[ThreadHandler] Room ${roomId} has ${existingThreads.length} threads and 0 unthreaded messages, skipping analysis`
      );
      io.to(roomId).emit('conversation_analysis_complete', {
        roomId,
        createdThreadsCount: existingThreads.length,
        skipped: true,
        reason: 'all_messages_threaded',
      });
      return;
    }

    console.log(
      `[ThreadHandler] ✅ Room ${roomId} has ${unthreadedMessageCount} unthreaded messages, triggering analysis`
    );

    // Check OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.warn(`[ThreadHandler] ⚠️  OPENAI_API_KEY not set - analysis will be skipped`);
      io.to(roomId).emit('conversation_analysis_complete', {
        roomId,
        createdThreadsCount: 0,
        skipped: true,
        reason: 'no_openai_key',
      });
      return;
    }

    // Analysis will run - log is already above

    // Trigger analysis in background (don't block join)
    setImmediate(async () => {
      try {
        console.log(
          `[ThreadHandler] 🔍 DEBUG: Starting analyzeConversationHistory for room ${roomId}`
        );
        const result = await threadManager.analyzeConversationHistory(roomId, 100);
        console.log(`[ThreadHandler] 🔍 DEBUG: Analysis result:`, {
          suggestions: result.suggestions?.length || 0,
          createdThreads: result.createdThreads?.length || 0,
        });

        if (result.createdThreads && result.createdThreads.length > 0) {
          console.log(
            `[ThreadHandler] ✅ Created ${result.createdThreads.length} threads for room ${roomId}`
          );

          // Emit each created thread as delta
          for (const created of result.createdThreads) {
            const thread = await threadManager.getThread(created.threadId);
            if (thread) {
              console.log(
                `[ThreadHandler] 🔍 DEBUG: Emitting thread_created for thread ${thread.id}: ${thread.title}`
              );
              io.to(roomId).emit('thread_created', { thread });
            } else {
              console.warn(
                `[ThreadHandler] ⚠️  Thread ${created.threadId} not found after creation`
              );
            }
          }
        } else {
          console.log(`[ThreadHandler] ⚠️  Analysis completed but no threads were created`);
          if (result.suggestions && result.suggestions.length > 0) {
            console.log(
              `[ThreadHandler] 🔍 DEBUG: ${result.suggestions.length} suggestions were generated but not created`
            );
          }
        }

        // CRITICAL: Emit analysis complete event so frontend knows analysis finished
        // This prevents infinite "analyzing conversation" state
        io.to(roomId).emit('conversation_analysis_complete', {
          roomId,
          createdThreadsCount: result.createdThreads?.length || 0,
        });
        console.log(
          `[ThreadHandler] ✅ Analysis complete for room ${roomId}, created ${result.createdThreads?.length || 0} threads`
        );
      } catch (err) {
        console.error(`[ThreadHandler] ❌ Auto-analysis failed for room ${roomId}:`, err.message);
        console.error(`[ThreadHandler] 🔍 DEBUG: Error stack:`, err.stack);
        // Even on error, emit completion event so frontend doesn't get stuck
        io.to(roomId).emit('conversation_analysis_complete', {
          roomId,
          createdThreadsCount: 0,
          error: err.message,
        });
      }
    });
  } catch (err) {
    console.error(`[ThreadHandler] ❌ maybeAnalyzeRoomOnJoin error:`, err.message);
    console.error(`[ThreadHandler] 🔍 DEBUG: Error stack:`, err.stack);
  }
}

module.exports = { registerThreadHandlers, maybeAnalyzeRoomOnJoin };
