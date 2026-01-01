/**
 * Draft Coaching Handlers
 *
 * Handles AI coaching/intervention events:
 * - draft_coaching
 * - draft_analysis (legacy)
 */

/**
 * Helper function to handle blocked messages (removes optimistic message)
 * @param {Object} coaching - Coaching data
 * @param {string} eventName - Event name for logging
 * @param {Object} handlers - Handler functions and refs
 */
function handleBlockedMessage(coaching, eventName, handlers) {
  if (!coaching || coaching.shouldSend !== false) {
    return;
  }

  const { usernameRef, setMessages, setPendingMessages, setMessageStatuses, messageUIMethodsRef } = handlers;

  console.log(`[${eventName}] Message blocked - removing optimistic message`);

  // Helper to extract email from message (supports both new and legacy structures)
  const getMessageEmail = msg => {
    return (msg.sender?.email || msg.user_email || msg.email || msg.username || '').toLowerCase();
  };

  const normalizedCurrentEmail = (usernameRef.current || '').toLowerCase();

  // Get useMessageUI method if available (preferred path)
  const removePendingMessage = messageUIMethodsRef?.current?.removePendingMessage;
  
  // Find message IDs to remove by searching pending messages
  // We'll search both messages array and pending messages to find all matches
  const messageIdsToRemove = [];
  
  // First, search pending messages to find IDs
  setPendingMessages(prev => {
    for (const [id, msg] of prev.entries()) {
      const msgEmail = getMessageEmail(msg);
      if (
        msg.isOptimistic &&
        msg.text === coaching.originalText &&
        msgEmail === normalizedCurrentEmail
      ) {
        messageIdsToRemove.push(id);
      }
    }
    return prev; // Don't modify here - will use proper method or legacy setters
  });

  // Remove optimistic messages that match the blocked text
  setMessages(prev => {
    return prev.filter(msg => {
      if (msg.isOptimistic && coaching.originalText) {
        const msgEmail = getMessageEmail(msg);
        if (msg.text === coaching.originalText && msgEmail === normalizedCurrentEmail) {
          console.log(`[${eventName}] Removing optimistic message:`, msg.id);
          return false; // Remove this message
        }
      }
      return true; // Keep this message
    });
  });

  // Remove from pending messages and update status
  // Use useMessageUI method if available, otherwise use legacy setters
  if (messageIdsToRemove.length > 0) {
    messageIdsToRemove.forEach(messageId => {
      if (removePendingMessage) {
        // useMessageUI method handles both pendingMessages and messageStatuses
        removePendingMessage(messageId);
        console.log(`[${eventName}] Removed from pending messages via useMessageUI:`, messageId);
      } else {
        // Legacy fallback: use setters directly
        setPendingMessages(prev => {
          const next = new Map(prev);
          next.delete(messageId);
          return next;
        });
        setMessageStatuses(prevStatuses => {
          const nextStatuses = new Map(prevStatuses);
          nextStatuses.delete(messageId);
          return nextStatuses;
        });
        console.log(`[${eventName}] Removed from pending messages via legacy setters:`, messageId);
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
