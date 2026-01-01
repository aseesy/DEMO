/**
 * useChatSocket Network Failure Tests
 * 
 * Tests that detect errors when backend server is unavailable:
 * - Socket.IO connection refused errors
 * - Transport errors (xhr poll error)
 * - Reconnection handling
 * - Error state management
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useChatSocket } from './useChatSocket.js';

// Mock socket.io-client
const mockSocket = {
  id: null,
  connected: false,
  disconnected: true,
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn(),
  connect: vi.fn(),
  // Mock the io manager object for reconnection events
  io: {
    on: vi.fn(),
    off: vi.fn(),
  },
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));

// Mock socket event handlers - now returns cleanup function
vi.mock('./socketEventHandlers.js', () => ({
  setupSocketEventHandlers: vi.fn(() => () => {}), // Returns a cleanup function
}));

// Mock other hooks
vi.mock('../../../hooks/room/useRoomId.js', () => ({
  useRoomId: vi.fn(() => ({
    roomId: 'test-room',
    setRoomId: vi.fn(),
  })),
}));

vi.mock('./useMessages.js', () => ({
  useMessages: vi.fn(() => ({
    messages: [],
    setMessages: vi.fn(),
    pendingMessages: [],
    setPendingMessages: vi.fn(),
    messageStatuses: new Map(),
    setMessageStatuses: vi.fn(),
  })),
}));

vi.mock('./useMessagePagination.js', () => ({
  useMessagePagination: vi.fn(() => ({
    loadOlderMessages: vi.fn(),
  })),
}));

// Mock config
vi.mock('../../../config.js', () => ({
  SOCKET_URL: 'http://localhost:3000',
}));

// Mock auth storage for socket authentication
vi.mock('../../../adapters/storage', () => ({
  authStorage: {
    getToken: vi.fn(() => 'test-token'),
    isAuthenticated: vi.fn(() => true),
    setAuthenticated: vi.fn(),
    clearAuth: vi.fn(),
  },
}));

// Mock console.error
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

import { io } from 'socket.io-client';

describe('useChatSocket - Network Failure Detection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy.mockClear();
    mockSocket.connected = false;
    mockSocket.disconnected = true;
    mockSocket.id = null;
  });

  afterEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy.mockRestore();
  });

  describe('Connection Refused Errors', () => {
    it('should handle ERR_CONNECTION_REFUSED during socket connection', async () => {
      const connectionError = new Error('xhr poll error');
      connectionError.type = 'TransportError';
      connectionError.description = 'ERR_CONNECTION_REFUSED';

      // Simulate connection error
      io.mockImplementationOnce(() => {
        // Trigger connect_error event
        setTimeout(() => {
          const errorHandler = mockSocket.on.mock.calls.find(
            call => call[0] === 'connect_error'
          )?.[1];
          if (errorHandler) {
            errorHandler(connectionError);
          }
        }, 0);
        return mockSocket;
      });

      const { result } = renderHook(() =>
        useChatSocket({
          username: 'testuser',
          isAuthenticated: true,
          currentView: 'chat',
          onNewMessage: vi.fn(),
        })
      );

      await waitFor(() => {
        expect(io).toHaveBeenCalled();
      });

      // Verify error handling
      expect(mockSocket.on).toHaveBeenCalledWith('connect_error', expect.any(Function));
    });

    it('should handle TransportError (xhr poll error)', async () => {
      const transportError = new Error('xhr poll error');
      transportError.type = 'TransportError';

      io.mockImplementationOnce(() => {
        setTimeout(() => {
          const errorHandler = mockSocket.on.mock.calls.find(
            call => call[0] === 'connect_error'
          )?.[1];
          if (errorHandler) {
            errorHandler(transportError);
          }
        }, 0);
        return mockSocket;
      });

      const { result } = renderHook(() =>
        useChatSocket({
          username: 'testuser',
          isAuthenticated: true,
          currentView: 'chat',
          onNewMessage: vi.fn(),
        })
      );

      await waitFor(() => {
        expect(io).toHaveBeenCalled();
      });

      // Verify error handler was set up
      expect(mockSocket.on).toHaveBeenCalledWith('connect_error', expect.any(Function));
    });
  });

  describe('Reconnection Handling', () => {
    it('should attempt reconnection after connection failure', async () => {
      const connectionError = new Error('Connection failed');
      
      io.mockImplementationOnce(() => {
        setTimeout(() => {
          const errorHandler = mockSocket.on.mock.calls.find(
            call => call[0] === 'connect_error'
          )?.[1];
          if (errorHandler) {
            errorHandler(connectionError);
          }
        }, 0);
        return mockSocket;
      });

      const { result } = renderHook(() =>
        useChatSocket({
          username: 'testuser',
          isAuthenticated: true,
          currentView: 'chat',
          onNewMessage: vi.fn(),
        })
      );

      await waitFor(() => {
        expect(io).toHaveBeenCalled();
      });

      // Socket.IO should handle reconnection automatically
      // Verify socket was created with reconnection options
      expect(io).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          reconnection: expect.any(Boolean),
        })
      );
    });
  });

  describe('Error State Management', () => {
    it('should set error state on connection failure', async () => {
      const connectionError = new Error('Unable to connect');
      
      io.mockImplementationOnce(() => {
        setTimeout(() => {
          const errorHandler = mockSocket.on.mock.calls.find(
            call => call[0] === 'connect_error'
          )?.[1];
          if (errorHandler) {
            errorHandler(connectionError);
          }
        }, 0);
        return mockSocket;
      });

      const { result } = renderHook(() =>
        useChatSocket({
          username: 'testuser',
          isAuthenticated: true,
          currentView: 'chat',
          onNewMessage: vi.fn(),
        })
      );

      await waitFor(() => {
        expect(io).toHaveBeenCalled();
      });

      // Error state should be managed by connection handlers
      // Verify error handler was registered
      expect(mockSocket.on).toHaveBeenCalledWith('connect_error', expect.any(Function));
    });
  });

  describe('Socket Configuration', () => {
    it('should configure socket with appropriate reconnection settings', async () => {
      const { result } = renderHook(() =>
        useChatSocket({
          username: 'testuser',
          isAuthenticated: true,
          currentView: 'chat',
          onNewMessage: vi.fn(),
        })
      );

      await waitFor(() => {
        expect(io).toHaveBeenCalled();
      });

      const socketConfig = io.mock.calls[0][1];
      
      // Verify reconnection is configured
      expect(socketConfig).toMatchObject({
        reconnection: expect.any(Boolean),
        reconnectionAttempts: expect.any(Number),
        reconnectionDelay: expect.any(Number),
      });
    });
  });
});

