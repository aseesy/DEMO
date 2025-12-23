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

  return {
    // State
    messages,
    pendingMessages,
    messageStatuses,

    // Setters (for socket event handlers)
    setMessages,
    setPendingMessages,
    setMessageStatuses,
  };
}

export default useMessages;

