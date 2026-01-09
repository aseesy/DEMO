/* eslint-env jest */
/**
 * Tests for aiFailure.js
 */

// Mock the logger before importing the module
jest.mock('../../../src/infrastructure/logging/logger', () => {
  const mockLogger = {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnThis(),
  };
  return {
    defaultLogger: mockLogger,
    Logger: jest.fn(() => mockLogger),
  };
});

const { handleAiFailure } = require('../../../socketHandlers/aiActionHelper/aiFailure');
const { defaultLogger } = require('../../../src/infrastructure/logging/logger');

describe('aiFailure', () => {
  let mockSocket;
  let mockIo;
  let mockLogger;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSocket = {
      connected: true,
      emit: jest.fn(),
    };

    mockIo = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };

    mockLogger = defaultLogger;
  });

  const createContext = (overrides = {}) => ({
    user: { email: 'user@example.com', roomId: 'room-123' },
    message: { id: 'msg-1', text: 'Hello world', username: 'user' },
    error: new Error('AI processing failed'),
    addToHistory: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  });

  it('should log the error', async () => {
    await handleAiFailure(mockSocket, mockIo, createContext());

    expect(mockLogger.error).toHaveBeenCalledWith('❌ AI Mediator failure', {
      message: 'AI processing failed',
    });
  });

  it('should emit error notification to connected socket', async () => {
    await handleAiFailure(mockSocket, mockIo, createContext());

    expect(mockSocket.emit).toHaveBeenCalledWith('new_message', {
      id: expect.stringMatching(/^ai-error-\d+$/),
      type: 'ai_error',
      username: 'LiaiZen',
      text: 'I had trouble analyzing your message, but it was sent successfully.',
      timestamp: expect.any(String),
      roomId: 'room-123',
      isPrivate: true,
    });
  });

  it('should not emit error notification when socket disconnected', async () => {
    mockSocket.connected = false;

    await handleAiFailure(mockSocket, mockIo, createContext());

    expect(mockSocket.emit).not.toHaveBeenCalled();
  });

  it('should persist the original message', async () => {
    const context = createContext();

    await handleAiFailure(mockSocket, mockIo, context);

    expect(context.addToHistory).toHaveBeenCalledWith(
      { id: 'msg-1', text: 'Hello world', username: 'user' },
      'room-123'
    );
  });

  it('should broadcast original message to room', async () => {
    await handleAiFailure(mockSocket, mockIo, createContext());

    expect(mockIo.to).toHaveBeenCalledWith('room-123');
    expect(mockIo.emit).toHaveBeenCalledWith('new_message', {
      id: 'msg-1',
      text: 'Hello world',
      username: 'user',
    });
  });

  it('should still broadcast message even if socket disconnected', async () => {
    mockSocket.connected = false;

    await handleAiFailure(mockSocket, mockIo, createContext());

    // io.to broadcasts to room, not to specific socket
    expect(mockIo.to).toHaveBeenCalledWith('room-123');
    expect(mockIo.emit).toHaveBeenCalledWith('new_message', expect.any(Object));
  });

  it('should handle different error types', async () => {
    const context = createContext({
      error: new TypeError('Type error occurred'),
    });

    await handleAiFailure(mockSocket, mockIo, context);

    expect(mockLogger.error).toHaveBeenCalledWith('❌ AI Mediator failure', {
      message: 'Type error occurred',
    });
    // Should still deliver message
    expect(mockIo.emit).toHaveBeenCalledWith('new_message', expect.any(Object));
  });
});
