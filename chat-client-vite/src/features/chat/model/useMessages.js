/**
 * useMessages Hook
 *
 * Responsibility: Message state management ONLY
 *
 * What it does:
 * - Manages messages array state
 * - Manages pending messages (optimistic updates)
 * - Manages message statuses (sent, pending, failed, etc.)
 * - Provides setters for socket event handlers
 *
 * What it does NOT do:
 * - ❌ Socket connection management
 * - ❌ Socket event handling (receives setters from socket handlers)
 * - ❌ Message sending logic
 * - ❌ Message validation
 * - ❌ Offline queue management (that's in useChatSocket for now)
 *
 * Architecture:
 *   useMessages (this hook)
 *     ↓ provides setters
 *   socketEventHandlers (uses setters to update state)
 *     ↓ receives events
 *   Socket.io
 */

import React from 'react';

/**
 * useMessages - Manages message state
 *
 * @param {Object} options
 * @param {React.RefObject} options.socketRef - Socket reference (for future use)
 * @returns {Object} { messages, setMessages, pendingMessages, setPendingMessages, messageStatuses, setMessageStatuses }
 */
export function useMessages({ socketRef } = {}) {
  // Messages array
  const [messages, setMessages] = React.useState([]);

  // Pending messages (optimistic updates)
  const [pendingMessages, setPendingMessages] = React.useState(new Map());

  // Message statuses (sent, pending, failed, queued, etc.)
  const [messageStatuses, setMessageStatuses] = React.useState(new Map());

  // Wrapped setMessages with safeguard to prevent accidental clearing
  const safeSetMessages = React.useCallback((updater) => {
    setMessages(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      
      // CRITICAL: Never allow messages to be cleared to empty array unless explicitly intended
      // Log if we're about to clear messages unexpectedly
      if (Array.isArray(next) && next.length === 0 && prev.length > 0) {
        const hasRealMessages = prev.some(msg => msg.id && !msg.id.startsWith('pending_') && !msg.isOptimistic);
        if (hasRealMessages) {
          console.error('[useMessages] ⚠️ WARNING: Attempting to clear messages with real content!', {
            prevCount: prev.length,
            realMessagesCount: prev.filter(msg => msg.id && !msg.id.startsWith('pending_') && !msg.isOptimistic).length,
            stack: new Error().stack,
          });
          // Don't clear - return previous state
          return prev;
        }
      }
      
      return next;
    });
  }, []);

  return {
    // State
    messages,
    pendingMessages,
    messageStatuses,

    // Setters (for socket event handlers)
    setMessages: safeSetMessages,
    setPendingMessages,
    setMessageStatuses,
  };
}

export default useMessages;

