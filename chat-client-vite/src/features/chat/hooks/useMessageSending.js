/**
 * useMessageSending Hook
 *
 * Handles message sending logic:
 * - emitOrQueueMessage: Creates optimistic message and sends via socket or queues offline
 * - sendMessage: Main send handler with AI analysis checks
 */

import React from 'react';

/**
 * Hook for handling message sending
 * @param {Object} params
 * @param {Object} params.socketRef - Socket ref
 * @param {string} params.inputMessage - Current input message
 * @param {string} params.username - Current username
 * @param {boolean} params.isPreApprovedRewrite - Whether message is AI rewrite
 * @param {string} params.originalRewrite - Original rewrite text
 * @param {Object} params.draftCoaching - Draft coaching state
 * @param {Function} params.setDraftCoaching - Set draft coaching
 * @param {Function} params.setMessages - Set messages
 * @param {Function} params.setPendingMessages - Set pending messages
 * @param {Function} params.setMessageStatuses - Set message statuses
 * @param {Function} params.setError - Set error
 * @param {Object} params.offlineQueueRef - Offline queue ref
 * @param {Object} params.typingTimeoutRef - Typing timeout ref
 * @returns {Object} { sendMessage, emitOrQueueMessage }
 */
export function useMessageSending({
  socketRef,
  inputMessage,
  username,
  isPreApprovedRewrite,
  originalRewrite,
  draftCoaching,
  setDraftCoaching,
  setMessages,
  setPendingMessages,
  setMessageStatuses,
  setError,
  offlineQueueRef,
  typingTimeoutRef,
}) {
  // Emit message via socket or queue for offline
  const emitOrQueueMessage = React.useCallback(
    text => {
      if (!text || !username) return;

      const now = new Date().toISOString();
      const messageId = `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const optimisticMessage = {
        id: messageId,
        text,
        username,
        displayName: username,
        timestamp: now,
        created_at: now,
        isPreApprovedRewrite,
        originalRewrite,
        status: 'sending', // Visual indicator
        isOptimistic: true, // Flag for optimistic update
      };

      // OPTIMISTIC UPDATE: Add message to UI immediately
      setMessages(prev => [...prev, optimisticMessage]);

      // Track in pending messages for status updates
      setPendingMessages(prev => new Map(prev).set(messageId, optimisticMessage));
      setMessageStatuses(prev => new Map(prev).set(messageId, 'sending'));

      if (socketRef.current?.connected) {
        socketRef.current.emit('send_message', {
          text,
          isPreApprovedRewrite,
          originalRewrite,
          optimisticId: messageId, // Send ID so server can correlate
        });
      } else {
        offlineQueueRef.current.push(optimisticMessage);
        try {
          localStorage.setItem('liaizen_offline_queue', JSON.stringify(offlineQueueRef.current));
        } catch (e) {
          /* ignore */
        }
        setError('Not connected. Message will be sent when connection is restored.');
        // Update status to queued
        setMessageStatuses(prev => new Map(prev).set(messageId, 'queued'));
      }

      // Clear input and draft coaching
      setDraftCoaching(null);
    },
    [
      username,
      isPreApprovedRewrite,
      originalRewrite,
      socketRef,
      offlineQueueRef,
      setError,
      setDraftCoaching,
      setMessages,
      setPendingMessages,
      setMessageStatuses,
      typingTimeoutRef,
    ]
  );

  // Clear typing indicator when sending
  React.useEffect(() => {
    if (typingTimeoutRef?.current) {
      return () => {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        if (socketRef.current) {
          socketRef.current.emit('typing', { isTyping: false });
        }
      };
    }
  }, [socketRef, typingTimeoutRef]);

  // Send message via WebSocket - backend handles all AI analysis
  // This is the SINGLE transport protocol for message analysis (no HTTP API)
  const sendMessage = React.useCallback(
    async e => {
      if (e?.preventDefault) e.preventDefault();
      const clean = inputMessage.trim();
      if (!clean || !socketRef.current) return;

      // If we already have a draft coaching result for this exact message
      // and it shows intervention needed, don't send
      if (draftCoaching && draftCoaching.observerData && draftCoaching.originalText === clean) {
        return;
      }

      // AI-GENERATED REWRITES: Skip analysis only if not edited
      if (isPreApprovedRewrite && originalRewrite) {
        if (clean === originalRewrite.trim()) {
          console.log('[ChatContext] Skipping analysis for unedited AI rewrite');
          emitOrQueueMessage(clean);
          return;
        }
      }

      // Show "Analyzing..." state while backend processes
      setDraftCoaching({ analyzing: true, riskLevel: 'low', shouldSend: false });

      // Send message via WebSocket - backend handles all AI analysis
      // Backend will emit either:
      // - 'new_message' if clean (clears analyzing state)
      // - 'draft_coaching' if intervention needed (shows ObserverCard)
      emitOrQueueMessage(clean);
    },
    [
      inputMessage,
      emitOrQueueMessage,
      socketRef,
      setDraftCoaching,
      draftCoaching,
      isPreApprovedRewrite,
      originalRewrite,
    ]
  );

  return { sendMessage, emitOrQueueMessage };
}

