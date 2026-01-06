/**
 * useMessageTransport Hook
 * 
 * Responsibility: Network Transport ONLY
 * 
 * What it does:
 * - Handles WebSocket message sending (via Socket.io)
 * - Manages connection state tracking
 * - Handles offline queue management (via MessageQueueService)
 * - Provides transport abstraction (via MessageTransportService)
 * - Supports HTTP fallback (for future use)
 * 
 * What it does NOT do:
 * - ❌ UI state management (delegated to useMessageUI)
 * - ❌ Business logic/validation (delegated to useMessageMediation)
 * - ❌ Message analysis (delegated to useMessageMediation)
 * - ❌ Creating pending messages (delegated to useMessageUI)
 */

import React from 'react';
import { createMessageTransportService } from '../../../services/message/MessageTransportService.js';
import { createMessageQueueService } from '../../../services/message/MessageQueueService.js';
import { createMessagePayload, saveOfflineQueue } from '../../../utils/messageBuilder.js';

/**
 * useMessageTransport - Manages network transport for messages
 * 
 * Phase 2: Enhanced to use services for better separation of concerns
 * 
 * @param {Object} options
 * @param {React.RefObject} options.socketRef - Socket reference
 * @param {React.RefObject} options.offlineQueueRef - Offline queue reference (legacy - kept for backward compatibility)
 * @param {Function} options.setError - Set error callback
 * @returns {Object} { sendMessage, isConnected, getConnectionId, connectionState }
 */
