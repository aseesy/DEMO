import React from 'react';
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

  // Helper function to determine if a message should be removed when rewrite is sent
  const shouldRemoveMessageOnRewrite = React.useCallback((message, pendingOriginal) => {
    // Always remove pending_original and ai_intervention messages
    if (message.type === 'pending_original' || message.type === 'ai_intervention') {
      return true;
    }

    // If we have a pending original message to remove, check if this message matches it
    if (!pendingOriginal) {
      return false;
    }

    // Match flagged/private messages that match the pending original
    const isFlaggedPrivate = message.flagged === true && message.private === true;
    const messageEmail = getMessageEmail(message);
    const pendingEmail = getMessageEmail(pendingOriginal);
    const matchesUsername = messageEmail === pendingEmail;
    const matchesText = message.text === pendingOriginal.text;

    // Match by exact timestamp or within 2 seconds (handles timing differences)
    const matchesTimestamp =
      message.timestamp === pendingOriginal.timestamp ||
      (message.timestamp &&
        pendingOriginal.timestamp &&
        Math.abs(
          new Date(message.timestamp).getTime() - new Date(pendingOriginal.timestamp).getTime()
        ) < 2000);

    return isFlaggedPrivate && matchesUsername && matchesText && matchesTimestamp;
  }, []);

  // Listen for rewrite-sent event to remove original message
  React.useEffect(() => {
    const handleRewriteSent = () => {
      // Remove all pending original messages and interventions when a new message is sent
      removeMessages(m => shouldRemoveMessageOnRewrite(m, pendingOriginalMessageToRemove));
      setPendingOriginalMessageToRemove(null);
    };

    window.addEventListener('rewrite-sent', handleRewriteSent);
    return () => window.removeEventListener('rewrite-sent', handleRewriteSent);
  }, [pendingOriginalMessageToRemove, removeMessages, shouldRemoveMessageOnRewrite]);

  // Wrap sendMessage to track analytics and clean up pending messages
  const sendMessage = React.useCallback(
    e => {
      const clean = inputMessage.trim();
      if (clean) {
        // Track message sent before sending
        trackMessageSent(clean.length, isPreApprovedRewrite);

        // Clear any pending original messages and interventions when any message is sent
        // This ensures the "not sent yet" bubble disappears
        window.dispatchEvent(new CustomEvent('rewrite-sent', { detail: { isNewMessage: true } }));
      }
      // Call original sendMessage (it handles validation)
      originalSendMessage(e);
    },
    [inputMessage, isPreApprovedRewrite, originalSendMessage]
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
      if (!socket || !socket.connected) {
        console.warn('Cannot send feedback: socket not connected');
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
