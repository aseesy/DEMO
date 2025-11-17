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
  };

  // Function to remove messages (e.g., when user selects a rewrite)
  const removeMessages = React.useCallback((predicate) => {
    setMessages((prev) => prev.filter((msg) => !predicate(msg)));
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
  };
}


