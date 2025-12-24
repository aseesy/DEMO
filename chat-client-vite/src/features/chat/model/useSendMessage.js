/**
 * useSendMessage Hook
 *
 * Handles message sending via WebSocket:
 * - Sends messages to backend for AI analysis (single transport protocol)
 * - Pending message tracking
 * - Offline queue management
 * - Draft coaching integration (receives analysis results from backend)
 */

import React from 'react';
import {
  createPendingMessage,
  createMessagePayload,
  saveOfflineQueue,
  MESSAGE_STATUS,
} from '../../../utils/messageBuilder.js';

export function useSendMessage({
  socketRef,
  username,
  inputMessage,
  isPreApprovedRewrite,
  originalRewrite,
  clearInput,
  stopTyping,
  setDraftCoaching,
  setError,
  offlineQueueRef,
  scrollToBottom,
}) {
  // Pending message tracking
  const [pendingMessages, setPendingMessages] = React.useState(new Map());
  const [messageStatuses, setMessageStatuses] = React.useState(new Map());

  // Send message via WebSocket (backend handles AI analysis)
  const sendMessage = React.useCallback(
    async e => {
      if (e?.preventDefault) e.preventDefault();
      const clean = inputMessage.trim();
      if (!clean || !socketRef?.current) return;

      // AI-GENERATED REWRITES: Skip analysis only if not edited
      if (isPreApprovedRewrite && originalRewrite) {
        // Check if the message matches the original rewrite (not edited)
        if (clean === originalRewrite.trim()) {
          console.log('[useSendMessage] Skipping analysis for unedited AI rewrite');
          sendCleanMessage(clean);
          stopTyping?.();
          return;
        }
        console.log('[useSendMessage] Rewrite was edited, will be analyzed by backend');
      }

      // Show "Analyzing..." state while backend processes
      setDraftCoaching?.({
        analyzing: true,
        riskLevel: 'low',
        shouldSend: false,
      });

      // Send message via WebSocket - backend handles all AI analysis
      // Backend will emit either:
      // - 'new_message' if clean (clears analyzing state via message receipt)
      // - 'draft_coaching' if intervention needed (shows ObserverCard)
      sendCleanMessage(clean);
      stopTyping?.();
    },
    [
      inputMessage,
      socketRef,
      isPreApprovedRewrite,
      originalRewrite,
      setDraftCoaching,
      stopTyping,
    ]
  );

  // Internal: Send a clean message
  const sendCleanMessage = React.useCallback(
    text => {
      const pendingMessage = createPendingMessage({
        text,
        username,
        socketId: socketRef?.current?.id,
        isPreApprovedRewrite,
        originalRewrite,
      });

      // Add to pending messages
      setPendingMessages(prev => {
        const next = new Map(prev);
        next.set(pendingMessage.id, pendingMessage);
        return next;
      });

      // Mark status as pending
      setMessageStatuses(prev => {
        const next = new Map(prev);
        next.set(pendingMessage.id, MESSAGE_STATUS.PENDING);
        return next;
      });

      // Try to send immediately if connected
      if (socketRef?.current?.connected) {
        socketRef.current.emit(
          'send_message',
          createMessagePayload({
            text,
            isPreApprovedRewrite,
            originalRewrite,
          })
        );
      } else {
        // Queue for offline sending
        offlineQueueRef.current.push(pendingMessage);
        saveOfflineQueue(offlineQueueRef.current);
        setError?.('Not connected. Message will be sent when connection is restored.');
      }

      clearInput?.();
      setDraftCoaching?.(null);

      // Scroll to bottom after sending
      setTimeout(() => scrollToBottom?.(), 100);
    },
    [
      username,
      socketRef,
      isPreApprovedRewrite,
      originalRewrite,
      offlineQueueRef,
      clearInput,
      setDraftCoaching,
      setError,
      scrollToBottom,
    ]
  );

  // Mark message as sent
  const markMessageSent = React.useCallback(messageId => {
    setMessageStatuses(prev => {
      const next = new Map(prev);
      next.set(messageId, 'sent');
      return next;
    });
    setPendingMessages(prev => {
      const next = new Map(prev);
      next.delete(messageId);
      return next;
    });
  }, []);

  // Mark message as failed
  const markMessageFailed = React.useCallback(messageId => {
    setMessageStatuses(prev => {
      const next = new Map(prev);
      next.set(messageId, 'failed');
      return next;
    });
  }, []);

  return {
    pendingMessages,
    setPendingMessages,
    messageStatuses,
    setMessageStatuses,
    sendMessage,
    markMessageSent,
    markMessageFailed,
  };
}

export default useSendMessage;
