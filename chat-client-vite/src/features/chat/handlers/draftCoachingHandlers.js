/**
 * Draft Coaching Handlers
 *
 * Handles AI coaching/intervention events:
 * - draft_coaching
 * - draft_analysis (legacy)
 */

/**
 * Helper function to handle blocked messages (marks message as blocked, keeps it visible)
 * @param {Object} coaching - Coaching data
 * @param {string} eventName - Event name for logging
 * @param {Object} handlers - Handler functions and refs
 */
function handleBlockedMessage(coaching, eventName, handlers) {
  if (!coaching || coaching.shouldSend !== false) {
    return;
  }

  const { usernameRef, setMessages, setPendingMessages, setMessageStatuses, messageUIMethodsRef } =
    handlers;

  console.log(`[${eventName}] Message blocked - marking as pending mediation (keeping visible)`);

  // Helper to extract email from message (supports both new and legacy structures)
  const getMessageEmail = msg => {
    return (msg.sender?.email || msg.user_email || msg.email || msg.username || '').toLowerCase();
  };

  const normalizedCurrentEmail = (usernameRef.current || '').toLowerCase();

  // Get useMessageUI method if available (preferred path)
  const markMessageBlocked = messageUIMethodsRef?.current?.markMessageBlocked;

  // Find message IDs to mark as blocked by searching messages
  const messageIdsToBlock = [];

  // Mark optimistic messages that match the blocked text as "blocked" or "pending_mediation"
  // Keep them visible on sender's side - DON'T remove them
  setMessages(prev => {
    return prev.map(msg => {
      if (msg.isOptimistic && coaching.originalText) {
        const msgEmail = getMessageEmail(msg);
        if (msg.text === coaching.originalText && msgEmail === normalizedCurrentEmail) {
          console.log(`[${eventName}] Marking message as blocked (pending mediation):`, msg.id);
          messageIdsToBlock.push(msg.id);
          // Mark message as blocked but keep it visible
          return {
            ...msg,
            status: 'blocked', // or 'pending_mediation'
            isBlocked: true,
            needsMediation: true,
          };
        }
      }
      return msg; // Keep other messages unchanged
    });
  });

  // Update status for blocked messages - keep them in pending messages
  // Use useMessageUI method if available, otherwise use legacy setters
  if (messageIdsToBlock.length > 0) {
    messageIdsToBlock.forEach(messageId => {
      if (markMessageBlocked) {
        // useMessageUI method handles status update
        markMessageBlocked(messageId);
        console.log(
          `[${eventName}] Marked message as blocked via useMessageUI (keeping visible):`,
          messageId
        );
      } else {
        // Legacy fallback: use setters directly
        setMessageStatuses(prevStatuses => {
          const nextStatuses = new Map(prevStatuses);
          nextStatuses.set(messageId, 'blocked'); // or 'pending_mediation'
          return nextStatuses;
        });
        // Keep in pending messages so it stays visible
        console.log(
          `[${eventName}] Marked message as blocked via legacy setters (keeping visible):`,
          messageId
        );
      }
    });
  }
}

/**
 * Setup draft coaching event handlers
 * @param {Object} socket - Socket.io socket instance
 * @param {Object} handlers - Handler functions and refs
 * @returns {Function} Cleanup function to remove listeners
 */
export function setupDraftCoachingHandlers(socket, handlers) {
  const { setDraftCoaching } = handlers;

  const handleDraftCoaching = coaching => {
    console.log('[draft_coaching] Received coaching:', {
      shouldSend: coaching?.shouldSend,
      hasObserverData: !!coaching?.observerData,
      originalText: coaching?.originalText?.substring(0, 30),
    });

    // If message is blocked, remove the optimistic message
    handleBlockedMessage(coaching, 'draft_coaching', handlers);

    // Set the draft coaching state (this shows the ObserverCard)
    setDraftCoaching(coaching);
  };

  const handleDraftAnalysis = coaching => {
    // Legacy alias - handle the same way as draft_coaching
    console.log('[draft_analysis] Received coaching (legacy):', {
      shouldSend: coaching?.shouldSend,
      hasObserverData: !!coaching?.observerData,
      originalText: coaching?.originalText?.substring(0, 30),
    });

    // If message is blocked, remove the optimistic message
    handleBlockedMessage(coaching, 'draft_analysis', handlers);

    // Set the draft coaching state
    setDraftCoaching(coaching);
  };

  socket.on('draft_coaching', handleDraftCoaching);
  socket.on('draft_analysis', handleDraftAnalysis);

  // Return cleanup function
  return () => {
    socket.off('draft_coaching', handleDraftCoaching);
    socket.off('draft_analysis', handleDraftAnalysis);
  };
}
