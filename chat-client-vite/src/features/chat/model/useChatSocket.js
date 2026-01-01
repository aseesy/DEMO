import React from 'react';
import { io } from 'socket.io-client';
import { setupSocketEventHandlers } from './socketEventHandlers.js';
import { useRoomId } from '../../../hooks/room/useRoomId.js';
import { useMessages } from './useMessages.js';
import { useMessagePagination } from './useMessagePagination.js';
import { authStorage } from '../../../adapters/storage';

// Central configuration - Single Source of Truth
import { SOCKET_URL } from '../../../config.js';

// Import SocketEvents for type-safe event names
// Note: Full migration to SocketAdapter pending - current code uses raw socket.io
import { SocketEvents } from '../../../adapters/socket';

/**
 * getSocketUrl - Returns socket URL from central config
 * Uses SOCKET_URL from config.js as the single source of truth
 */
function getSocketUrl() {
  // Allow runtime override via window (for testing/debugging)
  if (typeof window !== 'undefined' && window.SOCKET_URL) {
    return window.SOCKET_URL;
  }
  return SOCKET_URL;
}

// Debug: Expose socket diagnostic info on window for troubleshooting (development only)
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  window.__SOCKET_DEBUG__ = {
    SOCKET_URL,
    getSocketUrl,
    testConnection: () => {
      const url = getSocketUrl();
      const authToken = authStorage.getToken();
      console.log('[Debug] Testing socket connection to:', url);
      console.log('[Debug] Auth token:', authToken ? 'Present' : 'Missing');
      if (authToken) {
        console.log('[Debug] Token preview:', authToken.substring(0, 20) + '...');
      }
      const testSocket = io(url, {
        transports: ['polling'],
        timeout: 10000, // Increased timeout
        autoConnect: true,
        auth: authToken ? { token: authToken } : undefined,
      });
      
      let connected = false;
      let errorOccurred = false;
      
      testSocket.on('connect', () => {
        connected = true;
        console.log('[Debug] ✅ Test socket connected! ID:', testSocket.id);
        setTimeout(() => testSocket.disconnect(), 1000);
      });
      
      testSocket.on('connect_error', (err) => {
        errorOccurred = true;
        console.error('[Debug] ❌ Test socket connection failed:', {
          message: err.message,
          data: err.data,
          type: err.type,
          description: err.description,
          code: err.data?.code,
        });
        console.error('[Debug] Full error object:', err);
      });
      
      // Wait a bit and report status
      setTimeout(() => {
        if (!connected && !errorOccurred) {
          console.warn('[Debug] ⏳ Socket still connecting after 2 seconds...');
        }
      }, 2000);
      
      return testSocket;
    },
    checkAuth: () => {
      const token = authStorage.getToken();
      console.log('[Debug] Auth token check:', {
        hasToken: !!token,
        tokenLength: token?.length,
        tokenPreview: token ? token.substring(0, 20) + '...' : null,
      });
      return token;
    },
  };
  console.log('[useChatSocket] Debug tools available at window.__SOCKET_DEBUG__');
  console.log('[useChatSocket] SOCKET_URL =', SOCKET_URL);
}

/**
 * useChatSocket - Manages socket connection and message state
 */
