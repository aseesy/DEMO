/**
 * useChat Hook
 *
 * Main chat hook that composes smaller focused hooks:
 * - useScrollManager: Auto-scroll behavior
 * - useInputMessage: Input state and typing
 * - useSearchMessages: Search functionality
 * - useSendMessage: Message sending with analysis
 *
 * This hook orchestrates socket connection and message state.
 */

import React from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config.js';
import { trackConnectionError } from '../utils/analyticsEnhancements.js';
import {
  createMessagePayload,
  ensureMessageTimestamp,
  isSystemMessage,
  filterSystemMessages,
  isOwnMessage,
  isAIMessage,
  clearOfflineQueue,
  removeFromQueue,
  saveOfflineQueue,
  MESSAGE_STATUS,
} from '../utils/messageBuilder.js';

import { useScrollManager } from './useScrollManager.js';
import { useInputMessage } from './useInputMessage.js';
import { useSearchMessages } from './useSearchMessages.js';
import { useSendMessage } from './useSendMessage.js';

/**
 * Get socket URL from environment
 */
function getSocketUrl() {
  let socketUrl = window.SOCKET_URL;

  if (!socketUrl) {
    socketUrl = API_BASE_URL.replace(/\/+$/, '').replace(/\/api$/, '');

    if (socketUrl === '/api' || socketUrl === '') {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001';

      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        const hostname = window.location.hostname || 'localhost';
        socketUrl = `http://${hostname}:3001`;
      } else {
        socketUrl = origin;
      }
    }

    if (!socketUrl || socketUrl === 'http://localhost:3001') {
      const hostname = typeof window !== 'undefined' ? window.location.hostname || 'localhost' : 'localhost';
      socketUrl = `http://${hostname}:3001`;
    }
  }

  return socketUrl;
}

