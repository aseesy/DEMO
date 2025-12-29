/**
 * Pagination Handlers
 *
 * Handles pagination-related socket events:
 * - older_messages
 */

/**
 * Setup pagination event handlers
 * @param {Object} socket - Socket.io socket instance
 * @param {Object} handlers - Handler functions and refs
 */
export function setupPaginationHandlers(socket, handlers) {
  const { setMessages, setIsLoadingOlder, setHasMoreMessages, loadingTimeoutRef } = handlers;

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
