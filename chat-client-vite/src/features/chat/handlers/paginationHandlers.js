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
 * @returns {Function} Cleanup function to remove listeners
 */
export function setupPaginationHandlers(socket, handlers) {
  const { setMessages, setIsLoadingOlder, setHasMoreMessages, loadingTimeoutRef } = handlers;

  const handleOlderMessages = ({ messages: olderMsgs, hasMore }) => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
    setIsLoadingOlder(false);
    setHasMoreMessages(hasMore);
    if (olderMsgs?.length > 0) setMessages(prev => [...olderMsgs, ...prev]);
  };

  socket.on('older_messages', handleOlderMessages);

  // Return cleanup function
  return () => {
    socket.off('older_messages', handleOlderMessages);
  };
}
