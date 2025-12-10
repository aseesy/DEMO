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

  const socketRef = React.useRef(null);
  const messagesEndRef = React.useRef(null);
  const typingTimeoutRef = React.useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
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
    });

    socket.on('new_message', (message) => {
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

      setMessages((prev) => [
        ...prev,
        messageWithTimestamp,
      ]);

      // ALWAYS trigger notification for new messages from other users (like SMS)
      // The callback will filter out own messages
      if (onNewMessage && typeof onNewMessage === 'function') {
        onNewMessage(messageWithTimestamp);
      }

      // Update last seen timestamp if user is currently viewing chat
      if (currentView === 'chat' && !document.hidden) {
        lastSeenTimestampRef.current = messageWithTimestamp.timestamp;
      }

      // If this is a rewrite message (sent by current user), trigger removal of original
      // This is handled by the effect in ChatRoom.jsx that watches for new messages
      if (message.username === username && message.isPreApprovedRewrite) {
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
        socketRef.current.emit('send_message', {
          text: clean,
          isPreApprovedRewrite: isPreApprovedRewrite,
          originalRewrite: originalRewrite
        });
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
      socketRef.current.emit('send_message', {
        text: clean,
        isPreApprovedRewrite: isPreApprovedRewrite,
        originalRewrite: originalRewrite
      });
      setInputMessage('');
      setIsPreApprovedRewrite(false);
      setOriginalRewrite('');
      setDraftCoaching(null);
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

  return {
    messages,
    inputMessage,
    isConnected,
    isJoined,
    error,
    typingUsers,
    messagesEndRef,
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
  };
}


