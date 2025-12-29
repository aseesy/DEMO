import React from 'react';
import { useChatSocket } from '../model/useChatSocket.js';
import { useSearchMessages } from '../model/useSearchMessages.js';
import { useMessageSending } from '../hooks/useMessageSending.js';
import { useInputHandling } from '../hooks/useInputHandling.js';
import { useDerivedState } from '../hooks/useDerivedState.js';
import { useChatContextValue } from '../hooks/useChatContextValue.js';

/**
 * ChatContext - Provides socket connection and message state app-wide
 *
 * The socket connection is maintained at the app level, so it persists
 * across view changes. ChatView and other components consume this context
 * directly without props drilling.
 */
const ChatContext = React.createContext(null);

export function ChatProvider({ children, username, isAuthenticated, currentView, onNewMessage }) {
  // Get socket connection and state from hook
  const {
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
    isLoadingThreadMessages,
    createThread,
    getThreads,
    getThreadMessages,
    addToThread,
    isLoadingOlder,
    hasMoreMessages,
    isInitialLoad,
    loadOlderMessages,
    // Search removed from useChatSocket - use useSearchMessages hook instead
    draftCoaching,
    setDraftCoaching,
    unreadCount,
    setUnreadCount,
  } = useChatSocket({ username, isAuthenticated, currentView, onNewMessage });

  // Input state
  const [inputMessage, setInputMessage] = React.useState('');
  const [isPreApprovedRewrite, setIsPreApprovedRewrite] = React.useState(false);
  const [originalRewrite, setOriginalRewrite] = React.useState('');

  // Thread selection
  const [selectedThreadId, setSelectedThreadId] = React.useState(null);

  // Search - use useSearchMessages hook instead of managing state here
  const searchHook = useSearchMessages({
    socketRef,
    username,
    setError,
  });

  // Set up socket event handlers for search (after socket is available)
  React.useEffect(() => {
    if (!socketRef.current) return;

    const socket = socketRef.current;

    // Handle search results
    const handleSearchResults = ({ messages: results, total }) => {
      searchHook.handleSearchResults({ messages: results, total });
    };

    // Handle jump to message result
    const handleJumpToMessage = ({ messages: contextMsgs, targetMessageId }) => {
      searchHook.handleJumpToMessageResult({
        messages: contextMsgs,
        targetMessageId,
        setMessages,
      });
    };

    socket.on('search_results', handleSearchResults);
    socket.on('jump_to_message_result', handleJumpToMessage);

    return () => {
      socket.off('search_results', handleSearchResults);
      socket.off('jump_to_message_result', handleJumpToMessage);
    };
  }, [socketRef, searchHook, setMessages]);

  // Refs for typing (shared between hooks)
  const typingTimeoutRef = React.useRef(null);

  // Scroll helpers
  const scrollToBottom = React.useCallback(
    (instant = false) => {
      // Use scrollIntoView with block: 'end' to ensure message appears above input bar
      // The padding-bottom on MessagesContainer ensures it's not covered
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({
          behavior: instant ? 'instant' : 'smooth',
          block: 'end',
        });
      }
    },
    [messagesEndRef]
  );

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
  }, [messagesEndRef]);

  // Auto-scroll on new messages
  React.useEffect(() => {
    if (shouldAutoScroll()) scrollToBottom();
  }, [messages, shouldAutoScroll, scrollToBottom]);

  // Scroll to bottom when entering chat view (so user sees most recent messages)
  React.useEffect(() => {
    if (currentView === 'chat' && messages.length > 0) {
      // Wait a bit for messages to render, then scroll
      // If isInitialLoad is true, the message_history handler will handle scrolling
      // If isInitialLoad is false, we need to scroll here
      if (!isInitialLoad) {
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            scrollToBottom(true); // instant scroll, no animation
          });
        });
      }
    }
  }, [currentView, messages.length, isInitialLoad, scrollToBottom]); // Include messages.length to scroll when messages load

  // Use extracted hooks
  const { sendMessage, emitOrQueueMessage } = useMessageSending({
    socketRef,
    inputMessage,
    username,
    isPreApprovedRewrite,
    originalRewrite,
    draftCoaching,
    setDraftCoaching,
    setMessages,
    setPendingMessages,
    setMessageStatuses,
    setError,
    offlineQueueRef,
    typingTimeoutRef,
  });

  const { handleInputChange } = useInputHandling({
    socketRef,
    setInputMessage,
    setDraftCoaching,
    typingTimeoutRef,
  });

  const { hasMeanMessage } = useDerivedState(messages, username);

  const removeMessages = React.useCallback(
    predicate => {
      setMessages(prev => prev.filter(msg => !predicate(msg)));
    },
    [setMessages]
  );

  const flagMessage = React.useCallback(
    (messageId, reason = null) => {
      if (!socketRef.current?.connected) {
        setError('Not connected to chat server.');
        return;
      }
      socketRef.current.emit('flag_message', { messageId, reason });
    },
    [socketRef, setError]
  );

  // Search functions - use from useSearchMessages hook
  const searchMessages = searchHook.searchMessages;
  const toggleSearchMode = searchHook.toggleSearchMode;
  const exitSearchMode = searchHook.exitSearchMode;
  const jumpToMessage = searchHook.jumpToMessage;

  // Create context value using extracted hook
  const value = useChatContextValue({
    socketRef,
    isConnected,
    isJoined,
    error,
    messages,
    inputMessage,
    setInputMessage,
    sendMessage,
    handleInputChange,
    removeMessages,
    flagMessage,
    messagesEndRef,
    messagesContainerRef,
    pendingMessages,
    messageStatuses,
    draftCoaching,
    setDraftCoaching,
    isPreApprovedRewrite,
    setIsPreApprovedRewrite,
    originalRewrite,
    setOriginalRewrite,
    threads,
    threadMessages,
    isLoadingThreadMessages,
    selectedThreadId,
    setSelectedThreadId,
    createThread,
    getThreads,
    getThreadMessages,
    addToThread,
    typingUsers,
    loadOlderMessages,
    isLoadingOlder,
    hasMoreMessages,
    searchMessages,
    searchQuery: searchHook.searchQuery,
    searchResults: searchHook.searchResults,
    searchTotal: searchHook.searchTotal,
    isSearching: searchHook.isSearching,
    searchMode: searchHook.searchMode,
    toggleSearchMode,
    exitSearchMode,
    jumpToMessage,
    highlightedMessageId: searchHook.highlightedMessageId,
    isInitialLoad,
    unreadCount,
    setUnreadCount,
    hasMeanMessage,
  });

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

// Default context for when provider isn't ready (prevents crash during StrictMode/HMR)
const defaultContext = {
  socket: null,
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
  pendingMessages: new Map(),
  messageStatuses: new Map(),
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
  typingUsers: new Set(),
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

// Track if we've already warned to avoid spam in React StrictMode
let hasWarned = false;
let warningTimeout = null;

export function useChatContext() {
  const context = React.useContext(ChatContext);
  if (!context) {
    // In development, warn but don't crash - allows React StrictMode/HMR to work
    if (import.meta.env.DEV) {
      // Deduplicate warnings: only show once per session to avoid spam from React StrictMode double renders
      if (!hasWarned) {
        hasWarned = true;
        console.warn(
          '[useChatContext] Context not available - using default. This may indicate a component is rendering outside ChatProvider.',
          '\nNote: This warning appears once per session. React StrictMode may cause double renders during development.'
        );
        // Reset warning flag after 5 seconds to allow for legitimate new warnings
        if (warningTimeout) clearTimeout(warningTimeout);
        warningTimeout = setTimeout(() => {
          hasWarned = false;
        }, 5000);
      }
      return defaultContext;
    }
    // In production, still throw to catch real bugs
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}

export default ChatContext;
