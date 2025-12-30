/**
 * useTypingIndicator Hook
 *
 * Handles typing indicator logic:
 * - Emits typing events to socket
 * - Manages typing timeout
 */

import React from 'react';

/**
 * Hook for handling typing indicators
 * @param {Object} socketRef - Socket ref
 * @param {Object} typingTimeoutRef - Typing timeout ref (optional, will create if not provided)
 * @returns {Object} { emitTyping, typingTimeoutRef }
 */
export function useTypingIndicator(socketRef, providedTypingTimeoutRef) {
  const typingTimeoutRef = providedTypingTimeoutRef || React.useRef(null);

  const emitTyping = React.useCallback(
    (isTyping) => {
      if (!socketRef.current) return;

      socketRef.current.emit('typing', { isTyping });

      if (isTyping) {
        // Clear existing timeout
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        // Set new timeout to stop typing after 1 second
        typingTimeoutRef.current = setTimeout(() => {
          socketRef.current?.emit('typing', { isTyping: false });
        }, 1000);
      } else {
        // Clear timeout if explicitly stopping
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      }
    },
    [socketRef, typingTimeoutRef]
  );

  return { emitTyping, typingTimeoutRef };
}

