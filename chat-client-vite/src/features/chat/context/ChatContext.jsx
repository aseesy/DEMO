import React from 'react';
import { socketService as socketServiceV2 } from '../../../services/socket/SocketService.v2.js';
import { tokenManager } from '../../../utils/tokenManager.js';
import { messageService } from '../../../services/chat/MessageService.js';
import { createLogger } from '../../../utils/logger.js';
// import { unreadService } from '../../../services/chat/index.js'; // Unused

// Independent hooks - each subscribes to its own service
import { useChatRoom } from '../../../hooks/chat/useChatRoom.js';
import { useMessages } from '../../../hooks/chat/useMessages.js';
import { useTyping } from '../../../hooks/chat/useTyping.js';
import { useThreads } from '../../../hooks/chat/useThreads.js';
import { useCoaching } from '../../../hooks/chat/useCoaching.js';
import { useUnread } from '../../../hooks/chat/useUnread.js';
// useSocket no longer needed - SocketService subscribes to tokenManager directly

// Feature hooks
import { useSearchMessages } from '../model/useSearchMessages.js';
import { useDerivedState } from '../hooks/useDerivedState.js';
import { useMediationContext } from '../hooks/useMediationContext.js';

/**
 * ChatContext - Composes independent hooks for chat functionality
 *
 * Each hook subscribes to its own service. They re-render independently.
 * No God Hook orchestrating everything.
 */
const ChatContext = React.createContext(null);
// Separate context for high-frequency updates (messages, typing, input)
// This prevents re-renders of components that only need low-frequency state
const ChatMessagesContext = React.createContext(null);

/**
 * ChatProvider - Provides chat state and socket connection
 * @param {string} username - User's email (deprecated prop name, kept for backward compatibility)
 * @param {boolean} isAuthenticated - Whether user is authenticated
 * @param {string} currentView - Current view name
 * @param {Function} onNewMessage - Callback for new messages
 */
