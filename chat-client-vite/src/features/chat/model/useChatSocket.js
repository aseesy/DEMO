import React from 'react';
import { io } from 'socket.io-client';
import { setupSocketEventHandlers } from './socketEventHandlers.js';
import { useRoomId } from '../../../hooks/room/useRoomId.js';
import { useMessages } from './useMessages.js';
import { useMessagePagination } from './useMessagePagination.js';

// Import SocketEvents for type-safe event names
// Note: Full migration to SocketAdapter pending - current code uses raw socket.io
import { SocketEvents, getSocketUrl as getAdapterSocketUrl } from '../../../adapters/socket';

/**
 * getSocketUrl - Determines the correct socket URL based on environment
 */
function getSocketUrl() {
  let socketUrl = window.SOCKET_URL;
  if (!socketUrl) {
    socketUrl = API_BASE_URL.replace(/\/+$/, '').replace(/\/api$/, '');
    if (socketUrl === '/api' || socketUrl === '') {
      const origin =
        typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001';
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        socketUrl = `http://${window.location.hostname || 'localhost'}:3001`;
      } else {
        socketUrl = origin;
      }
    }
    if (!socketUrl || socketUrl === 'http://localhost:3001') {
      socketUrl = `http://${typeof window !== 'undefined' ? window.location.hostname || 'localhost' : 'localhost'}:3001`;
    }
  }
  return socketUrl;
}

/**
 * useChatSocket - Manages socket connection and message state
 */
export function useChatSocket({ username, isAuthenticated, currentView, onNewMessage }) {
  // Connection state
  const [isConnected, setIsConnected] = React.useState(false);
  const [isJoined, setIsJoined] = React.useState(false);
  const [error, setError] = React.useState('');
  const [typingUsers, setTypingUsers] = React.useState(new Set());

  // Threads
  const [threads, setThreads] = React.useState([]);
  const [threadMessages, setThreadMessages] = React.useState({});
  
  // Room ID management - extracted to useRoomId hook
  const { roomId, setRoomId } = useRoomId(username, isAuthenticated);

  // Message state management - extracted to useMessages hook
  const { messages, setMessages, pendingMessages, setPendingMessages, messageStatuses, setMessageStatuses } = useMessages();

  // Pagination state and operations - extracted to useMessagePagination hook
  // Note: socketRef is created later, but we pass it when it's available
  const [isLoadingOlder, setIsLoadingOlder] = React.useState(false);
  const [hasMoreMessages, setHasMoreMessages] = React.useState(true);
  const [isInitialLoad, setIsInitialLoad] = React.useState(true);
  
  // Create socketRef early so we can use it in useMessagePagination
  const socketRef = React.useRef(null);
  
  const { loadOlderMessages } = useMessagePagination({
    socketRef,
    messages,
    setIsLoadingOlder,
    setHasMoreMessages,
    setIsInitialLoad,
  });

  // Search state - removed (use useSearchMessages hook instead)

  // Draft coaching
  const [draftCoaching, setDraftCoaching] = React.useState(null);

  // Unread count
  const [unreadCount, setUnreadCount] = React.useState(0);

  // Refs
  const socketRef = React.useRef(null);
  const messagesEndRef = React.useRef(null);
  const messagesContainerRef = React.useRef(null);
  const offlineQueueRef = React.useRef([]);
  const loadingTimeoutRef = React.useRef(null);
  const lastLoadedRoomIdRef = React.useRef(null); // Track last loaded roomId to prevent duplicate thread loads

  // Keep refs updated to avoid socket reconnection
  const currentViewRef = React.useRef(currentView);
  const onNewMessageRef = React.useRef(onNewMessage);
  const usernameRef = React.useRef(username);

  React.useEffect(() => {
    currentViewRef.current = currentView;
  }, [currentView]);
  React.useEffect(() => {
    onNewMessageRef.current = onNewMessage;
  }, [onNewMessage]);
  React.useEffect(() => {
    usernameRef.current = username;
  }, [username]);

  // Reset unread count when viewing chat
  React.useEffect(() => {
    if (currentView === 'chat') {
      setUnreadCount(0);
    }
  }, [currentView]);

  // Socket connection - persists across view changes
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

    setupSocketEventHandlers(socket, {
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
      // Search handlers - removed (use useSearchMessages hook instead)
      setDraftCoaching,
      setUnreadCount,
      setRoomId, // Add setRoomId so socket handler can update it
    });

    return () => socket.disconnect();
  }, [username, isAuthenticated]);

  // Room ID is now managed by useRoomId hook
  // Reset thread loading ref when roomId changes (username change handled by useRoomId)
  React.useEffect(() => {
    if (!roomId) {
      lastLoadedRoomIdRef.current = null;
    }
  }, [roomId]);

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

  // Load threads when roomId is available and socket is connected
  // Use ref to prevent duplicate loads when dependencies change rapidly
  React.useEffect(() => {
    if (roomId && socketRef.current?.connected && isJoined) {
      // Only load if we haven't already loaded threads for this roomId
      if (lastLoadedRoomIdRef.current !== roomId) {
        lastLoadedRoomIdRef.current = roomId;
        getThreads(roomId);
      }
    } else if (!roomId) {
      // Reset ref when roomId is cleared (user lost room or disconnected)
      lastLoadedRoomIdRef.current = null;
    }
  }, [roomId, isConnected, isJoined, getThreads]);

  // Thread actions
  const createThread = React.useCallback((roomId, title, messageId) => {
    if (socketRef.current?.connected)
      socketRef.current.emit('create_thread', { roomId, title, messageId });
  }, []);

  const getThreads = React.useCallback(roomId => {
    if (socketRef.current?.connected) socketRef.current.emit('get_threads', { roomId });
  }, []);

  const getThreadMessages = React.useCallback(threadId => {
    if (socketRef.current?.connected) socketRef.current.emit('get_thread_messages', { threadId });
  }, []);

  const addToThread = React.useCallback((messageId, threadId) => {
    if (socketRef.current?.connected)
      socketRef.current.emit('add_to_thread', { messageId, threadId });
  }, []);

  // Pagination
  const loadOlderMessages = React.useCallback(() => {
    if (
      !socketRef.current?.connected ||
      isLoadingOlder ||
      !hasMoreMessages ||
      messages.length === 0
    )
      return;
    setIsLoadingOlder(true);
    if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    loadingTimeoutRef.current = setTimeout(() => {
      console.warn('Loading older messages timed out');
      setIsLoadingOlder(false);
    }, 10000);
    socketRef.current.emit('load_older_messages', {
      beforeTimestamp: messages[0].timestamp,
      limit: 50,
    });
  }, [messages, isLoadingOlder, hasMoreMessages]);

  // Search - removed (use useSearchMessages hook instead)

  return {
    // Connection
    socketRef,
    isConnected,
    isJoined,
    error,
    setError,

    // Messages
    messages,
    setMessages,
    pendingMessages,
    setPendingMessages,
    messageStatuses,
    setMessageStatuses,

    // Refs
    messagesEndRef,
    messagesContainerRef,
    offlineQueueRef,
    loadingTimeoutRef,

    // Typing
    typingUsers,

    // Threads
    threads,
    threadMessages,
    setThreadMessages,
    createThread,
    getThreads,
    getThreadMessages,
    addToThread,

    // Pagination
    isLoadingOlder,
    hasMoreMessages,
    isInitialLoad,
    loadOlderMessages,

    // Search - removed (use useSearchMessages hook instead)

    // Draft coaching
    draftCoaching,
    setDraftCoaching,

    // Unread
    unreadCount,
    setUnreadCount,
  };
}

export default useChatSocket;