export function useChat({ username, isAuthenticated, currentView, onNewMessage }) {
  // Core message state
  const [messages, setMessages] = React.useState([]);
  const [isConnected, setIsConnected] = React.useState(false);
  const [isJoined, setIsJoined] = React.useState(false);
  const [error, setError] = React.useState('');
  const [typingUsers, setTypingUsers] = React.useState(new Set());
  const [draftCoaching, setDraftCoaching] = React.useState(null);

  // Thread state
  const [threads, setThreads] = React.useState([]);
  const [threadMessages, setThreadMessages] = React.useState({});
  const [selectedThreadId, setSelectedThreadId] = React.useState(null);

  // Pagination state
  const [isLoadingOlder, setIsLoadingOlder] = React.useState(false);
  const [hasMoreMessages, setHasMoreMessages] = React.useState(true);

  // Refs
  const socketRef = React.useRef(null);
  const messagesEndRef = React.useRef(null);
  const messagesContainerRef = React.useRef(null);
  const offlineQueueRef = React.useRef([]);
  const loadingTimeoutRef = React.useRef(null);
  const lastSeenTimestampRef = React.useRef(null);

  // Refs to avoid socket reconnection when these change
  const currentViewRef = React.useRef(currentView);
  const onNewMessageRef = React.useRef(onNewMessage);

  React.useEffect(() => {
    currentViewRef.current = currentView;
  }, [currentView]);

  React.useEffect(() => {
    onNewMessageRef.current = onNewMessage;
  }, [onNewMessage]);

  // Compose scroll manager
  const {
    isInitialLoad,
    setIsInitialLoad,
    scrollToBottom,
    shouldAutoScroll,
    handleInitialScroll,
  } = useScrollManager({ messagesContainerRef, messagesEndRef });

  // Compose input manager
  const {
    inputMessage,
    setInputMessage,
    isPreApprovedRewrite,
    setIsPreApprovedRewrite,
    originalRewrite,
    setOriginalRewrite,
    handleInputChange,
    clearInput,
    stopTyping,
  } = useInputMessage({ socketRef, setDraftCoaching });

  // Compose search manager
  const {
    searchQuery,
    searchResults,
    searchTotal,
    isSearching,
    searchMode,
    highlightedMessageId,
    setSearchResults,
    setSearchTotal,
    setIsSearching,
    setHighlightedMessageId,
    setSearchMode,
    searchMessages,
    jumpToMessage,
    toggleSearchMode,
    exitSearchMode: exitSearchModeBase,
  } = useSearchMessages({ socketRef, username, setError });

  // Exit search mode with re-join
  const exitSearchMode = React.useCallback(() => {
    exitSearchModeBase();
    if (socketRef.current?.connected && username) {
      socketRef.current.emit('join', { username });
    }
  }, [exitSearchModeBase, username]);

  // Compose send message
  const {
    pendingMessages,
    setPendingMessages,
    messageStatuses,
    setMessageStatuses,
    sendMessage,
    markMessageSent,
  } = useSendMessage({
    socketRef,
    username,
    inputMessage,
    isPreApprovedRewrite,
    originalRewrite,
    clearInput,
    stopTyping,
    setDraftCoaching,
    setError,
    offlineQueueRef,
    scrollToBottom,
  });

  // Auto-scroll on new messages
  React.useEffect(() => {
    if (shouldAutoScroll()) {
      scrollToBottom();
    }
  }, [messages, shouldAutoScroll, scrollToBottom]);

  // Socket connection
  React.useEffect(() => {
    if (!username) return;

    const socketUrl = getSocketUrl();
    const socket = io(socketUrl, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      timeout: 20000,
      forceNew: false,
      upgrade: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      setError('');
      if (isAuthenticated && username) {
        socket.emit('join', { username });
      }

      // Retry sending queued offline messages
      if (offlineQueueRef.current.length > 0 && socket.connected) {
        const queue = [...offlineQueueRef.current];
        offlineQueueRef.current = [];

        queue.forEach(queuedMessage => {
          socket.emit('send_message', createMessagePayload(queuedMessage));
          setMessageStatuses(prev => {
            const next = new Map(prev);
            next.set(queuedMessage.id, MESSAGE_STATUS.PENDING);
            return next;
          });
        });

        clearOfflineQueue();
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setIsJoined(false);
    });

    socket.on('connect_error', err => {
      console.error('Chat connection error:', err);
      setIsConnected(false);
      setError('Unable to connect to chat server. Please check if the server is running.');
      trackConnectionError('socket_connect_error', err.message || String(err));
    });

    socket.on('join_success', () => {
      setIsJoined(true);
      setError('');
    });

    socket.on('message_history', data => {
      const history = Array.isArray(data) ? data : data.messages || [];
      const hasMore = Array.isArray(data) ? true : (data.hasMore ?? true);
      const filtered = filterSystemMessages(history);
      const processedMessages = filtered.map(msg => ensureMessageTimestamp(msg));

      setMessages(processedMessages);
      setHasMoreMessages(hasMore);

      if (processedMessages.length > 0) {
        const lastMessage = processedMessages[processedMessages.length - 1];
        lastSeenTimestampRef.current = lastMessage.timestamp || new Date().toISOString();
      }

      requestAnimationFrame(() => {
        handleInitialScroll();
      });
    });

    socket.on('new_message', message => {
      if (isAIMessage(message)) {
        console.log('📩 Received AI/intervention message:', {
          type: message.type,
          id: message.id,
        });
      }

      if (isSystemMessage(message)) return;

      const messageWithTimestamp = ensureMessageTimestamp(message);

      // Mark own message as sent
      if (isOwnMessage(message, username) && message.id) {
        markMessageSent(message.id);
        offlineQueueRef.current = removeFromQueue(offlineQueueRef.current, message.id);
        saveOfflineQueue(offlineQueueRef.current);
      }

      setMessages(prev => [...prev, messageWithTimestamp]);

      // Trigger notification callback
      if (onNewMessageRef.current && typeof onNewMessageRef.current === 'function') {
        onNewMessageRef.current(messageWithTimestamp);
      }

      // Update last seen timestamp
      if (currentViewRef.current === 'chat' && !document.hidden) {
        lastSeenTimestampRef.current = messageWithTimestamp.timestamp;
      }

      // Handle rewrite sent event
      if (
        message.username?.toLowerCase() === username?.toLowerCase() &&
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
        if (isTyping) next.add(typingName);
        else next.delete(typingName);
        return next;
      });
    });

    socket.on('user_joined', data => {
      window.dispatchEvent(new CustomEvent('coparent-joined', { detail: data }));
    });

    socket.on('message_flagged', ({ messageId, flaggedBy }) => {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId ? { ...msg, user_flagged_by: flaggedBy } : msg
        )
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
      setError(message || 'You opened this chat in another tab. This tab is now disconnected.');
      socket.disconnect();
    });

    socket.on('draft_analysis', coaching => {
      setDraftCoaching(coaching);
    });

    socket.on('threads_updated', threads => setThreads(threads));
    socket.on('threads_list', threads => setThreads(threads));

    socket.on('thread_messages', ({ threadId, messages }) => {
      setThreadMessages(prev => ({ ...prev, [threadId]: messages }));
    });

    socket.on('older_messages', ({ messages: olderMsgs, hasMore }) => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      setIsLoadingOlder(false);
      setHasMoreMessages(hasMore);
      if (olderMsgs && olderMsgs.length > 0) {
        setMessages(prev => [...olderMsgs, ...prev]);
      }
    });

    socket.on('search_results', ({ messages: results, total }) => {
      setIsSearching(false);
      setSearchResults(results || []);
      setSearchTotal(total || 0);
    });

    socket.on('jump_to_message_result', ({ messages: contextMsgs, targetMessageId }) => {
      if (contextMsgs && contextMsgs.length > 0) {
        setMessages(contextMsgs);
        setHighlightedMessageId(targetMessageId);
        setSearchMode(false);

        setTimeout(() => {
          const messageElement = document.getElementById(`message-${targetMessageId}`);
          if (messageElement) {
            messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);

        setTimeout(() => setHighlightedMessageId(null), 3000);
      }
    });

    return () => socket.disconnect();
  }, [username, isAuthenticated, handleInitialScroll, markMessageSent, setMessageStatuses, setSearchResults, setSearchTotal, setIsSearching, setHighlightedMessageId, setSearchMode]);

  // Auto-join when navigating to chat view
  React.useEffect(() => {
    if (
      currentView === 'chat' &&
      isAuthenticated &&
      username &&
      socketRef.current?.connected &&
      !isJoined
    ) {
      socketRef.current.emit('join', { username });
    }
  }, [currentView, isAuthenticated, username, isJoined]);

  // Mark all messages as seen when viewing chat
  React.useEffect(() => {
    if (currentView === 'chat' && !document.hidden && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage?.timestamp) {
        lastSeenTimestampRef.current = lastMessage.timestamp;
      }
    }
  }, [currentView, messages]);

  // Function to remove messages
  const removeMessages = React.useCallback(predicate => {
    setMessages(prev => prev.filter(msg => !predicate(msg)));
  }, []);

  // Function to flag a message
  const flagMessage = React.useCallback((messageId, reason = null) => {
    if (!socketRef.current?.connected) {
      setError('Not connected to chat server.');
      return;
    }
    socketRef.current.emit('flag_message', { messageId, reason });
  }, []);

  // Thread management
  const createThread = React.useCallback((roomId, title, messageId) => {
    if (!socketRef.current?.connected) {
      setError('Not connected to chat server.');
      return;
    }
    socketRef.current.emit('create_thread', { roomId, title, messageId });
  }, []);

  const getThreads = React.useCallback(roomId => {
    if (!socketRef.current?.connected) {
      setError('Not connected to chat server.');
      return;
    }
    socketRef.current.emit('get_threads', { roomId });
  }, []);

  const getThreadMessages = React.useCallback(threadId => {
    if (!socketRef.current?.connected) {
      setError('Not connected to chat server.');
      return;
    }
    socketRef.current.emit('get_thread_messages', { threadId });
  }, []);

  const addToThread = React.useCallback((messageId, threadId) => {
    if (!socketRef.current?.connected) {
      setError('Not connected to chat server.');
      return;
    }
    socketRef.current.emit('add_to_thread', { messageId, threadId });
  }, []);

  // Load older messages (pagination)
  const loadOlderMessages = React.useCallback(() => {
    if (!socketRef.current?.connected || isLoadingOlder || !hasMoreMessages || messages.length === 0) {
      return;
    }

    const oldestMessage = messages[0];
    const beforeTimestamp = oldestMessage.timestamp;

    setIsLoadingOlder(true);

    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    loadingTimeoutRef.current = setTimeout(() => {
      console.warn('Loading older messages timed out');
      setIsLoadingOlder(false);
    }, 10000);

    socketRef.current.emit('load_older_messages', { beforeTimestamp, limit: 50 });
  }, [messages, isLoadingOlder, hasMoreMessages]);

  return {
    // Messages
    messages,
    inputMessage,
    setInputMessage,
    sendMessage,
    handleInputChange,
    removeMessages,
    flagMessage,

    // Connection
    isConnected,
    isJoined,
    error,
    socket: socketRef.current,

    // UI state
    typingUsers,
    messagesEndRef,
    messagesContainerRef,
    isInitialLoad,

    // Draft coaching
    draftCoaching,
    setDraftCoaching,
    isPreApprovedRewrite,
    setIsPreApprovedRewrite,
    setOriginalRewrite,

    // Threads
    threads,
    threadMessages,
    selectedThreadId,
    setSelectedThreadId,
    createThread,
    getThreads,
    getThreadMessages,
    addToThread,

    // Pagination
    loadOlderMessages,
    isLoadingOlder,
    hasMoreMessages,

    // Search
    searchMessages,
    searchQuery,
    searchResults,
    searchTotal,
    isSearching,
    searchMode,
    toggleSearchMode,
    exitSearchMode,
    jumpToMessage,
    highlightedMessageId,
  };
}

export default useChat;
