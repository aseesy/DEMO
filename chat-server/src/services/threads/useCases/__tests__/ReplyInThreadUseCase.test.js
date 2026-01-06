/**
 * Unit Tests for ReplyInThreadUseCase
 * Tests thread reply functionality with validation and atomicity
 */

const { ReplyInThreadUseCase } = require('../ReplyInThreadUseCase');
const { eventEmitter } = require('../../../../core/events/DomainEventEmitter');
const { THREAD_MESSAGE_ADDED } = require('../../../../core/events/ThreadEvents');

// Mock dependencies
jest.mock('../../../../core/events/DomainEventEmitter');
jest.mock('../../../../core/events/ThreadEvents', () => ({
  THREAD_MESSAGE_ADDED: 'ThreadMessageAdded',
}));

describe('ReplyInThreadUseCase', () => {
  let useCase;
  let mockThreadRepository;
  let mockMessageService;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    eventEmitter.emit = jest.fn();

    // Create mock repository
    mockThreadRepository = {
      findById: jest.fn(),
      addMessage: jest.fn(),
    };

    // Create mock message service
    mockMessageService = {
      createMessage: jest.fn(),
    };

    // Create use case instance
    useCase = new ReplyInThreadUseCase(mockThreadRepository, mockMessageService);
  });

  describe('execute', () => {
    const validParams = {
      threadId: 'thread-123',
      messageText: 'Test message',
      userEmail: 'user@example.com',
      roomId: 'room-456',
    };

    const mockThread = {
      id: 'thread-123',
      room_id: 'room-456',
      title: 'Test Thread',
      category: 'logistics',
      is_archived: 0,
    };

    const mockMessage = {
      id: 'msg-789',
      text: 'Test message',
      roomId: 'room-456',
      threadId: null, // Should be null initially
    };

    const mockAddResult = {
      success: true,
      messageCount: 5,
      lastMessageAt: '2025-01-04T12:00:00Z',
      sequenceNumber: 4,
    };

    it('should successfully reply in thread', async () => {
      mockThreadRepository.findById.mockResolvedValue(mockThread);
      mockMessageService.createMessage.mockResolvedValue(mockMessage);
      mockThreadRepository.addMessage.mockResolvedValue(mockAddResult);

      const result = await useCase.execute(validParams);

      expect(mockThreadRepository.findById).toHaveBeenCalledWith('thread-123');
      expect(mockMessageService.createMessage).toHaveBeenCalledWith(
        {
          text: 'Test message',
          roomId: 'room-456',
        },
        'user@example.com',
        { retry: true, maxRetries: 3 }
      );
      expect(mockThreadRepository.addMessage).toHaveBeenCalledWith('msg-789', 'thread-123');
      expect(eventEmitter.emit).toHaveBeenCalledWith(THREAD_MESSAGE_ADDED, {
        messageId: 'msg-789',
        threadId: 'thread-123',
        roomId: 'room-456',
        userEmail: 'user@example.com',
      });

      expect(result).toEqual({
        success: true,
        message: mockMessage,
        thread: {
          id: 'thread-123',
          title: 'Test Thread',
          category: 'logistics',
          messageCount: 5,
          lastMessageAt: '2025-01-04T12:00:00Z',
        },
      });
    });

    it('should throw error if thread not found', async () => {
      mockThreadRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(validParams)).rejects.toThrow('Thread not found: thread-123');
      expect(mockMessageService.createMessage).not.toHaveBeenCalled();
      expect(mockThreadRepository.addMessage).not.toHaveBeenCalled();
    });

    it('should throw error if thread belongs to different room', async () => {
      const wrongRoomThread = { ...mockThread, room_id: 'room-999' };
      mockThreadRepository.findById.mockResolvedValue(wrongRoomThread);

      await expect(useCase.execute(validParams)).rejects.toThrow(
        'Thread belongs to different room. Thread room: room-999, Message room: room-456'
      );
      expect(mockMessageService.createMessage).not.toHaveBeenCalled();
    });

    it('should throw error if thread is archived', async () => {
      const archivedThread = { ...mockThread, is_archived: 1 };
      mockThreadRepository.findById.mockResolvedValue(archivedThread);

      await expect(useCase.execute(validParams)).rejects.toThrow(
        'Cannot reply to archived thread. Please reopen the thread first.'
      );
      expect(mockMessageService.createMessage).not.toHaveBeenCalled();
    });

    it('should pass additional messageData to message service', async () => {
      const paramsWithData = {
        ...validParams,
        messageData: { type: 'system', metadata: { test: true } },
      };

      mockThreadRepository.findById.mockResolvedValue(mockThread);
      mockMessageService.createMessage.mockResolvedValue(mockMessage);
      mockThreadRepository.addMessage.mockResolvedValue(mockAddResult);

      await useCase.execute(paramsWithData);

      expect(mockMessageService.createMessage).toHaveBeenCalledWith(
        {
          type: 'system',
          metadata: { test: true },
          text: 'Test message',
          roomId: 'room-456',
        },
        'user@example.com',
        { retry: true, maxRetries: 3 }
      );
    });

    it('should handle errors from message creation', async () => {
      mockThreadRepository.findById.mockResolvedValue(mockThread);
      mockMessageService.createMessage.mockRejectedValue(new Error('Message creation failed'));

      await expect(useCase.execute(validParams)).rejects.toThrow('Message creation failed');
      expect(mockThreadRepository.addMessage).not.toHaveBeenCalled();
    });

    it('should handle errors from addMessage', async () => {
      mockThreadRepository.findById.mockResolvedValue(mockThread);
      mockMessageService.createMessage.mockResolvedValue(mockMessage);
      mockThreadRepository.addMessage.mockRejectedValue(new Error('Failed to add message'));

      await expect(useCase.execute(validParams)).rejects.toThrow('Failed to add message');
    });
  });
});

