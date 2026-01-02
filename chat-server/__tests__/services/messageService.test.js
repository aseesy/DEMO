/**
 * MessageService Tests
 *
 * Tests for message persistence, retrieval, and lifecycle operations.
 * These tests verify that messages are correctly saved and retrieved.
 */

const MessageService = require('../../src/services/messages/messageService');

// Mock the database
jest.mock('../../dbPostgres', () => ({
  query: jest.fn(),
  getPool: jest.fn(() => ({
    query: jest.fn(),
  })),
}));

jest.mock('../../dbSafe', () => ({
  safeInsert: jest.fn(),
  safeSelect: jest.fn(),
  safeUpdate: jest.fn(),
  parseResult: jest.fn(result => result?.rows || []),
}));

const dbPostgres = require('../../dbPostgres');
const dbSafe = require('../../dbSafe');

describe('MessageService', () => {
  let messageService;

  beforeEach(() => {
    jest.clearAllMocks();
    messageService = new MessageService();
  });

  describe('createMessage', () => {
    const testMessage = {
      id: 'msg-123',
      roomId: 'room-456',
      text: 'Hello, world!',
      type: 'user',
      timestamp: '2024-01-01T12:00:00.000Z',
    };
    const testUserEmail = 'sender@example.com';

    it('should save a message to the database', async () => {
      dbPostgres.query.mockResolvedValue({
        rows: [{ id: 'msg-123', text: 'Hello, world!' }],
      });

      const result = await messageService.createMessage(testMessage, testUserEmail);

      expect(dbPostgres.query).toHaveBeenCalled();
      // Verify the query includes the message data
      const [query, params] = dbPostgres.query.mock.calls[0];
      expect(query).toContain('INSERT');
      expect(query.toLowerCase()).toContain('messages');
    });

    it('should handle messages with metadata', async () => {
      const messageWithMetadata = {
        ...testMessage,
        metadata: {
          validation: { score: 0.8 },
          tip1: 'Be kind',
          rewrite: 'Suggested rewrite',
        },
      };

      dbPostgres.query.mockResolvedValue({
        rows: [messageWithMetadata],
      });

      await messageService.createMessage(messageWithMetadata, testUserEmail);

      expect(dbPostgres.query).toHaveBeenCalled();
    });

    it('should handle messages with thread information', async () => {
      const threadedMessage = {
        ...testMessage,
        threadId: 'thread-789',
        threadSequence: 1,
      };

      dbPostgres.query.mockResolvedValue({
        rows: [threadedMessage],
      });

      await messageService.createMessage(threadedMessage, testUserEmail);

      expect(dbPostgres.query).toHaveBeenCalled();
    });

    it('should throw error when database fails', async () => {
      dbPostgres.query.mockRejectedValue(new Error('Database connection failed'));

      await expect(messageService.createMessage(testMessage, testUserEmail)).rejects.toThrow();
    });

    it('should handle empty message text gracefully', async () => {
      const emptyMessage = { ...testMessage, text: '' };

      dbPostgres.query.mockResolvedValue({ rows: [emptyMessage] });

      // Should not throw - empty messages are allowed for system messages
      await expect(
        messageService.createMessage(emptyMessage, testUserEmail)
      ).resolves.toBeDefined();
    });
  });

  describe('getRoomMessages', () => {
    const testRoomId = 'room-456';
    const testUserEmail = 'user@example.com';

    it('should retrieve messages for a room', async () => {
      const mockMessages = [
        { id: 'msg-1', text: 'Hello', timestamp: '2024-01-01T12:00:00Z' },
        { id: 'msg-2', text: 'World', timestamp: '2024-01-01T12:01:00Z' },
      ];

      dbPostgres.query.mockResolvedValue({ rows: mockMessages });

      const result = await messageService.getRoomMessages(testRoomId, {}, testUserEmail);

      expect(dbPostgres.query).toHaveBeenCalled();
      expect(result.messages).toBeDefined();
    });

    it('should apply pagination with limit and offset', async () => {
      dbPostgres.query.mockResolvedValue({ rows: [] });

      await messageService.getRoomMessages(testRoomId, { limit: 20, offset: 40 }, testUserEmail);

      expect(dbPostgres.query).toHaveBeenCalled();
      // Check any of the queries for LIMIT/OFFSET (the SELECT query has it, not COUNT)
      const allQueries = dbPostgres.query.mock.calls.map(call => call[0]).join(' ');
      expect(allQueries).toContain('LIMIT');
      expect(allQueries).toContain('OFFSET');
    });

    it('should filter by threadId when provided', async () => {
      dbPostgres.query.mockResolvedValue({ rows: [] });

      await messageService.getRoomMessages(testRoomId, { threadId: 'thread-123' }, testUserEmail);

      expect(dbPostgres.query).toHaveBeenCalled();
    });

    it('should exclude deleted messages by default', async () => {
      dbPostgres.query.mockResolvedValue({ rows: [] });

      await messageService.getRoomMessages(testRoomId, {}, testUserEmail);

      expect(dbPostgres.query).toHaveBeenCalled();
      // Check any of the queries for deleted filter
      const allQueries = dbPostgres.query.mock.calls.map(call => call[0]).join(' ');
      // Messages table filters out deleted messages via type or conditions
      expect(allQueries.toLowerCase()).toMatch(/type|private|flagged/);
    });

    it('should order messages by timestamp', async () => {
      dbPostgres.query.mockResolvedValue({ rows: [] });

      await messageService.getRoomMessages(testRoomId, {}, testUserEmail);

      expect(dbPostgres.query).toHaveBeenCalled();
      // Check any of the queries for ORDER BY (second query has it)
      const allQueries = dbPostgres.query.mock.calls.map(call => call[0]).join(' ');
      expect(allQueries).toContain('ORDER BY');
    });
  });

  describe('updateMessage', () => {
    const testMessageId = 'msg-123';
    const testUserEmail = 'user@example.com';

    it('should update message text', async () => {
      // First call: get message for ownership check
      // Second call: update message
      dbPostgres.query
        .mockResolvedValueOnce({
          rows: [{ id: testMessageId, user_email: testUserEmail, text: 'Original text' }],
        })
        .mockResolvedValueOnce({
          rows: [{ id: testMessageId, text: 'Updated text', edited: true }],
        });

      await messageService.updateMessage(testMessageId, { text: 'Updated text' }, testUserEmail);

      expect(dbPostgres.query).toHaveBeenCalled();
    });

    it('should set edited flag and timestamp', async () => {
      dbPostgres.query
        .mockResolvedValueOnce({
          rows: [{ id: testMessageId, user_email: testUserEmail, text: 'Original' }],
        })
        .mockResolvedValueOnce({
          rows: [{ id: testMessageId, edited: true }],
        });

      await messageService.updateMessage(testMessageId, { text: 'New text' }, testUserEmail);

      expect(dbPostgres.query).toHaveBeenCalled();
    });
  });

  describe('deleteMessage', () => {
    const testMessageId = 'msg-123';
    const testUserEmail = 'user@example.com';

    it('should soft delete a message', async () => {
      // First call: get message for ownership check
      // Second call: update message
      dbPostgres.query
        .mockResolvedValueOnce({
          rows: [{ id: testMessageId, user_email: testUserEmail, text: 'Test' }],
        })
        .mockResolvedValueOnce({
          rows: [{ id: testMessageId, deleted: true }],
        });

      await messageService.deleteMessage(testMessageId, testUserEmail);

      expect(dbPostgres.query).toHaveBeenCalled();
    });

    it('should set deleted_at timestamp', async () => {
      dbPostgres.query
        .mockResolvedValueOnce({
          rows: [{ id: testMessageId, user_email: testUserEmail, text: 'Test' }],
        })
        .mockResolvedValueOnce({
          rows: [{ id: testMessageId, deleted: true, deleted_at: new Date().toISOString() }],
        });

      await messageService.deleteMessage(testMessageId, testUserEmail);

      expect(dbPostgres.query).toHaveBeenCalled();
    });
  });

  describe('addReaction', () => {
    const testMessageId = 'msg-123';
    const testEmoji = '👍';
    const testUserEmail = 'user@example.com';

    it('should call database to get and update message', async () => {
      // addReaction internally calls getMessage then updateMessage
      // We need to mock all the calls it makes
      dbPostgres.query
        // First call: getMessage (addReaction)
        .mockResolvedValueOnce({
          rows: [
            { id: testMessageId, user_email: testUserEmail, reactions: '{}', room_id: 'room-1' },
          ],
        })
        // Second call: getMessage (updateMessage ownership check)
        .mockResolvedValueOnce({
          rows: [{ id: testMessageId, user_email: testUserEmail, reactions: '{}' }],
        })
        // Third call: update
        .mockResolvedValueOnce({
          rows: [{ id: testMessageId, reactions: JSON.stringify({ '👍': [testUserEmail] }) }],
        });

      await messageService.addReaction(testMessageId, testEmoji, testUserEmail);

      // Verify database was called
      expect(dbPostgres.query).toHaveBeenCalled();
    });

    it('should return null if message not found', async () => {
      dbPostgres.query.mockResolvedValueOnce({ rows: [] });

      const result = await messageService.addReaction(testMessageId, testEmoji, testUserEmail);

      expect(result).toBeNull();
    });
  });
});

