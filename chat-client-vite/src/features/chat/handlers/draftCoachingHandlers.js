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

  const { usernameRef, setMessages, setPendingMessages, setMessageStatuses } = handlers;

  console.log(`[${eventName}] Message blocked - removing optimistic message`);

  // Helper to extract email from message (supports both new and legacy structures)
  const getMessageEmail = msg => {
    return (msg.sender?.email || msg.user_email || msg.email || msg.username || '').toLowerCase();
  };

  const normalizedCurrentEmail = (usernameRef.current || '').toLowerCase();

  // Remove optimistic messages that match the blocked text
  setMessages(prev => {
    const filtered = prev.filter(msg => {
      if (msg.isOptimistic && coaching.originalText) {
        const msgEmail = getMessageEmail(msg);
        if (msg.text === coaching.originalText && msgEmail === normalizedCurrentEmail) {
          console.log(`[${eventName}] Removing optimistic message:`, msg.id);
          return false; // Remove this message
        }
      }
      return true; // Keep this message
    });
    return filtered;
  });

  // Also remove from pending messages and update status
  setPendingMessages(prev => {
    const next = new Map(prev);
    let removedId = null;

    for (const [id, msg] of next.entries()) {
      const msgEmail = getMessageEmail(msg);
      if (
        msg.isOptimistic &&
        msg.text === coaching.originalText &&
        msgEmail === normalizedCurrentEmail
      ) {
        removedId = id;
        next.delete(id);
        break;
      }
    }

    if (removedId) {
      console.log(`[${eventName}] Removed from pending messages:`, removedId);
      setMessageStatuses(prevStatuses => {
        const nextStatuses = new Map(prevStatuses);
        nextStatuses.delete(removedId);
        return nextStatuses;
      });
    }

    return next;
  });
}

/**
 * Setup draft coaching event handlers
 * @param {Object} socket - Socket.io socket instance
 * @param {Object} handlers - Handler functions and refs
 */
export function setupDraftCoachingHandlers(socket, handlers) {
  const { setDraftCoaching } = handlers;

  // Handle AI coaching/intervention events from backend (WebSocket-only analysis)
  socket.on('draft_coaching', coaching => {
    console.log('[draft_coaching] Received coaching:', {
      shouldSend: coaching?.shouldSend,
      hasObserverData: !!coaching?.observerData,
      originalText: coaching?.originalText?.substring(0, 30),
    });

    // If message is blocked, remove the optimistic message
    handleBlockedMessage(coaching, 'draft_coaching', handlers);

    // Set the draft coaching state (this shows the ObserverCard)
    setDraftCoaching(coaching);
  });

  socket.on('draft_analysis', coaching => {
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
  });
}
