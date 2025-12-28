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
 */
export function setupTypingHandlers(socket, handlers) {
  const { setTypingUsers } = handlers;

  socket.on('user_typing', ({ username: typingName, isTyping }) => {
    setTypingUsers(prev => {
      const next = new Set(prev);
      isTyping ? next.add(typingName) : next.delete(typingName);
      return next;
    });
  });
}
