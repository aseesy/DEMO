import React from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config.js';
import { trackConnectionError } from '../utils/analyticsEnhancements.js';

// Minimal chat hook ported from the legacy ChatRoom logic.
// Handles connecting, joining, receiving history, and sending messages.

export function useChat({ username, isAuthenticated, currentView, onNewMessage }) {
  const [messages, setMessages] = React.useState([]);
  // Track the timestamp of the last message seen when user was viewing chat
  const lastSeenTimestampRef = React.useRef(null);
  const [inputMessage, setInputMessage] = React.useState('');
  const [isConnected, setIsConnected] = React.useState(false);
  const [isJoined, setIsJoined] = React.useState(false);
  const [error, setError] = React.useState('');
  const [typingUsers, setTypingUsers] = React.useState(new Set());
  const [draftCoaching, setDraftCoaching] = React.useState(null);
  const [threads, setThreads] = React.useState([]);
  const [threadMessages, setThreadMessages] = React.useState({});
  const [selectedThreadId, setSelectedThreadId] = React.useState(null);
  const [isPreApprovedRewrite, setIsPreApprovedRewrite] = React.useState(false);
  const [originalRewrite, setOriginalRewrite] = React.useState('');
  const [pendingMessages, setPendingMessages] = React.useState(new Map()); // Track pending messages by ID
  const [messageStatuses, setMessageStatuses] = React.useState(new Map()); // Track message status: 'sent' | 'pending' | 'failed'

  // Pagination state
  const [isLoadingOlder, setIsLoadingOlder] = React.useState(false);
  const [hasMoreMessages, setHasMoreMessages] = React.useState(true);

  // Search state
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState([]);
  const [searchTotal, setSearchTotal] = React.useState(0);
  const [isSearching, setIsSearching] = React.useState(false);
  const [searchMode, setSearchMode] = React.useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = React.useState(null);

  const socketRef = React.useRef(null);
  const messagesEndRef = React.useRef(null);
  const messagesContainerRef = React.useRef(null);
  const typingTimeoutRef = React.useRef(null);
  const offlineQueueRef = React.useRef([]); // Queue for offline messages
  const loadingTimeoutRef = React.useRef(null); // Timeout for loading older messages

  // Refs to avoid socket reconnection when these change
  const currentViewRef = React.useRef(currentView);
  const onNewMessageRef = React.useRef(onNewMessage);

  // Keep refs updated
  React.useEffect(() => {
    currentViewRef.current = currentView;
  }, [currentView]);

  React.useEffect(() => {
    onNewMessageRef.current = onNewMessage;
  }, [onNewMessage]);

  const scrollToBottom = (instant = false) => {
    messagesEndRef.current?.scrollIntoView({ behavior: instant ? 'instant' : 'smooth' });
  };

  // Only auto-scroll if user is near bottom (within 100px)
  // This prevents interrupting users who are reading old messages
  const shouldAutoScroll = () => {
    if (!messagesEndRef.current) return false;
    
    // Find the scrollable container (parent with overflow-y-auto)
    let container = messagesEndRef.current.parentElement;
    while (container) {
      const style = window.getComputedStyle(container);
      if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
        break;
      }
      container = container.parentElement;
    }
    
    if (!container) return false;
    
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    
    // Only auto-scroll if within 100px of bottom
    return distanceFromBottom < 100;
  };

  React.useEffect(() => {
    // Only auto-scroll if user is already near bottom
    if (shouldAutoScroll()) {
      scrollToBottom();
    }
  }, [messages]);

  React.useEffect(() => {
    // Don't connect if username is null (e.g., on landing page)
    if (!username) {
      return;
    }

    // Determine socket URL from API_BASE_URL
    let socketUrl = window.SOCKET_URL;

    if (!socketUrl) {
      // Remove trailing slashes and /api suffix if present
      socketUrl = API_BASE_URL.replace(/\/+$/, '').replace(/\/api$/, '');

      // If API_BASE_URL is just /api (relative), use current origin
      if (socketUrl === '/api' || socketUrl === '') {
        socketUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001';
      }

      // Fallback to localhost for development
      if (!socketUrl || socketUrl === 'http://localhost:3001') {
        socketUrl = 'http://localhost:3001';
      }
    }

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
        console.log(`📤 Retrying ${offlineQueueRef.current.length} queued messages...`);
        const queue = [...offlineQueueRef.current];
        offlineQueueRef.current = [];
        
        queue.forEach((queuedMessage) => {
          socket.emit('send_message', {
            text: queuedMessage.text,
            isPreApprovedRewrite: queuedMessage.isPreApprovedRewrite || false,
            originalRewrite: queuedMessage.originalRewrite || null
          });
          // Mark as pending
          setMessageStatuses((prev) => {
            const next = new Map(prev);
            next.set(queuedMessage.id, 'pending');
            return next;
          });
        });
        
        // Clear localStorage queue
        try {
          localStorage.removeItem('liaizen_offline_queue');
        } catch (e) {
          console.warn('Failed to clear offline queue:', e);
        }
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setIsJoined(false);
    });

    socket.on('connect_error', (err) => {
      console.error('Chat connection error (Vite):', err);
      setIsConnected(false);
      setError('Unable to connect to chat server. Please check if the server is running.');
      // Track connection error
      trackConnectionError('socket_connect_error', err.message || String(err));
    });

    socket.on('join_success', () => {
      setIsJoined(true);
      setError('');
    });

    socket.on('message_history', (history) => {
      const filtered = (history || []).filter((msg) => {
        if (typeof msg?.text !== 'string') return true;
        const lower = msg.text.toLowerCase();
        // Drop any historical join/leave system lines
        if (lower.includes(' left the chat')) return false;
        if (lower.includes(' joined the chat')) return false;
        return true;
      });

      const processedMessages = filtered.map((msg) => ({
          ...msg,
          timestamp: msg.timestamp,
      }));

      setMessages(processedMessages);

      // Mark all historical messages as seen
      if (processedMessages.length > 0) {
        const lastMessage = processedMessages[processedMessages.length - 1];
        lastSeenTimestampRef.current = lastMessage.timestamp || new Date().toISOString();
      }

      // Scroll to bottom after loading message history (on page load/refresh)
      // Use instant scroll to avoid animating through all messages
      setTimeout(() => {
        scrollToBottom(true); // instant scroll on initial load
      }, 100);
    });

    socket.on('new_message', (message) => {
      // Debug logging for AI messages
      if (message.type?.startsWith('ai_') || message.type === 'pending_original') {
        console.log('📩 Received AI/intervention message:', {
          type: message.type,
          id: message.id,
          hasPersonalMessage: !!message.personalMessage,
          hasRewrite1: !!message.rewrite1,
          hasRewrite2: !!message.rewrite2,
          timestamp: message.timestamp
        });
      }

      if (typeof message?.text === 'string') {
        const lower = message.text.toLowerCase();
        // Drop any join/leave messages regardless of type
        if (lower.includes(' left the chat')) return;
        if (lower.includes(' joined the chat')) return;
      }

      const messageWithTimestamp = {
        ...message,
        timestamp: message.timestamp || new Date().toISOString(),
      };

      // If this is our own message, mark it as sent (case-insensitive comparison)
      if (message.username?.toLowerCase() === username?.toLowerCase() && message.id) {
        setMessageStatuses((prev) => {
          const next = new Map(prev);
          next.set(message.id, 'sent');
          return next;
        });
        // Remove from pending messages
        setPendingMessages((prev) => {
          const next = new Map(prev);
          next.delete(message.id);
          return next;
        });
        // Remove from offline queue
        offlineQueueRef.current = offlineQueueRef.current.filter(m => m.id !== message.id);
        // Save updated queue to localStorage
        try {
          localStorage.setItem('liaizen_offline_queue', JSON.stringify(offlineQueueRef.current));
        } catch (e) {
          console.warn('Failed to save offline queue:', e);
        }
      }

      setMessages((prev) => [
        ...prev,
        messageWithTimestamp,
      ]);

      // ALWAYS trigger notification for new messages from other users (like SMS)
      // The callback will filter out own messages
      if (onNewMessageRef.current && typeof onNewMessageRef.current === 'function') {
        onNewMessageRef.current(messageWithTimestamp);
      }

      // Update last seen timestamp if user is currently viewing chat
      if (currentViewRef.current === 'chat' && !document.hidden) {
        lastSeenTimestampRef.current = messageWithTimestamp.timestamp;
      }

      // If this is a rewrite message (sent by current user), trigger removal of original
      // This is handled by the effect in ChatRoom.jsx that watches for new messages
      if (message.username?.toLowerCase() === username?.toLowerCase() && message.isPreApprovedRewrite) {
        // Dispatch event to notify ChatRoom that rewrite was sent
        window.dispatchEvent(new CustomEvent('rewrite-sent', { 
          detail: { message: messageWithTimestamp } 
        }));
      }
    });

    socket.on('user_typing', ({ username: typingName, isTyping }) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        if (isTyping) {
          next.add(typingName);
        } else {
          next.delete(typingName);
        }
        return next;
      });
    });

    // Listen for when a user joins the room (e.g., co-parent accepts invite)
    socket.on('user_joined', (data) => {
      // Trigger a custom event that can be listened to by other components
      window.dispatchEvent(new CustomEvent('coparent-joined', { detail: data }));
    });

    socket.on('message_flagged', ({ messageId, flaggedBy }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId || (msg.timestamp && msg.id === undefined && msg.text)
            ? { ...msg, user_flagged_by: flaggedBy }
            : msg
        )
      );
    });

    socket.on('error', ({ message }) => {
      // Track socket errors
      trackConnectionError('socket_error', message || 'Unknown socket error');
      console.error('Socket error:', message);
      setError(message);
      // Reset loading states on error
      setIsLoadingOlder(false);
      setIsSearching(false);
      // Clear any pending timeout
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    });

    socket.on('replaced_by_new_connection', ({ message }) => {
      // User opened chat in another tab - this tab is now disconnected
      console.log('Connection replaced:', message);
      setError(message || 'You opened this chat in another tab. This tab is now disconnected.');
      // Optionally disconnect this socket
      socket.disconnect();
    });

    socket.on('draft_analysis', (coaching) => {
      // Store coaching analysis for display
      setDraftCoaching(coaching);
    });

    socket.on('threads_updated', (threads) => {
      // Update threads list
      setThreads(threads);
    });

    socket.on('threads_list', (threads) => {
      // Update threads list
      setThreads(threads);
    });

    socket.on('thread_messages', ({ threadId, messages }) => {
      // Store thread messages
      setThreadMessages(prev => ({
        ...prev,
        [threadId]: messages
      }));
    });

    // Handle older messages (pagination)
    socket.on('older_messages', ({ messages: olderMsgs, hasMore }) => {
      // Clear loading timeout
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }

      setIsLoadingOlder(false);
      setHasMoreMessages(hasMore);

      if (olderMsgs && olderMsgs.length > 0) {
        // Prepend older messages to the beginning
        setMessages((prev) => [...olderMsgs, ...prev]);
      }
    });

    // Handle search results
    socket.on('search_results', ({ messages: results, total, query, hasMore }) => {
      setIsSearching(false);
      setSearchResults(results || []);
      setSearchTotal(total || 0);
    });

    // Handle jump to message result
    socket.on('jump_to_message_result', ({ messages: contextMsgs, targetMessageId }) => {
      if (contextMsgs && contextMsgs.length > 0) {
        setMessages(contextMsgs);
        setHighlightedMessageId(targetMessageId);
        setSearchMode(false);

        // Scroll to the highlighted message after render
        setTimeout(() => {
          const messageElement = document.getElementById(`message-${targetMessageId}`);
          if (messageElement) {
            messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);

        // Clear highlight after 3 seconds
        setTimeout(() => setHighlightedMessageId(null), 3000);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [username, isAuthenticated]);

  // Auto-join when navigating to chat view if not already joined
  React.useEffect(() => {
    if (
      currentView === 'chat' &&
      isAuthenticated &&
      username &&
      socketRef.current &&
      socketRef.current.connected &&
      !isJoined
    ) {
      socketRef.current.emit('join', { username });
    }
  }, [currentView, isAuthenticated, username, isJoined]);

  // Mark all messages as seen when user is viewing chat and page is visible
  React.useEffect(() => {
    if (currentView === 'chat' && !document.hidden && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.timestamp) {
        lastSeenTimestampRef.current = lastMessage.timestamp;
      }
    }
  }, [currentView, messages]);

  const sendMessage = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    const clean = inputMessage.trim();
    if (!clean || !socketRef.current) return;

    // OBSERVER/MEDIATOR FRAMEWORK: Analyze message before sending
    // Import dynamically to avoid circular dependencies
    const { analyzeMessage, shouldSendMessage } = await import('../utils/messageAnalyzer.js');
    
    try {
      // 1. Show "Analyzing..." state
      setDraftCoaching({ 
        analyzing: true, 
        riskLevel: 'low',
        shouldSend: false 
      });

      // 2. Analyze the message (get sender/receiver profiles from context if available)
      // TODO: Get actual profiles from user context/contacts
      const senderProfile = {
        role: 'Parent',
        position: 'unknown',
        resources: 'unknown',
        conflict_level: 'unknown',
        abuse_history: 'None',
      };
      
      const receiverProfile = {
        has_new_partner: false, // TODO: Get from contacts/context
        income_disparity: 'unknown',
        distance: 'unknown',
      };

      const analysis = await analyzeMessage(clean, senderProfile, receiverProfile);

      // 3. Traffic Control
      const decision = shouldSendMessage(analysis);

      if (decision.shouldSend) {
        // SCENARIO A: CLEAN - Send the message
        const messageId = `${Date.now()}-${socketRef.current?.id || 'local'}`;
        
        // Create pending message
        const pendingMessage = {
          id: messageId,
          text: clean,
          username: username,
          timestamp: new Date().toISOString(),
          isPreApprovedRewrite: isPreApprovedRewrite,
          originalRewrite: originalRewrite,
          status: 'pending'
        };
        
        // Add to pending messages
        setPendingMessages((prev) => {
          const next = new Map(prev);
          next.set(messageId, pendingMessage);
          return next;
        });
        
        // Mark status as pending
        setMessageStatuses((prev) => {
          const next = new Map(prev);
          next.set(messageId, 'pending');
          return next;
        });
        
        // Try to send immediately if connected
        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit('send_message', {
            text: clean,
            isPreApprovedRewrite: isPreApprovedRewrite,
            originalRewrite: originalRewrite
          });
        } else {
          // Queue for offline sending
          offlineQueueRef.current.push(pendingMessage);
          try {
            localStorage.setItem('liaizen_offline_queue', JSON.stringify(offlineQueueRef.current));
          } catch (e) {
            console.warn('Failed to save offline queue:', e);
          }
          setError('Not connected. Message will be sent when connection is restored.');
        }
        
        setInputMessage('');
        setIsPreApprovedRewrite(false);
        setOriginalRewrite('');
        setDraftCoaching(null); // Clear analysis
      } else {
        // SCENARIO B: CONFLICT DETECTED - Show Observer Card, don't send
        setDraftCoaching({
          analyzing: false,
          riskLevel: analysis.escalation?.riskLevel || 'medium',
          shouldSend: false,
          observerData: decision.observerData,
          originalText: clean,
          analysis: analysis, // Store full analysis for UI
        });
        // Don't clear input - user can edit or use rewrite
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      socketRef.current.emit('typing', { isTyping: false });
    } catch (error) {
      console.error('Error analyzing message:', error);
      // On error, allow message through (fail open)
      const messageId = `${Date.now()}-${socketRef.current?.id || 'local'}`;
      
      // Create pending message
      const pendingMessage = {
        id: messageId,
        text: clean,
        username: username,
        timestamp: new Date().toISOString(),
        isPreApprovedRewrite: isPreApprovedRewrite,
        originalRewrite: originalRewrite,
        status: 'pending'
      };
      
      // Add to pending messages
      setPendingMessages((prev) => {
        const next = new Map(prev);
        next.set(messageId, pendingMessage);
        return next;
      });
      
      // Mark status as pending
      setMessageStatuses((prev) => {
        const next = new Map(prev);
        next.set(messageId, 'pending');
        return next;
      });
      
      // Try to send immediately if connected
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('send_message', {
          text: clean,
          isPreApprovedRewrite: isPreApprovedRewrite,
          originalRewrite: originalRewrite
        });
      } else {
        // Queue for offline sending
        offlineQueueRef.current.push(pendingMessage);
        try {
          localStorage.setItem('liaizen_offline_queue', JSON.stringify(offlineQueueRef.current));
        } catch (e) {
          console.warn('Failed to save offline queue:', e);
        }
        setError('Not connected. Message will be sent when connection is restored.');
      }
      
      setInputMessage('');
      setIsPreApprovedRewrite(false);
      setOriginalRewrite('');
      setDraftCoaching(null);

      // Always scroll to bottom after sending a message
      setTimeout(() => scrollToBottom(), 100);
    }
  };

  const draftAnalysisTimeoutRef = React.useRef(null);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputMessage(value);
    if (!socketRef.current) return;
    socketRef.current.emit('typing', { isTyping: true });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('typing', { isTyping: false });
    }, 1000);

    // Request proactive coaching analysis (debounced)
    if (draftAnalysisTimeoutRef.current) {
      clearTimeout(draftAnalysisTimeoutRef.current);
    }

    // Only analyze if message is substantial (at least 10 chars)
    if (value.trim().length >= 10 && socketRef.current?.connected) {
      draftAnalysisTimeoutRef.current = setTimeout(() => {
        socketRef.current?.emit('analyze_draft', { draftText: value.trim() });
      }, 1000); // Wait 1 second after user stops typing
    } else {
      setDraftCoaching(null); // Clear coaching if message is too short
    }
  };

  // Function to remove messages (e.g., when user selects a rewrite)
  const removeMessages = React.useCallback((predicate) => {
    setMessages((prev) => prev.filter((msg) => !predicate(msg)));
  }, []);

  // Function to flag a message
  const flagMessage = React.useCallback((messageId, reason = null) => {
    if (!socketRef.current || !socketRef.current.connected) {
      setError('Not connected to chat server.');
      return;
    }
    socketRef.current.emit('flag_message', { messageId, reason });
  }, []);

  // Thread management functions
  const createThread = React.useCallback((roomId, title, messageId) => {
    if (!socketRef.current || !socketRef.current.connected) {
      setError('Not connected to chat server.');
      return;
    }
    socketRef.current.emit('create_thread', { roomId, title, messageId });
  }, []);

  const getThreads = React.useCallback((roomId) => {
    if (!socketRef.current || !socketRef.current.connected) {
      setError('Not connected to chat server.');
      return;
    }
    socketRef.current.emit('get_threads', { roomId });
  }, []);

  const getThreadMessages = React.useCallback((threadId) => {
    if (!socketRef.current || !socketRef.current.connected) {
      setError('Not connected to chat server.');
      return;
    }
    socketRef.current.emit('get_thread_messages', { threadId });
  }, []);

  const addToThread = React.useCallback((messageId, threadId) => {
    if (!socketRef.current || !socketRef.current.connected) {
      setError('Not connected to chat server.');
      return;
    }
    socketRef.current.emit('add_to_thread', { messageId, threadId });
  }, []);

  // Load older messages (pagination)
  const loadOlderMessages = React.useCallback(() => {
    if (!socketRef.current || !socketRef.current.connected || isLoadingOlder || !hasMoreMessages) {
      return;
    }

    if (messages.length === 0) {
      return;
    }

    // Get the oldest message timestamp
    const oldestMessage = messages[0];
    const beforeTimestamp = oldestMessage.timestamp;

    setIsLoadingOlder(true);

    // Set a timeout to prevent infinite loading (10 seconds)
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    loadingTimeoutRef.current = setTimeout(() => {
      console.warn('Loading older messages timed out');
      setIsLoadingOlder(false);
    }, 10000);

    socketRef.current.emit('load_older_messages', {
      beforeTimestamp,
      limit: 50
    });
  }, [messages, isLoadingOlder, hasMoreMessages]);

  // Search messages
  const searchMessages = React.useCallback((query) => {
    if (!socketRef.current || !socketRef.current.connected) {
      setError('Not connected to chat server.');
      return;
    }

    setSearchQuery(query);

    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      setSearchTotal(0);
      return;
    }

    setIsSearching(true);
    socketRef.current.emit('search_messages', {
      query: query.trim(),
      limit: 50,
      offset: 0
    });
  }, []);

  // Jump to a specific message
  const jumpToMessage = React.useCallback((messageId) => {
    if (!socketRef.current || !socketRef.current.connected) {
      setError('Not connected to chat server.');
      return;
    }

    socketRef.current.emit('jump_to_message', { messageId });
  }, []);

  // Toggle search mode
  const toggleSearchMode = React.useCallback(() => {
    setSearchMode((prev) => {
      if (prev) {
        // Exiting search mode - clear search
        setSearchQuery('');
        setSearchResults([]);
        setSearchTotal(0);
      }
      return !prev;
    });
  }, []);

  // Exit search mode and reload current messages
  const exitSearchMode = React.useCallback(() => {
    setSearchMode(false);
    setSearchQuery('');
    setSearchResults([]);
    setSearchTotal(0);
    // Re-join to reload current messages
    if (socketRef.current && socketRef.current.connected && username) {
      socketRef.current.emit('join', { username });
    }
  }, [username]);

  return {
    messages,
    inputMessage,
    isConnected,
    isJoined,
    error,
    typingUsers,
    messagesEndRef,
    messagesContainerRef,
    setInputMessage,
    sendMessage,
    handleInputChange,
    removeMessages,
    flagMessage,
    draftCoaching,
    setDraftCoaching,
    isPreApprovedRewrite,
    setIsPreApprovedRewrite,
    setOriginalRewrite,
    threads,
    threadMessages,
    selectedThreadId,
    setSelectedThreadId,
    createThread,
    getThreads,
    getThreadMessages,
    addToThread,
    socket: socketRef.current,
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


