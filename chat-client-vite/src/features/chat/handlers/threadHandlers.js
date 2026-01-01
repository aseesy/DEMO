/**
 * Thread Handlers
 *
 * Handles thread-related socket events:
 * - threads_list
 * - thread_created
 * - thread_message_count_changed
 * - threads_updated
 * - sub_thread_created
 * - thread_ancestors
 * - sub_threads_list
 * - thread_hierarchy
 * - thread_messages
 */

/**
 * Setup thread event handlers
 * @param {Object} socket - Socket.io socket instance
 * @param {Object} handlers - Handler functions and refs
 * @returns {Function} Cleanup function to remove listeners
 */
export function setupThreadHandlers(socket, handlers) {
  const { setThreads, setThreadMessages, setIsLoadingThreadMessages } = handlers;

  // Thread events - use DELTA UPDATES (client-side reducers, not full list refetches)
  // Full list only on initial load
  const handleThreadsList = threadList => setThreads(threadList);

  // Delta: New thread created - add to array
  const handleThreadCreated = ({ thread }) => {
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
  };

  // Delta: Thread message count changed - update specific thread
  const handleThreadMessageCountChanged = ({ threadId, messageCount, lastMessageAt }) => {
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
  };

  // Legacy event - kept for backwards compatibility during transition
  const handleThreadsUpdated = threadList => setThreads(threadList);

  // ============================================================================
  // HIERARCHICAL THREAD EVENTS (nested/sub-thread support)
  // ============================================================================

  // Delta: Sub-thread created - add to array with parent reference
  const handleSubThreadCreated = ({ thread, parentThreadId }) => {
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
  };

  // Thread ancestors received - dispatch event for components to handle
  const handleThreadAncestors = ({ threadId, ancestors }) => {
    window.dispatchEvent(
      new CustomEvent('thread-ancestors-loaded', { detail: { threadId, ancestors } })
    );
  };

  // Sub-threads list received - dispatch event for components to handle
  const handleSubThreadsList = ({ parentThreadId, subThreads }) => {
    window.dispatchEvent(
      new CustomEvent('sub-threads-loaded', { detail: { parentThreadId, subThreads } })
    );
  };

  // Full thread hierarchy received - dispatch event for tree view components
  const handleThreadHierarchy = ({ rootThreadId, hierarchy }) => {
    window.dispatchEvent(
      new CustomEvent('thread-hierarchy-loaded', { detail: { rootThreadId, hierarchy } })
    );
  };

  const handleThreadMessages = ({ threadId, messages: msgs }) => {
    setThreadMessages(prev => ({ ...prev, [threadId]: msgs }));
    if (setIsLoadingThreadMessages) setIsLoadingThreadMessages(false);
  };

  // Register all handlers
  socket.on('threads_list', handleThreadsList);
  socket.on('thread_created', handleThreadCreated);
  socket.on('thread_message_count_changed', handleThreadMessageCountChanged);
  socket.on('threads_updated', handleThreadsUpdated);
  socket.on('sub_thread_created', handleSubThreadCreated);
  socket.on('thread_ancestors', handleThreadAncestors);
  socket.on('sub_threads_list', handleSubThreadsList);
  socket.on('thread_hierarchy', handleThreadHierarchy);
  socket.on('thread_messages', handleThreadMessages);

  // Return cleanup function
  return () => {
    socket.off('threads_list', handleThreadsList);
    socket.off('thread_created', handleThreadCreated);
    socket.off('thread_message_count_changed', handleThreadMessageCountChanged);
    socket.off('threads_updated', handleThreadsUpdated);
    socket.off('sub_thread_created', handleSubThreadCreated);
    socket.off('thread_ancestors', handleThreadAncestors);
    socket.off('sub_threads_list', handleSubThreadsList);
    socket.off('thread_hierarchy', handleThreadHierarchy);
    socket.off('thread_messages', handleThreadMessages);
  };
}