export function useMessageTransport({ socketRef, offlineQueueRef, setError } = {}) {
  // Create transport service instance
  const transportService = React.useMemo(() => {
    if (!socketRef?.current) return null;
    return createMessageTransportService(socketRef.current);
  }, [socketRef?.current]);

  // Create queue service instance
  const queueService = React.useMemo(() => {
    return createMessageQueueService();
  }, []);

  // Track connection state
  const [connectionState, setConnectionState] = React.useState({
    isConnected: socketRef?.current?.connected ?? false,
    lastConnected: null,
    lastDisconnected: null,
  });

  // Check if connected (computed from state)
  const isConnected = React.useMemo(() => {
    return connectionState.isConnected || (socketRef?.current?.connected ?? false);
  }, [connectionState.isConnected, socketRef?.current?.connected]);

  /**
   * Flush queued messages when connection is restored
   * @private
   */
  const flushQueuedMessages = React.useCallback(async () => {
    // Check connection directly from socket ref to avoid stale closure
    const socketConnected = socketRef?.current?.connected ?? false;
    if (!socketConnected || !transportService || !socketRef?.current) {
      return;
    }

    // Get queued messages from both sources (legacy ref and service)
    let queuedMessages = [];

    // Check legacy offlineQueueRef first
    if (offlineQueueRef?.current && Array.isArray(offlineQueueRef.current)) {
      queuedMessages = [...offlineQueueRef.current];
    } else if (queueService) {
      // Fallback to queue service
      queuedMessages = queueService.getQueue();
    }

    if (queuedMessages.length === 0) {
      return;
    }

    console.log(`[useMessageTransport] Flushing ${queuedMessages.length} queued message(s)`);

    // Send each queued message
    for (const msg of queuedMessages) {
      try {
        const payload = {
          ...createMessagePayload({
            text: msg.text,
            isPreApprovedRewrite: msg.isPreApprovedRewrite,
            originalRewrite: msg.originalRewrite,
          }),
          ...(msg.optimisticId && { optimisticId: msg.optimisticId }),
        };

        const sent = await transportService.sendMessage(payload);
        if (sent) {
          // Remove from queue on success
          if (offlineQueueRef?.current) {
            const index = offlineQueueRef.current.findIndex(m => m.id === msg.id);
            if (index !== -1) {
              offlineQueueRef.current.splice(index, 1);
              saveOfflineQueue(offlineQueueRef.current);
            }
          } else if (queueService) {
            queueService.dequeue(msg.id);
          }
          console.log(`[useMessageTransport] Successfully sent queued message: ${msg.id}`);
        } else {
          console.warn(`[useMessageTransport] Failed to send queued message: ${msg.id}`);
        }
      } catch (error) {
        console.error(`[useMessageTransport] Error sending queued message ${msg.id}:`, error);
        // Don't remove from queue on error - will retry on next reconnect
      }
    }
  }, [transportService, socketRef, queueService, offlineQueueRef]);

  // Update connection state when socket connection changes
  React.useEffect(() => {
    if (!socketRef?.current) return;

    const socket = socketRef.current;
    const handleConnect = () => {
      setConnectionState(prev => ({
        isConnected: true,
        lastConnected: new Date().toISOString(),
        lastDisconnected: prev.lastDisconnected,
      }));

      // Auto-flush queued messages when reconnecting
      // Use setTimeout to ensure state has updated
      setTimeout(() => {
        flushQueuedMessages();
      }, 100);
    };

    const handleDisconnect = () => {
      setConnectionState(prev => ({
        isConnected: false,
        lastConnected: prev.lastConnected,
        lastDisconnected: new Date().toISOString(),
      }));
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // Set initial state
    setConnectionState(prev => ({
      ...prev,
      isConnected: socket.connected,
    }));

    // If already connected, try to flush any existing queue
    if (socket.connected) {
      setTimeout(() => {
        flushQueuedMessages();
      }, 100);
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [socketRef, flushQueuedMessages]);

  // Get connection ID
  const getConnectionId = React.useCallback(() => {
    return socketRef?.current?.id ?? transportService?.getConnectionId() ?? null;
  }, [socketRef, transportService]);

  /**
   * Send message via WebSocket (or queue if offline)
   * 
   * @param {Object} params
   * @param {string} params.text - Message text
   * @param {boolean} params.isPreApprovedRewrite - Is this a rewrite
   * @param {string} params.originalRewrite - Original rewrite text
   * @param {string} params.optimisticId - Optional optimistic message ID for correlation
   * @returns {Promise<Object>} { success: boolean, queued?: boolean, error?: string }
   */
  const sendMessage = React.useCallback(
    async ({ text, isPreApprovedRewrite, originalRewrite, optimisticId }) => {
      if (!socketRef?.current) {
        return { success: false, error: 'Socket not available' };
      }

      const payload = {
        ...createMessagePayload({
          text,
          isPreApprovedRewrite,
          originalRewrite,
        }),
        ...(optimisticId && { optimisticId }), // Include optimistic ID if provided
      };

      // Try to send immediately if connected
      if (isConnected && transportService) {
        try {
          const sent = await transportService.sendMessage(payload);
          if (sent) {
            return { success: true };
          } else {
            // Transport service returned false - queue it
            return await queueForOffline({ text, isPreApprovedRewrite, originalRewrite });
          }
        } catch (error) {
          console.error('[useMessageTransport] Error sending message:', error);
          // On error, try to queue for offline
          return await queueForOffline({ text, isPreApprovedRewrite, originalRewrite });
        }
      } else {
        // Not connected - queue for offline
        return await queueForOffline({ text, isPreApprovedRewrite, originalRewrite });
      }
    },
    [socketRef, transportService, isConnected, queueService, setError]
  );

  /**
   * Queue message for offline sending
   * @private
   */
  const queueForOffline = React.useCallback(
    async ({ text, isPreApprovedRewrite, originalRewrite }) => {
      const pendingMessage = {
        id: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text,
        timestamp: new Date().toISOString(),
        isPreApprovedRewrite,
        originalRewrite,
      };

      // Use legacy offlineQueueRef for now (backward compatibility)
      // TODO: Phase 3+ will migrate to queueService fully
      if (offlineQueueRef?.current) {
        offlineQueueRef.current.push(pendingMessage);
        saveOfflineQueue(offlineQueueRef.current);
      } else if (queueService) {
        // Fallback to queue service if ref not available
        queueService.enqueue(pendingMessage);
      }

      setError?.('Not connected. Message will be sent when connection is restored.');
      return { success: false, queued: true };
    },
    [queueService, offlineQueueRef, setError]
  );

  // Expose queue size for UI
  const getQueueSize = React.useCallback(() => {
    if (offlineQueueRef?.current && Array.isArray(offlineQueueRef.current)) {
      return offlineQueueRef.current.length;
    } else if (queueService) {
      return queueService.size();
    }
    return 0;
  }, [queueService, offlineQueueRef]);

  return {
    sendMessage,
    isConnected,
    getConnectionId,
    connectionState,
    getQueueSize,
    flushQueuedMessages,
  };
}

export default useMessageTransport;

