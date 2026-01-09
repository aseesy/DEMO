/**
 * Message Handlers
 *
 * Handles message-related socket events:
 * - message_history
 * - new_message
 */

import {
  isSystemMessage,
  isOwnMessage,
  determineMessageAction,
  applyMessageAction,
} from '../model/messageUtils.js';

/**
 * Setup message event handlers
 * @param {Object} socket - Socket.io socket instance
 * @param {Object} handlers - Handler functions and refs
 */
export function setupMessageHandlers(socket, handlers) {
  const {
    usernameRef,
    currentViewRef,
    onNewMessageRef,
    offlineQueueRef,
    messagesContainerRef,
    messagesEndRef,
    setMessages,
    setHasMoreMessages,
    setIsInitialLoad,
    setMessageStatuses,
    setPendingMessages,
    setUnreadCount,
    setDraftCoaching,
  } = handlers;

  // Message history handler
  const handleMessageHistory = data => {
    console.log('[message_history] 📨 Received data:', {
      isArray: Array.isArray(data),
      hasMessages: !!data.messages,
      messageCount: Array.isArray(data) ? data.length : data.messages?.length || 0,
      dataKeys: Object.keys(data || {}),
      firstMessage: Array.isArray(data) ? data[0] : data.messages?.[0],
      fullData: data, // Log full data for debugging
    });

    const messages = Array.isArray(data) ? data : data.messages || [];
    const hasMore = data.hasMore !== undefined ? data.hasMore : true;

    console.log('[message_history] 📊 Processing:', {
      messagesCount: messages.length,
      hasMore,
      messagesSample: messages.slice(0, 3).map(m => ({
        id: m.id,
        text: m.text?.substring(0, 30),
        timestamp: m.timestamp,
        sender: m.sender?.email || m.user_email || m.email || m.username,
      })),
    });

    // Helper to extract email from message (supports both new and legacy structures)
    const getMessageEmail = msg => {
      return (msg.sender?.email || msg.user_email || msg.email || msg.username || '').toLowerCase();
    };

    // Optimize message filtering and merging - use efficient Set operations
    setMessages(prev => {
      // Early return if no new messages
      if (messages.length === 0) return prev;

      // Build set of optimistic message keys to avoid duplicates
      // CRITICAL: Check BOTH offlineQueue AND current messages array (prev)
      // Blocked messages are in the messages array (prev), not offlineQueue
      const optimisticKeys = new Set();

      // First, check offlineQueue (for pending messages)
      offlineQueueRef.current.forEach(msg => {
        if (msg.isOptimistic && msg.text && msg.timestamp) {
          const msgEmail = getMessageEmail(msg);
          if (!msgEmail) return; // Skip if no email/username
          // Create a key based on text, email, and time window (within 5 seconds)
          const msgTimeWindow = Math.floor(new Date(msg.timestamp).getTime() / 5000);
          const key = `${msg.text}_${msgEmail}_${msgTimeWindow}`;
          optimisticKeys.add(key);
        }
      });

      // CRITICAL: Also check current messages array (prev) for optimistic messages (including blocked ones)
      // This prevents server messages from duplicating blocked optimistic messages
      prev.forEach(msg => {
        if (msg.isOptimistic && msg.text && msg.timestamp) {
          const msgEmail = getMessageEmail(msg);
          if (!msgEmail) return;
          const msgTimeWindow = Math.floor(new Date(msg.timestamp).getTime() / 5000);
          const key = `${msg.text}_${msgEmail}_${msgTimeWindow}`;
          optimisticKeys.add(key);
          if (import.meta.env.DEV && msg.isBlocked) {
            console.log(
              '[message_history] Protected blocked optimistic message from duplication:',
              {
                messageId: msg.id,
                key: key,
                text: msg.text?.substring(0, 30),
              }
            );
          }
        }
      });

      // Continue with existing merge logic...

      // Filter out messages that match optimistic messages - optimized
      const newMessages = [];
      const prevMessageIds = new Set(prev.map(m => m.id));

      for (const msg of messages) {
        // Skip if already in prev (deduplication)
        if (prevMessageIds.has(msg.id)) continue;

        // Skip if missing required fields
        if (!msg.text || !msg.timestamp) {
          newMessages.push(msg);
          continue;
        }

        const msgEmail = getMessageEmail(msg);
        if (!msgEmail) {
          newMessages.push(msg);
          continue;
        }

        // Check optimistic keys
        const msgTimeWindow = Math.floor(new Date(msg.timestamp).getTime() / 5000);
        const key = `${msg.text}_${msgEmail}_${msgTimeWindow}`;

        if (optimisticKeys.has(key)) {
          if (import.meta.env.DEV) {
            console.log('[message_history] Skipping message that matches optimistic:', {
              msgId: msg.id,
              key: key,
            });
          }
          continue;
        }

        newMessages.push(msg);
      }

      // Early return if no new messages after filtering
      if (newMessages.length === 0) return prev;

      // Combine existing messages with new ones, sorted by timestamp (stable sort with ID tiebreaker)
      // Use efficient merge - prev is already sorted, newMessages just need to be inserted
      const merged = [...prev, ...newMessages].sort((a, b) => {
        const timeA = new Date(a.timestamp || a.created_at || 0).getTime();
        const timeB = new Date(b.timestamp || b.created_at || 0).getTime();
        // If timestamps are equal (or very close within 1ms), use ID as tiebreaker for stable sort
        if (Math.abs(timeA - timeB) < 1) {
          return (a.id || '').localeCompare(b.id || '');
        }
        return timeA - timeB;
      });

      if (import.meta.env.DEV) {
        console.log('[message_history] Merge complete:', {
          newMessagesCount: newMessages.length,
          finalCount: merged.length,
        });
      }

      return merged;
    });

    setHasMoreMessages(hasMore);

    // Scroll to bottom after messages are loaded and rendered
    // Use multiple delays to ensure DOM is fully updated
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // First, try scrolling the container directly
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
        // Then, scroll the end ref into view
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({
            behavior: 'instant',
            block: 'end',
          });
        }
        // Set isInitialLoad to false after scroll completes
        setTimeout(() => {
          setIsInitialLoad(false);
          // One more scroll after a brief delay to ensure we're at the bottom
          requestAnimationFrame(() => {
            if (messagesEndRef.current) {
              messagesEndRef.current.scrollIntoView({
                behavior: 'instant',
                block: 'end',
              });
            }
          });
        }, 100);
      });
    });
  };

  // New message handler - uses pure functions from messageUtils.js for SRP compliance
  const handleNewMessage = message => {
    // Filter system messages using pure function
    if (isSystemMessage(message)) return;

    const messageWithTimestamp = {
      ...message,
      timestamp: message.timestamp || new Date().toISOString(),
    };

    // Debug logging for conversation/message data transformation
    // Enable via VITE_DEBUG_DATA_TRANSFORM=true or in development
    import('../../../utils/dataTransformDebug.js').then(({ logConversationTransform }) => {
      logConversationTransform(message, messageWithTimestamp);
    });

    const ownMessage = isOwnMessage(message, usernameRef.current);

    // Update message status for own messages
    if (ownMessage && message.id) {
      // Use useMessageUI method if available (proper state management)
      // Otherwise fall back to legacy setters
      const markMessageSent = handlers.messageUIMethodsRef?.current?.markMessageSent;
      if (markMessageSent) {
        markMessageSent(message.id);
      } else {
        // Legacy fallback
        setMessageStatuses(prev => new Map(prev).set(message.id, 'sent'));
        setPendingMessages(prev => {
          const next = new Map(prev);
          next.delete(message.id);
          return next;
        });
      }
      offlineQueueRef.current = offlineQueueRef.current.filter(m => m.id !== message.id);
    }

    // Use pure functions to determine and apply message action
    // NOTE: We capture removedMsgId and actionResult inside the callback but use them AFTER
    // to avoid calling state setters inside another state setter's callback
    let removedMsgId = null;
    let actionResult = null;

    // Batch state updates to prevent multiple re-renders
    // Use functional update to ensure we're working with latest state
    setMessages(prev => {
      const action = determineMessageAction(prev, message, usernameRef.current);
      actionResult = action; // Capture action for use outside callback

      // Only log in dev mode to avoid performance impact in production
      if (import.meta.env.DEV) {
        console.log('[new_message] Action determined:', {
          action: action.action,
          reason: action.reason || action.matchedBy,
          messageId: message.id,
          optimisticId: message.optimisticId,
          text: message.text?.substring(0, 30),
          prevMessagesCount: prev.length,
          optimisticMessagesInPrev: prev.filter(m => m.isOptimistic).length,
        });
      }

      // Capture ID for cleanup (will be processed after this callback)
      if (action.action === 'replace' && action.removeIndex >= 0) {
        const removedMsg = prev[action.removeIndex];
        if (removedMsg?.id) {
          removedMsgId = removedMsg.id;
        }
      }

      // CRITICAL: Log blocked messages before applying action
      const blockedMessagesBefore = prev.filter(
        m => m.isBlocked || m.status === 'blocked' || m.needsMediation
      );
      if (import.meta.env.DEV && blockedMessagesBefore.length > 0) {
        console.log('[new_message] Blocked messages before action:', {
          count: blockedMessagesBefore.length,
          blockedIds: blockedMessagesBefore.map(m => m.id),
          blockedTexts: blockedMessagesBefore.map(m => m.text?.substring(0, 30)),
          action: action.action,
        });
      }

      const updated = applyMessageAction(prev, messageWithTimestamp, action);

      // CRITICAL: Verify blocked messages are still present after action
      const blockedMessagesAfter = updated.filter(
        m => m.isBlocked || m.status === 'blocked' || m.needsMediation
      );
      if (import.meta.env.DEV) {
        if (
          blockedMessagesBefore.length > 0 &&
          blockedMessagesAfter.length !== blockedMessagesBefore.length
        ) {
          console.error('[new_message] ⚠️ BLOCKED MESSAGE REMOVED!', {
            beforeCount: blockedMessagesBefore.length,
            afterCount: blockedMessagesAfter.length,
            beforeIds: blockedMessagesBefore.map(m => m.id),
            afterIds: blockedMessagesAfter.map(m => m.id),
            action: action.action,
            removedIds: blockedMessagesBefore
              .filter(b => !blockedMessagesAfter.some(a => a.id === b.id))
              .map(m => ({ id: m.id, text: m.text?.substring(0, 30) })),
          });
        }
        console.log('[new_message] Messages updated:', {
          action: action.action,
          previousCount: prev.length,
          updatedCount: updated.length,
          newMessageId: message.id,
          blockedMessagesCount: blockedMessagesAfter.length,
        });
      }

      return updated;
    });

    // Clean up pending message tracking after capturing the ID
    // The setMessages callback runs synchronously, so removedMsgId is set by now
    if (removedMsgId) {
      // Use useMessageUI method if available (proper state management)
      // Otherwise fall back to legacy setters
      const removePendingMessage = handlers.messageUIMethodsRef?.current?.removePendingMessage;
      if (removePendingMessage) {
        removePendingMessage(removedMsgId);
      } else {
        // Legacy fallback
        setPendingMessages(p => {
          const next = new Map(p);
          next.delete(removedMsgId);
          return next;
        });
        setMessageStatuses(p => {
          const next = new Map(p);
          next.delete(removedMsgId);
          return next;
        });
      }
    }

    // Trigger callback for new messages
    if (onNewMessageRef.current) onNewMessageRef.current(messageWithTimestamp);

    // Update unread count for messages from others
    // Increment if: not in chat view OR app is hidden (backgrounded)
    // This ensures badge shows even when app is open but in background
    if (!ownMessage) {
      if (currentViewRef.current !== 'chat' || document.hidden) {
        setUnreadCount(prev => {
          const newCount = prev + 1;
          console.log('[UnreadCount] Incremented:', {
            previous: prev,
            new: newCount,
            currentView: currentViewRef.current,
            documentHidden: document.hidden,
            messageId: message.id,
            sender:
              message.sender?.email || message.user_email || message.email || message.username,
          });
          return newCount;
        });
      }
    }

    // Dispatch event for pre-approved rewrites
    if (ownMessage && message.isPreApprovedRewrite) {
      window.dispatchEvent(
        new CustomEvent('rewrite-sent', { detail: { message: messageWithTimestamp } })
      );
    }

    // Clear draftCoaching when own message is approved by backend
    // This indicates the message passed AI analysis and was sent successfully
    // BUT: Only clear if the message wasn't blocked (blocked messages keep their coaching)
    if (ownMessage && setDraftCoaching) {
      // Check if this message was blocked - if so, don't clear draftCoaching
      // The draftCoaching should remain for blocked messages
      // Use actionResult captured from inside the setMessages callback
      const wasBlocked =
        actionResult?.action === 'skip' &&
        actionResult?.reason === 'blocked_message_must_stay_visible';
      if (!wasBlocked) {
        // Clear draftCoaching completely - removes both analyzing state and blocked message
        // This clears any frontend pre-check analyzing state
        setDraftCoaching(null);
        if (import.meta.env.DEV) {
          console.log('[new_message] Cleared draftCoaching - message approved');
        }
      } else if (import.meta.env.DEV) {
        console.log('[new_message] Keeping draftCoaching for blocked message');
      }
    }
  };

  // Register handlers
  socket.on('message_history', handleMessageHistory);
  socket.on('new_message', handleNewMessage);

  // Return cleanup function
  return () => {
    socket.off('message_history', handleMessageHistory);
    socket.off('new_message', handleNewMessage);
  };
}
