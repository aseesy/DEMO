import { useState } from 'react';

/**
 * useTypingIndicators Hook
 *
 * Responsibility: Typing indicator state management ONLY
 *
 * What it does:
 * - Manages typingUsers Set state
 * - Provides setter for socket event handlers
 *
 * What it does NOT do:
 * - ❌ Socket connection management
 * - ❌ Socket event handling (done in typingHandlers.js)
 * - ❌ Emitting typing events (done in message sending)
 */
export function useTypingIndicators() {
  const [typingUsers, setTypingUsers] = useState(new Set());

  return {
    typingUsers,
    setTypingUsers,
  };
}

export default useTypingIndicators;
