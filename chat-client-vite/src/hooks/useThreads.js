/* global window, fetch */
import React from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config.js';

/**
 * getSocketUrl - Determines the correct socket URL based on environment
 */
function getSocketUrl() {
  let socketUrl = window.SOCKET_URL;
  if (!socketUrl) {
    socketUrl = API_BASE_URL.replace(/\/+$/, '').replace(/\/api$/, '');
    if (socketUrl === '/api' || socketUrl === '') {
      const origin =
        typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001';
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        socketUrl = `http://${window.location.hostname || 'localhost'}:3001`;
      } else {
        socketUrl = origin;
      }
    }
    if (!socketUrl || socketUrl === 'http://localhost:3001') {
      socketUrl = `http://${typeof window !== 'undefined' ? window.location.hostname || 'localhost' : 'localhost'}:3001`;
    }
  }
  return socketUrl;
}

/**
 * useThreads - Hook to load and manage threads for the dashboard
 * 
 * @param {string} username - Current user's username
 * @param {boolean} isAuthenticated - Whether user is authenticated
 * @returns {Object} Thread state and handlers
 */
export function useThreads(username, isAuthenticated) {
  const [threads, setThreads] = React.useState([]);
  const [isLoadingThreads, setIsLoadingThreads] = React.useState(false);
  const [selectedThreadId, setSelectedThreadId] = React.useState(null);
  const [roomId, setRoomId] = React.useState(null);
  const [error, setError] = React.useState(null);

  const socketRef = React.useRef(null);
  const usernameRef = React.useRef(username);
  const loadTimeoutRef = React.useRef(null);

  React.useEffect(() => {
    usernameRef.current = username;
  }, [username]);

  // Fetch user's room ID
  React.useEffect(() => {
    if (!isAuthenticated || !username) {
      setRoomId(null);
      return;
    }

    let cancelled = false;

    async function fetchRoom() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/room/${encodeURIComponent(username)}`);
        if (!response.ok) {
          if (response.status === 404) {
            // User doesn't have a room yet - this is okay, threads will be empty
            console.log('[useThreads] User does not have a room yet');
            if (!cancelled) {
              setRoomId(null);
            }
            return;
          }
          throw new Error(`Failed to fetch room: ${response.statusText}`);
        }
        const room = await response.json();
        if (!cancelled && room?.roomId) {
          setRoomId(room.roomId);
        }
      } catch (err) {
        console.error('Error fetching user room:', err);
        if (!cancelled) {
          // Don't set error for 404 - user just doesn't have a room yet
          if (!err.message.includes('404')) {
            setError(err.message);
          }
        }
      }
    }

    fetchRoom();

    return () => {
      cancelled = true;
    };
  }, [username, isAuthenticated]);

  // Connect to socket and load threads
  React.useEffect(() => {
    if (!isAuthenticated || !username || !roomId) {
      return;
    }

    const socketUrl = getSocketUrl();
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 10000, // 10 second timeout
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[useThreads] Socket connected for room:', roomId);
      // Join the room first
      socket.emit('join', { username: usernameRef.current });
      
      // Set a timeout in case 'joined' event doesn't fire
      loadTimeoutRef.current = setTimeout(() => {
        console.warn('[useThreads] Timeout waiting for join, requesting threads directly');
        setIsLoadingThreads(true);
        socket.emit('get_threads', { roomId });
      }, 3000);
    });

    socket.on('joined', data => {
      console.log('[useThreads] Joined room, loading threads', data);
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
      setIsLoadingThreads(true);
      // Request threads for the room
      // Use the roomId from the joined event if available, otherwise use state
      const targetRoomId = data?.roomId || roomId;
      if (targetRoomId) {
        socket.emit('get_threads', { roomId: targetRoomId });
      } else {
        console.error('[useThreads] No roomId available to load threads');
        setError('Room ID not available');
        setIsLoadingThreads(false);
      }
    });

    socket.on('threads_list', threadList => {
      console.log('[useThreads] Received threads:', threadList?.length || 0);
      setThreads(Array.isArray(threadList) ? threadList : []);
      setIsLoadingThreads(false);
      setError(null);
    });

    socket.on('threads_updated', threadList => {
      console.log('[useThreads] Threads updated:', threadList?.length || 0);
      setThreads(Array.isArray(threadList) ? threadList : []);
    });

    socket.on('error', err => {
      console.error('[useThreads] Socket error:', err);
      const errorMessage = typeof err === 'string' ? err : err?.message || 'Failed to load threads';
      setError(errorMessage);
      setIsLoadingThreads(false);
    });

    socket.on('connect_error', err => {
      console.error('[useThreads] Socket connection error:', err);
      setError('Failed to connect to server');
      setIsLoadingThreads(false);
    });

    socket.on('disconnect', () => {
      console.log('[useThreads] Socket disconnected');
    });

    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [username, isAuthenticated, roomId]);

  const getThreadMessages = React.useCallback(
    threadId => {
      if (socketRef.current?.connected && threadId) {
        socketRef.current.emit('get_thread_messages', { threadId });
      }
    },
    []
  );

  const analyzeConversation = React.useCallback(() => {
    if (socketRef.current?.connected && roomId) {
      setIsLoadingThreads(true);
      socketRef.current.emit('analyze_conversation_history', { roomId, limit: 100 });
    }
  }, [roomId]);

  // Listen for conversation analysis results
  React.useEffect(() => {
    if (!socketRef.current) return;

    const socket = socketRef.current;

    const handleAnalysis = ({ roomId: analyzedRoomId, suggestions, createdThreads }) => {
      if (analyzedRoomId === roomId) {
        console.log('[useThreads] Received conversation analysis:', {
          suggestions: suggestions?.length || 0,
          createdThreads: createdThreads?.length || 0,
        });
        
        // If threads were created, they will be updated via threads_updated event
        // But also reload to ensure we have the latest
        if (createdThreads && createdThreads.length > 0) {
          console.log('[useThreads] Threads were automatically created:', createdThreads);
          // Threads will be updated via threads_updated event, but request fresh list
          setTimeout(() => {
            socket.emit('get_threads', { roomId });
          }, 500);
        }
      }
      setIsLoadingThreads(false);
    };

    socket.on('conversation_analysis', handleAnalysis);

    return () => {
      socket.off('conversation_analysis', handleAnalysis);
    };
  }, [roomId]);

  return {
    threads,
    isLoadingThreads,
    selectedThreadId,
    setSelectedThreadId,
    getThreadMessages,
    analyzeConversation,
    error,
    roomId,
  };
}

