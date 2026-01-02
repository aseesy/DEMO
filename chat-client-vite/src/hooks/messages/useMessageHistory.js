/**
 * useMessageHistory - Hook for loading message history via REST API
 *
 * Provides a way to load message history using the new REST API
 * as an alternative or fallback to socket-based loading.
 */

import { useState, useEffect, useCallback } from 'react';
import { messageApi } from '../../services/api/messageApi';

/**
 * Hook for loading message history via REST API
 * @param {string} roomId - Room ID to load messages for
 * @param {Object} options - Options
 * @param {boolean} options.enabled - Whether to load messages (default: true)
 * @param {number} options.limit - Message limit (default: 50)
 * @param {number} options.offset - Offset for pagination (default: 0)
 */
export function useMessageHistory(roomId, options = {}) {
  const { enabled = true, limit = 50, offset = 0 } = options;
  
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  const loadMessages = useCallback(async (roomIdToLoad, options = {}) => {
    if (!roomIdToLoad || !enabled) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await messageApi.getRoomMessages(roomIdToLoad, {
        limit: options.limit || limit,
        offset: options.offset || offset,
        ...options,
      });

      setMessages(result.messages || []);
      setHasMore(result.hasMore || false);
      setTotal(result.total || 0);
    } catch (err) {
      console.error('[useMessageHistory] Error loading messages:', err);
      setError(err.message || 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [enabled, limit, offset]);

  // Auto-load when roomId changes
  useEffect(() => {
    if (roomId && enabled) {
      loadMessages(roomId);
    }
  }, [roomId, enabled, loadMessages]);

  const loadOlder = useCallback(async () => {
    if (!roomId || !hasMore || isLoading) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await messageApi.getRoomMessages(roomId, {
        limit,
        offset: messages.length,
      });

      if (result.messages && result.messages.length > 0) {
        setMessages(prev => [...result.messages, ...prev]);
        setHasMore(result.hasMore || false);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('[useMessageHistory] Error loading older messages:', err);
      setError(err.message || 'Failed to load older messages');
    } finally {
      setIsLoading(false);
    }
  }, [roomId, hasMore, isLoading, messages.length, limit]);

  return {
    messages,
    isLoading,
    error,
    hasMore,
    total,
    loadMessages,
    loadOlder,
    refresh: () => loadMessages(roomId),
  };
}

export default useMessageHistory;

