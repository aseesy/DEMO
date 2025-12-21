import React from 'react';
import { useChatSocket } from '../hooks/useChatSocket.js';

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
    createThread,
    getThreads,
    getThreadMessages,
    addToThread,
    isLoadingOlder,
    hasMoreMessages,
    isInitialLoad,
    loadOlderMessages,
    searchResults,
    searchTotal,
    isSearching,
    highlightedMessageId,
    searchMessages: socketSearchMessages,
    jumpToMessage,
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

  // Search state
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchMode, setSearchMode] = React.useState(false);

  // Refs for typing
  const typingTimeoutRef = React.useRef(null);
  const draftAnalysisTimeoutRef = React.useRef(null);

  // Compute hasMeanMessage for Navigation
  const hasMeanMessage = React.useMemo(() => {
    return messages.some(
      msg =>
        msg.username?.toLowerCase() === username?.toLowerCase() &&
        msg.user_flagged_by &&
        Array.isArray(msg.user_flagged_by) &&
        msg.user_flagged_by.length > 0
    );
  }, [messages, username]);

  // Scroll helpers
  const scrollToBottom = React.useCallback(
    (instant = false) => {
      messagesEndRef.current?.scrollIntoView({ behavior: instant ? 'instant' : 'smooth' });
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

  // Helper to emit or queue a message
  const emitOrQueueMessage = React.useCallback(
    text => {
      const messageId = `${Date.now()}-${socketRef.current?.id || 'local'}`;
      const pendingMessage = {
        id: messageId,
        text,
        username,
        timestamp: new Date().toISOString(),
        isPreApprovedRewrite,
        originalRewrite,
        status: 'pending',
      };

      setPendingMessages(prev => new Map(prev).set(messageId, pendingMessage));
      setMessageStatuses(prev => new Map(prev).set(messageId, 'pending'));

      if (socketRef.current?.connected) {
        socketRef.current.emit('send_message', { text, isPreApprovedRewrite, originalRewrite });
      } else {
        offlineQueueRef.current.push(pendingMessage);
        try {
          localStorage.setItem('liaizen_offline_queue', JSON.stringify(offlineQueueRef.current));
        } catch (e) {
          /* ignore */
        }
        setError('Not connected. Message will be sent when connection is restored.');
      }

      setInputMessage('');
      setIsPreApprovedRewrite(false);
      setOriginalRewrite('');
      setDraftCoaching(null);
    },
    [
      username,
      isPreApprovedRewrite,
      originalRewrite,
      socketRef,
      offlineQueueRef,
      setError,
      setDraftCoaching,
      setPendingMessages,
      setMessageStatuses,
    ]
  );

  // Send message with analysis
  const sendMessage = React.useCallback(
    async e => {
      if (e?.preventDefault) e.preventDefault();
      const clean = inputMessage.trim();
      if (!clean || !socketRef.current) return;

      const { analyzeMessage, shouldSendMessage } = await import('../utils/messageAnalyzer.js');

      try {
        setDraftCoaching({ analyzing: true, riskLevel: 'low', shouldSend: false });

        const senderProfile = {
          role: 'Parent',
          position: 'unknown',
          resources: 'unknown',
          conflict_level: 'unknown',
          abuse_history: 'None',
        };
        const receiverProfile = {
          has_new_partner: false,
          income_disparity: 'unknown',
          distance: 'unknown',
        };
        const analysis = await analyzeMessage(clean, senderProfile, receiverProfile);
        const decision = shouldSendMessage(analysis);

        if (decision.shouldSend) {
          emitOrQueueMessage(clean);
        } else {
          setDraftCoaching({
            analyzing: false,
            riskLevel: analysis.escalation?.riskLevel || 'medium',
            shouldSend: false,
            observerData: decision.observerData,
            originalText: clean,
            analysis,
          });
        }

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        socketRef.current.emit('typing', { isTyping: false });
      } catch (err) {
        console.error('Error analyzing message:', err);
        emitOrQueueMessage(clean); // Fail open - send anyway
      }
    },
    [inputMessage, emitOrQueueMessage, socketRef, setDraftCoaching]
  );

  const handleInputChange = React.useCallback(
    e => {
      const value = e.target.value;
      setInputMessage(value);
      if (!socketRef.current) return;

      socketRef.current.emit('typing', { isTyping: true });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current?.emit('typing', { isTyping: false });
      }, 1000);

      if (draftAnalysisTimeoutRef.current) clearTimeout(draftAnalysisTimeoutRef.current);
      if (value.trim().length >= 10 && socketRef.current?.connected) {
        draftAnalysisTimeoutRef.current = setTimeout(() => {
          socketRef.current?.emit('analyze_draft', { draftText: value.trim() });
        }, 1000);
      } else {
        setDraftCoaching(null);
      }
    },
    [socketRef, setDraftCoaching]
  );

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

  // Wrap socketSearchMessages to manage searchQuery state
  const searchMessages = React.useCallback(
    query => {
      setSearchQuery(query);
      socketSearchMessages(query);
    },
    [socketSearchMessages]
  );

  const toggleSearchMode = React.useCallback(() => {
    setSearchMode(prev => {
      if (prev) {
        setSearchQuery('');
        socketSearchMessages(''); // Clears results via socket hook
      }
      return !prev;
    });
  }, [socketSearchMessages]);

  const exitSearchMode = React.useCallback(() => {
    setSearchMode(false);
    setSearchQuery('');
    socketSearchMessages(''); // Clears results via socket hook
    if (socketRef.current?.connected && username) {
      socketRef.current.emit('join', { username });
    }
  }, [username, socketRef, socketSearchMessages]);

  const value = React.useMemo(
    () => ({
      // Connection
      socket: socketRef.current,
      isConnected,
      isJoined,
      error,

      // Messages
      messages,
      inputMessage,
      setInputMessage,
      sendMessage,
      handleInputChange,
      removeMessages,
      flagMessage,
      messagesEndRef,
      messagesContainerRef,

      // Message tracking
      pendingMessages,
      messageStatuses,

      // Draft coaching
      draftCoaching,
      setDraftCoaching,
      isPreApprovedRewrite,
      setIsPreApprovedRewrite,
      originalRewrite,
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

      // Typing
      typingUsers,

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

      // UI state
      isInitialLoad,
      unreadCount,
      setUnreadCount,
      hasMeanMessage,
    }),
    [
      socketRef,
      isConnected,
      isJoined,
      error,
      messages,
      inputMessage,
      sendMessage,
      handleInputChange,
      removeMessages,
      flagMessage,
      pendingMessages,
      messageStatuses,
      draftCoaching,
      isPreApprovedRewrite,
      originalRewrite,
      threads,
      threadMessages,
      selectedThreadId,
      createThread,
      getThreads,
      getThreadMessages,
      addToThread,
      typingUsers,
      loadOlderMessages,
      isLoadingOlder,
      hasMoreMessages,
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
      isInitialLoad,
      unreadCount,
      hasMeanMessage,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatContext() {
  const context = React.useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}

export default ChatContext;
