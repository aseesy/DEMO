/**
 * Typing Handlers
 *
 * Handles typing indicator events:
 * - user_typing
 */

/**
 * Setup typing event handlers
 * @param {Object} socket - Socket.io socket instance
 * @param {Object} handlers - Handler functions and refs
 * @returns {Function} Cleanup function to remove listeners
 */
export function setupTypingHandlers(socket, handlers) {
  const { setTypingUsers } = handlers;

  const handleUserTyping = ({ username: typingName, isTyping }) => {
    setTypingUsers(prev => {
      const next = new Set(prev);
      isTyping ? next.add(typingName) : next.delete(typingName);
      return next;
    });
  };

  socket.on('user_typing', handleUserTyping);

  // Return cleanup function
  return () => {
    socket.off('user_typing', handleUserTyping);
  };
}
