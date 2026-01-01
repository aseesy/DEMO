/* eslint-env jest */
/**
 * Tests for aiFailure.js
 */

const { handleAiFailure } = require('../../../socketHandlers/aiActionHelper/aiFailure');

describe('aiFailure', () => {
  let mockSocket;
  let mockIo;

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

    console.error = jest.fn();
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

    expect(console.error).toHaveBeenCalledWith('❌ AI Mediator failure:', 'AI processing failed');
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

    expect(console.error).toHaveBeenCalledWith('❌ AI Mediator failure:', 'Type error occurred');
    // Should still deliver message
    expect(mockIo.emit).toHaveBeenCalledWith('new_message', expect.any(Object));
  });
});
