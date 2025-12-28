/**
 * Unit Tests for messageOperations.js
 *
 * Tests pure business logic functions for message handling.
 * These functions have single responsibilities and are easily testable.
 */

/* global jest, describe, beforeEach, afterEach, it, expect */

const {
  validateMessageText,
  validateActiveUser,
  createUserMessage,
  createEditedMessage,
  parseReactions,
  toggleReaction,
} = require('../../socketHandlers/messageOperations');

// Mock the utils module
jest.mock('../../utils', () => ({
  sanitizeInput: jest.fn(text => (text ? text.trim() : '')),
  MAX_MESSAGE_LENGTH: 5000,
}));

jest.mock('../../socketHandlers/utils', () => ({
  getUserDisplayName: jest.fn(),
}));

describe('messageOperations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateMessageText', () => {
    it('should return valid result for normal text', () => {
      const result = validateMessageText('Hello world');
      expect(result).toEqual({
        valid: true,
        cleanText: 'Hello world',
      });
    });

    it('should return empty flag for empty string', () => {
      const result = validateMessageText('');
      expect(result).toEqual({
        valid: false,
        empty: true,
      });
    });

    it('should return empty flag for whitespace-only string', () => {
      const result = validateMessageText('   ');
      expect(result).toEqual({
        valid: false,
        empty: true,
      });
    });

    it('should return empty flag for null', () => {
      const result = validateMessageText(null);
      expect(result).toEqual({
        valid: false,
        empty: true,
      });
    });

    it('should return empty flag for undefined', () => {
      const result = validateMessageText(undefined);
      expect(result).toEqual({
        valid: false,
        empty: true,
      });
    });

    it('should return error for message exceeding max length', () => {
      const longMessage = 'a'.repeat(5001);
      // Mock sanitizeInput to return the long message
      require('../../utils').sanitizeInput.mockReturnValue(longMessage);

      const result = validateMessageText(longMessage);
      expect(result).toEqual({
        valid: false,
        error: 'Message too long (max 5000 characters).',
      });
    });

    it('should trim whitespace from message', () => {
      require('../../utils').sanitizeInput.mockReturnValue('Hello world');
      const result = validateMessageText('  Hello world  ');
      expect(result.cleanText).toBe('Hello world');
    });
  });

  describe('validateActiveUser', () => {
    it('should return valid result when user exists', () => {
      const user = { username: 'testuser', roomId: 'room1' };
      const userSessionService = {
        getUserBySocketId: jest.fn().mockReturnValue(user),
      };

      const result = validateActiveUser(userSessionService, 'socket123');
      expect(result).toEqual({
        valid: true,
        user,
      });
    });

    it('should return error when user not found', () => {
      const userSessionService = {
        getUserBySocketId: jest.fn().mockReturnValue(null),
      };

      const result = validateActiveUser(userSessionService, 'unknown-socket');
      expect(result).toEqual({
        valid: false,
        error: 'You must join before sending messages.',
      });
    });

    it('should return error when userSessionService returns null', () => {
      const userSessionService = {
        getUserBySocketId: jest.fn().mockReturnValue(null),
      };

      const result = validateActiveUser(userSessionService, 'socket123');
      expect(result).toEqual({
        valid: false,
        error: 'You must join before sending messages.',
      });
    });
  });

  describe('createUserMessage', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-15T12:00:00.000Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should create message with all required fields', () => {
      const user = { username: 'testuser', roomId: 'room1' };
      const message = createUserMessage('socket123', user, 'Hello', 'Test User');

      expect(message).toMatchObject({
        type: 'user',
        username: 'testuser',
        displayName: 'Test User',
        text: 'Hello',
        socketId: 'socket123',
        roomId: 'room1',
      });
      expect(message.id).toContain('socket123');
      expect(message.timestamp).toBe('2024-01-15T12:00:00.000Z');
    });

    it('should include optimisticId when provided', () => {
      const user = { username: 'testuser', roomId: 'room1' };
      const optimisticId = 'pending_123456_abc';

      const message = createUserMessage('socket123', user, 'Hello', 'Test User', optimisticId);

      expect(message.optimisticId).toBe('pending_123456_abc');
    });

    it('should NOT include optimisticId when not provided', () => {
      const user = { username: 'testuser', roomId: 'room1' };

      const message = createUserMessage('socket123', user, 'Hello', 'Test User');

      expect(message).not.toHaveProperty('optimisticId');
    });

    it('should NOT include optimisticId when null is passed', () => {
      const user = { username: 'testuser', roomId: 'room1' };

      const message = createUserMessage('socket123', user, 'Hello', 'Test User', null);

      expect(message).not.toHaveProperty('optimisticId');
    });

    it('should generate unique IDs for different messages', () => {
      const user = { username: 'testuser', roomId: 'room1' };

      const message1 = createUserMessage('socket1', user, 'Hello', 'Test User');

      // Advance time by 1ms to get different timestamp
      jest.advanceTimersByTime(1);

      const message2 = createUserMessage('socket2', user, 'World', 'Test User');

      expect(message1.id).not.toBe(message2.id);
    });
  });

  describe('createEditedMessage', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-15T12:00:00.000Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should create edited message with correct fields', () => {
      const originalMessage = {
        id: 'msg123',
        type: 'user',
        username: 'testuser',
        text: 'Original text',
        timestamp: '2024-01-15T11:00:00.000Z',
      };

      const result = createEditedMessage(originalMessage, 'Updated text', 'room1');

      expect(result).toEqual({
        id: 'msg123',
        type: 'user',
        username: 'testuser',
        text: 'Updated text',
        timestamp: '2024-01-15T11:00:00.000Z',
        edited: true,
        editedAt: '2024-01-15T12:00:00.000Z',
        roomId: 'room1',
      });
    });

    it('should preserve original message ID', () => {
      const originalMessage = {
        id: 'unique-message-id',
        type: 'user',
        username: 'testuser',
        timestamp: '2024-01-15T11:00:00.000Z',
      };

      const result = createEditedMessage(originalMessage, 'New text', 'room1');

      expect(result.id).toBe('unique-message-id');
    });
  });

  describe('parseReactions', () => {
    it('should parse valid JSON reactions', () => {
      const json = '{"👍": ["user1", "user2"], "❤️": ["user3"]}';
      const result = parseReactions(json);

      expect(result).toEqual({
        '👍': ['user1', 'user2'],
        '❤️': ['user3'],
      });
    });

    it('should return empty object for null', () => {
      const result = parseReactions(null);
      expect(result).toEqual({});
    });

    it('should return empty object for undefined', () => {
      const result = parseReactions(undefined);
      expect(result).toEqual({});
    });

    it('should return empty object for empty string', () => {
      const result = parseReactions('');
      expect(result).toEqual({});
    });

    it('should return empty object for invalid JSON', () => {
      const result = parseReactions('not valid json');
      expect(result).toEqual({});
    });

    it('should return empty object for malformed JSON', () => {
      const result = parseReactions('{broken');
      expect(result).toEqual({});
    });
  });

  describe('toggleReaction', () => {
    it('should add reaction when user has not reacted', () => {
      const reactions = { '👍': ['user1'] };
      const result = toggleReaction(reactions, '👍', 'user2');

      expect(result).toEqual({
        '👍': ['user1', 'user2'],
      });
    });

    it('should create emoji array when first reaction', () => {
      const reactions = {};
      const result = toggleReaction(reactions, '❤️', 'user1');

      expect(result).toEqual({
        '❤️': ['user1'],
      });
    });

    it('should remove reaction when user already reacted', () => {
      const reactions = { '👍': ['user1', 'user2'] };
      const result = toggleReaction(reactions, '👍', 'user1');

      expect(result).toEqual({
        '👍': ['user2'],
      });
    });

    it('should remove emoji key when last user removes reaction', () => {
      const reactions = { '👍': ['user1'] };
      const result = toggleReaction(reactions, '👍', 'user1');

      expect(result).toEqual({});
      expect(result).not.toHaveProperty('👍');
    });

    it('should not mutate original reactions object', () => {
      const reactions = { '👍': ['user1'] };
      const original = JSON.parse(JSON.stringify(reactions));

      toggleReaction(reactions, '👍', 'user2');

      expect(reactions).toEqual(original);
    });

    it('should handle multiple emojis independently', () => {
      const reactions = {
        '👍': ['user1'],
        '❤️': ['user2'],
      };
      const result = toggleReaction(reactions, '👍', 'user2');

      expect(result).toEqual({
        '👍': ['user1', 'user2'],
        '❤️': ['user2'],
      });
    });
  });
});
