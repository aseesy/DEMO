import { trackConnectionError } from '../../../utils/analyticsEnhancements.js';
import {
  isSystemMessage,
  isOwnMessage,
  determineMessageAction,
  applyMessageAction,
} from './messageUtils.js';

/**
 * Sets up socket event handlers for the chat connection
 * @param {Object} socket - Socket.io socket instance
 * @param {Object} handlers - Object containing all handler functions and refs
 */
export function setupSocketEventHandlers(socket, handlers) {
  const {
    username,
    isAuthenticated,
    usernameRef,
    currentViewRef,
    onNewMessageRef,
    offlineQueueRef,
    messagesContainerRef,
    messagesEndRef,
    loadingTimeoutRef,
    setIsConnected,
    setError,
    setIsJoined,
    setMessages,
    setHasMoreMessages,
    setIsInitialLoad,
    setMessageStatuses,
    setPendingMessages,
    setTypingUsers,
    setThreads,
    setThreadMessages,
    setIsLoadingOlder,
    // Search handlers - optional (use useSearchMessages hook instead)
    setSearchResults,
    setSearchTotal,
    setIsSearching,
    setHighlightedMessageId,
    setDraftCoaching,
    setUnreadCount,
    setRoomId,
  } = handlers;

  // Connection events
  socket.on('connect', () => {
    setIsConnected(true);
    setError('');
    if (isAuthenticated && username) socket.emit('join', { username });

    if (offlineQueueRef.current.length > 0 && socket.connected) {
      const queue = [...offlineQueueRef.current];
      offlineQueueRef.current = [];
      queue.forEach(msg => {
        socket.emit('send_message', {
          text: msg.text,
          isPreApprovedRewrite: msg.isPreApprovedRewrite || false,
          originalRewrite: msg.originalRewrite || null,
        });
        setMessageStatuses(prev => new Map(prev).set(msg.id, 'pending'));
      });
      try {
        localStorage.removeItem('liaizen_offline_queue');
      } catch {
        /* ignore */
      }
    }
  });

  socket.on('disconnect', () => {
    setIsConnected(false);
    setIsJoined(false);
  });

  socket.on('connect_error', err => {
    console.error('Chat connection error:', err);
    setIsConnected(false);
    setError('Unable to connect to chat server.');
    trackConnectionError('socket_connect_error', err.message || String(err));
  });

  socket.on('join_success', data => {
    setIsJoined(true);
    setError('');
    // Extract roomId from join_success event (authoritative source from backend)
    // This takes precedence over HTTP-fetched roomId since it's from the actual join
    if (data?.roomId && setRoomId) {
      setRoomId(data.roomId);
    }
  });

  // Message history
  socket.on('message_history', data => {
    console.log('[message_history] Received data:', {
      isArray: Array.isArray(data),
      hasMessages: !!data.messages,
      messageCount: Array.isArray(data) ? data.length : data.messages?.length || 0,
      hasMore: data.hasMore,
    });

    const history = Array.isArray(data) ? data : data.messages || [];
    const hasMore = Array.isArray(data) ? true : (data.hasMore ?? true);

    console.log('[message_history] Raw history count:', history.length);

    const filtered = (history || []).filter(msg => {
      if (typeof msg?.text !== 'string') return true;
      const lower = msg.text.toLowerCase();
      const shouldKeep = !lower.includes(' left the chat') && !lower.includes(' joined the chat');
      if (!shouldKeep) {
        console.log('[message_history] Filtering out system message:', msg.text?.substring(0, 50));
      }
      return shouldKeep;
    });

    console.log('[message_history] After filtering:', {
      before: history.length,
      after: filtered.length,
      filteredOut: history.length - filtered.length,
    });

    const historyMessages = filtered.map(msg => ({ ...msg, timestamp: msg.timestamp }));

    // Log sample of messages
    if (historyMessages.length > 0) {
      console.log('[message_history] Sample messages:', {
        first: historyMessages[0]?.text?.substring(0, 40),
        last: historyMessages[historyMessages.length - 1]?.text?.substring(0, 40),
        count: historyMessages.length,
      });
    } else {
      console.warn('[message_history] ⚠️ No messages after filtering!');
    }

    // Only replace messages if this is an initial load (isInitialLoad is true)
    // Otherwise, merge with existing messages to preserve messages that were already loaded
    // This prevents clearing messages when socket reconnects or user navigates back
    setMessages(prev => {
      // Check if this is an initial load by checking isInitialLoad state
      // We need to access it via a ref or check if prev.length is 0
      // For now, use prev.length === 0 as indicator of initial load
      // But also check if all messages are optimistic (pending) - if so, this might be a reconnect
      const hasRealMessages = prev.some(
        msg => msg.id && !msg.id.startsWith('pending_') && !msg.isOptimistic
      );

      // If we have no real messages, this is an initial load - replace all
      // This happens on page refresh
      if (prev.length === 0 || !hasRealMessages) {
        console.log('[message_history] Initial load - replacing all messages:', {
          prevCount: prev.length,
          historyCount: historyMessages.length,
        });
        return historyMessages;
      }

      // Otherwise, merge history with existing messages, avoiding duplicates
      // Create a map of existing message IDs
      const existingIds = new Set(prev.map(msg => msg.id).filter(Boolean));

      // Track optimistic messages by text+username+timestamp to avoid duplicates
      // Use a more lenient matching for optimistic messages
      const optimisticKeys = new Set(
        prev
          .filter(msg => msg.isOptimistic || msg.id?.startsWith('pending_'))
          .map(msg => {
            const text = (msg.text || '').trim().toLowerCase();
            const username = (msg.username || '').toLowerCase();
            const timestamp = msg.timestamp || msg.created_at || '';
            // Use a time window (round to nearest 5 seconds) for matching
            const timeWindow = timestamp ? Math.floor(new Date(timestamp).getTime() / 5000) : '';
            return `${text}_${username}_${timeWindow}`;
          })
      );

      console.log('[message_history] Merging messages:', {
        prevCount: prev.length,
        historyCount: historyMessages.length,
        optimisticCount: optimisticKeys.size,
        existingIdsCount: existingIds.size,
      });

      // Add new messages from history that don't already exist
      const newMessages = historyMessages.filter(msg => {
        // Skip if we already have this message by ID
        if (msg.id && existingIds.has(msg.id)) {
          return false;
        }

        // Skip if this matches an optimistic message (same text, username, and time window)
        const msgText = (msg.text || '').trim().toLowerCase();
        const msgUsername = (msg.username || '').toLowerCase();
        const msgTimestamp = msg.timestamp || msg.created_at || '';
        const msgTimeWindow = msgTimestamp
          ? Math.floor(new Date(msgTimestamp).getTime() / 5000)
          : '';
        const key = `${msgText}_${msgUsername}_${msgTimeWindow}`;

        if (optimisticKeys.has(key)) {
          console.log('[message_history] Skipping message that matches optimistic:', {
            msgId: msg.id,
            key: key,
          });
          return false;
        }

        return true;
      });

      // Combine existing messages with new ones, sorted by timestamp
      const merged = [...prev, ...newMessages].sort((a, b) => {
        const timeA = new Date(a.timestamp || a.created_at || 0).getTime();
        const timeB = new Date(b.timestamp || b.created_at || 0).getTime();
        return timeA - timeB;
      });

      console.log('[message_history] Merge complete:', {
        newMessagesCount: newMessages.length,
        finalCount: merged.length,
      });

      return merged;
    });

    setHasMoreMessages(hasMore);

    requestAnimationFrame(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
      setTimeout(() => setIsInitialLoad(false), 50);
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
    setMessages(prev => {
      const action = determineMessageAction(prev, message, usernameRef.current);

      console.log('[new_message] Action determined:', {
        action: action.action,
        reason: action.reason || action.matchedBy,
        messageId: message.id,
        optimisticId: message.optimisticId,
        text: message.text?.substring(0, 30),
      });

      // Clean up pending message tracking when replacing optimistic message
      if (action.action === 'replace' && action.removeIndex >= 0) {
        const removedMsg = prev[action.removeIndex];
        if (removedMsg?.id) {
          setPendingMessages(p => {
            const next = new Map(p);
            next.delete(removedMsg.id);
            return next;
          });
          setMessageStatuses(p => {
            const next = new Map(p);
            next.delete(removedMsg.id);
            return next;
          });
        }
      }

      return applyMessageAction(prev, messageWithTimestamp, action);
    });

    // Trigger callback for new messages
    if (onNewMessageRef.current) onNewMessageRef.current(messageWithTimestamp);

    // Update unread count for messages from others when not in chat view
    if (currentViewRef.current !== 'chat' || document.hidden) {
      if (!ownMessage) {
        setUnreadCount(prev => prev + 1);
      }
    }

    // Dispatch event for pre-approved rewrites
    if (ownMessage && message.isPreApprovedRewrite) {
      window.dispatchEvent(
        new CustomEvent('rewrite-sent', { detail: { message: messageWithTimestamp } })
      );
    }
  });

  socket.on('user_typing', ({ username: typingName, isTyping }) => {
    setTypingUsers(prev => {
      const next = new Set(prev);
      isTyping ? next.add(typingName) : next.delete(typingName);
      return next;
    });
  });

  socket.on('user_joined', data =>
    window.dispatchEvent(new CustomEvent('coparent-joined', { detail: data }))
  );

  socket.on('message_flagged', ({ messageId, flaggedBy }) => {
    setMessages(prev =>
      prev.map(msg => (msg.id === messageId ? { ...msg, user_flagged_by: flaggedBy } : msg))
    );
  });

  socket.on('error', ({ message }) => {
    trackConnectionError('socket_error', message || 'Unknown socket error');
    console.error('Socket error:', message);
    setError(message);
    setIsLoadingOlder(false);
    if (setIsSearching) setIsSearching(false);
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
  });

  socket.on('replaced_by_new_connection', ({ message }) => {
    setError(message || 'You opened this chat in another tab.');
    socket.disconnect();
  });

  socket.on('draft_analysis', coaching => setDraftCoaching(coaching));
  socket.on('threads_updated', threadList => setThreads(threadList));
  socket.on('threads_list', threadList => setThreads(threadList));
  socket.on('thread_messages', ({ threadId, messages: msgs }) => {
    setThreadMessages(prev => ({ ...prev, [threadId]: msgs }));
  });

  socket.on('older_messages', ({ messages: olderMsgs, hasMore }) => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
    setIsLoadingOlder(false);
    setHasMoreMessages(hasMore);
    if (olderMsgs?.length > 0) setMessages(prev => [...olderMsgs, ...prev]);
  });

  socket.on('search_results', ({ messages: results, total }) => {
    // Only handle if search handlers are provided (from useSearchMessages hook)
    if (setIsSearching && setSearchResults && setSearchTotal) {
      setIsSearching(false);
      setSearchResults(results || []);
      setSearchTotal(total || 0);
    }
  });

  socket.on('jump_to_message_result', ({ messages: contextMsgs, targetMessageId }) => {
    if (contextMsgs?.length > 0) {
      setMessages(contextMsgs);
      setHighlightedMessageId(targetMessageId);
      setTimeout(() => {
        document
          .getElementById(`message-${targetMessageId}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      setTimeout(() => setHighlightedMessageId(null), 3000);
    }
  });
}
