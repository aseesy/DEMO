/**
 * useMessageSending Hook
 *
 * Handles message sending logic:
 * - emitOrQueueMessage: Creates pending message (not optimistic "sent") and sends via socket or queues offline
 * - sendMessage: Main send handler with hybrid analysis (frontend pre-check + backend full analysis)
 *
 * Phase 1: Uses useMessageUI internally for UI state management
 * Phase 2: Uses useMessageTransport for network transport
 * Phase 4: Uses useMessageMediation for frontend pre-check (hybrid analysis)
 */

import React from 'react';
import { useMessageUI } from './useMessageUI.js';
import { useMessageTransport } from './useMessageTransport.js';
import { useMessageMediation } from './useMessageMediation.js';
// Note: saveOfflineQueue is deprecated - use StorageAdapter directly

/**
 * Hook for handling message sending
 * @param {Object} params
 * @param {Object} params.socketRef - Socket ref
 * @param {string} params.inputMessage - Current input message
 * @param {string} params.username - Current user's email (parameter name kept for backward compatibility)
 * @param {boolean} params.isPreApprovedRewrite - Whether message is AI rewrite
 * @param {string} params.originalRewrite - Original rewrite text
 * @param {Object} params.draftCoaching - Draft coaching state
 * @param {Function} params.setDraftCoaching - Set draft coaching
 * @param {Function} params.setMessages - Set messages (for optimistic updates - will be refactored in later phases)
 * @param {Function} params.setPendingMessages - Set pending messages (legacy - useMessageUI handles this internally)
 * @param {Function} params.setMessageStatuses - Set message statuses (legacy - useMessageUI handles this internally)
 * @param {Function} params.setError - Set error
 * @param {Object} params.offlineQueueRef - Offline queue ref
 * @param {Object} params.typingTimeoutRef - Typing timeout ref
 * @param {Function} params.clearInput - Clear input callback
 * @param {Function} params.scrollToBottom - Scroll callback
 * @param {Object} params.senderProfile - Sender profile context (for frontend pre-check)
 * @param {Object} params.receiverProfile - Receiver profile context (for frontend pre-check)
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
  setPendingMessages, // Legacy - kept for backward compatibility
  setMessageStatuses, // Legacy - kept for backward compatibility
  setError,
  offlineQueueRef,
  typingTimeoutRef,
  clearInput,
  scrollToBottom,
  senderProfile = {}, // Frontend context (current state)
  receiverProfile = {}, // Frontend context (current state)
}) {
  // Use useMessageUI for UI state management (Phase 1)
  const ui = useMessageUI({ clearInput, scrollToBottom });

  // Use useMessageTransport for network transport (Phase 2)
  const transport = useMessageTransport({ socketRef, offlineQueueRef, setError });

  // Use useMessageMediation for frontend pre-check (Phase 4: hybrid analysis)
  const mediation = useMessageMediation({
    setDraftCoaching,
    setError,
    senderProfile,
    receiverProfile,
  });

  // Sync UI state with legacy props (for backward compatibility during migration)
  React.useEffect(() => {
    if (setPendingMessages) {
      setPendingMessages(ui.pendingMessages);
    }
  }, [ui.pendingMessages, setPendingMessages]);

  React.useEffect(() => {
    if (setMessageStatuses) {
      setMessageStatuses(ui.messageStatuses);
    }
  }, [ui.messageStatuses, setMessageStatuses]);

  // Emit message via socket or queue for offline
  // PHASE 1 CHANGE: Creates pending state (not optimistic "sent")
  const emitOrQueueMessage = React.useCallback(
    async text => {
      if (!text || !username) return;

      // Create pending message state using useMessageUI
      // This implements the UX improvement: messages start as "pending" not "sent"
      const { messageId, pendingMessage } = ui.createPendingMessageState({
        text,
        username,
        socketId: socketRef.current?.id || 'local',
        isPreApprovedRewrite,
        originalRewrite,
      });

      // Create optimistic message for messages array (temporary - will be refactored)
      // Status is "pending" not "sending" - avoids emotional whiplash
      const optimisticMessage = {
        ...pendingMessage,
        displayName: username,
        created_at: pendingMessage.timestamp,
        status: 'pending', // Changed from 'sending' to 'pending'
        isOptimistic: true,
        isPending: true, // Flag to indicate pending state
      };

      // OPTIMISTIC UPDATE: Add message to UI immediately (as pending, not sent)
      setMessages(prev => {
        const updated = [...prev, optimisticMessage];
        if (import.meta.env.DEV) {
          console.log('[useMessageSending] ✅ Added optimistic message:', {
            messageId: optimisticMessage.id,
            text: optimisticMessage.text?.substring(0, 30),
            totalMessages: updated.length,
            timestamp: optimisticMessage.timestamp,
          });
        }
        return updated;
      });

      // Send via transport (Phase 2: uses useMessageTransport)
      // Note: Backend will perform full analysis with historical context
      // This is the hybrid approach: frontend pre-check + backend full analysis
      const result = await transport.sendMessage({
        text,
        isPreApprovedRewrite,
        originalRewrite,
        optimisticId: messageId, // Send ID so server can correlate
      });

      // Handle transport result
      if (!result.success) {
        if (result.queued) {
          // Message queued for offline sending
          // Also add to legacy offline queue ref for backward compatibility
          if (offlineQueueRef?.current) {
            offlineQueueRef.current.push(optimisticMessage);
            // Use StorageAdapter directly (saveOfflineQueue is deprecated and async)
            import('../../../adapters/storage')
              .then(({ storage, StorageKeys }) => {
                storage.set(StorageKeys.OFFLINE_QUEUE, offlineQueueRef.current);
              })
              .catch(err => {
                console.warn('[useMessageSending] Failed to save offline queue:', err);
              });
          }
          // Mark as queued in UI state
          ui.markMessageQueued(messageId);
        } else {
          // Transport error
          console.error('[useMessageSending] Transport error:', result.error);
          setError?.(result.error || 'Failed to send message. Please try again.');
        }
      }
      // If success: true, message was sent successfully
      // Backend will respond with 'new_message' or 'draft_coaching' event
      // NOTE: Don't clear draftCoaching here - it's handled by backend responses:
      // - 'new_message' clears it (in messageHandlers.js)
      // - 'draft_coaching' sets it with analyzing: false (in draftCoachingHandlers.js)
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
      ui,
      transport,
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

  // Send message with hybrid analysis (Phase 4)
  // Frontend pre-check (instant feedback) + Backend full analysis (final authority)
  const sendMessage = React.useCallback(
    async e => {
      if (e?.preventDefault) e.preventDefault();
      const clean = inputMessage.trim();
      if (!clean || !socketRef.current) return;

      // If we already have a draft coaching result for this exact message
      // and it shows intervention needed, don't send
      // BUT: Allow sending NEW messages even if there's a blocked message showing
      if (draftCoaching && draftCoaching.observerData && draftCoaching.originalText === clean) {
        if (import.meta.env.DEV) {
          console.log(
            '[useMessageSending] Blocked: duplicate of blocked message:',
            clean.substring(0, 30)
          );
        }
        return;
      }

      if (import.meta.env.DEV && draftCoaching) {
        console.log('[useMessageSending] Sending NEW message while draftCoaching active:', {
          newMessage: clean.substring(0, 30),
          previousBlocked: draftCoaching.originalText?.substring(0, 30),
        });
      }

      // AI-GENERATED REWRITES: Skip analysis only if not edited
      if (isPreApprovedRewrite && originalRewrite) {
        if (clean === originalRewrite.trim()) {
          console.log('[useMessageSending] Skipping analysis for unedited AI rewrite');
          emitOrQueueMessage(clean);
          return;
        }
        console.log('[useMessageSending] Rewrite was edited, will be analyzed');
      }

      // PHASE 4: Frontend pre-check (hybrid analysis)
      // This provides instant feedback before sending
      // Run validation without blocking - use microtask to yield to UI
      const validation = await Promise.resolve().then(() => mediation.validateMessage(clean));

      if (!validation.shouldSend) {
        // Frontend pre-check blocked the message
        // Draft coaching state already set by useMessageMediation
        if (import.meta.env.DEV) {
          console.log(
            '[useMessageSending] Message blocked by frontend pre-check:',
            validation.reason
          );
        }
        return;
      }

      // Frontend pre-check passed - send message
      // Backend will perform full analysis with historical context
      // Backend will emit either:
      // - 'new_message' if clean (marks as sent)
      // - 'draft_coaching' if intervention needed (removes pending, shows ObserverCard)

      // Clear input immediately (user feedback)
      clearInput?.();

      // CRITICAL: Only clear previous draftCoaching if it's for a DIFFERENT message
      // Blocked messages should stay visible until a NEW message is sent
      // Don't clear if the new message text matches the blocked message (user is retrying)
      if (draftCoaching && draftCoaching.originalText !== clean.trim()) {
        // This is a genuinely NEW message - clear the previous blocked message's coaching
        // The blocked message itself will stay in the messages array (marked as isBlocked: true)
        // But we clear the draftCoaching state so the ObserverCard disappears
        if (import.meta.env.DEV) {
          console.log('[useMessageSending] Clearing previous draftCoaching for new message:', {
            previousBlocked: draftCoaching.originalText?.substring(0, 30),
            newMessage: clean.substring(0, 30),
          });
        }
        setDraftCoaching(null);
      } else if (draftCoaching && import.meta.env.DEV) {
        console.log(
          '[useMessageSending] Keeping draftCoaching - new message matches blocked message'
        );
      }

      // Send the message
      emitOrQueueMessage(clean);

      // NOTE: Backend response will handle final state:
      // - 'draft_coaching' (sets coaching state for this new message)
      // - 'new_message' (clears coaching in messageHandlers.js if approved)
    },
    [
      inputMessage,
      emitOrQueueMessage,
      socketRef,
      clearInput,
      isPreApprovedRewrite,
      originalRewrite,
      mediation,
    ]
  );

  return {
    sendMessage,
    emitOrQueueMessage,
    // Expose UI state for backward compatibility
    pendingMessages: ui.pendingMessages,
    messageStatuses: ui.messageStatuses,
    markMessageSent: ui.markMessageSent,
    markMessageFailed: ui.markMessageFailed,
    removePendingMessage: ui.removePendingMessage,
    // Expose transport state
    isConnected: transport.isConnected,
    getConnectionId: transport.getConnectionId,
  };
}
