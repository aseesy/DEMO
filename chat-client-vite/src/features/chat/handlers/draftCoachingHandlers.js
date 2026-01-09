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
  // Use normalized text matching to handle whitespace differences
  const normalizedOriginalText = (coaching.originalText || '').trim().toLowerCase();
  console.log(`[${eventName}] Looking for blocked message:`, {
    originalText: normalizedOriginalText.substring(0, 50),
    currentEmail: normalizedCurrentEmail,
    totalMessages: 0, // Will be set in map
  });

  setMessages(prev => {
    let foundMatch = false;
    const updated = prev.map(msg => {
      // CRITICAL: Only match messages that match BOTH text AND haven't already been matched/blocked
      // This prevents matching the wrong message when multiple optimistic messages exist
      if (msg.isOptimistic && normalizedOriginalText && !msg.isBlocked) {
        // Try multiple ways to get email/username from message
        const msgEmail = getMessageEmail(msg);
        // Also check username field directly (optimistic messages use username)
        const msgUsername = (msg.username || '').toLowerCase();
        const normalizedMsgText = (msg.text || '').trim().toLowerCase();

        // Match by normalized text (trimmed, lowercased) and email/username
        const emailMatches = msgEmail === normalizedCurrentEmail;
        const usernameMatches = msgUsername === normalizedCurrentEmail;
        const textMatches = normalizedMsgText === normalizedOriginalText;

        if (textMatches && (emailMatches || usernameMatches)) {
          foundMatch = true;
          console.log(`[${eventName}] ✅ MATCHED - Marking message as blocked:`, {
            messageId: msg.id,
            messageText: normalizedMsgText.substring(0, 30),
            originalText: normalizedOriginalText.substring(0, 30),
            emailMatch: emailMatches,
            usernameMatch: usernameMatches,
            totalOptimistic: prev.filter(m => m.isOptimistic).length,
            totalBlocked: prev.filter(m => m.isBlocked).length,
          });
          messageIdsToBlock.push(msg.id);
          // Mark message as blocked but keep it visible - DO NOT remove it
          const blockedMessage = {
            ...msg,
            status: 'blocked', // or 'pending_mediation'
            isBlocked: true,
            needsMediation: true,
            // Keep the original text visible
            text: msg.text, // Preserve original text
            // Ensure it stays in the messages array
            isOptimistic: true, // Keep optimistic flag so it's not filtered out
          };

          console.log(`[${eventName}] 🔒 BLOCKED MESSAGE CREATED - Must stay visible:`, {
            messageId: blockedMessage.id,
            text: blockedMessage.text?.substring(0, 50),
            isBlocked: blockedMessage.isBlocked,
            isOptimistic: blockedMessage.isOptimistic,
            status: blockedMessage.status,
            needsMediation: blockedMessage.needsMediation,
          });

          return blockedMessage;
        }
      }
      return msg; // Keep other messages unchanged (including already-blocked messages)
    });

    if (!foundMatch && normalizedOriginalText) {
      console.warn(`[${eventName}] ⚠️ No matching optimistic message found:`, {
        originalText: normalizedOriginalText.substring(0, 50),
        currentEmail: normalizedCurrentEmail,
        optimisticMessages: prev
          .filter(m => m.isOptimistic)
          .map(m => ({
            id: m.id,
            text: (m.text || '').trim().toLowerCase().substring(0, 30),
            email: getMessageEmail(m),
            username: (m.username || '').toLowerCase(),
          })),
      });
    }

    // CRITICAL: Verify blocked messages are still in the array after update
    const blockedMessagesAfter = updated.filter(
      m => m.isBlocked || m.status === 'blocked' || m.needsMediation
    );
    if (import.meta.env.DEV) {
      console.log(`[${eventName}] Blocked messages after marking:`, {
        count: blockedMessagesAfter.length,
        messageIds: blockedMessagesAfter.map(m => m.id),
        texts: blockedMessagesAfter.map(m => m.text?.substring(0, 30)),
      });
    }

    return updated;
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
      analyzing: coaching?.analyzing,
    });

    // If message is blocked, mark the optimistic message as blocked
    handleBlockedMessage(coaching, 'draft_coaching', handlers);

    // Set the draft coaching state (this shows the ObserverCard)
    // CRITICAL: Ensure analyzing is false when we receive coaching from backend
    // Backend coaching replaces frontend pre-check analyzing state
    setDraftCoaching({
      ...coaching,
      analyzing: false, // Backend has finished analyzing
    });
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
