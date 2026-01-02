/**
 * useMessagePagination Hook
 *
 * Responsibility: Message pagination state, operations, AND subscriptions
 *
 * What it does:
 * - Manages pagination state (isLoadingOlder, hasMoreMessages, isInitialLoad)
 * - Subscribes to older_messages socket event
 * - Provides loadOlderMessages function
 * - Handles loading timeout safety
 *
 * What it does NOT do:
 * - ❌ Socket connection management
 * - ❌ Message content management (appending done via callback)
 * - ❌ UI concerns (scrolling, etc.)
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { socketService } from '../../../services/socket/index.js';

const LOADING_TIMEOUT_MS = 10000;

/**
 * useMessagePagination - Manages message pagination
 *
 * @param {Object} options
 * @param {Array} options.messages - Current messages array (to get beforeTimestamp)
 * @param {Function} options.onOlderMessages - Callback when older messages are received
 * @returns {Object} { isLoadingOlder, hasMoreMessages, isInitialLoad, loadOlderMessages, setters... }
 */
export function useMessagePagination({ messages = [], onOlderMessages } = {}) {
  // Pagination state
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Timeout ref for loading safety
  const loadingTimeoutRef = useRef(null);

  // Keep callback ref in sync
  const onOlderMessagesRef = useRef(onOlderMessages);
  useEffect(() => {
    onOlderMessagesRef.current = onOlderMessages;
  }, [onOlderMessages]);

  // Subscribe to older_messages event
  useEffect(() => {
    const unsubscribe = socketService.subscribe('older_messages', data => {
      setIsLoadingOlder(false);

      if (data.messages?.length > 0) {
        setHasMoreMessages(data.messages.length >= 50);
        // Notify parent to prepend messages
        onOlderMessagesRef.current?.(data.messages);
      } else {
        setHasMoreMessages(false);
      }
    });

    return unsubscribe;
  }, []);

  // Loading timeout effect - prevents stuck loading state
  useEffect(() => {
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
  const loadOlderMessages = useCallback(() => {
    if (
      !socketService.isConnected() ||
      isLoadingOlder ||
      !hasMoreMessages ||
      messages.length === 0
    ) {
      return;
    }

    setIsLoadingOlder(true);

    socketService.emit('load_older_messages', {
      beforeTimestamp: messages[0].timestamp,
      limit: 50,
    });
  }, [messages, isLoadingOlder, hasMoreMessages]);

  return {
    // State
    isLoadingOlder,
    hasMoreMessages,
    isInitialLoad,

    // Setters (for external use, e.g., when joining room)
    setIsLoadingOlder,
    setHasMoreMessages,
    setIsInitialLoad,

    // Methods
    loadOlderMessages,
  };
}

export default useMessagePagination;
