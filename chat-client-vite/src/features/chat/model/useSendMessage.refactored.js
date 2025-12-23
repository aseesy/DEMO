/**
 * useSendMessage Hook - REFACTORED VERSION
 *
 * Responsibility: UI State Management ONLY
 *
 * What it does:
 * - Manages pending message state (UI concerns)
 * - Manages message statuses (UI concerns)
 * - Coordinates between services (orchestration)
 * - Handles UI feedback (scrolling, clearing input)
 *
 * What it does NOT do:
 * - ❌ Direct socket communication (delegated to MessageTransportService)
 * - ❌ Message validation/analysis (delegated to MessageValidationService)
 * - ❌ Offline queue management (delegated to MessageQueueService)
 *
 * Architecture:
 *   UI Hook (this file)
 *     ↓
 *   MessageValidationService (business logic)
 *     ↓
 *   MessageTransportService (transport)
 *     ↓
 *   SocketAdapter (socket.io abstraction)
 */

import React from 'react';
import {
  createPendingMessage,
  createMessagePayload,
  MESSAGE_STATUS,
} from '../../../utils/messageBuilder.js';
import {
  createMessageTransportService,
  createMessageValidationService,
  createMessageQueueService,
} from '../../../services/message/index.js';

/**
 * useSendMessage - UI state management hook
 *
 * @param {Object} options
 * @param {Object} options.transport - MessageTransportService instance
 * @param {Object} options.validationService - MessageValidationService instance
 * @param {Object} options.queueService - MessageQueueService instance
 * @param {string} options.username - Current username
 * @param {string} options.inputMessage - Current input text
 * @param {boolean} options.isPreApprovedRewrite - Is this a rewrite
 * @param {string} options.originalRewrite - Original message if rewrite
 * @param {Function} options.clearInput - Clear input callback
 * @param {Function} options.stopTyping - Stop typing indicator
 * @param {Function} options.setDraftCoaching - Set draft coaching callback
 * @param {Function} options.setError - Set error callback
 * @param {Function} options.scrollToBottom - Scroll callback
 */
export function useSendMessage({
  transport, // MessageTransportService instance
  validationService, // MessageValidationService instance
  queueService, // MessageQueueService instance
  username,
  inputMessage,
  isPreApprovedRewrite,
  originalRewrite,
  clearInput,
  stopTyping,
  setDraftCoaching,
  setError,
  scrollToBottom,
}) {
  // UI State: Pending messages tracking
  const [pendingMessages, setPendingMessages] = React.useState(new Map());
  const [messageStatuses, setMessageStatuses] = React.useState(new Map());

  // Internal: Send a validated message
  const sendValidatedMessage = React.useCallback(
    async text => {
      // Create pending message for UI
      const pendingMessage = createPendingMessage({
        text,
        username,
        socketId: transport.getConnectionId(),
        isPreApprovedRewrite,
        originalRewrite,
      });

      // Update UI state
      setPendingMessages(prev => {
        const next = new Map(prev);
        next.set(pendingMessage.id, pendingMessage);
        return next;
      });

      setMessageStatuses(prev => {
        const next = new Map(prev);
        next.set(pendingMessage.id, MESSAGE_STATUS.PENDING);
        return next;
      });

      // Try to send via transport
      const sent = await transport.sendMessage({
        text,
        isPreApprovedRewrite,
        originalRewrite,
      });

      if (!sent) {
        // Queue for offline sending
        queueService.enqueue(pendingMessage);
        setError?.('Not connected. Message will be sent when connection is restored.');
        setMessageStatuses(prev => {
          const next = new Map(prev);
          next.set(pendingMessage.id, MESSAGE_STATUS.QUEUED);
          return next;
        });
      }

      // UI feedback
      clearInput?.();
      setDraftCoaching?.(null);
      setTimeout(() => scrollToBottom?.(), 100);
    },
    [
      username,
      transport,
      queueService,
      isPreApprovedRewrite,
      originalRewrite,
      clearInput,
      setDraftCoaching,
      setError,
      scrollToBottom,
    ]
  );

  // Send message - orchestrates services
  const sendMessage = React.useCallback(
    async e => {
      if (e?.preventDefault) e.preventDefault();
      const clean = inputMessage.trim();
      if (!clean) return;

      // Step 1: Validate message (business logic - delegated to service)
      setDraftCoaching?.({
        analyzing: true,
        riskLevel: 'low',
        shouldSend: false,
      });

      try {
        const validation = await validationService.validateMessage(clean);

        if (validation.shouldSend) {
          // Step 2: Send via transport (network - delegated to service)
          await sendValidatedMessage(clean);
        } else {
          // Step 3: Show intervention (UI feedback)
          setDraftCoaching?.({
            analyzing: false,
            riskLevel: validation.analysis?.escalation?.riskLevel || 'medium',
            shouldSend: false,
            observerData: validation.observerData,
            originalText: clean,
            analysis: validation.analysis,
          });
          // Don't clear input - user can edit or use rewrite
        }

        stopTyping?.();
      } catch (error) {
        console.error('[useSendMessage] Error:', error);
        // Fail open - allow message through
        await sendValidatedMessage(clean);
      }
    },
    [inputMessage, validationService, setDraftCoaching, stopTyping, sendValidatedMessage]
  );

  // Mark message as sent (UI state update)
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

  // Mark message as failed (UI state update)
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
