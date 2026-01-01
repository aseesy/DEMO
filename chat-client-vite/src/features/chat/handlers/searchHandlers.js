/**
 * Search Handlers
 *
 * Handles search-related socket events:
 * - search_results
 * - jump_to_message_result
 */

/**
 * Setup search event handlers
 * @param {Object} socket - Socket.io socket instance
 * @param {Object} handlers - Handler functions and refs
 * @returns {Function} Cleanup function to remove listeners
 */
export function setupSearchHandlers(socket, handlers) {
  const { setMessages, setIsSearching, setSearchResults, setSearchTotal, setHighlightedMessageId } =
    handlers;

  const handleSearchResults = ({ messages: results, total }) => {
    // Only handle if search handlers are provided (from useSearchMessages hook)
    if (setIsSearching && setSearchResults && setSearchTotal) {
      setIsSearching(false);
      setSearchResults(results || []);
      setSearchTotal(total || 0);
    }
  };

  const handleJumpToMessageResult = ({ messages: contextMsgs, targetMessageId }) => {
    if (contextMsgs?.length > 0) {
      setMessages(contextMsgs);
      setHighlightedMessageId(targetMessageId);
      setTimeout(() => {
        document
          .getElementById(`message-${targetMessageId}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      setTimeout(() => setHighlightedMessageId(null), 3000);
    }
  };

  socket.on('search_results', handleSearchResults);
  socket.on('jump_to_message_result', handleJumpToMessageResult);

  // Return cleanup function
  return () => {
    socket.off('search_results', handleSearchResults);
    socket.off('jump_to_message_result', handleJumpToMessageResult);
  };
}
