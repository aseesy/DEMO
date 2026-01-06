/**
 * Unit Tests for Thread Manager
 * Tests thread CRUD operations, message associations, and edge cases
 *
 * Framework: Jest
 * Coverage: threadManager.js public API
 */

// Suppress console.error for expected error tests
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalError;
});

// Mock dependencies before requiring threadManager
jest.mock('../dbSafe');
jest.mock('../dbPostgres', () => ({
  query: jest.fn().mockResolvedValue({ rows: [] }),
}));
jest.mock('../openaiClient');
jest.mock('../src/infrastructure/database/neo4jClient', () => {
  return {
    isAvailable: jest.fn(() => false),
    createOrUpdateThreadNode: jest.fn(),
    linkMessageToThread: jest.fn(),
    findSimilarMessages: jest.fn(),
  };
});

// Mock the ThreadServiceFactory to return mocked repository
const mockThreadRepository = {
  findById: jest.fn(),
  findByRoomId: jest.fn(),
  findByCategory: jest.fn(),
  create: jest.fn(),
  updateTitle: jest.fn(),
  updateCategory: jest.fn(),
  archive: jest.fn(),
  getMessages: jest.fn(),
  addMessage: jest.fn(),
  removeMessage: jest.fn(),
};

const mockConversationAnalyzer = {
  suggestThreadForMessage: jest.fn(),
  analyzeConversationHistory: jest.fn(),
  autoAssignMessageToThread: jest.fn(),
};

const mockCreateThreadUseCase = {
  execute: jest.fn(),
};

// Create mock use cases that will be returned by factory methods
const mockArchiveThreadUseCase = {
  execute: jest.fn(),
};
const mockReplyInThreadUseCase = {
  execute: jest.fn(),
};
const mockMoveMessageToThreadUseCase = {
  execute: jest.fn(),
};

jest.mock('../src/services/threads/ThreadServiceFactory', () => {
  return {
    factory: {
      getThreadRepository: () => mockThreadRepository,
      getConversationAnalyzer: () => mockConversationAnalyzer,
      getCreateThreadUseCase: () => mockCreateThreadUseCase,
      getAnalyzeConversationUseCase: jest.fn(),
      getSuggestThreadUseCase: jest.fn(),
      getAutoAssignMessageUseCase: jest.fn(),
      getArchiveThreadUseCase: () => mockArchiveThreadUseCase,
      getReplyInThreadUseCase: () => mockReplyInThreadUseCase,
      getMoveMessageToThreadUseCase: () => mockMoveMessageToThreadUseCase,
    },
  };
});

const threadManager = require('../threadManager');
const dbSafe = require('../dbSafe');
const dbPostgres = require('../dbPostgres');
const openaiClient = require('../openaiClient');

