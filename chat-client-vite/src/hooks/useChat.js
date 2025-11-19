import React from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config.js';

// Minimal chat hook ported from the legacy ChatRoom logic.
// Handles connecting, joining, receiving history, and sending messages.

export function useChat({ username, isAuthenticated, currentView }) {
  const [messages, setMessages] = React.useState([]);
  const [inputMessage, setInputMessage] = React.useState('');
  const [isConnected, setIsConnected] = React.useState(false);
  const [isJoined, setIsJoined] = React.useState(false);
  const [error, setError] = React.useState('');
  const [typingUsers, setTypingUsers] = React.useState(new Set());
  const [draftCoaching, setDraftCoaching] = React.useState(null);
  const [threads, setThreads] = React.useState([]);
  const [threadMessages, setThreadMessages] = React.useState({});
  const [selectedThreadId, setSelectedThreadId] = React.useState(null);

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
    const socketUrl =
      window.SOCKET_URL ||
      API_BASE_URL.replace(/\/+$/, '').replace(/\/api$/, '') ||
      'http://localhost:3001';

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

      setMessages(
        filtered.map((msg) => ({
          ...msg,
          timestamp: msg.timestamp,
        })),
      );
    });

    socket.on('new_message', (message) => {
      if (typeof message?.text === 'string') {
        const lower = message.text.toLowerCase();
        // Drop any join/leave messages regardless of type
        if (lower.includes(' left the chat')) return;
        if (lower.includes(' joined the chat')) return;
      }

      setMessages((prev) => [
        ...prev,
        {
          ...message,
          timestamp: message.timestamp || new Date().toISOString(),
        },
      ]);
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
      console.log('User joined room:', data);
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
      console.error('Socket error:', message);
      setError(message);
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

  const sendMessage = (e) => {
    if (e?.preventDefault) e.preventDefault();
    const clean = inputMessage.trim();
    if (!clean || !socketRef.current) return;
    socketRef.current.emit('send_message', { text: clean });
    setInputMessage('');
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socketRef.current.emit('typing', { isTyping: false });
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

  const removeFromThread = React.useCallback((messageId) => {
    if (!socketRef.current || !socketRef.current.connected) {
      setError('Not connected to chat server.');
      return;
    }
    socketRef.current.emit('remove_from_thread', { messageId });
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
    threads,
    threadMessages,
    selectedThreadId,
    setSelectedThreadId,
    createThread,
    getThreads,
    getThreadMessages,
    addToThread,
    removeFromThread,
    socket: socketRef.current,
  };
}


