/**
 * Unit Tests for MoveMessageToThreadUseCase
 * Tests message movement between threads with transaction atomicity
 */

const { MoveMessageToThreadUseCase } = require('../MoveMessageToThreadUseCase');
const { eventEmitter } = require('../../../../core/events/DomainEventEmitter');
const { THREAD_MESSAGE_ADDED } = require('../../../../core/events/ThreadEvents');

// Mock dependencies
jest.mock('../../../../core/events/DomainEventEmitter');
jest.mock('../../../../core/events/ThreadEvents', () => ({
  THREAD_MESSAGE_ADDED: 'ThreadMessageAdded',
}));
jest.mock('../../../../../dbPostgres', () => ({
  query: jest.fn(),
}));

const dbPostgres = require('../../../../../dbPostgres');

describe('MoveMessageToThreadUseCase', () => {
  let useCase;
  let mockThreadRepository;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    eventEmitter.emit = jest.fn();
    dbPostgres.query.mockResolvedValue({ rows: [] });

    // Create mock repository
    mockThreadRepository = {
      findById: jest.fn(),
      addMessage: jest.fn(),
      removeMessage: jest.fn(),
    };

    // Create use case instance
    useCase = new MoveMessageToThreadUseCase(mockThreadRepository);
  });

  describe('execute', () => {
    const validParams = {
      messageId: 'msg-123',
      targetThreadId: 'thread-456',
      roomId: 'room-789',
    };

    const mockMessage = {
      thread_id: 'thread-111',
      room_id: 'room-789',
    };

    const mockTargetThread = {
      id: 'thread-456',
      room_id: 'room-789',
    };

    it('should successfully move message from one thread to another', async () => {
      // Mock database queries - use implementation to handle sequential calls
      let callCount = 0;
      dbPostgres.query.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return Promise.resolve({ rows: [mockMessage] }); // Get message
        if (callCount === 2) return Promise.resolve({}); // BEGIN
        if (callCount === 3) return Promise.resolve({}); // COMMIT
        return Promise.resolve({ rows: [] });
      });

      mockThreadRepository.findById.mockResolvedValue(mockTargetThread);
      mockThreadRepository.removeMessage.mockResolvedValue({
        success: true,
        messageCount: 4,
      });
      mockThreadRepository.addMessage.mockResolvedValue({
        success: true,
        messageCount: 6,
      });

      const result = await useCase.execute(validParams);

      expect(dbPostgres.query).toHaveBeenCalledWith('SELECT thread_id, room_id FROM messages WHERE id = $1', [
        'msg-123',
      ]);
      expect(mockThreadRepository.findById).toHaveBeenCalledWith('thread-456');
      expect(mockThreadRepository.removeMessage).toHaveBeenCalledWith('msg-123');
      expect(mockThreadRepository.addMessage).toHaveBeenCalledWith('msg-123', 'thread-456');
      expect(eventEmitter.emit).toHaveBeenCalledWith(THREAD_MESSAGE_ADDED, {
        messageId: 'msg-123',
        threadId: 'thread-456',
        roomId: 'room-789',
        movedFrom: 'thread-111',
      });

      expect(result).toEqual({
        success: true,
        messageId: 'msg-123',
        oldThreadId: 'thread-111',
        newThreadId: 'thread-456',
        affectedThreads: [
          { threadId: 'thread-111', messageCount: 4, action: 'removed' },
          { threadId: 'thread-456', messageCount: 6, action: 'added' },
        ],
      });
    });

    it('should move message from main chat to thread', async () => {
      const messageInMainChat = {
        thread_id: null,
        room_id: 'room-789',
      };

      // Setup sequential mocks - each query call gets the next value
      let callCount = 0;
      dbPostgres.query.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return Promise.resolve({ rows: [messageInMainChat] }); // Get message
        if (callCount === 2) return Promise.resolve({}); // BEGIN
        if (callCount === 3) return Promise.resolve({}); // COMMIT
        return Promise.resolve({ rows: [] });
      });

      mockThreadRepository.findById.mockResolvedValue(mockTargetThread);
      mockThreadRepository.addMessage.mockResolvedValue({
        success: true,
        messageCount: 1,
      });

      const result = await useCase.execute({
        messageId: 'msg-123',
        targetThreadId: 'thread-456',
        roomId: 'room-789',
      });

      expect(mockThreadRepository.removeMessage).not.toHaveBeenCalled();
      expect(mockThreadRepository.addMessage).toHaveBeenCalledWith('msg-123', 'thread-456');
      expect(result.affectedThreads).toEqual([{ threadId: 'thread-456', messageCount: 1, action: 'added' }]);
    });

    it('should move message from thread to main chat', async () => {
      let callCount = 0;
      dbPostgres.query.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return Promise.resolve({ rows: [mockMessage] }); // Get message
        if (callCount === 2) return Promise.resolve({}); // BEGIN
        if (callCount === 3) return Promise.resolve({}); // UPDATE messages
        if (callCount === 4) return Promise.resolve({}); // COMMIT
        return Promise.resolve({ rows: [] });
      });

      mockThreadRepository.removeMessage.mockResolvedValue({
        success: true,
        messageCount: 3,
      });

      const result = await useCase.execute({
        messageId: 'msg-123',
        targetThreadId: null,
        roomId: 'room-789',
      });

      expect(mockThreadRepository.removeMessage).toHaveBeenCalledWith('msg-123');
      expect(mockThreadRepository.addMessage).not.toHaveBeenCalled();
      expect(dbPostgres.query).toHaveBeenCalledWith(
        'UPDATE messages SET thread_id = NULL, thread_sequence = NULL WHERE id = $1',
        ['msg-123']
      );
      expect(result.newThreadId).toBeNull();
    });

    it('should return no-op if message already in target thread', async () => {
      const messageInTargetThread = {
        thread_id: 'thread-456',
        room_id: 'room-789',
      };

      dbPostgres.query.mockResolvedValue({ rows: [messageInTargetThread] });

      const result = await useCase.execute({
        messageId: 'msg-123',
        targetThreadId: 'thread-456',
        roomId: 'room-789',
      });

      expect(result).toEqual({
        success: true,
        messageId: 'msg-123',
        oldThreadId: 'thread-456',
        newThreadId: 'thread-456',
        message: 'Message already in target thread',
      });
      expect(mockThreadRepository.removeMessage).not.toHaveBeenCalled();
      expect(mockThreadRepository.addMessage).not.toHaveBeenCalled();
    });

    it('should throw error if message not found', async () => {
      dbPostgres.query.mockResolvedValue({ rows: [] });

      await expect(useCase.execute(validParams)).rejects.toThrow('Message not found: msg-123');
    });

    it('should throw error if message belongs to different room', async () => {
      const wrongRoomMessage = {
        thread_id: 'thread-111',
        room_id: 'room-999',
      };

      dbPostgres.query.mockResolvedValue({ rows: [wrongRoomMessage] });

      await expect(useCase.execute(validParams)).rejects.toThrow(
        'Message belongs to different room. Message room: room-999, Target room: room-789'
      );
    });

    it('should throw error if target thread not found', async () => {
      dbPostgres.query.mockResolvedValueOnce({ rows: [mockMessage] });
      mockThreadRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(validParams)).rejects.toThrow('Target thread not found: thread-456');
    });

    it('should throw error if target thread belongs to different room', async () => {
      const wrongRoomThread = {
        id: 'thread-456',
        room_id: 'room-999',
      };

      dbPostgres.query.mockResolvedValue({ rows: [mockMessage] });
      mockThreadRepository.findById.mockResolvedValue(wrongRoomThread);

      await expect(useCase.execute(validParams)).rejects.toThrow(
        'Target thread belongs to different room. Thread room: room-999, Message room: room-789'
      );
    });

    it('should rollback transaction on error', async () => {
      let callCount = 0;
      dbPostgres.query.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return Promise.resolve({ rows: [mockMessage] }); // Get message
        if (callCount === 2) return Promise.resolve({}); // BEGIN
        if (callCount === 3) return Promise.resolve({}); // ROLLBACK
        return Promise.resolve({ rows: [] });
      });

      mockThreadRepository.findById.mockResolvedValue(mockTargetThread);
      mockThreadRepository.removeMessage.mockRejectedValue(new Error('Database error'));

      await expect(useCase.execute(validParams)).rejects.toThrow('Database error');
      expect(dbPostgres.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });
});

