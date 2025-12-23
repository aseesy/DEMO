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

/**
 * useMessagePagination - Manages message pagination
 *
 * @param {Object} options
 * @param {React.RefObject} options.socketRef - Socket reference for emitting events
 * @param {Array} options.messages - Current messages array (to get beforeTimestamp)
 * @param {Function} options.setIsLoadingOlder - Set loading state (optional, creates internal state if not provided)
 * @param {Function} options.setHasMoreMessages - Set has more messages state (optional, creates internal state if not provided)
 * @param {Function} options.setIsInitialLoad - Set initial load state (optional, creates internal state if not provided)
 * @returns {Object} { isLoadingOlder, hasMoreMessages, isInitialLoad, loadOlderMessages }
 */
export function useMessagePagination({
  socketRef,
  messages = [],
  setIsLoadingOlder: externalSetIsLoadingOlder,
  setHasMoreMessages: externalSetHasMoreMessages,
  setIsInitialLoad: externalSetIsInitialLoad,
} = {}) {
  // Internal state (used if external setters not provided)
  const [internalIsLoadingOlder, setInternalIsLoadingOlder] = React.useState(false);
  const [internalHasMoreMessages, setInternalHasMoreMessages] = React.useState(true);
  const [internalIsInitialLoad, setInternalIsInitialLoad] = React.useState(true);

  // Use external setters if provided, otherwise use internal state
  const isLoadingOlder = externalSetIsLoadingOlder ? undefined : internalIsLoadingOlder;
  const hasMoreMessages = externalSetHasMoreMessages ? undefined : internalHasMoreMessages;
  const isInitialLoad = externalSetIsInitialLoad ? undefined : internalIsInitialLoad;

  const setIsLoadingOlder = externalSetIsLoadingOlder || setInternalIsLoadingOlder;
  const setHasMoreMessages = externalSetHasMoreMessages || setInternalHasMoreMessages;
  const setIsInitialLoad = externalSetIsInitialLoad || setInternalIsInitialLoad;

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
  }, [socketRef, messages, isLoadingOlder, hasMoreMessages, setIsLoadingOlder]);

  return {
    isLoadingOlder,
    hasMoreMessages,
    isInitialLoad,
    loadOlderMessages,
    // Expose setters for socket event handlers
    setIsLoadingOlder,
    setHasMoreMessages,
    setIsInitialLoad,
  };
}

export default useMessagePagination;

