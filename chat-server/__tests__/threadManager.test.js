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
jest.mock('../openaiClient');
jest.mock('../src/utils/neo4jClient', () => {
  return {
    isAvailable: jest.fn(() => false),
    createOrUpdateThreadNode: jest.fn(),
    linkMessageToThread: jest.fn(),
    findSimilarMessages: jest.fn(),
  };
});

const threadManager = require('../threadManager');
const dbSafe = require('../dbSafe');
const openaiClient = require('../openaiClient');

describe('ThreadManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset dbSafe mocks
    dbSafe.safeInsert = jest.fn();
    dbSafe.safeSelect = jest.fn();
    dbSafe.safeUpdate = jest.fn();
    dbSafe.parseResult = jest.fn((result) => result);
  });

  describe('createThread', () => {
    it('should create a thread with all required fields', async () => {
      const roomId = 'room_123';
      const title = 'Test Thread';
      const createdBy = 'user1';
      const mockThreadId = 'thread_1234567890_abc123';

      // Mock thread ID generation (simplified - actual uses Date.now())
      jest.spyOn(Date.prototype, 'getTime').mockReturnValue(1234567890);
      jest.spyOn(Math, 'random').mockReturnValue(0.5);
      jest.spyOn(String.prototype, 'substr').mockReturnValue('abc123');

      dbSafe.safeInsert.mockResolvedValue({});

      const threadId = await threadManager.createThread(roomId, title, createdBy);

      expect(dbSafe.safeInsert).toHaveBeenCalledWith('threads', expect.objectContaining({
        room_id: roomId,
        title: title,
        created_by: createdBy,
        message_count: 0,
        is_archived: 0,
      }));
      expect(threadId).toBeDefined();
      expect(typeof threadId).toBe('string');
    });

    it('should create thread with initial message', async () => {
      const roomId = 'room_123';
      const title = 'Test Thread';
      const createdBy = 'user1';
      const initialMessageId = 'msg_123';

      jest.spyOn(Date.prototype, 'getTime').mockReturnValue(1234567890);
      jest.spyOn(Math, 'random').mockReturnValue(0.5);
      jest.spyOn(String.prototype, 'substr').mockReturnValue('abc123');

      dbSafe.safeInsert.mockResolvedValue({});
      dbSafe.safeUpdate.mockResolvedValue({});
      dbSafe.safeSelect.mockResolvedValue([]);
      dbSafe.parseResult.mockReturnValue([]);

      await threadManager.createThread(roomId, title, createdBy, initialMessageId);

      expect(dbSafe.safeInsert).toHaveBeenCalledWith('threads', expect.objectContaining({
        message_count: 1,
        last_message_at: expect.any(String),
      }));
      // Verify addMessageToThread was called (it updates messages and threads)
      expect(dbSafe.safeUpdate).toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      const roomId = 'room_123';
      const title = 'Test Thread';
      const createdBy = 'user1';

      dbSafe.safeInsert.mockRejectedValue(new Error('Database error'));

      await expect(
        threadManager.createThread(roomId, title, createdBy)
      ).rejects.toThrow('Database error');
    });
  });

  describe('getThreadsForRoom', () => {
    it('should return threads for a room', async () => {
      const roomId = 'room_123';
      const mockThreads = [
        { id: 'thread_1', title: 'Thread 1', room_id: roomId },
        { id: 'thread_2', title: 'Thread 2', room_id: roomId },
      ];

      dbSafe.safeSelect.mockResolvedValue(mockThreads);
      dbSafe.parseResult.mockReturnValue(mockThreads);

      const threads = await threadManager.getThreadsForRoom(roomId);

      expect(dbSafe.safeSelect).toHaveBeenCalledWith(
        'threads',
        { room_id: roomId, is_archived: 0 },
        expect.objectContaining({
          orderBy: 'updated_at',
          orderDirection: 'DESC',
        })
      );
      expect(threads).toEqual(mockThreads);
    });

    it('should include archived threads when requested', async () => {
      const roomId = 'room_123';

      dbSafe.safeSelect.mockResolvedValue([]);
      dbSafe.parseResult.mockReturnValue([]);

      await threadManager.getThreadsForRoom(roomId, true);

      expect(dbSafe.safeSelect).toHaveBeenCalledWith(
        'threads',
        { room_id: roomId },
        expect.any(Object)
      );
    });

    it('should return empty array on error', async () => {
      const roomId = 'room_123';

      dbSafe.safeSelect.mockRejectedValue(new Error('Database error'));

      const threads = await threadManager.getThreadsForRoom(roomId);

      expect(threads).toEqual([]);
    });
  });

  describe('addMessageToThread', () => {
    it('should add message to thread and update message_count', async () => {
      const messageId = 'msg_123';
      const threadId = 'thread_123';

      const mockThread = {
        id: threadId,
        message_count: 5,
      };
      const mockMessage = {
        id: messageId,
        timestamp: new Date().toISOString(),
      };

      dbSafe.safeUpdate.mockResolvedValue({});
      dbSafe.safeSelect
        .mockResolvedValueOnce([mockThread]) // For thread lookup
        .mockResolvedValueOnce([mockMessage]); // For message lookup
      dbSafe.parseResult
        .mockReturnValueOnce([mockThread])
        .mockReturnValueOnce([mockMessage]);

      const result = await threadManager.addMessageToThread(messageId, threadId);

      expect(dbSafe.safeUpdate).toHaveBeenCalledWith(
        'messages',
        { thread_id: threadId },
        { id: messageId }
      );
      expect(dbSafe.safeUpdate).toHaveBeenCalledWith(
        'threads',
        expect.objectContaining({
          message_count: 6, // 5 + 1
        }),
        { id: threadId }
      );
      expect(result).toBe(true);
    });

    it('should return false on error', async () => {
      const messageId = 'msg_123';
      const threadId = 'thread_123';

      // Mock the first safeUpdate to fail
      dbSafe.safeUpdate.mockRejectedValueOnce(new Error('Database error'));

      const result = await threadManager.addMessageToThread(messageId, threadId);

      expect(result).toBe(false);
    });
  });

  describe('removeMessageFromThread', () => {
    it('should remove message from thread and decrement message_count', async () => {
      const messageId = 'msg_123';
      const threadId = 'thread_123';

      const mockMessage = {
        id: messageId,
        thread_id: threadId,
      };
      const mockThread = {
        id: threadId,
        message_count: 5,
      };

      dbSafe.safeUpdate.mockResolvedValue({});
      dbSafe.safeSelect
        .mockResolvedValueOnce([mockMessage]) // For message lookup
        .mockResolvedValueOnce([mockThread]); // For thread lookup
      dbSafe.parseResult
        .mockReturnValueOnce([mockMessage])
        .mockReturnValueOnce([mockThread]);

      const result = await threadManager.removeMessageFromThread(messageId);

      expect(dbSafe.safeUpdate).toHaveBeenCalledWith(
        'messages',
        { thread_id: null },
        { id: messageId }
      );
      expect(dbSafe.safeUpdate).toHaveBeenCalledWith(
        'threads',
        expect.objectContaining({
          message_count: 4, // 5 - 1, but Math.max(0, ...) ensures >= 0
        }),
        { id: threadId }
      );
      expect(result).toBe(true);
    });

    it('should not decrement below zero', async () => {
      const messageId = 'msg_123';
      const threadId = 'thread_123';

      const mockMessage = {
        id: messageId,
        thread_id: threadId,
      };
      const mockThread = {
        id: threadId,
        message_count: 0, // Already at zero
      };

      dbSafe.safeUpdate.mockResolvedValue({});
      dbSafe.safeSelect
        .mockResolvedValueOnce([mockMessage])
        .mockResolvedValueOnce([mockThread]);
      dbSafe.parseResult
        .mockReturnValueOnce([mockMessage])
        .mockReturnValueOnce([mockThread]);

      await threadManager.removeMessageFromThread(messageId);

      expect(dbSafe.safeUpdate).toHaveBeenCalledWith(
        'threads',
        expect.objectContaining({
          message_count: 0, // Math.max(0, 0 - 1) = 0
        }),
        { id: threadId }
      );
    });
  });

  describe('updateThreadTitle', () => {
    it('should update thread title', async () => {
      const threadId = 'thread_123';
      const newTitle = 'Updated Title';

      dbSafe.safeUpdate.mockResolvedValue({});

      const result = await threadManager.updateThreadTitle(threadId, newTitle);

      expect(dbSafe.safeUpdate).toHaveBeenCalledWith(
        'threads',
        expect.objectContaining({
          title: newTitle,
          updated_at: expect.any(String),
        }),
        { id: threadId }
      );
      expect(result).toBe(true);
    });
  });

  describe('archiveThread', () => {
    it('should archive a thread', async () => {
      const threadId = 'thread_123';

      dbSafe.safeUpdate.mockResolvedValue({});

      const result = await threadManager.archiveThread(threadId, true);

      expect(dbSafe.safeUpdate).toHaveBeenCalledWith(
        'threads',
        expect.objectContaining({
          is_archived: 1,
          updated_at: expect.any(String),
        }),
        { id: threadId }
      );
      expect(result).toBe(true);
    });

    it('should unarchive a thread', async () => {
      const threadId = 'thread_123';

      dbSafe.safeUpdate.mockResolvedValue({});

      const result = await threadManager.archiveThread(threadId, false);

      expect(dbSafe.safeUpdate).toHaveBeenCalledWith(
        'threads',
        expect.objectContaining({
          is_archived: 0,
        }),
        { id: threadId }
      );
      expect(result).toBe(true);
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

      dbSafe.safeSelect.mockResolvedValue([mockThread]);
      dbSafe.parseResult.mockReturnValue([mockThread]);

      const thread = await threadManager.getThread(threadId);

      expect(dbSafe.safeSelect).toHaveBeenCalledWith(
        'threads',
        { id: threadId },
        { limit: 1 }
      );
      expect(thread).toEqual(mockThread);
    });

    it('should return null if thread not found', async () => {
      const threadId = 'thread_123';

      dbSafe.safeSelect.mockResolvedValue([]);
      dbSafe.parseResult.mockReturnValue([]);

      const thread = await threadManager.getThread(threadId);

      expect(thread).toBeNull();
    });
  });

  describe('getThreadMessages', () => {
    it('should return messages for a thread', async () => {
      const threadId = 'thread_123';
      const mockMessages = [
        {
          id: 'msg_1',
          thread_id: threadId,
          text: 'Message 1',
          timestamp: new Date().toISOString(),
        },
        {
          id: 'msg_2',
          thread_id: threadId,
          text: 'Message 2',
          timestamp: new Date().toISOString(),
        },
      ];

      const dbPostgres = require('../dbPostgres');
      dbPostgres.query = jest.fn().mockResolvedValue({
        rows: mockMessages,
      });

      const messages = await threadManager.getThreadMessages(threadId);

      expect(dbPostgres.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE thread_id = $1'),
        [threadId, 50] // Default limit
      );
      expect(messages).toHaveLength(2);
      expect(messages[0]).toHaveProperty('threadId', threadId);
    });

    it('should respect limit parameter', async () => {
      const threadId = 'thread_123';
      const limit = 10;

      const dbPostgres = require('../dbPostgres');
      dbPostgres.query = jest.fn().mockResolvedValue({ rows: [] });

      await threadManager.getThreadMessages(threadId, limit);

      expect(dbPostgres.query).toHaveBeenCalledWith(
        expect.any(String),
        [threadId, limit]
      );
    });

    it('should filter out system, private, and flagged messages', async () => {
      const threadId = 'thread_123';

      const dbPostgres = require('../dbPostgres');
      dbPostgres.query = jest.fn().mockResolvedValue({ rows: [] });

      await threadManager.getThreadMessages(threadId);

      const query = dbPostgres.query.mock.calls[0][0];
      expect(query).toContain("type != 'system'");
      expect(query).toContain('(private = 0 OR private IS NULL)');
      expect(query).toContain('(flagged = 0 OR flagged IS NULL)');
    });
  });
});

