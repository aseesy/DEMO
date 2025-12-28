/**
 * Other Handlers
 *
 * Handles miscellaneous socket events:
 * - user_joined
 * - message_flagged
 * - error
 * - replaced_by_new_connection
 * - Thread events
 * - Pagination events
 */

import { trackConnectionError } from '../../../utils/analyticsEnhancements.js';

/**
 * Setup other event handlers
 * @param {Object} socket - Socket.io socket instance
 * @param {Object} handlers - Handler functions and refs
 */
export function setupOtherHandlers(socket, handlers) {
  const {
    setMessages,
    setThreads,
    setThreadMessages,
    setIsLoadingThreadMessages,
    setIsLoadingOlder,
    setHasMoreMessages,
    loadingTimeoutRef,
    setError,
    setIsSearching,
  } = handlers;

  socket.on('user_joined', data =>
    window.dispatchEvent(new CustomEvent('coparent-joined', { detail: data }))
  );

  socket.on('message_flagged', ({ messageId, flaggedBy }) => {
    setMessages(prev =>
      prev.map(msg => (msg.id === messageId ? { ...msg, user_flagged_by: flaggedBy } : msg))
    );
  });

  socket.on('error', ({ message }) => {
    trackConnectionError('socket_error', message || 'Unknown socket error');
    console.error('Socket error:', message);
    setError(message);
    setIsLoadingOlder(false);
    if (setIsSearching) setIsSearching(false);
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
  });

  socket.on('replaced_by_new_connection', ({ message }) => {
    setError(message || 'You opened this chat in another tab.');
    socket.disconnect();
  });

  // Thread events - use DELTA UPDATES (client-side reducers, not full list refetches)
  // Full list only on initial load
  socket.on('threads_list', threadList => setThreads(threadList));

  // Delta: New thread created - add to array
  socket.on('thread_created', ({ thread }) => {
    if (thread) {
      setThreads(prev => {
        // Check if thread already exists (prevent duplicates)
        if (prev.some(t => t.id === thread.id)) {
          return prev;
        }
        // Add new thread at the beginning (most recent first)
        return [thread, ...prev];
      });
    }
  });

  // Delta: Thread message count changed - update specific thread
  socket.on('thread_message_count_changed', ({ threadId, messageCount, lastMessageAt }) => {
    setThreads(prev =>
      prev.map(thread =>
        thread.id === threadId
          ? {
              ...thread,
              message_count: messageCount,
              last_message_at: lastMessageAt || thread.last_message_at,
              updated_at: new Date().toISOString(),
            }
          : thread
      )
    );
  });

  // Legacy event - kept for backwards compatibility during transition
  socket.on('threads_updated', threadList => setThreads(threadList));

  // ============================================================================
  // HIERARCHICAL THREAD EVENTS (nested/sub-thread support)
  // ============================================================================

  // Delta: Sub-thread created - add to array with parent reference
  socket.on('sub_thread_created', ({ thread, parentThreadId }) => {
    if (thread) {
      setThreads(prev => {
        // Check if thread already exists (prevent duplicates)
        if (prev.some(t => t.id === thread.id)) {
          return prev;
        }
        // Add new sub-thread with hierarchy info
        return [{ ...thread, parent_thread_id: parentThreadId }, ...prev];
      });
    }
  });

  // Thread ancestors received - dispatch event for components to handle
  socket.on('thread_ancestors', ({ threadId, ancestors }) => {
    window.dispatchEvent(
      new CustomEvent('thread-ancestors-loaded', { detail: { threadId, ancestors } })
    );
  });

  // Sub-threads list received - dispatch event for components to handle
  socket.on('sub_threads_list', ({ parentThreadId, subThreads }) => {
    window.dispatchEvent(
      new CustomEvent('sub-threads-loaded', { detail: { parentThreadId, subThreads } })
    );
  });

  // Full thread hierarchy received - dispatch event for tree view components
  socket.on('thread_hierarchy', ({ rootThreadId, hierarchy }) => {
    window.dispatchEvent(
      new CustomEvent('thread-hierarchy-loaded', { detail: { rootThreadId, hierarchy } })
    );
  });

  socket.on('thread_messages', ({ threadId, messages: msgs }) => {
    setThreadMessages(prev => ({ ...prev, [threadId]: msgs }));
    if (setIsLoadingThreadMessages) setIsLoadingThreadMessages(false);
  });

  socket.on('older_messages', ({ messages: olderMsgs, hasMore }) => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
    setIsLoadingOlder(false);
    setHasMoreMessages(hasMore);
    if (olderMsgs?.length > 0) setMessages(prev => [...olderMsgs, ...prev]);
  });
}