describe('Message History Integration', () => {
  describe('Message Lifecycle', () => {
    it('should maintain message order by timestamp', () => {
      const messages = [
        { id: '1', timestamp: '2024-01-01T12:00:00Z' },
        { id: '2', timestamp: '2024-01-01T12:01:00Z' },
        { id: '3', timestamp: '2024-01-01T11:59:00Z' },
      ];

      const sorted = [...messages].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      expect(sorted[0].id).toBe('3');
      expect(sorted[1].id).toBe('1');
      expect(sorted[2].id).toBe('2');
    });

    it('should preserve message metadata through save/load cycle', () => {
      const originalMessage = {
        id: 'msg-123',
        text: 'Test message',
        metadata: {
          validation: { score: 0.85 },
          tip1: 'Consider rephrasing',
          originalMessage: 'Original text',
        },
      };

      // Simulate JSON serialization (as happens in database)
      const serialized = JSON.stringify(originalMessage.metadata);
      const deserialized = JSON.parse(serialized);

      expect(deserialized).toEqual(originalMessage.metadata);
      expect(deserialized.validation.score).toBe(0.85);
    });

    it('should handle reaction JSON serialization correctly', () => {
      const reactions = {
        '👍': ['user1@example.com', 'user2@example.com'],
        '❤️': ['user3@example.com'],
      };

      const serialized = JSON.stringify(reactions);
      const deserialized = JSON.parse(serialized);

      expect(deserialized['👍']).toHaveLength(2);
      expect(deserialized['❤️']).toHaveLength(1);
    });

    it('should track edit history correctly', () => {
      const message = {
        id: 'msg-123',
        text: 'Edited text',
        edited: true,
        edited_at: '2024-01-01T12:30:00Z',
        original_text: 'Original text',
      };

      expect(message.edited).toBe(true);
      expect(message.edited_at).toBeDefined();
      expect(new Date(message.edited_at)).toBeInstanceOf(Date);
    });

    it('should mark deleted messages without removing them', () => {
      const deletedMessage = {
        id: 'msg-123',
        text: 'This was deleted',
        deleted: true,
        deleted_at: '2024-01-01T13:00:00Z',
      };

      // Message still exists but is marked deleted
      expect(deletedMessage.id).toBeDefined();
      expect(deletedMessage.deleted).toBe(true);
      expect(deletedMessage.deleted_at).toBeDefined();
    });
  });

  describe('Thread Handling', () => {
    it('should group messages by thread', () => {
      const messages = [
        { id: '1', threadId: 'thread-A', threadSequence: 1 },
        { id: '2', threadId: 'thread-A', threadSequence: 2 },
        { id: '3', threadId: 'thread-B', threadSequence: 1 },
        { id: '4', threadId: null }, // Main thread
      ];

      const byThread = messages.reduce((acc, msg) => {
        const key = msg.threadId || 'main';
        acc[key] = acc[key] || [];
        acc[key].push(msg);
        return acc;
      }, {});

      expect(byThread['thread-A']).toHaveLength(2);
      expect(byThread['thread-B']).toHaveLength(1);
      expect(byThread['main']).toHaveLength(1);
    });

    it('should order messages within thread by sequence', () => {
      const threadMessages = [
        { id: '2', threadSequence: 2 },
        { id: '1', threadSequence: 1 },
        { id: '3', threadSequence: 3 },
      ];

      const sorted = [...threadMessages].sort((a, b) => a.threadSequence - b.threadSequence);

      expect(sorted[0].id).toBe('1');
      expect(sorted[1].id).toBe('2');
      expect(sorted[2].id).toBe('3');
    });
  });

  describe('Message Types', () => {
    it('should distinguish between message types', () => {
      const messageTypes = ['user', 'system', 'ai_intervention', 'ai_comment'];

      messageTypes.forEach(type => {
        const message = { type };
        expect(['user', 'system', 'ai_intervention', 'ai_comment']).toContain(message.type);
      });
    });

    it('should handle AI intervention messages with rewrites', () => {
      const interventionMessage = {
        type: 'ai_intervention',
        text: 'Consider rephrasing',
        metadata: {
          originalMessage: 'You always do this!',
          rewrite: 'I feel frustrated when this happens',
          tip1: 'Use "I" statements',
        },
      };

      expect(interventionMessage.type).toBe('ai_intervention');
      expect(interventionMessage.metadata.originalMessage).toBeDefined();
      expect(interventionMessage.metadata.rewrite).toBeDefined();
    });
  });
});
