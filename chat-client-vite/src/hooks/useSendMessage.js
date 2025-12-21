/**
 * useSendMessage Hook
 *
 * Handles message sending with analysis and offline queue:
 * - Message analysis before sending
 * - Pending message tracking
 * - Offline queue management
 * - Draft coaching integration
 */

import React from 'react';
import {
  createPendingMessage,
  createMessagePayload,
  saveOfflineQueue,
  MESSAGE_STATUS,
} from '../utils/messageBuilder.js';
import { DEFAULT_SENDER_PROFILE, DEFAULT_RECEIVER_PROFILE } from '../utils/profileBuilder.js';

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

  // Send message with analysis
  const sendMessage = React.useCallback(
    async e => {
      if (e?.preventDefault) e.preventDefault();
      const clean = inputMessage.trim();
      if (!clean || !socketRef?.current) return;

      // OBSERVER/MEDIATOR FRAMEWORK: Analyze message before sending
      const { analyzeMessage, shouldSendMessage } = await import('../utils/messageAnalyzer.js');

      try {
        // 1. Show "Analyzing..." state
        setDraftCoaching?.({
          analyzing: true,
          riskLevel: 'low',
          shouldSend: false,
        });

        // 2. Analyze the message
        const senderProfile = DEFAULT_SENDER_PROFILE;
        const receiverProfile = DEFAULT_RECEIVER_PROFILE;
        const analysis = await analyzeMessage(clean, senderProfile, receiverProfile);

        // 3. Traffic Control
        const decision = shouldSendMessage(analysis);

        if (decision.shouldSend) {
          // SCENARIO A: CLEAN - Send the message
          sendCleanMessage(clean);
        } else {
          // SCENARIO B: CONFLICT DETECTED - Show Observer Card, don't send
          setDraftCoaching?.({
            analyzing: false,
            riskLevel: analysis.escalation?.riskLevel || 'medium',
            shouldSend: false,
            observerData: decision.observerData,
            originalText: clean,
            analysis: analysis,
          });
          // Don't clear input - user can edit or use rewrite
        }

        stopTyping?.();
      } catch (error) {
        console.error('Error analyzing message:', error);
        // On error, allow message through (fail open)
        sendCleanMessage(clean);
      }
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
