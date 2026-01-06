/**
 * Message Entity Tests
 *
 * Tests for Message domain entity business rules and methods.
 */

const { Message } = require('../Message');
const { MessageId } = require('../../valueObjects/MessageId');
const { RoomId } = require('../../valueObjects/RoomId');

describe('Message Entity', () => {
  describe('Constructor', () => {
    it('should create a Message with required fields', () => {
      const message = new Message({
        id: 'msg-123',
        type: 'message',
        text: 'Hello world',
        username: 'testuser',
        roomId: 'room-123',
        timestamp: new Date('2024-01-01'),
      });

      expect(message.id).toBeInstanceOf(MessageId);
      expect(message.id.toString()).toBe('msg-123');
      expect(message.type).toBe('message');
      expect(message.text).toBe('Hello world');
      expect(message.username).toBe('testuser');
      expect(message.roomId).toBeInstanceOf(RoomId);
      expect(message.roomId.toString()).toBe('room-123');
    });

    it('should throw error if id is missing', () => {
      expect(() => {
        new Message({
          type: 'message',
          text: 'Hello',
          username: 'testuser',
          roomId: 'room-123',
          timestamp: new Date(),
        });
      }).toThrow('Message ID is required');
    });

    it('should throw error if text is empty for non-system messages', () => {
      expect(() => {
        new Message({
          id: 'msg-123',
          type: 'message',
          text: '   ',
          username: 'testuser',
          roomId: 'room-123',
          timestamp: new Date(),
        });
      }).toThrow('Message text cannot be empty');
    });

    it('should allow empty text for system messages', () => {
      const message = new Message({
        id: 'msg-123',
        type: 'system',
        text: '',
        username: 'system',
        roomId: 'room-123',
        timestamp: new Date(),
      });

      expect(message.text).toBe('');
      expect(message.isSystemMessage()).toBe(true);
    });

    it('should trim message text', () => {
      const message = new Message({
        id: 'msg-123',
        type: 'message',
        text: '  Hello world  ',
        username: 'testuser',
        roomId: 'room-123',
        timestamp: new Date(),
      });

      expect(message.text).toBe('Hello world');
    });

    it('should make entity immutable', () => {
      const message = new Message({
        id: 'msg-123',
        type: 'message',
        text: 'Hello',
        username: 'testuser',
        roomId: 'room-123',
        timestamp: new Date(),
      });

      expect(() => {
        message.text = 'New text';
      }).toThrow();
    });
  });

  describe('isSystemMessage', () => {
    it('should return true for system messages', () => {
      const message = new Message({
        id: 'msg-123',
        type: 'system',
        text: '',
        username: 'system',
        roomId: 'room-123',
        timestamp: new Date(),
      });

      expect(message.isSystemMessage()).toBe(true);
    });

    it('should return false for regular messages', () => {
      const message = new Message({
        id: 'msg-123',
        type: 'message',
        text: 'Hello',
        username: 'testuser',
        roomId: 'room-123',
        timestamp: new Date(),
      });

      expect(message.isSystemMessage()).toBe(false);
    });
  });

  describe('isAIIntervention', () => {
    it('should return true for AI intervention messages', () => {
      const message = new Message({
        id: 'msg-123',
        type: 'ai_intervention',
        text: 'Intervention text',
        username: 'system',
        roomId: 'room-123',
        timestamp: new Date(),
      });

      expect(message.isAIIntervention()).toBe(true);
    });

    it('should return false for regular messages', () => {
      const message = new Message({
        id: 'msg-123',
        type: 'message',
        text: 'Hello',
        username: 'testuser',
        roomId: 'room-123',
        timestamp: new Date(),
      });

      expect(message.isAIIntervention()).toBe(false);
    });
  });

  describe('wasMediatedByAI', () => {
    it('should return true if message was mediated', () => {
      const message = new Message({
        id: 'msg-123',
        type: 'message',
        text: 'Hello',
        username: 'testuser',
        roomId: 'room-123',
        timestamp: new Date(),
        wasMediated: true,
      });

      expect(message.wasMediatedByAI()).toBe(true);
    });

    it('should return false if message was not mediated', () => {
      const message = new Message({
        id: 'msg-123',
        type: 'message',
        text: 'Hello',
        username: 'testuser',
        roomId: 'room-123',
        timestamp: new Date(),
        wasMediated: false,
      });

      expect(message.wasMediatedByAI()).toBe(false);
    });
  });

  describe('isThreaded', () => {
    it('should return true if message has threadId', () => {
      const message = new Message({
        id: 'msg-123',
        type: 'message',
        text: 'Hello',
        username: 'testuser',
        roomId: 'room-123',
        timestamp: new Date(),
        threadId: 'thread-456',
      });

      expect(message.isThreaded()).toBe(true);
    });

    it('should return false if message has no threadId', () => {
      const message = new Message({
        id: 'msg-123',
        type: 'message',
        text: 'Hello',
        username: 'testuser',
        roomId: 'room-123',
        timestamp: new Date(),
      });

      expect(message.isThreaded()).toBe(false);
    });
  });

  describe('getOriginalContent', () => {
    it('should return original content if available', () => {
      const message = new Message({
        id: 'msg-123',
        type: 'message',
        text: 'Rewritten text',
        username: 'testuser',
        roomId: 'room-123',
        timestamp: new Date(),
        originalContent: 'Original text',
      });

      expect(message.getOriginalContent()).toBe('Original text');
    });

    it('should return current text if no original content', () => {
      const message = new Message({
        id: 'msg-123',
        type: 'message',
        text: 'Hello',
        username: 'testuser',
        roomId: 'room-123',
        timestamp: new Date(),
      });

      expect(message.getOriginalContent()).toBe('Hello');
    });
  });

  describe('updateText', () => {
    it('should create new Message with updated text', () => {
      const message = new Message({
        id: 'msg-123',
        type: 'message',
        text: 'Hello',
        username: 'testuser',
        roomId: 'room-123',
        timestamp: new Date(),
      });

      const updated = message.updateText('Updated text');

      expect(updated).not.toBe(message); // New instance
      expect(updated.text).toBe('Updated text');
    });

    it('should throw error if new text is empty', () => {
      const message = new Message({
        id: 'msg-123',
        type: 'message',
        text: 'Hello',
        username: 'testuser',
        roomId: 'room-123',
        timestamp: new Date(),
      });

      expect(() => {
        message.updateText('');
      }).toThrow('New message text cannot be empty');
    });
  });

  describe('markAsMediated', () => {
    it('should mark message as mediated', () => {
      const message = new Message({
        id: 'msg-123',
        type: 'message',
        text: 'Rewritten text',
        username: 'testuser',
        roomId: 'room-123',
        timestamp: new Date(),
      });

      const mediated = message.markAsMediated('Original text');

      expect(mediated).not.toBe(message); // New instance
      expect(mediated.wasMediated).toBe(true);
      expect(mediated.originalContent).toBe('Original text');
    });

    it('should use current text if no original content provided', () => {
      const message = new Message({
        id: 'msg-123',
        type: 'message',
        text: 'Hello',
        username: 'testuser',
        roomId: 'room-123',
        timestamp: new Date(),
      });

      const mediated = message.markAsMediated();

      expect(mediated.originalContent).toBe('Hello');
    });
  });

  describe('fromDatabaseRow', () => {
    it('should create Message from database row', () => {
      const row = {
        id: 'msg-123',
        type: 'message',
        text: 'Hello',
        username: 'testuser',
        room_id: 'room-123',
        timestamp: new Date('2024-01-01'),
        thread_id: 'thread-456',
        thread_sequence: 5,
        original_content: 'Original',
        was_mediated: true,
      };

      const message = Message.fromDatabaseRow(row);

      expect(message.id.toString()).toBe('msg-123');
      expect(message.text).toBe('Hello');
      expect(message.roomId.toString()).toBe('room-123');
      expect(message.threadId).toBe('thread-456');
      expect(message.threadSequence).toBe(5);
      expect(message.originalContent).toBe('Original');
      expect(message.wasMediated).toBe(true);
    });

    it('should handle user_email field (migration support)', () => {
      const row = {
        id: 'msg-123',
        type: 'message',
        text: 'Hello',
        user_email: 'test@example.com', // No username, use user_email
        room_id: 'room-123',
        timestamp: new Date('2024-01-01'),
        thread_id: 'thread-456',
        thread_sequence: 3,
      };

      const message = Message.fromDatabaseRow(row);

      expect(message.username).toBe('test@example.com');
      expect(message.threadSequence).toBe(3);
    });

    it('should handle null thread_sequence', () => {
      const row = {
        id: 'msg-123',
        type: 'message',
        text: 'Hello',
        username: 'testuser',
        room_id: 'room-123',
        timestamp: new Date('2024-01-01'),
        thread_id: null,
        thread_sequence: null,
      };

      const message = Message.fromDatabaseRow(row);

      expect(message.threadId).toBe(null);
      expect(message.threadSequence).toBe(null);
    });
  });

  describe('fromApiData', () => {
    it('should create Message from API data', () => {
      const data = {
        id: 'msg-123',
        type: 'message',
        text: 'Hello',
        username: 'testuser',
        roomId: 'room-123',
        timestamp: '2024-01-01T00:00:00Z',
      };

      const message = Message.fromApiData(data);

      expect(message.id.toString()).toBe('msg-123');
      expect(message.text).toBe('Hello');
      expect(message.roomId.toString()).toBe('room-123');
    });

    it('should handle snake_case API data', () => {
      const data = {
        id: 'msg-123',
        type: 'message',
        text: 'Hello',
        username: 'testuser',
        room_id: 'room-123',
        timestamp: '2024-01-01T00:00:00Z',
        thread_id: 'thread-456',
        thread_sequence: 7,
        was_mediated: true,
      };

      const message = Message.fromApiData(data);

      expect(message.roomId.toString()).toBe('room-123');
      expect(message.threadId).toBe('thread-456');
      expect(message.threadSequence).toBe(7);
      expect(message.wasMediated).toBe(true);
    });

    it('should handle threadSequence field', () => {
      const data = {
        id: 'msg-123',
        type: 'message',
        text: 'Hello',
        username: 'testuser',
        roomId: 'room-123',
        timestamp: '2024-01-01T00:00:00Z',
        threadId: 'thread-456',
        threadSequence: 10,
      };

      const message = Message.fromApiData(data);

      expect(message.threadId).toBe('thread-456');
      expect(message.threadSequence).toBe(10);
    });
  });

  describe('getThreadSequence', () => {
    it('should return thread sequence number', () => {
      const message = new Message({
        id: 'msg-123',
        type: 'message',
        text: 'Hello',
        username: 'testuser',
        roomId: 'room-123',
        timestamp: new Date(),
        threadId: 'thread-456',
        threadSequence: 5,
      });

      expect(message.getThreadSequence()).toBe(5);
    });

    it('should return null if not in thread', () => {
      const message = new Message({
        id: 'msg-123',
        type: 'message',
        text: 'Hello',
        username: 'testuser',
        roomId: 'room-123',
        timestamp: new Date(),
      });

      expect(message.getThreadSequence()).toBe(null);
    });
  });
});