export function ChatProvider({
  children,
  username,
  isAuthenticated,
  currentView,
  onNewMessage: _onNewMessage,
}) {
  // username prop is actually the user's email (for backward compatibility)
  const userEmail = username;
  const logger = createLogger('ChatProvider');

  // DEBUG: Log ChatProvider mount with timestamp (dev only)
  React.useEffect(() => {
    logger.debug('ChatProvider mounted', {
      timestamp: new Date().toISOString(),
      isAuthenticated,
      currentView,
      // Email is already sanitized by logger
    });
  }, []);

  // === SOCKET CONNECTION (Event-Driven Architecture) ===
  // SocketService now subscribes to tokenManager directly.
  // When token changes, socket auto-connects/disconnects.
  // No need for complex token memoization or useSocket dependencies.

  // Initialize tokenManager on mount (needed for initial token load)
  React.useEffect(() => {
    tokenManager.initialize().catch(err => {
      logger.warn('TokenManager initialization failed', { error: err.message });
    });
  }, [logger]);

  // Get connection state from service (reactive via subscribeToState)
  const [isConnected, setIsConnected] = React.useState(socketServiceV2.isConnected());
  const prevConnectedRef = React.useRef(isConnected);
  React.useEffect(() => {
    return socketServiceV2.subscribeToState(state => {
      const newConnected = state === 'connected';
      setIsConnected(newConnected);

      // Only log when connection state actually changes (not on every render)
      if (prevConnectedRef.current !== newConnected) {
        logger.debug('Socket connection state changed', {
          isConnected: newConnected,
          previous: prevConnectedRef.current,
        });
        prevConnectedRef.current = newConnected;
      }
    });
  }, [logger]);

  // Create socket-compatible object for components that need it
  const emit = React.useCallback((event, data) => socketServiceV2.emit(event, data), []);
  const socket = React.useMemo(
    () => ({
      connected: isConnected,
      emit,
      on: (event, handler) => socketServiceV2.subscribe(event, handler),
      off: (_event, _handler) => {
        logger.warn('socket.off called - use unsubscribe from socket.on instead');
      },
    }),
    [isConnected, emit, logger]
  );

  // === INDEPENDENT HOOKS (each subscribes to its own service) ===
  const room = useChatRoom();
  const messaging = useMessages();
  const typing = useTyping();
  const threads = useThreads();
  const coaching = useCoaching();
  const unread = useUnread();

  // === EVENT-DRIVEN ROOM JOIN ===
  // Just set the email - ChatRoomService handles auto-join on socket connect
  // This is much simpler than the old useEffect chain with isConnected/isAuthenticated/etc.
  React.useEffect(() => {
    if (isAuthenticated && userEmail) {
      room.setEmail(userEmail);
    } else {
      room.clearEmail();
    }
  }, [isAuthenticated, userEmail, room.setEmail, room.clearEmail]);

  // Configure unread service with current user info
  React.useEffect(() => {
    unread.setUsername(userEmail);
  }, [userEmail, unread.setUsername]);

  React.useEffect(() => {
    unread.setViewingChat(currentView === 'chat');
  }, [currentView, unread.setViewingChat]);

  // Load threads when room is joined
  React.useEffect(() => {
    if (room.isJoined && room.roomId) {
      threads.loadThreads(room.roomId);
    }
  }, [room.isJoined, room.roomId, threads.loadThreads]);

  // === LOCAL UI STATE ===
  const [inputMessage, setInputMessage] = React.useState('');
  const [isPreApprovedRewrite, setIsPreApprovedRewrite] = React.useState(false);
  const [originalRewrite, setOriginalRewrite] = React.useState('');
  const [selectedThreadId, setSelectedThreadId] = React.useState(null);
  const [error, setError] = React.useState('');

  // Refs for UI
  const messagesEndRef = React.useRef(null);
  const messagesContainerRef = React.useRef(null);
  const typingTimeoutRef = React.useRef(null);

  // === SEARCH ===
  const searchHook = useSearchMessages({ username, setError });

  // Subscribe to search events
  // Note: handleSearchResults and handleJumpToMessageResult are stable (useCallback in hook)
  React.useEffect(() => {
    const unsubscribes = [
      socketServiceV2.subscribe('search_results', ({ messages: results, total }) => {
        searchHook.handleSearchResults({ messages: results, total });
      }),
      socketServiceV2.subscribe(
        'jump_to_message_result',
        ({ messages: contextMsgs, targetMessageId }) => {
          // This needs setMessages from messaging - we'll handle it differently
          searchHook.handleJumpToMessageResult({ messages: contextMsgs, targetMessageId });
        }
      ),
    ];
    return () => unsubscribes.forEach(unsub => unsub());
  }, [searchHook.handleSearchResults, searchHook.handleJumpToMessageResult]);

  // === MEDIATION CONTEXT ===
  // username is actually userEmail (for backward compatibility)
  const { senderProfile, receiverProfile } = useMediationContext(userEmail, isAuthenticated);

  // === SCROLL HELPERS ===
  const scrollToBottom = React.useCallback((instant = false) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: instant ? 'instant' : 'smooth',
        block: 'end',
      });
    }
  }, []);

  const shouldAutoScroll = React.useCallback(() => {
    if (!messagesEndRef.current) return false;
    let container = messagesEndRef.current.parentElement;
    while (container) {
      const style = window.getComputedStyle(container);
      if (style.overflowY === 'auto' || style.overflowY === 'scroll') break;
      container = container.parentElement;
    }
    if (!container) return false;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    return distanceFromBottom < 100;
  }, []);

  // Auto-scroll on new messages
  React.useEffect(() => {
    if (shouldAutoScroll()) scrollToBottom();
  }, [messaging.messages, shouldAutoScroll, scrollToBottom]);

  // Scroll to bottom when entering chat view
  React.useEffect(() => {
    if (currentView === 'chat' && messaging.messages.length > 0) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => scrollToBottom(true));
      });
    }
  }, [currentView, messaging.messages.length, scrollToBottom]);

  // === DERIVED STATE ===
  // username is actually userEmail (for backward compatibility)
  const { hasMeanMessage } = useDerivedState(messaging.messages, userEmail);

  // === ACTIONS ===
  const sendMessage = React.useCallback(() => {
    if (!inputMessage.trim()) return;

    messaging.send({
      text: inputMessage,
      isPreApprovedRewrite,
      originalRewrite,
      senderProfile,
      receiverProfile,
    });

    setInputMessage('');
    setIsPreApprovedRewrite(false);
    setOriginalRewrite('');
    coaching.dismiss();

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    typing.stopTyping();
    scrollToBottom();
  }, [
    inputMessage,
    isPreApprovedRewrite,
    originalRewrite,
    senderProfile,
    receiverProfile,
    messaging,
    coaching,
    typing,
    scrollToBottom,
  ]);

  // Debounce typing indicator to reduce socket emissions
  const typingDebounceRef = React.useRef(null);
  const handleInputChange = React.useCallback(
    e => {
      const value = e.target.value;
      setInputMessage(value);
      coaching.dismiss();

      // Typing indicator - debounced to reduce socket traffic
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      // Only emit typing start if not already typing (reduces socket emissions)
      if (!typingDebounceRef.current) {
        typing.startTyping();
        typingDebounceRef.current = true;
      }

      typingTimeoutRef.current = setTimeout(() => {
        typing.stopTyping();
        typingDebounceRef.current = null;
      }, 2000);
    },
    [coaching, typing]
  );

  const removeMessages = React.useCallback(predicate => {
    // Delegate to MessageService - messages are managed by service
    messageService.removeMessages(predicate);
  }, []);

  const flagMessage = React.useCallback((messageId, reason = null) => {
    socketServiceV2.emit('flag_message', { messageId, reason });
  }, []);

  // === CONTEXT SPLITTING ===
  // Split into high-frequency (messages, typing, input) and low-frequency (room, threads, search)
  // This prevents components that only need low-frequency state from re-rendering on message updates

  // Optimize message array reference stability
  // Create a stable reference key based on message count and last message ID
  // This prevents context value recreation when messages array reference changes but content is the same
  const messagesStableKey = React.useMemo(() => {
    if (!messaging.messages || messaging.messages.length === 0) {
      return 'empty';
    }
    const lastMessage = messaging.messages[messaging.messages.length - 1];
    return `${messaging.messages.length}-${lastMessage?.id || 'none'}`;
  }, [messaging.messages]);

  // Memoize messages array with stable reference when possible
  // Only recreate if messages actually changed (count or last message ID)
  const stableMessages = React.useMemo(() => {
    return messaging.messages;
  }, [messagesStableKey, messaging.messages]);

  // High-frequency context: messages, typing, input
  // Updates frequently - components using this will re-render often
  const messagesValue = React.useMemo(
    () => ({
      // Messages - use stable reference
      messages: stableMessages,
      pendingMessages: messaging.pendingMessages,
      messageStatuses: messaging.messageStatuses,
      hasMoreMessages: messaging.hasMore,
      isLoadingOlder: messaging.isLoadingOlder,
      loadOlderMessages: messaging.loadOlder,
      isInitialLoad: stableMessages.length === 0,

      // Input
      inputMessage,
      setInputMessage,
      sendMessage,
      handleInputChange,
      isPreApprovedRewrite,
      setIsPreApprovedRewrite,
      originalRewrite,
      setOriginalRewrite,

      // Coaching
      draftCoaching: coaching.coaching,
      setDraftCoaching: () => {}, // Managed by service

      // Typing
      typingUsers: typing.typingUsers,

      // Message actions
      removeMessages,
      flagMessage,

      // UI Refs
      messagesEndRef,
      messagesContainerRef,
    }),
    [
      stableMessages,
      messagesStableKey,
      messaging.pendingMessages,
      messaging.messageStatuses,
      messaging.hasMore,
      messaging.isLoadingOlder,
      messaging.loadOlder,
      inputMessage,
      setInputMessage,
      sendMessage,
      handleInputChange,
      isPreApprovedRewrite,
      setIsPreApprovedRewrite,
      originalRewrite,
      setOriginalRewrite,
      coaching.coaching,
      typing.typingUsers,
      removeMessages,
      flagMessage,
    ]
  );

  // Low-frequency context: room, threads, search, connection
  // Updates infrequently - components using this won't re-render on message updates
  const lowFrequencyValue = React.useMemo(
    () => ({
      // Connection
      isConnected,
      isJoined: room.isJoined,
      error: error || room.error,
      room, // Room object with roomId for TopicsPanel
      socket, // Socket-compatible interface for TopicsPanel

      // Threads
      threads: threads.threads,
      threadMessages: threads.threadMessages,
      isLoadingThreadMessages: threads.isLoading,
      isAnalysisComplete: threads.isAnalysisComplete,
      selectedThreadId,
      setSelectedThreadId,
      createThread: threads.create,
      getThreads: threads.loadThreads,
      getThreadMessages: threads.loadThreadMessages,
      addToThread: threads.addToThread,
      replyInThread: threads.replyInThread,
      moveMessageToThread: threads.moveMessageToThread,
      archiveThread: threads.archiveThread,

      // Search
      searchMessages: searchHook.searchMessages,
      searchQuery: searchHook.searchQuery,
      searchResults: searchHook.searchResults,
      searchTotal: searchHook.searchTotal,
      isSearching: searchHook.isSearching,
      searchMode: searchHook.searchMode,
      toggleSearchMode: searchHook.toggleSearchMode,
      exitSearchMode: searchHook.exitSearchMode,
      jumpToMessage: searchHook.jumpToMessage,
      highlightedMessageId: searchHook.highlightedMessageId,

      // Other
      unreadCount: unread.count,
      setUnreadCount: () => {}, // Managed by service
      hasMeanMessage,
    }),
    [
      isConnected,
      room,
      socket,
      error,
      threads.threads,
      threads.threadMessages,
      threads.isLoading,
      threads.isAnalysisComplete,
      selectedThreadId,
      threads.create,
      threads.loadThreads,
      threads.loadThreadMessages,
      threads.addToThread,
      threads.replyInThread,
      threads.moveMessageToThread,
      threads.archiveThread,
      searchHook.searchMessages,
      searchHook.searchQuery,
      searchHook.searchResults,
      searchHook.searchTotal,
      searchHook.isSearching,
      searchHook.searchMode,
      searchHook.toggleSearchMode,
      searchHook.exitSearchMode,
      searchHook.jumpToMessage,
      searchHook.highlightedMessageId,
      unread.count,
      hasMeanMessage,
    ]
  );

  // Combined value for backward compatibility (components can still use useChatContext)
  // This will still cause re-renders, but components can opt into messagesValue or lowFrequencyValue
  const combinedValue = React.useMemo(
    () => ({
      ...messagesValue,
      ...lowFrequencyValue,
    }),
    [messagesValue, lowFrequencyValue]
  );

  return (
    <ChatMessagesContext.Provider value={messagesValue}>
      <ChatContext.Provider value={combinedValue}>{children}</ChatContext.Provider>
    </ChatMessagesContext.Provider>
  );
}

