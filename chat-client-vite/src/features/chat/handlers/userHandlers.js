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
 */
export function setupUserHandlers(socket, handlers) {
  const { setMessages } = handlers;

  socket.on('user_joined', data =>
    window.dispatchEvent(new CustomEvent('coparent-joined', { detail: data }))
  );

  socket.on('message_flagged', ({ messageId, flaggedBy }) => {
    setMessages(prev =>
      prev.map(msg => (msg.id === messageId ? { ...msg, user_flagged_by: flaggedBy } : msg))
    );
  });
}
