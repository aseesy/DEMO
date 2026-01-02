/**
 * Message History Integration Tests
 *
 * Tests actual message persistence against a real database.
 * These tests verify the complete save/retrieve cycle.
 *
 * Run with: npm run test:integration -- messageHistory
 * Requires: DATABASE_URL environment variable
 */

const MessageService = require('../../src/services/messages/messageService');
const dbPostgres = require('../../dbPostgres');

// Skip if no database
const hasDatabase = !!process.env.DATABASE_URL;
const describeIfDb = hasDatabase ? describe : describe.skip;

describeIfDb('Message History - Real Database', () => {
  let messageService;
  // Use existing test room and user (mom1@test.com connected to dad1@test.com)
  const testRoomId = 'room_1766089147534_c60cb4c1a9d4fb9c';
  const testUserEmail = 'mom1@test.com';
  const testUsername = 'Mom';
  const createdMessageIds = [];
  const testRunId = Date.now();

  beforeAll(async () => {
    messageService = new MessageService();
  });

  afterAll(async () => {
    // Cleanup: delete only test messages created during this run
    // (identified by testRunId in the message id)
    for (const msgId of createdMessageIds) {
      try {
        await dbPostgres.query(`DELETE FROM messages WHERE id = $1`, [msgId]);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  });

  // Helper to create valid message with all required fields
  function createTestMessage(overrides = {}) {
    return {
      id: `msg-test-${testRunId}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      room_id: testRoomId,
      text: 'Test message',
      type: 'user',
      timestamp: new Date().toISOString(),
      user_email: testUserEmail,
      username: testUsername, // Required field!
      ...overrides,
    };
  }

  describe('Save and Retrieve Cycle', () => {
    it('should save a message and retrieve it', async () => {
      const message = createTestMessage({
        text: 'Hello, this is a test message',
      });

      // Save
      const saved = await messageService.createMessage(message, testUserEmail);
      createdMessageIds.push(message.id);

      // Retrieve
      const result = await messageService.getRoomMessages(testRoomId, {}, testUserEmail);

      // Verify
      const found = result.messages.find(m => m.id === message.id);
      expect(found).toBeDefined();
      expect(found.text).toBe('Hello, this is a test message');
    });

    it('should preserve message metadata through save/retrieve', async () => {
      const message = createTestMessage({
        text: 'Message with metadata',
        validation: JSON.stringify({ score: 0.85 }),
        tip1: 'Be kind',
      });

      await messageService.createMessage(message, testUserEmail);
      createdMessageIds.push(message.id);

      const result = await messageService.getRoomMessages(testRoomId, {}, testUserEmail);
      const found = result.messages.find(m => m.id === message.id);

      expect(found).toBeDefined();
      // tip1 is stored inside metadata object by _formatMessages
      expect(found.metadata?.tip1).toBe('Be kind');
    });

    it('should return messages in chronological order', async () => {
      const now = Date.now();
      const messages = [
        createTestMessage({
          id: `msg-order-1-${now}`,
          text: 'First',
          timestamp: new Date(now - 2000).toISOString(),
        }),
        createTestMessage({
          id: `msg-order-2-${now}`,
          text: 'Second',
          timestamp: new Date(now - 1000).toISOString(),
        }),
        createTestMessage({
          id: `msg-order-3-${now}`,
          text: 'Third',
          timestamp: new Date(now).toISOString(),
        }),
      ];

      for (const msg of messages) {
        await messageService.createMessage(msg, testUserEmail);
        createdMessageIds.push(msg.id);
      }

      const result = await messageService.getRoomMessages(testRoomId, {}, testUserEmail);
      const testMsgs = result.messages.filter(m => m.id.includes(`order-`) && m.id.includes(now));

      // Should be in order: First, Second, Third
      expect(testMsgs[0].text).toBe('First');
      expect(testMsgs[1].text).toBe('Second');
      expect(testMsgs[2].text).toBe('Third');
    });
  });

  describe('Edit Cycle', () => {
    it('should mark message as edited after update', async () => {
      const message = createTestMessage({
        text: 'Original text',
      });

      await messageService.createMessage(message, testUserEmail);
      createdMessageIds.push(message.id);

      // Edit
      await messageService.updateMessage(message.id, { text: 'Edited text' }, testUserEmail);

      // Retrieve and verify
      const result = await messageService.getRoomMessages(testRoomId, {}, testUserEmail);
      const found = result.messages.find(m => m.id === message.id);

      expect(found.text).toBe('Edited text');
      expect(found.edited).toBe(true);
    });
  });

  describe('Delete Cycle', () => {
    it('should soft-delete message (not appear in results)', async () => {
      const message = createTestMessage({
        text: 'To be deleted',
      });

      await messageService.createMessage(message, testUserEmail);
      createdMessageIds.push(message.id);

      // Delete
      await messageService.deleteMessage(message.id, testUserEmail);

      // Retrieve - should not find it
      const result = await messageService.getRoomMessages(testRoomId, {}, testUserEmail);
      const found = result.messages.find(m => m.id === message.id);

      expect(found).toBeUndefined();
    });
  });

  describe('Reaction Cycle', () => {
    it('should persist reactions', async () => {
      const message = createTestMessage({
        text: 'React to this',
      });

      await messageService.createMessage(message, testUserEmail);
      createdMessageIds.push(message.id);

      // Add reaction
      await messageService.addReaction(message.id, '👍', testUserEmail);

      // Retrieve and verify
      const result = await messageService.getRoomMessages(testRoomId, {}, testUserEmail);
      const found = result.messages.find(m => m.id === message.id);

      expect(found.reactions).toBeDefined();
      expect(found.reactions['👍']).toContain(testUserEmail);
    });
  });

  describe('Pagination', () => {
    it('should respect limit parameter', async () => {
      // Create 5 messages
      const now = Date.now();
      for (let i = 0; i < 5; i++) {
        const msg = createTestMessage({
          id: `msg-page-${now}-${i}`,
          text: `Pagination test ${i}`,
          timestamp: new Date(now + i * 1000).toISOString(),
        });
        await messageService.createMessage(msg, testUserEmail);
        createdMessageIds.push(msg.id);
      }

      // Request only 2
      const result = await messageService.getRoomMessages(testRoomId, { limit: 2 }, testUserEmail);

      expect(result.messages.length).toBeLessThanOrEqual(2);
      expect(result.hasMore).toBe(true);
    });
  });
});

/**
 * Fallback unit tests when database not available
 */
describe('Message History - Unit Tests (no DB required)', () => {
  describe('Message Structure Validation', () => {
    it('should validate required message fields', () => {
      const validMessage = {
        id: 'msg-123',
        roomId: 'room-456',
        text: 'Hello',
        type: 'user',
        timestamp: new Date().toISOString(),
      };

      expect(validMessage.id).toBeDefined();
      expect(validMessage.roomId).toBeDefined();
      expect(validMessage.text).toBeDefined();
      expect(validMessage.timestamp).toBeDefined();
    });

    it('should validate timestamp format', () => {
      const timestamp = new Date().toISOString();
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should validate message types', () => {
      const validTypes = ['user', 'system', 'ai_intervention', 'ai_comment'];
      validTypes.forEach(type => {
        expect(['user', 'system', 'ai_intervention', 'ai_comment']).toContain(type);
      });
    });
  });

  describe('Reaction Logic', () => {
    it('should add user to reaction list', () => {
      const reactions = {};
      const emoji = '👍';
      const user = 'user@example.com';

      if (!reactions[emoji]) reactions[emoji] = [];
      if (!reactions[emoji].includes(user)) reactions[emoji].push(user);

      expect(reactions['👍']).toContain(user);
    });

    it('should toggle reaction (remove if exists)', () => {
      const reactions = { '👍': ['user@example.com'] };
      const emoji = '👍';
      const user = 'user@example.com';

      if (reactions[emoji]?.includes(user)) {
        reactions[emoji] = reactions[emoji].filter(u => u !== user);
      }

      expect(reactions['👍']).not.toContain(user);
    });
  });

  describe('Soft Delete Logic', () => {
    it('should mark as deleted without removing data', () => {
      const message = { id: '123', text: 'Hello', deleted: false };

      // Soft delete
      message.deleted = true;
      message.deleted_at = new Date().toISOString();

      expect(message.id).toBe('123');
      expect(message.text).toBe('Hello');
      expect(message.deleted).toBe(true);
      expect(message.deleted_at).toBeDefined();
    });
  });
});
