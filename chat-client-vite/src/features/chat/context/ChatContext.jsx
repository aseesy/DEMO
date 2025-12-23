import React from 'react';
import { useChatSocket } from '../model/useChatSocket.js';
import { useSearchMessages } from '../model/useSearchMessages.js';

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

  // Scroll to bottom when entering chat view (so user sees most recent messages)
  React.useEffect(() => {
    if (currentView === 'chat' && messages.length > 0 && !isInitialLoad) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        scrollToBottom(true); // instant scroll, no animation
      });
    }
  }, [currentView, scrollToBottom]); // Don't include messages to avoid re-scrolling on every new message

  // Helper to emit or queue a message - with optimistic updates for instant UI feedback
  const emitOrQueueMessage = React.useCallback(
    text => {
      const messageId = `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();

      const optimisticMessage = {
        id: messageId,
        text,
        username,
        displayName: username,
        timestamp: now,
        created_at: now,
        isPreApprovedRewrite,
        originalRewrite,
        status: 'sending', // Visual indicator
        isOptimistic: true, // Flag for optimistic update
      };

      // OPTIMISTIC UPDATE: Add message to UI immediately
      setMessages(prev => [...prev, optimisticMessage]);

      // Track in pending messages for status updates
      setPendingMessages(prev => new Map(prev).set(messageId, optimisticMessage));
      setMessageStatuses(prev => new Map(prev).set(messageId, 'sending'));

      if (socketRef.current?.connected) {
        socketRef.current.emit('send_message', {
          text,
          isPreApprovedRewrite,
          originalRewrite,
          optimisticId: messageId, // Send ID so server can correlate
        });
      } else {
        offlineQueueRef.current.push(optimisticMessage);
        try {
          localStorage.setItem('liaizen_offline_queue', JSON.stringify(offlineQueueRef.current));
        } catch (e) {
          /* ignore */
        }
        setError('Not connected. Message will be sent when connection is restored.');
        // Update status to queued
        setMessageStatuses(prev => new Map(prev).set(messageId, 'queued'));
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
      setMessages,
      setPendingMessages,
      setMessageStatuses,
    ]
  );

  // Track what message was last analyzed to use cached results
  const lastAnalyzedTextRef = React.useRef('');

  // Send message with analysis - uses cached draft analysis when available
  const sendMessage = React.useCallback(
    async e => {
      if (e?.preventDefault) e.preventDefault();
      const clean = inputMessage.trim();
      if (!clean || !socketRef.current) return;

      // FAST PATH 1: If we already have a draft coaching result for this exact message
      // and it shows intervention needed, use it immediately (no new analysis)
      if (draftCoaching && draftCoaching.observerData && draftCoaching.originalText === clean) {
        // Already showing intervention - don't send, just keep showing it
        return;
      }

      // FAST PATH 2: If we analyzed this message while typing and it was clean, send immediately
      if (draftCoaching === null && lastAnalyzedTextRef.current === clean) {
        // Message was already analyzed and passed - send immediately
        emitOrQueueMessage(clean);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        socketRef.current.emit('typing', { isTyping: false });
        return;
      }

      // FAST PATH 3: Quick local check for obviously safe messages
      const { shouldSendMessage } = await import('../../../utils/messageAnalyzer.js');
      const quickCheck = shouldSendMessage({ action: 'QUICK_CHECK', messageText: clean });
      if (quickCheck.shouldSend && quickCheck.reason === 'polite_request') {
        // Polite request - send immediately without full analysis
        emitOrQueueMessage(clean);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        socketRef.current.emit('typing', { isTyping: false });
        return;
      }

      // STANDARD PATH: Need full analysis
      const { analyzeMessage } = await import('../../../utils/messageAnalyzer.js');

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
    [inputMessage, emitOrQueueMessage, socketRef, setDraftCoaching, draftCoaching]
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

      const trimmed = value.trim();

      // Quick local check - if message passes fast filters, mark as analyzed
      if (trimmed.length >= 3) {
        import('../../../utils/messageAnalyzer.js').then(({ shouldSendMessage }) => {
          const quickCheck = shouldSendMessage({ action: 'QUICK_CHECK', messageText: trimmed });
          if (quickCheck.shouldSend) {
            // Message passes quick check - cache it as analyzed
            lastAnalyzedTextRef.current = trimmed;
            setDraftCoaching(null); // Clear any previous coaching
          } else if (trimmed.length >= 10 && socketRef.current?.connected) {
            // Needs full analysis - send to server after delay
            draftAnalysisTimeoutRef.current = setTimeout(() => {
              socketRef.current?.emit('analyze_draft', { draftText: trimmed });
              lastAnalyzedTextRef.current = trimmed; // Track what we analyzed
            }, 800); // Reduced from 1000ms for faster feedback
          }
        });
      } else {
        setDraftCoaching(null);
        lastAnalyzedTextRef.current = '';
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

  // Search functions - use from useSearchMessages hook
  const searchMessages = searchHook.searchMessages;
  const toggleSearchMode = searchHook.toggleSearchMode;
  const exitSearchMode = searchHook.exitSearchMode;
  const jumpToMessage = searchHook.jumpToMessage;

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
      searchQuery: searchHook.searchQuery,
      searchResults: searchHook.searchResults,
      searchTotal: searchHook.searchTotal,
      isSearching: searchHook.isSearching,
      searchMode: searchHook.searchMode,
      toggleSearchMode,
      exitSearchMode,
      jumpToMessage,
      highlightedMessageId: searchHook.highlightedMessageId,

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
