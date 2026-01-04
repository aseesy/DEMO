/**
 * useMessageUI Hook
 *
 * Responsibility: UI State Management ONLY
 *
 * What it does:
 * - Manages pending message state (UI concerns)
 * - Manages message statuses (UI concerns)
 * - Creates pending messages (not optimistic "sent" - true pending state)
 * - Handles UI feedback (scrolling, clearing input, animations)
 * - Updates UI based on message state changes
 *
 * What it does NOT do:
 * - ❌ Network transport (delegated to useMessageTransport)
 * - ❌ Business logic/validation (delegated to useMessageMediation)
 * - ❌ Message analysis (delegated to useMessageMediation)
 * - ❌ Adding messages to messages array (that's handled by socket handlers)
 */

import React from 'react';
import { createPendingMessage, MESSAGE_STATUS } from '../../../utils/messageBuilder.js';

/**
 * useMessageUI - Manages UI state for messages
 *
 * @param {Object} options
 * @param {Function} options.clearInput - Clear input callback
 * @param {Function} options.scrollToBottom - Scroll callback
 * @returns {Object} {
 *   pendingMessages,
 *   setPendingMessages,
 *   messageStatuses,
 *   setMessageStatuses,
 *   markMessageSent,
 *   markMessageFailed,
 *   markMessagePending,
 *   createPendingMessageState,
 *   handleMessageSent
 * }
 */
export function useMessageUI({ clearInput, scrollToBottom } = {}) {
  // UI State: Pending messages tracking
  const [pendingMessages, setPendingMessages] = React.useState(new Map());
  const [messageStatuses, setMessageStatuses] = React.useState(new Map());

  /**
   * Create a pending message state (not optimistic "sent" - true pending)
   * This implements the UX improvement: messages start as "pending" not "sent"
   *
   * @param {Object} params
   * @param {string} params.text - Message text
   * @param {string} params.username - Sender username
   * @param {string} params.socketId - Socket ID
   * @param {boolean} params.isPreApprovedRewrite - Is this a rewrite
   * @param {string} params.originalRewrite - Original rewrite text
   * @returns {Object} { messageId, pendingMessage } - Created message ID and object
   */
  const createPendingMessageState = React.useCallback(
    ({ text, username, socketId, isPreApprovedRewrite, originalRewrite }) => {
      const pendingMessage = createPendingMessage({
        text,
        username,
        socketId,
        isPreApprovedRewrite,
        originalRewrite,
      });

      // Mark as pending (not "sent" - avoids emotional whiplash)
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

      return {
        messageId: pendingMessage.id,
        pendingMessage,
      };
    },
    []
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

  // Mark message as pending (UI state update)
  const markMessagePending = React.useCallback(messageId => {
    setMessageStatuses(prev => {
      const next = new Map(prev);
      next.set(messageId, MESSAGE_STATUS.PENDING);
      return next;
    });
  }, []);

  // Mark message as queued (offline)
  const markMessageQueued = React.useCallback(messageId => {
    setMessageStatuses(prev => {
      const next = new Map(prev);
      next.set(messageId, 'queued');
      return next;
    });
  }, []);

  // Mark message as blocked (pending mediation) - keep visible on sender's side
  const markMessageBlocked = React.useCallback(messageId => {
    setMessageStatuses(prev => {
      const next = new Map(prev);
      next.set(messageId, 'blocked'); // or 'pending_mediation'
      return next;
    });
    // Keep in pending messages so it stays visible
  }, []);

  // Remove pending message (e.g., when dismissed or rewrite sent)
  const removePendingMessage = React.useCallback(messageId => {
    setPendingMessages(prev => {
      const next = new Map(prev);
      next.delete(messageId);
      return next;
    });
    setMessageStatuses(prev => {
      const next = new Map(prev);
      next.delete(messageId);
      return next;
    });
  }, []);

  // Handle UI feedback after message operations
  const handleMessageSent = React.useCallback(
    messageId => {
      markMessageSent(messageId);
      clearInput?.();
      setTimeout(() => scrollToBottom?.(), 100);
    },
    [markMessageSent, clearInput, scrollToBottom]
  );

  return {
    // State
    pendingMessages,
    messageStatuses,

    // Setters (for external control if needed)
    setPendingMessages,
    setMessageStatuses,

    // Actions
    createPendingMessageState,
    markMessageSent,
    markMessageFailed,
    markMessagePending,
    markMessageQueued,
    markMessageBlocked,
    removePendingMessage,
    handleMessageSent,
  };
}

export default useMessageUI;
