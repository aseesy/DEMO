/**
 * useMessagePagination Hook
 *
 * Responsibility: Message pagination state and operations ONLY
 *
 * What it does:
 * - Manages pagination state (isLoadingOlder, hasMoreMessages, isInitialLoad)
 * - Provides loadOlderMessages function
 * - Handles pagination logic
 *
 * What it does NOT do:
 * - ❌ Socket connection management
 * - ❌ Message state management
 * - ❌ UI concerns (scrolling, etc.)
 *
 * Architecture:
 *   useMessagePagination (this hook)
 *     ↓ uses
 *   socketRef (from useChatSocket)
 *     ↓ emits
 *   Socket.io (load_older_messages event)
 */

import React from 'react';

const LOADING_TIMEOUT_MS = 10000;

/**
 * useMessagePagination - Manages message pagination
 *
 * @param {Object} options
 * @param {React.RefObject} options.socketRef - Socket reference for emitting events
 * @param {Array} options.messages - Current messages array (to get beforeTimestamp)
 * @returns {Object} { isLoadingOlder, hasMoreMessages, isInitialLoad, loadOlderMessages, setters... }
 */
export function useMessagePagination({ socketRef, messages = [] } = {}) {
  // Pagination state
  const [isLoadingOlder, setIsLoadingOlder] = React.useState(false);
  const [hasMoreMessages, setHasMoreMessages] = React.useState(true);
  const [isInitialLoad, setIsInitialLoad] = React.useState(true);

  // Timeout ref for loading safety
  const loadingTimeoutRef = React.useRef(null);

  // Loading timeout effect - prevents stuck loading state
  React.useEffect(() => {
    if (isLoadingOlder) {
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = setTimeout(() => {
        console.warn('[useMessagePagination] Loading older messages timed out');
        setIsLoadingOlder(false);
      }, LOADING_TIMEOUT_MS);
    }
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [isLoadingOlder]);

  // Load older messages
  const loadOlderMessages = React.useCallback(() => {
    if (
      !socketRef?.current?.connected ||
      isLoadingOlder ||
      !hasMoreMessages ||
      messages.length === 0
    ) {
      return;
    }

    setIsLoadingOlder(true);

    // Emit load_older_messages event
    socketRef.current.emit('load_older_messages', {
      beforeTimestamp: messages[0].timestamp,
      limit: 50,
    });
  }, [socketRef, messages, isLoadingOlder, hasMoreMessages]);

  return {
    // State
    isLoadingOlder,
    hasMoreMessages,
    isInitialLoad,

    // Setters (for socket event handlers)
    setIsLoadingOlder,
    setHasMoreMessages,
    setIsInitialLoad,

    // Methods
    loadOlderMessages,
  };
}

export default useMessagePagination;
