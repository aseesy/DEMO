import React, { useState, useEffect, useRef } from 'react';
import { Send, Users, MessageCircle, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import io from 'socket.io-client';

// Get Socket URL from environment or use localhost as default
const SOCKET_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SOCKET_URL) || 
                   'http://localhost:3001';

export default function ChatRoom() {
  const [username, setUsername] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [activeUsers, setActiveUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState('');
  const [typingUsers, setTypingUsers] = useState(new Set());
  
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    const socket = socketRef.current;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
      setError('');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('Connection error:', err);
      setIsConnected(false);
      setError('Unable to connect to chat server. Please try again.');
    });

    // Chat event handlers
    socket.on('join_success', ({ username: confirmedUsername, users }) => {
      setIsJoined(true);
      setActiveUsers(users);
      setError('');
    });

    socket.on('message_history', (history) => {
      setMessages(history.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp).toLocaleTimeString()
      })));
    });

    socket.on('user_joined', ({ message, users }) => {
      setMessages(prev => [...prev, {
        ...message,
        timestamp: new Date(message.timestamp).toLocaleTimeString()
      }]);
      setActiveUsers(users);
    });

    socket.on('new_message', (message) => {
      setMessages(prev => [...prev, {
        ...message,
        timestamp: new Date(message.timestamp).toLocaleTimeString()
      }]);
    });

    socket.on('user_left', ({ message, users }) => {
      setMessages(prev => [...prev, {
        ...message,
        timestamp: new Date(message.timestamp).toLocaleTimeString()
      }]);
      setActiveUsers(users);
    });

    socket.on('user_typing', ({ username, isTyping }) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        if (isTyping) {
          newSet.add(username);
        } else {
          newSet.delete(username);
        }
        return newSet;
      });
    });

    socket.on('error', ({ message }) => {
      setError(message);
      setTimeout(() => setError(''), 5000);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, []);

  const sanitizeInput = (input) => {
    return input.replace(/[<>]/g, '').trim();
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    const cleanUsername = sanitizeInput(username);
    
    if (cleanUsername.length < 2) {
      setError('Username must be at least 2 characters');
      return;
    }
    
    if (cleanUsername.length > 20) {
      setError('Username must be less than 20 characters');
      return;
    }

    if (!isConnected) {
      setError('Not connected to server. Please wait...');
      return;
    }

    setUsername(cleanUsername);
    socketRef.current.emit('join', { username: cleanUsername });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    const cleanMessage = sanitizeInput(inputMessage);
    
    if (!cleanMessage) return;
    
    if (cleanMessage.length > 500) {
      setError('Message is too long (max 500 characters)');
      return;
    }

    socketRef.current.emit('send_message', { text: cleanMessage });
    setInputMessage('');
    
    // Clear typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socketRef.current.emit('typing', { isTyping: false });
  };

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    
    // Send typing indicator
    socketRef.current.emit('typing', { isTyping: true });
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current.emit('typing', { isTyping: false });
    }, 1000);
  };

  const stringToColor = (str) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
      'bg-orange-500',
      'bg-cyan-500'
    ];
    
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  if (!isJoined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="flex items-center justify-center mb-6">
            <MessageCircle className="w-12 h-12 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
            Join Chat Room
          </h1>
          <p className="text-center text-gray-600 mb-6">
            Enter your username to start chatting
          </p>

          {/* Connection Status */}
          <div className={`flex items-center justify-center gap-2 mb-4 p-2 rounded-lg ${
            isConnected ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {isConnected ? (
              <>
                <Wifi className="w-4 h-4" />
                <span className="text-sm font-medium">Connected to server</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4" />
                <span className="text-sm font-medium">Connecting to server...</span>
              </>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          
          <form onSubmit={handleJoinRoom}>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors mb-4"
              maxLength={20}
              autoFocus
              disabled={!isConnected}
            />
            <button
              type="submit"
              disabled={!isConnected}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Join Room
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[700px] flex">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-indigo-600 text-white px-6 py-4 rounded-tl-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-6 h-6" />
              <h2 className="text-xl font-bold">Chat Room</h2>
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 ${
                isConnected ? 'text-green-300' : 'text-red-300'
              }`}>
                {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              </div>
              <div className="flex items-center gap-2 bg-indigo-700 px-3 py-1 rounded-full">
                <Users className="w-4 h-4" />
                <span className="text-sm font-medium">{activeUsers.length} online</span>
              </div>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="bg-red-50 border-b border-red-200 text-red-700 px-4 py-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id}>
                {msg.type === 'system' ? (
                  <div className="text-center">
                    <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      {msg.text}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full ${stringToColor(msg.username)} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                      {msg.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-semibold text-gray-800">{msg.username}</span>
                        <span className="text-xs text-gray-500">{msg.timestamp}</span>
                      </div>
                      <div className="bg-gray-100 rounded-lg px-4 py-2 inline-block max-w-full break-words">
                        <p className="text-gray-800">{msg.text}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {/* Typing Indicator */}
            {typingUsers.size > 0 && (
              <div className="text-sm text-gray-500 italic">
                {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4">
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <input
                type="text"
                placeholder="Type your message..."
                value={inputMessage}
                onChange={handleInputChange}
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors"
                maxLength={500}
                disabled={!isConnected}
                autoFocus
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || !isConnected}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="w-5 h-5" />
                Send
              </button>
            </form>
            <p className="text-xs text-gray-500 mt-2">
              Chatting as <span className="font-semibold">{username}</span>
            </p>
          </div>
        </div>

        {/* Sidebar - Active Users */}
        <div className="w-64 bg-gray-50 rounded-tr-2xl rounded-br-2xl border-l border-gray-200 p-4">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Active Users ({activeUsers.length})
          </h3>
          <div className="space-y-2">
            {activeUsers.map((user, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-2 bg-white rounded-lg shadow-sm"
              >
                <div className={`w-8 h-8 rounded-full ${stringToColor(user.username)} flex items-center justify-center text-white font-bold text-xs`}>
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {user.username}
                    {user.username === username && (
                      <span className="ml-1 text-xs text-gray-500">(you)</span>
                    )}
                  </p>
                </div>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