// Default context for when provider isn't ready
const defaultContext = {
  isConnected: false,
  isJoined: false,
  error: '',
  room: { roomId: null, isJoined: false, error: null },
  socket: { connected: false, emit: () => {}, on: () => () => {}, off: () => {} },
  messages: [],
  inputMessage: '',
  setInputMessage: () => {},
  sendMessage: () => {},
  handleInputChange: () => {},
  removeMessages: () => {},
  flagMessage: () => {},
  messagesEndRef: { current: null },
  messagesContainerRef: { current: null },
  pendingMessages: [],
  messageStatuses: {},
  draftCoaching: null,
  setDraftCoaching: () => {},
  isPreApprovedRewrite: false,
  setIsPreApprovedRewrite: () => {},
  originalRewrite: '',
  setOriginalRewrite: () => {},
  threads: [],
  threadMessages: {},
  isLoadingThreadMessages: false,
  isAnalysisComplete: false,
  selectedThreadId: null,
  setSelectedThreadId: () => {},
  createThread: () => {},
  getThreads: () => {},
  getThreadMessages: () => {},
  addToThread: () => {},
  typingUsers: [],
  loadOlderMessages: () => {},
  isLoadingOlder: false,
  hasMoreMessages: true,
  searchMessages: () => {},
  searchQuery: '',
  searchResults: [],
  searchTotal: 0,
  isSearching: false,
  searchMode: false,
  toggleSearchMode: () => {},
  exitSearchMode: () => {},
  jumpToMessage: () => {},
  highlightedMessageId: null,
  isInitialLoad: true,
  unreadCount: 0,
  setUnreadCount: () => {},
  hasMeanMessage: false,
};

