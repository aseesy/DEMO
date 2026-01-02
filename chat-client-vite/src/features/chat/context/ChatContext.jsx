import React from 'react';
import { socketService } from '../../../services/socket/index.js';
import { authStorage } from '../../../adapters/storage/index.js';
import { unreadService } from '../../../services/chat/index.js';

// Independent hooks - each subscribes to its own service
import { useChatRoom } from '../../../hooks/chat/useChatRoom.js';
import { useMessages } from '../../../hooks/chat/useMessages.js';
import { useTyping } from '../../../hooks/chat/useTyping.js';
import { useThreads } from '../../../hooks/chat/useThreads.js';
import { useCoaching } from '../../../hooks/chat/useCoaching.js';
import { useUnread } from '../../../hooks/chat/useUnread.js';
import { useSocketState, useSocketConnection } from '../../../hooks/socket/index.js';

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

export function ChatProvider({ children, username, isAuthenticated, currentView, onNewMessage }) {
  // DEBUG: Log ChatProvider mount
  console.log('[ChatProvider] Rendering with:', { username, isAuthenticated, currentView });

  // === SOCKET CONNECTION (infrastructure) ===
  // Use useSocketConnection hook to manage connection lifecycle
  const getToken = React.useCallback(() => {
    const token = authStorage.getToken();
    console.log('[ChatProvider] getToken called:', token ? 'has token' : 'NO TOKEN');
    return token;
  }, []);

  console.log('[ChatProvider] Calling useSocketConnection with isAuthenticated:', isAuthenticated);
  useSocketConnection({ isAuthenticated, getToken });

  const { isConnected } = useSocketState();
  console.log('[ChatProvider] Socket state - isConnected:', isConnected);

  // === INDEPENDENT HOOKS (each subscribes to its own service) ===
  const room = useChatRoom();
  const messaging = useMessages();
  const typing = useTyping();
  const threads = useThreads();
  const coaching = useCoaching();
  const unread = useUnread();

  // Configure unread service with current user info
  // Note: unread.setUsername is stable (useCallback in hook)
  React.useEffect(() => {
    unread.setUsername(username);
  }, [username, unread.setUsername]);

  React.useEffect(() => {
    unread.setViewingChat(currentView === 'chat');
  }, [currentView, unread.setViewingChat]);

  // === AUTO-JOIN (when connected + authenticated) ===
  // Note: room.join is stable (useCallback in hook)
  React.useEffect(() => {
    if (isConnected && isAuthenticated && username && !room.isJoined) {
      room.join(username);
    }
  }, [isConnected, isAuthenticated, username, room.isJoined, room.join]);

  // Load threads when room is joined
  // Note: threads.loadThreads is stable (useCallback in hook)
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
      socketService.subscribe('search_results', ({ messages: results, total }) => {
        searchHook.handleSearchResults({ messages: results, total });
      }),
      socketService.subscribe(
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
  const { senderProfile, receiverProfile } = useMediationContext(username, isAuthenticated);

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
  const { hasMeanMessage } = useDerivedState(messaging.messages, username);

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

  const handleInputChange = React.useCallback(
    e => {
      const value = e.target.value;
      setInputMessage(value);
      coaching.dismiss();

      // Typing indicator
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typing.startTyping();
      typingTimeoutRef.current = setTimeout(() => {
        typing.stopTyping();
      }, 2000);
    },
    [coaching, typing]
  );

  const removeMessages = React.useCallback(predicate => {
    // Messages are managed by service - this would need service method
    console.warn('removeMessages not implemented in new architecture');
  }, []);

  const flagMessage = React.useCallback((messageId, reason = null) => {
    socketService.emit('flag_message', { messageId, reason });
  }, []);

  // === CONTEXT VALUE ===
  const value = React.useMemo(
    () => ({
      // Connection
      isConnected,
      isJoined: room.isJoined,
      error: error || room.error,

      // Messages
      messages: messaging.messages,
      pendingMessages: messaging.pendingMessages,
      messageStatuses: messaging.messageStatuses,
      hasMoreMessages: messaging.hasMore,
      isLoadingOlder: messaging.isLoadingOlder,
      loadOlderMessages: messaging.loadOlder,

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

      // Threads
      threads: threads.threads,
      threadMessages: threads.threadMessages,
      isLoadingThreadMessages: threads.isLoading,
      selectedThreadId,
      setSelectedThreadId,
      createThread: threads.create,
      getThreads: threads.loadThreads,
      getThreadMessages: threads.loadThreadMessages,
      addToThread: threads.addToThread,

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

      // UI Refs
      messagesEndRef,
      messagesContainerRef,

      // Other
      removeMessages,
      flagMessage,
      isInitialLoad: messaging.messages.length === 0,
      unreadCount: unread.count,
      setUnreadCount: () => {}, // Managed by service
      hasMeanMessage,
    }),
    [
      isConnected,
      room,
      error,
      messaging,
      inputMessage,
      sendMessage,
      handleInputChange,
      isPreApprovedRewrite,
      originalRewrite,
      coaching,
      typing,
      threads,
      selectedThreadId,
      searchHook,
      removeMessages,
      flagMessage,
      unread,
      hasMeanMessage,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

// Default context for when provider isn't ready
const defaultContext = {
  isConnected: false,
  isJoined: false,
  error: '',
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
  if (!context) {
    if (import.meta.env.DEV) {
      if (!hasWarned) {
        hasWarned = true;
        console.warn('[useChatContext] Context not available - using default.');
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