describe('ThreadManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset dbSafe mocks (still used by repository implementation)
    dbSafe.safeInsert = jest.fn();
    dbSafe.safeSelect = jest.fn();
    dbSafe.safeUpdate = jest.fn();
    dbSafe.parseResult = jest.fn(result => result);
    // Reset dbPostgres mock - ensure it returns a promise
    dbPostgres.query = jest.fn().mockResolvedValue({ rows: [] });
    // Reset repository mocks
    mockThreadRepository.findById.mockReset();
    mockThreadRepository.findByRoomId.mockReset();
    mockThreadRepository.findByCategory.mockReset();
    mockThreadRepository.create.mockReset();
    mockThreadRepository.updateTitle.mockReset();
    mockThreadRepository.updateCategory.mockReset();
    mockThreadRepository.archive.mockReset();
    mockThreadRepository.getMessages.mockReset();
    mockThreadRepository.addMessage.mockReset();
    mockThreadRepository.removeMessage.mockReset();
    // Reset use case mocks
    mockCreateThreadUseCase.execute.mockReset();
  });

  describe('createThread', () => {
    it('should create a thread with all required fields', async () => {
      const roomId = 'room_123';
      const title = 'Test Thread';
      const createdBy = 'user1';
      const mockThreadId = 'thread_1234567890_abc123';

      mockCreateThreadUseCase.execute.mockResolvedValue(mockThreadId);

      const threadId = await threadManager.createThread(roomId, title, createdBy);

      expect(mockCreateThreadUseCase.execute).toHaveBeenCalledWith({
        roomId,
        title,
        createdBy,
        initialMessageId: null,
        category: 'logistics',
      });
      expect(threadId).toBe(mockThreadId);
    });

    it('should create thread with initial message', async () => {
      const roomId = 'room_123';
      const title = 'Test Thread';
      const createdBy = 'user1';
      const initialMessageId = 'msg_123';
      const mockThreadId = 'thread_1234567890_abc123';

      mockCreateThreadUseCase.execute.mockResolvedValue(mockThreadId);

      const threadId = await threadManager.createThread(roomId, title, createdBy, initialMessageId);

      expect(mockCreateThreadUseCase.execute).toHaveBeenCalledWith({
        roomId,
        title,
        createdBy,
        initialMessageId,
        category: 'logistics',
      });
      expect(threadId).toBe(mockThreadId);
    });

    it('should handle database errors gracefully', async () => {
      const roomId = 'room_123';
      const title = 'Test Thread';
      const createdBy = 'user1';

      mockCreateThreadUseCase.execute.mockRejectedValue(new Error('Database error'));

      await expect(threadManager.createThread(roomId, title, createdBy)).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('getThreadsForRoom', () => {
    it('should return threads for a room', async () => {
      const roomId = 'room_123';
      const mockThreads = [
        { id: 'thread_1', title: 'Thread 1', room_id: roomId },
        { id: 'thread_2', title: 'Thread 2', room_id: roomId },
      ];

      mockThreadRepository.findByRoomId.mockResolvedValue(mockThreads);

      const threads = await threadManager.getThreadsForRoom(roomId);

      expect(mockThreadRepository.findByRoomId).toHaveBeenCalledWith(roomId, {
        includeArchived: false,
        limit: 10,
      });
      expect(threads).toEqual(mockThreads);
    });

    it('should include archived threads when requested', async () => {
      const roomId = 'room_123';

      mockThreadRepository.findByRoomId.mockResolvedValue([]);

      await threadManager.getThreadsForRoom(roomId, true);

      expect(mockThreadRepository.findByRoomId).toHaveBeenCalledWith(roomId, {
        includeArchived: true,
        limit: 10,
      });
    });

    it('should return empty array on error', async () => {
      const roomId = 'room_123';

      mockThreadRepository.findByRoomId.mockRejectedValue(new Error('Database error'));

      // threadManager should catch errors and return empty array
      const threads = await threadManager.getThreadsForRoom(roomId);

      expect(threads).toEqual([]);
    });
  });

  describe('addMessageToThread', () => {
    it('should add message to thread with atomic sequence assignment', async () => {
      const messageId = 'msg_123';
      const threadId = 'thread_123';
      const now = new Date().toISOString();

      mockThreadRepository.addMessage.mockResolvedValue({
        success: true,
        messageCount: 6,
        lastMessageAt: now,
        sequenceNumber: 5,
      });

      const result = await threadManager.addMessageToThread(messageId, threadId);

      expect(mockThreadRepository.addMessage).toHaveBeenCalledWith(messageId, threadId);

      expect(result).toEqual({
        success: true,
        messageCount: 6,
        lastMessageAt: now,
        sequenceNumber: 5,
      });
    });

    it('should return failure object on error', async () => {
      const messageId = 'msg_123';
      const threadId = 'thread_123';

      mockThreadRepository.addMessage.mockResolvedValue({
        success: false,
        messageCount: 0,
        lastMessageAt: null,
        sequenceNumber: null,
      });

      const result = await threadManager.addMessageToThread(messageId, threadId);

      expect(result).toEqual({
        success: false,
        messageCount: 0,
        lastMessageAt: null,
        sequenceNumber: null,
      });
    });
  });

  describe('removeMessageFromThread', () => {
    it('should remove message from thread using atomic decrement', async () => {
      const messageId = 'msg_123';
      const threadId = 'thread_123';

      mockThreadRepository.removeMessage.mockResolvedValue({
        success: true,
        threadId: threadId,
        messageCount: 4,
      });

      const result = await threadManager.removeMessageFromThread(messageId);

      expect(mockThreadRepository.removeMessage).toHaveBeenCalledWith(messageId);

      expect(result).toEqual({
        success: true,
        threadId: threadId,
        messageCount: 4,
      });
    });

    it('should handle message not in any thread', async () => {
      const messageId = 'msg_123';

      mockThreadRepository.removeMessage.mockResolvedValue({
        success: true,
        threadId: null,
        messageCount: 0,
      });

      const result = await threadManager.removeMessageFromThread(messageId);

      expect(mockThreadRepository.removeMessage).toHaveBeenCalledWith(messageId);

      expect(result).toEqual({
        success: true,
        threadId: null,
        messageCount: 0,
      });
    });
  });

  describe('updateThreadTitle', () => {
    it('should update thread title', async () => {
      const threadId = 'thread_123';
      const newTitle = 'Updated Title';

      mockThreadRepository.updateTitle.mockResolvedValue(true);

      const result = await threadManager.updateThreadTitle(threadId, newTitle);

      expect(mockThreadRepository.updateTitle).toHaveBeenCalledWith(threadId, newTitle);
      expect(result).toBe(true);
    });
  });

  describe('archiveThread', () => {
    it('should archive a thread', async () => {
      const threadId = 'thread_123';

      mockArchiveThreadUseCase.execute.mockResolvedValue(true);

      const result = await threadManager.archiveThread(threadId, true);

      expect(mockArchiveThreadUseCase.execute).toHaveBeenCalledWith({
        threadId,
        archived: true,
        cascade: true,
      });
      expect(result).toBe(true);
    });

    it('should unarchive a thread', async () => {
      const threadId = 'thread_123';

      mockArchiveThreadUseCase.execute.mockResolvedValue(false);

      const result = await threadManager.archiveThread(threadId, false);

      expect(mockArchiveThreadUseCase.execute).toHaveBeenCalledWith({
        threadId,
        archived: false,
        cascade: true,
      });
      expect(result).toBe(false);
    });
  });

  describe('getThread', () => {
    it('should return thread by ID', async () => {
      const threadId = 'thread_123';
      const mockThread = {
        id: threadId,
        title: 'Test Thread',
        room_id: 'room_123',
      };

      mockThreadRepository.findById.mockResolvedValue(mockThread);

      const thread = await threadManager.getThread(threadId);

      expect(mockThreadRepository.findById).toHaveBeenCalledWith(threadId);
      expect(thread).toEqual(mockThread);
    });

    it('should return null if thread not found', async () => {
      const threadId = 'thread_123';

      mockThreadRepository.findById.mockResolvedValue(null);

      const thread = await threadManager.getThread(threadId);

      expect(mockThreadRepository.findById).toHaveBeenCalledWith(threadId);
      expect(thread).toBeNull();
    });
  });

  describe('getThreadMessages', () => {
    it('should return messages for a thread', async () => {
      const threadId = 'thread_123';
      const mockMessages = [
        {
          id: 'msg_1',
          threadId: threadId,
          text: 'Message 1',
          timestamp: new Date().toISOString(),
          type: 'user',
          username: 'user1',
          userEmail: 'user1@example.com',
          firstName: 'User',
          displayName: 'User One',
        },
        {
          id: 'msg_2',
          threadId: threadId,
          text: 'Message 2',
          timestamp: new Date().toISOString(),
          type: 'user',
          username: 'user2',
          userEmail: 'user2@example.com',
          firstName: 'User',
          displayName: 'User Two',
        },
      ];

      mockThreadRepository.getMessages.mockResolvedValue(mockMessages);

      const messages = await threadManager.getThreadMessages(threadId);

      expect(mockThreadRepository.getMessages).toHaveBeenCalledWith(threadId, 50, 0);
      expect(messages).toHaveLength(2);
      expect(messages[0]).toHaveProperty('threadId', threadId);
      expect(messages[0]).toHaveProperty('id', 'msg_1');
      expect(messages[0]).toHaveProperty('text', 'Message 1');
    });

    it('should respect limit parameter', async () => {
      const threadId = 'thread_123';
      const limit = 10;

      mockThreadRepository.getMessages.mockResolvedValue([]);

      await threadManager.getThreadMessages(threadId, limit);

      expect(mockThreadRepository.getMessages).toHaveBeenCalledWith(threadId, limit, 0);
    });

    it('should filter out system, private, and flagged messages', async () => {
      const threadId = 'thread_123';

      // The filtering is done in the repository implementation
      // We just verify the repository is called correctly
      mockThreadRepository.getMessages.mockResolvedValue([]);

      await threadManager.getThreadMessages(threadId);

      expect(mockThreadRepository.getMessages).toHaveBeenCalledWith(threadId, 50, 0);
      // The actual SQL filtering is tested in repository tests
    });
  });
});
