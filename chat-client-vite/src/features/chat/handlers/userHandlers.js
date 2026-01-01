/**
 * User Handlers
 *
 * Handles user-related socket events:
 * - user_joined
 * - message_flagged
 */

/**
 * Setup user event handlers
 * @param {Object} socket - Socket.io socket instance
 * @param {Object} handlers - Handler functions and refs
 * @returns {Function} Cleanup function to remove listeners
 */
export function setupUserHandlers(socket, handlers) {
  const { setMessages } = handlers;

  const handleUserJoined = data => {
    window.dispatchEvent(new CustomEvent('coparent-joined', { detail: data }));
  };

  const handleMessageFlagged = ({ messageId, flaggedBy }) => {
    setMessages(prev =>
      prev.map(msg => (msg.id === messageId ? { ...msg, user_flagged_by: flaggedBy } : msg))
    );
  };

  socket.on('user_joined', handleUserJoined);
  socket.on('message_flagged', handleMessageFlagged);

  // Return cleanup function
  return () => {
    socket.off('user_joined', handleUserJoined);
    socket.off('message_flagged', handleMessageFlagged);
  };
}
