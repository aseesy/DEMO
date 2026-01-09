import React from 'react';
import { createLogger } from '../../../utils/logger.js';
import {
  trackMessageSent,
  trackAIIntervention,
  trackRewriteUsed,
  trackInterventionOverride,
  trackMessageFlagged,
  trackThreadCreated,
} from '../../../utils/analytics.js';

/**
 * useMessageHandlers Hook
 *
 * Handles message operations with analytics tracking:
 * - Send message with analytics
 * - Flag message with analytics
 * - Create thread with analytics
 * - Intervention feedback
 * - Pending message removal on rewrite
 * - AI intervention tracking
 */
export function useMessageHandlers({
  inputMessage,
  isPreApprovedRewrite,
  originalSendMessage,
  originalFlagMessage,
  originalCreateThread,
  removeMessages,
  socket,
  messages,
}) {
  // Track original message to remove after rewrite is sent
  const [pendingOriginalMessageToRemove, setPendingOriginalMessageToRemove] = React.useState(null);

  // Track which interventions received feedback
  const [feedbackGiven, setFeedbackGiven] = React.useState(new Set());

  // Helper to extract email from message (supports both new and legacy structures)
  const getMessageEmail = React.useCallback(msg => {
    return (
      msg?.sender?.email ||
      msg?.user_email ||
      msg?.email ||
      msg?.username ||
      ''
    ).toLowerCase();
  }, []);

  // Listen for rewrite-sent event to remove original message
  // Only remove when a NEW message is sent (not a rewrite)
  React.useEffect(() => {
    const handleRewriteSent = event => {
      // Only remove messages if this is a genuinely NEW message, not a rewrite
      const isNewMessage = event.detail?.isNewMessage && !event.detail?.isRewrite;
      // Get specific message IDs to remove (captured at dispatch time to prevent race conditions)
      const messageIdsToRemove = event.detail?.messageIdsToRemove || [];

      if (isNewMessage && messageIdsToRemove.length > 0) {
        // Remove only the specific messages by ID (prevents race condition with newly arriving messages)
        removeMessages(m => messageIdsToRemove.includes(m.id));
      }

      // Also check for pending original message to remove (for flagged messages)
      if (isNewMessage && pendingOriginalMessageToRemove) {
        removeMessages(m => {
          const isFlaggedPrivate = m.flagged === true && m.private === true;
          const messageEmail = getMessageEmail(m);
          const pendingEmail = getMessageEmail(pendingOriginalMessageToRemove);
          const matchesUsername = messageEmail === pendingEmail;
          const matchesText = m.text === pendingOriginalMessageToRemove.text;
          const matchesTimestamp =
            m.timestamp === pendingOriginalMessageToRemove.timestamp ||
            (m.timestamp &&
              pendingOriginalMessageToRemove.timestamp &&
              Math.abs(
                new Date(m.timestamp).getTime() -
                  new Date(pendingOriginalMessageToRemove.timestamp).getTime()
              ) < 2000);
          return isFlaggedPrivate && matchesUsername && matchesText && matchesTimestamp;
        });
        setPendingOriginalMessageToRemove(null);
      }
    };

    window.addEventListener('rewrite-sent', handleRewriteSent);
    return () => window.removeEventListener('rewrite-sent', handleRewriteSent);
  }, [pendingOriginalMessageToRemove, removeMessages, getMessageEmail]);

  // Wrap sendMessage to track analytics and clean up pending messages
  const sendMessage = React.useCallback(
    e => {
      const clean = inputMessage.trim();
      if (clean) {
        // Track message sent before sending
        trackMessageSent(clean.length, isPreApprovedRewrite);

        // Capture the IDs of current pending_original and ai_intervention messages
        // This prevents race conditions where newly arriving messages get removed
        const messageIdsToRemove = messages
          .filter(m => m.type === 'pending_original' || m.type === 'ai_intervention')
          .map(m => m.id)
          .filter(Boolean);

        // Only trigger cleanup for genuinely new messages (not rewrites)
        // Rewrites should keep the blocked message visible
        const isNewMessage = !isPreApprovedRewrite;
        window.dispatchEvent(
          new CustomEvent('rewrite-sent', {
            detail: { isNewMessage, isRewrite: isPreApprovedRewrite, messageIdsToRemove },
          })
        );
      }
      // Call original sendMessage (it handles validation)
      originalSendMessage(e);
    },
    [inputMessage, isPreApprovedRewrite, originalSendMessage, messages]
  );

  // Wrap flagMessage to track analytics
  const flagMessage = React.useCallback(
    (messageId, reason = 'user_flagged') => {
      trackMessageFlagged(reason);
      originalFlagMessage(messageId);
    },
    [originalFlagMessage]
  );

  // Wrap createThread to track analytics
  const createThread = React.useCallback(
    (roomId, title, messageIds, category = 'logistics') => {
      trackThreadCreated();
      return originalCreateThread(roomId, title, messageIds, category);
    },
    [originalCreateThread]
  );

  // Handle intervention feedback (thumbs up/down)
  const sendInterventionFeedback = React.useCallback(
    (interventionId, helpful) => {
      const logger = createLogger('useMessageHandlers');
      if (!socket || !socket.connected) {
        logger.warn('Cannot send feedback: socket not connected');
        return;
      }
      socket.emit('intervention_feedback', {
        interventionId,
        helpful,
        reason: null,
      });
      setFeedbackGiven(prev => new Set([...prev, interventionId]));
    },
    [socket]
  );

  // Track AI interventions when they appear
  const trackedInterventionsRef = React.useRef(new Set());
  React.useEffect(() => {
    messages.forEach(msg => {
      if (
        msg.type === 'ai_intervention' &&
        msg.id &&
        !trackedInterventionsRef.current.has(msg.id)
      ) {
        trackedInterventionsRef.current.add(msg.id);
        trackAIIntervention(
          msg.interventionType || 'general',
          msg.confidence || 'medium',
          msg.riskLevel || 'medium'
        );
      }
    });
  }, [messages]);

  return {
    // State
    pendingOriginalMessageToRemove,
    setPendingOriginalMessageToRemove,
    feedbackGiven,
    setFeedbackGiven,

    // Wrapped handlers with analytics
    sendMessage,
    flagMessage,
    createThread,
    sendInterventionFeedback,
  };
}
