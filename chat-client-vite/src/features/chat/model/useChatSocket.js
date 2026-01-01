import { useState, useEffect, useRef, useCallback } from 'react';
import { socketService } from '../../../services/socket/index.js';
import { authStorage } from '../../../adapters/storage/index.js';
import { useSocketState, useSocketConnection, useSocketEmit } from '../../../hooks/socket/index.js';

// State hooks
import { useRoomId } from '../../../hooks/room/useRoomId.js';
import { useMessages } from './useMessages.js';
import { useMessagePagination } from './useMessagePagination.js';
import { useTypingIndicators } from './useTypingIndicators.js';
import { useDraftCoaching } from './useDraftCoaching.js';
import { useUnreadCount } from './useUnreadCount.js';
import { useThreads } from './useThreads.js';

// Initialize debug tools in development
import './socketDebug.js';

/**
 * useChatSocket - Orchestrates chat state and socket subscriptions
 *
 * Architecture:
 * - SocketService (singleton) manages the socket connection (infrastructure)
 * - This hook subscribes to events and manages React state (presentation)
 * - State hooks manage their specific domain state
 *
 * The socket lives OUTSIDE React's lifecycle in SocketService.
 * This hook only subscribes to events and updates React state.
 */
export function useChatSocket({
  username,
  isAuthenticated,
  currentView,
  onNewMessage,
  messageUIMethodsRef,
}) {
  if (import.meta.env.DEV) {
    console.log('[useChatSocket] Hook called with:', { username, isAuthenticated, currentView });
  }

  // === SOCKET CONNECTION (via SocketService) ===
  const getToken = useCallback(() => authStorage.getToken(), []);
  useSocketConnection({ isAuthenticated, getToken });

  const { isConnected } = useSocketState();
  const emit = useSocketEmit();

  // === LOCAL STATE ===
  const [isJoined, setIsJoined] = useState(false);
  const [error, setError] = useState('');

  // === STATE HOOKS ===
  const { roomId, setRoomId } = useRoomId(username, isAuthenticated);
  const { typingUsers, setTypingUsers } = useTypingIndicators();
  const { draftCoaching, setDraftCoaching } = useDraftCoaching();
  const { unreadCount, setUnreadCount } = useUnreadCount(currentView);

  const {
    messages,
    setMessages,
    pendingMessages,
    setPendingMessages,
    messageStatuses,
    setMessageStatuses,
  } = useMessages();

  // Socket-like ref for backward compatibility with code expecting socket.on/off/emit
  // Maps socket methods to SocketService while preserving legacy interface
  const socketRef = useRef(null);
  const unsubscribeMapRef = useRef(new Map()); // Track subscriptions for off()

  useEffect(() => {
    socketRef.current = {
      get connected() {
        return socketService.isConnected();
      },
      get id() {
        return socketService.getSocketId();
      },
      emit: (event, data) => socketService.emit(event, data),
      on: (event, callback) => {
        const unsub = socketService.subscribe(event, callback);
        // Store unsubscribe function keyed by event+callback
        const key = `${event}:${callback.toString().slice(0, 50)}`;
        unsubscribeMapRef.current.set(key, unsub);
      },
      off: (event, callback) => {
        const key = `${event}:${callback.toString().slice(0, 50)}`;
        const unsub = unsubscribeMapRef.current.get(key);
        if (unsub) {
          unsub();
          unsubscribeMapRef.current.delete(key);
        }
      },
    };

    return () => {
      // Clean up all subscriptions on unmount
      unsubscribeMapRef.current.forEach(unsub => unsub());
      unsubscribeMapRef.current.clear();
    };
  }, [isConnected]);

  const {
    isLoadingOlder,
    hasMoreMessages,
    isInitialLoad,
    setIsLoadingOlder,
    setHasMoreMessages,
    setIsInitialLoad,
    loadOlderMessages,
  } = useMessagePagination({ socketRef, messages });

  const {
    threads,
    threadMessages,
    isLoadingThreadMessages,
    setThreads,
    setThreadMessages,
    setIsLoadingThreadMessages,
    createThread,
    getThreads,
    getThreadMessages,
    addToThread,
  } = useThreads({ socketRef, roomId, isConnected, isJoined });

  // === REFS ===
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const offlineQueueRef = useRef([]);
  const currentViewRef = useRef(currentView);
  const onNewMessageRef = useRef(onNewMessage);
  const usernameRef = useRef(username);

  useEffect(() => {
    currentViewRef.current = currentView;
  }, [currentView]);
  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
  }, [onNewMessage]);
  useEffect(() => {
    usernameRef.current = username;
  }, [username]);

  // === SOCKET EVENT SUBSCRIPTIONS ===
  useEffect(() => {
    const unsubscribes = [];

    // Connection events
    unsubscribes.push(
      socketService.subscribe('connect', () => {
        console.log('[useChatSocket] Connected');
        setError('');
      })
    );

    unsubscribes.push(
      socketService.subscribe('disconnect', ({ reason }) => {
        console.log('[useChatSocket] Disconnected:', reason);
        setIsJoined(false);
      })
    );

    unsubscribes.push(
      socketService.subscribe('connect_error', ({ error: err }) => {
        setError(err || 'Connection error');
      })
    );

    // Room events
    unsubscribes.push(
      socketService.subscribe('joined', data => {
        console.log('[useChatSocket] Joined room:', data);
        setIsJoined(true);
        if (data.roomId) setRoomId(data.roomId);
        if (data.messages) {
          setMessages(data.messages);
          setHasMoreMessages(data.messages.length >= 50);
          setIsInitialLoad(false);
        }
      })
    );

    unsubscribes.push(
      socketService.subscribe('room_created', data => {
        if (data.roomId) setRoomId(data.roomId);
      })
    );

    // Message events
    unsubscribes.push(
      socketService.subscribe('new_message', message => {
        setMessages(prev => [...prev, message]);
        if (currentViewRef.current !== 'chat' && message.sender !== usernameRef.current) {
          setUnreadCount(prev => prev + 1);
        }
        onNewMessageRef.current?.(message);
      })
    );

    unsubscribes.push(
      socketService.subscribe('message_sent', data => {
        messageUIMethodsRef?.current?.markMessageSent?.(data.tempId, data.message);
        setMessageStatuses(prev => ({ ...prev, [data.tempId]: 'sent' }));
      })
    );

    unsubscribes.push(
      socketService.subscribe('message_error', data => {
        setMessageStatuses(prev => ({ ...prev, [data.tempId]: 'error' }));
      })
    );

    // Pagination events
    unsubscribes.push(
      socketService.subscribe('older_messages', data => {
        setIsLoadingOlder(false);
        if (data.messages?.length > 0) {
          setMessages(prev => [...data.messages, ...prev]);
          setHasMoreMessages(data.messages.length >= 50);
        } else {
          setHasMoreMessages(false);
        }
      })
    );

    // Typing events
    unsubscribes.push(
      socketService.subscribe('user_typing', data => {
        if (data.username !== usernameRef.current) {
          setTypingUsers(prev => new Set([...prev, data.username]));
        }
      })
    );

    unsubscribes.push(
      socketService.subscribe('user_stopped_typing', data => {
        setTypingUsers(prev => {
          const next = new Set(prev);
          next.delete(data.username);
          return next;
        });
      })
    );

    // Draft coaching events
    unsubscribes.push(socketService.subscribe('draft_coaching', setDraftCoaching));
    unsubscribes.push(socketService.subscribe('coaching_dismissed', () => setDraftCoaching(null)));

    // Thread events
    unsubscribes.push(socketService.subscribe('threads', data => setThreads(data.threads || [])));
    unsubscribes.push(
      socketService.subscribe('thread_created', data => {
        setThreads(prev => [...prev, data.thread]);
      })
    );
    unsubscribes.push(
      socketService.subscribe('thread_messages', data => {
        setIsLoadingThreadMessages(false);
        setThreadMessages(prev => ({ ...prev, [data.threadId]: data.messages }));
      })
    );

    // Error events
    unsubscribes.push(
      socketService.subscribe('error', data => {
        console.error('[useChatSocket] Server error:', data);
        setError(data.message || 'Server error');
      })
    );

    return () => unsubscribes.forEach(unsub => unsub());
  }, [
    setRoomId,
    setMessages,
    setHasMoreMessages,
    setIsInitialLoad,
    setMessageStatuses,
    setIsLoadingOlder,
    setTypingUsers,
    setDraftCoaching,
    setUnreadCount,
    setThreads,
    setThreadMessages,
    setIsLoadingThreadMessages,
    messageUIMethodsRef,
  ]);

  // === AUTO-JOIN EFFECT ===
  useEffect(() => {
    if (currentView === 'chat' && isAuthenticated && username && isConnected && !isJoined) {
      console.log('[useChatSocket] 📤 Emitting join:', { email: username });
      emit('join', { email: username });
    }
  }, [currentView, isAuthenticated, username, isConnected, isJoined, emit]);

  return {
    socketRef,
    isConnected,
    isJoined,
    error,
    setError,
    messages,
    setMessages,
    pendingMessages,
    setPendingMessages,
    messageStatuses,
    setMessageStatuses,
    messagesEndRef,
    messagesContainerRef,
    offlineQueueRef,
    typingUsers,
    threads,
    threadMessages,
    setThreadMessages,
    isLoadingThreadMessages,
    createThread,
    getThreads,
    getThreadMessages,
    addToThread,
    isLoadingOlder,
    hasMoreMessages,
    isInitialLoad,
    loadOlderMessages,
    draftCoaching,
    setDraftCoaching,
    unreadCount,
    setUnreadCount,
    emit,
  };
}

export default useChatSocket;