export function useChatSocket({ username, isAuthenticated, currentView, onNewMessage, messageUIMethodsRef }) {
  // Debug: Log hook invocation (development only)
  if (import.meta.env.DEV) {
    console.log('[useChatSocket] Hook called with:', { username, isAuthenticated, currentView });
  }

  // Connection state
  const [isConnected, setIsConnected] = React.useState(false);
  const [isJoined, setIsJoined] = React.useState(false);
  const [error, setError] = React.useState('');
  const [typingUsers, setTypingUsers] = React.useState(new Set());

  // Threads
  const [threads, setThreads] = React.useState([]);
  const [threadMessages, setThreadMessages] = React.useState({});
  const [isLoadingThreadMessages, setIsLoadingThreadMessages] = React.useState(false);

  // Room ID management - extracted to useRoomId hook
  const { roomId, setRoomId } = useRoomId(username, isAuthenticated);

  // Message state management - extracted to useMessages hook
  const {
    messages,
    setMessages,
    pendingMessages,
    setPendingMessages,
    messageStatuses,
    setMessageStatuses,
  } = useMessages();

  // Create socketRef early so we can use it in useMessagePagination
  const socketRef = React.useRef(null);

  // Pagination state and operations - extracted to useMessagePagination hook
  const [isLoadingOlder, setIsLoadingOlder] = React.useState(false);
  const [hasMoreMessages, setHasMoreMessages] = React.useState(true);
  const [isInitialLoad, setIsInitialLoad] = React.useState(true);

  const { loadOlderMessages } = useMessagePagination({
    socketRef,
    messages,
    isLoadingOlder,
    hasMoreMessages,
    isInitialLoad,
    setIsLoadingOlder,
    setHasMoreMessages,
    setIsInitialLoad,
  });

  // Search state - removed (use useSearchMessages hook instead)

  // Draft coaching
  const [draftCoaching, setDraftCoaching] = React.useState(null);

  // Unread count
  const [unreadCount, setUnreadCount] = React.useState(0);

  // Refs (socketRef created earlier for useMessagePagination)
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
      console.log('[UnreadCount] Resetting to 0 (viewing chat)');
      setUnreadCount(0);
    }
  }, [currentView]);

  // Socket connection - persists across view changes
  // Uses ref to prevent duplicate connections from React Strict Mode double-mounting
  const socketInitializedRef = React.useRef(false);
  // Track if cleanup should actually disconnect (prevents StrictMode race condition)
  const cleanupTimeoutRef = React.useRef(null);
  const isUnmountingRef = React.useRef(false);

  React.useEffect(() => {
    // Cancel any pending cleanup from StrictMode's first unmount
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
      cleanupTimeoutRef.current = null;
      console.log('[useChatSocket] ↩️ Cancelled pending cleanup (StrictMode remount)');
    }
    isUnmountingRef.current = false;

    console.log('[useChatSocket] Socket effect running:', {
      username,
      isAuthenticated,
      socketRefExists: !!socketRef.current,
      socketConnected: socketRef.current?.connected,
      socketInitialized: socketInitializedRef.current,
      authToken: authStorage.getToken() ? 'present' : 'missing',
    });

    // Socket creation requires authentication, NOT username
    // Username is only needed for joining room (handled in connectionHandlers)
    if (!isAuthenticated) {
      console.log('[useChatSocket] ⚠️ Not authenticated, skipping socket creation');
      return;
    }

    // If socket already exists and is usable, keep it
    if (socketRef.current) {
      const existingSocket = socketRef.current;
      if (existingSocket.connected) {
        console.log('[useChatSocket] ✅ Reusing existing connected socket:', existingSocket.id);
        socketInitializedRef.current = true;
        return;
      } else if (!existingSocket.disconnected) {
        // Socket exists but is connecting - let it continue
        console.log('[useChatSocket] ⏳ Socket exists and is connecting, waiting...');
        socketInitializedRef.current = true;
        return;
      }
    }

    // Prevent duplicate socket creation
    if (socketInitializedRef.current) {
      console.log('[useChatSocket] ⚠️ Socket already initialized, skipping creation');
      return;
    }
    socketInitializedRef.current = true;

    const socketUrl = getSocketUrl();
    console.log('[useChatSocket] 🔌 Creating socket to:', socketUrl);

    // Get auth token for socket authentication
    const authToken = authStorage.getToken();
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/83e2bb31-7602-4e5a-bb5a-bc4e122570f2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useChatSocket.js:240',message:'Getting auth token',data:{hasToken:!!authToken,tokenLength:authToken?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    if (!authToken) {
      console.warn('[useChatSocket] ⚠️ No auth token available for socket connection');
      console.warn('[useChatSocket] ⚠️ Socket connection will fail - user needs to log in first');
      socketInitializedRef.current = false;
      return;
    }

    // Build socket URL with auth token in query params as fallback for polling transport
    // Socket.io's auth object should work, but query params ensure it reaches the server
    const socketUrlWithAuth = `${socketUrl}?token=${encodeURIComponent(authToken)}`;
    
    let socket;
    try {
      const socketConfig = {
        // In development, use polling only to avoid WebSocket upgrade errors
        // In production, socket.io will automatically try websocket then fall back to polling
        transports: import.meta.env.DEV ? ['polling'] : ['polling', 'websocket'],
        reconnection: true,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 10000,
        reconnectionAttempts: 5,
        timeout: 20000,
        forceNew: false,
        upgrade: !import.meta.env.DEV, // Disable upgrade attempts in dev to avoid console noise
        autoConnect: true,
        // Send auth token via query parameter (works with both polling and websocket)
        // Socket.io preserves query parameters and makes them available in socket.handshake.query
        query: {
          token: authToken,
        },
        // Also send via auth object as fallback (for WebSocket transport)
        auth: {
          token: authToken,
        },
        // extraHeaders only works with WebSocket transport, not polling
        ...(import.meta.env.DEV ? {} : {
          extraHeaders: {
            Authorization: `Bearer ${authToken}`,
          },
        }),
      };
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/83e2bb31-7602-4e5a-bb5a-bc4e122570f2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useChatSocket.js:278',message:'Creating socket',data:{url:socketUrlWithAuth,hasAuthToken:!!socketConfig.auth.token,transport:socketConfig.transports[0],hasQueryToken:!!socketUrlWithAuth.includes('token=')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      socket = io(socketUrlWithAuth, socketConfig);
      console.log('[useChatSocket] ✅ io() call succeeded');
    } catch (err) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/83e2bb31-7602-4e5a-bb5a-bc4e122570f2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useChatSocket.js:268',message:'Socket creation failed',data:{error:err.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      console.error('[useChatSocket] ❌ io() call failed:', err);
      socketInitializedRef.current = false;
      return;
    }

    // Debug: Track socket lifecycle events
    socket.on('connect', () => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/83e2bb31-7602-4e5a-bb5a-bc4e122570f2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useChatSocket.js:276',message:'Socket connected',data:{socketId:socket.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      console.log('[useChatSocket] ✅ Socket connected! ID:', socket.id);
    });
    socket.on('disconnect', (reason) => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/83e2bb31-7602-4e5a-bb5a-bc4e122570f2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useChatSocket.js:279',message:'Socket disconnected',data:{reason},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      console.log('[useChatSocket] ❌ Socket disconnected. Reason:', reason);
    });
          socket.on('connect_error', (error) => {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/83e2bb31-7602-4e5a-bb5a-bc4e122570f2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useChatSocket.js:285',message:'Socket connect error',data:{error:error.message,errorType:error.type,errorData:error.data},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
            // Suppress WebSocket upgrade failures - socket.io handles them automatically
            // These are expected in development and socket.io falls back to polling
            const isWebSocketUpgradeError =
              error.message?.includes('WebSocket') ||
              error.message?.includes('websocket') ||
              error.type === 'TransportError';

            if (!isWebSocketUpgradeError) {
              // Only log non-WebSocket connection errors
              console.log('[useChatSocket] ⚠️ Connection error:', error.message);
            }
            // WebSocket errors are silently handled - socket.io will use polling
          });
    socket.io.on('reconnect_attempt', (attempt) => {
      console.log('[useChatSocket] 🔄 Reconnection attempt:', attempt);
    });

    socketRef.current = socket;

    // Setup event handlers and store cleanup function
    const cleanupHandlers = setupSocketEventHandlers(socket, {
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
      setIsLoadingThreadMessages,
      setIsLoadingOlder,
      setDraftCoaching,
      setUnreadCount,
      setRoomId,
      // Pass ref to useMessageUI methods for proper state management
      messageUIMethodsRef, // Contains removePendingMessage, markMessageSent
    });

    return () => {
      console.log('[useChatSocket] 🧹 Cleanup scheduled (delayed for StrictMode)');
      isUnmountingRef.current = true;

      // Delay cleanup to allow StrictMode remount to cancel it
      cleanupTimeoutRef.current = setTimeout(() => {
        if (isUnmountingRef.current) {
          console.log('[useChatSocket] 🧹 Cleanup executing - removing listeners and disconnecting');
          // Remove all event listeners first to prevent memory leaks
          if (typeof cleanupHandlers === 'function') {
            cleanupHandlers();
          }
          socket.disconnect();
          socketInitializedRef.current = false;
          socketRef.current = null;
        }
      }, 100); // Short delay - enough for StrictMode but not noticeable to users
    };
  }, [isAuthenticated]); // Only depend on isAuthenticated - username is handled by auto-join effect

  // Room ID is now managed by useRoomId hook
  // Reset thread loading ref when roomId changes (username change handled by useRoomId)
  React.useEffect(() => {
    if (!roomId) {
      lastLoadedRoomIdRef.current = null;
    }
  }, [roomId]);

  // Auto-join when navigating to chat view
  React.useEffect(() => {
    console.log('[useChatSocket] Auto-join effect:', {
      currentView,
      isAuthenticated,
      username,
      socketConnected: socketRef.current?.connected,
      isJoined,
      shouldJoin: currentView === 'chat' && isAuthenticated && username && socketRef.current?.connected && !isJoined,
    });
    
    if (
      currentView === 'chat' &&
      isAuthenticated &&
      username &&
      socketRef.current?.connected &&
      !isJoined
    ) {
      console.log('[useChatSocket] 📤 Emitting join event:', { email: username });
      socketRef.current.emit('join', { email: username });
    } else {
      console.log('[useChatSocket] ⏸️ Not joining:', {
        currentView,
        isAuthenticated,
        hasUsername: !!username,
        socketConnected: socketRef.current?.connected,
        isJoined,
      });
    }
  }, [currentView, isAuthenticated, username, isJoined]);

  // Thread actions - defined BEFORE useEffect that uses them to avoid temporal dead zone
  const createThread = React.useCallback((roomId, title, messageId, category = 'logistics') => {
    if (socketRef.current?.connected)
      socketRef.current.emit('create_thread', { roomId, title, messageId, category });
  }, []);

  const getThreads = React.useCallback(roomId => {
    if (socketRef.current?.connected) socketRef.current.emit('get_threads', { roomId });
  }, []);

  const getThreadMessages = React.useCallback(threadId => {
    if (socketRef.current?.connected) {
      setIsLoadingThreadMessages(true);
      socketRef.current.emit('get_thread_messages', { threadId });
    }
  }, []);

  const addToThread = React.useCallback((messageId, threadId) => {
    if (socketRef.current?.connected)
      socketRef.current.emit('add_to_thread', { messageId, threadId });
  }, []);

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

  // Pagination - loadOlderMessages provided by useMessagePagination hook
  // Timeout handling still managed here (could be extracted later)
  React.useEffect(() => {
    if (isLoadingOlder) {
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = setTimeout(() => {
        console.warn('Loading older messages timed out');
        setIsLoadingOlder(false);
      }, 10000);
    }
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [isLoadingOlder]);

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
    isLoadingThreadMessages,
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