let hasWarned = false;
let warningTimeout = null;

export function useChatContext() {
  const context = React.useContext(ChatContext);
  const logger = createLogger('useChatContext');
  if (!context) {
    if (import.meta.env.DEV) {
      if (!hasWarned) {
        hasWarned = true;
        logger.warn('Context not available - using default');
        if (warningTimeout) clearTimeout(warningTimeout);
        warningTimeout = setTimeout(() => {
          hasWarned = false;
        }, 5000);
      }
      return defaultContext;
    }
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}

/**
 * Hook to use high-frequency chat state (messages, typing, input)
 * Use this for components that need message updates but don't need room/threads/search
 * This prevents re-renders when low-frequency state changes
 */
export function useChatMessagesContext() {
  const context = React.useContext(ChatMessagesContext);
  if (!context) {
    if (import.meta.env.DEV) {
      return {
        messages: [],
        pendingMessages: [],
        messageStatuses: {},
        hasMoreMessages: true,
        isLoadingOlder: false,
        loadOlderMessages: () => {},
        isInitialLoad: true,
        inputMessage: '',
        setInputMessage: () => {},
        sendMessage: () => {},
        handleInputChange: () => {},
        isPreApprovedRewrite: false,
        setIsPreApprovedRewrite: () => {},
        originalRewrite: '',
        setOriginalRewrite: () => {},
        draftCoaching: null,
        setDraftCoaching: () => {},
        typingUsers: [],
        removeMessages: () => {},
        flagMessage: () => {},
        messagesEndRef: { current: null },
        messagesContainerRef: { current: null },
      };
    }
    throw new Error('useChatMessagesContext must be used within ChatProvider');
  }
  return context;
}

/**
 * Hook to use low-frequency chat state (room, threads, search)
 * Use this for components that need room/threads/search but don't need message updates
 * This prevents re-renders when messages update
 */
export function useChatLowFrequencyContext() {
  // Extract low-frequency state from combined context
  const context = React.useContext(ChatContext);
  if (!context) {
    if (import.meta.env.DEV) {
      return {
        isConnected: false,
        isJoined: false,
        error: '',
        room: { roomId: null, isJoined: false, error: null },
        socket: { connected: false, emit: () => {}, on: () => () => {}, off: () => {} },
        threads: [],
        threadMessages: {},
        isLoadingThreadMessages: false,
        isAnalysisComplete: false,
        selectedThreadId: null,
        setSelectedThreadId: () => {},
        createThread: () => {},
        getThreads: () => {},
        getThreadMessages: () => {},
        addToThread: () => {},
        replyInThread: () => {},
        moveMessageToThread: () => {},
        archiveThread: () => {},
        searchMessages: () => {},
        searchQuery: '',
        searchResults: [],
        searchTotal: 0,
        isSearching: false,
        searchMode: false,
        toggleSearchMode: () => {},
        exitSearchMode: () => {},
        jumpToMessage: () => {},
        highlightedMessageId: null,
        unreadCount: 0,
        setUnreadCount: () => {},
        hasMeanMessage: false,
      };
    }
    throw new Error('useChatLowFrequencyContext must be used within ChatProvider');
  }

  // Return only low-frequency properties (memoized to prevent re-renders)
  return React.useMemo(
    () => ({
      isConnected: context.isConnected,
      isJoined: context.isJoined,
      error: context.error,
      room: context.room,
      socket: context.socket,
      threads: context.threads,
      threadMessages: context.threadMessages,
      isLoadingThreadMessages: context.isLoadingThreadMessages,
      isAnalysisComplete: context.isAnalysisComplete,
      selectedThreadId: context.selectedThreadId,
      setSelectedThreadId: context.setSelectedThreadId,
      createThread: context.createThread,
      getThreads: context.getThreads,
      getThreadMessages: context.getThreadMessages,
      addToThread: context.addToThread,
      replyInThread: context.replyInThread,
      moveMessageToThread: context.moveMessageToThread,
      archiveThread: context.archiveThread,
      searchMessages: context.searchMessages,
      searchQuery: context.searchQuery,
      searchResults: context.searchResults,
      searchTotal: context.searchTotal,
      isSearching: context.isSearching,
      searchMode: context.searchMode,
      toggleSearchMode: context.toggleSearchMode,
      exitSearchMode: context.exitSearchMode,
      jumpToMessage: context.jumpToMessage,
      highlightedMessageId: context.highlightedMessageId,
      unreadCount: context.unreadCount,
      setUnreadCount: context.setUnreadCount,
      hasMeanMessage: context.hasMeanMessage,
    }),
    [
      context.isConnected,
      context.isJoined,
      context.error,
      context.room,
      context.socket,
      context.threads,
      context.threadMessages,
      context.isLoadingThreadMessages,
      context.isAnalysisComplete,
      context.selectedThreadId,
      context.setSelectedThreadId,
      context.createThread,
      context.getThreads,
      context.getThreadMessages,
      context.addToThread,
      context.replyInThread,
      context.moveMessageToThread,
      context.archiveThread,
      context.searchMessages,
      context.searchQuery,
      context.searchResults,
      context.searchTotal,
      context.isSearching,
      context.searchMode,
      context.toggleSearchMode,
      context.exitSearchMode,
      context.jumpToMessage,
      context.highlightedMessageId,
      context.unreadCount,
      context.setUnreadCount,
      context.hasMeanMessage,
    ]
  );
}
