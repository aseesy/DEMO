import { trackConnectionError } from '../../../utils/analyticsEnhancements.js';

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
      } catch (e) {
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
    const history = Array.isArray(data) ? data : data.messages || [];
    const hasMore = Array.isArray(data) ? true : (data.hasMore ?? true);

    const filtered = (history || []).filter(msg => {
      if (typeof msg?.text !== 'string') return true;
      const lower = msg.text.toLowerCase();
      return !lower.includes(' left the chat') && !lower.includes(' joined the chat');
    });

    setMessages(filtered.map(msg => ({ ...msg, timestamp: msg.timestamp })));
    setHasMoreMessages(hasMore);

    requestAnimationFrame(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
      setTimeout(() => setIsInitialLoad(false), 50);
    });
  });

  // New message
  socket.on('new_message', message => {
    if (typeof message?.text === 'string') {
      const lower = message.text.toLowerCase();
      if (lower.includes(' left the chat') || lower.includes(' joined the chat')) return;
    }

    const messageWithTimestamp = {
      ...message,
      timestamp: message.timestamp || new Date().toISOString(),
    };

    const isOwnMessage = message.username?.toLowerCase() === usernameRef.current?.toLowerCase();

    if (isOwnMessage && message.id) {
      setMessageStatuses(prev => new Map(prev).set(message.id, 'sent'));
      setPendingMessages(prev => {
        const next = new Map(prev);
        next.delete(message.id);
        return next;
      });
      offlineQueueRef.current = offlineQueueRef.current.filter(m => m.id !== message.id);
    }

    // Handle optimistic update replacement for own messages
    if (isOwnMessage) {
      setMessages(prev => {
        // Find and remove any optimistic message with matching text from this user
        // (optimistic messages have isOptimistic: true and id starting with 'pending_')
        const withoutOptimistic = prev.filter(msg => {
          if (msg.isOptimistic && msg.text === message.text) {
            // Clean up pending message tracking
            setPendingMessages(p => {
              const next = new Map(p);
              next.delete(msg.id);
              return next;
            });
            setMessageStatuses(p => {
              const next = new Map(p);
              next.delete(msg.id);
              return next;
            });
            return false; // Remove this optimistic message
          }
          return true;
        });
        return [...withoutOptimistic, messageWithTimestamp];
      });
    } else {
      // For messages from others, just append
      setMessages(prev => [...prev, messageWithTimestamp]);
    }

    if (onNewMessageRef.current) onNewMessageRef.current(messageWithTimestamp);

    if (currentViewRef.current !== 'chat' || document.hidden) {
      if (message.username?.toLowerCase() !== usernameRef.current?.toLowerCase()) {
        setUnreadCount(prev => prev + 1);
      }
    }

    if (
      message.username?.toLowerCase() === usernameRef.current?.toLowerCase() &&
      message.isPreApprovedRewrite
    ) {
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
    setIsSearching(false);
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
    setIsSearching(false);
    setSearchResults(results || []);
    setSearchTotal(total || 0);
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
