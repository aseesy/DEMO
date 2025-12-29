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

  // Message history
  socket.on('message_history', data => {
    console.log('[message_history] Received data:', {
      isArray: Array.isArray(data),
      hasMessages: !!data.messages,
      messageCount: Array.isArray(data) ? data.length : data.messages?.length || 0,
    });

    const messages = Array.isArray(data) ? data : data.messages || [];
    const hasMore = data.hasMore !== undefined ? data.hasMore : true;

    // Helper to extract email from message (supports both new and legacy structures)
    const getMessageEmail = msg => {
      return (msg.sender?.email || msg.user_email || msg.email || msg.username || '').toLowerCase();
    };

    // Build set of optimistic message keys to avoid duplicates
    const optimisticKeys = new Set();
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

    setMessages(prev => {
      // Filter out messages that match optimistic messages
      const newMessages = messages.filter(msg => {
        if (!msg.text || !msg.timestamp) return true;

        const msgEmail = getMessageEmail(msg);
        if (!msgEmail) return true; // Keep messages without email (shouldn't happen, but defensive)

        const msgTimeWindow = Math.floor(new Date(msg.timestamp).getTime() / 5000);
        const key = `${msg.text}_${msgEmail}_${msgTimeWindow}`;

        if (optimisticKeys.has(key)) {
          console.log('[message_history] Skipping message that matches optimistic:', {
            msgId: msg.id,
            key: key,
          });
          return false;
        }

        return true;
      });

      // Combine existing messages with new ones, sorted by timestamp (stable sort with ID tiebreaker)
      const merged = [...prev, ...newMessages].sort((a, b) => {
        const timeA = new Date(a.timestamp || a.created_at || 0).getTime();
        const timeB = new Date(b.timestamp || b.created_at || 0).getTime();
        // If timestamps are equal (or very close within 1ms), use ID as tiebreaker for stable sort
        if (Math.abs(timeA - timeB) < 1) {
          return (a.id || '').localeCompare(b.id || '');
        }
        return timeA - timeB;
      });

      console.log('[message_history] Merge complete:', {
        newMessagesCount: newMessages.length,
        finalCount: merged.length,
      });

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
  });

  // New message handler - uses pure functions from messageUtils.js for SRP compliance
  socket.on('new_message', message => {
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
      setMessageStatuses(prev => new Map(prev).set(message.id, 'sent'));
      setPendingMessages(prev => {
        const next = new Map(prev);
        next.delete(message.id);
        return next;
      });
      offlineQueueRef.current = offlineQueueRef.current.filter(m => m.id !== message.id);
    }

    // Use pure functions to determine and apply message action
    // NOTE: We capture removedMsgId inside the callback but clean up AFTER
    // to avoid calling state setters inside another state setter's callback
    let removedMsgId = null;

    setMessages(prev => {
      const action = determineMessageAction(prev, message, usernameRef.current);

      console.log('[new_message] Action determined:', {
        action: action.action,
        reason: action.reason || action.matchedBy,
        messageId: message.id,
        optimisticId: message.optimisticId,
        text: message.text?.substring(0, 30),
      });

      // Capture ID for cleanup (will be processed after this callback)
      if (action.action === 'replace' && action.removeIndex >= 0) {
        const removedMsg = prev[action.removeIndex];
        if (removedMsg?.id) {
          removedMsgId = removedMsg.id;
        }
      }

      return applyMessageAction(prev, messageWithTimestamp, action);
    });

    // Clean up pending message tracking after capturing the ID
    // The setMessages callback runs synchronously, so removedMsgId is set by now
    if (removedMsgId) {
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
    // Clear both analyzing state AND blocked message (ObserverCard)
    if (ownMessage && setDraftCoaching) {
      // Clear draftCoaching completely - removes both analyzing state and blocked message
      setDraftCoaching(null);
    }
  });
}
