/**
 * Unit Tests: MessageId Value Object
 * 
 * @module domain/valueObjects/__tests__/MessageId.test
 */

const MessageId = require('../MessageId');

describe('MessageId', () => {
  describe('constructor', () => {
    it('should create valid message ID', () => {
      const messageId = new MessageId('msg-xyz789');
      expect(messageId.value).toBe('msg-xyz789');
    });

    it('should trim whitespace', () => {
      const messageId = new MessageId('  msg-xyz789  ');
      expect(messageId.value).toBe('msg-xyz789');
    });

    it('should accept single character', () => {
      const messageId = new MessageId('a');
      expect(messageId.value).toBe('a');
    });

    it('should accept long message ID', () => {
      const longId = 'msg-' + 'a'.repeat(100);
      const messageId = new MessageId(longId);
      expect(messageId.value).toBe(longId);
    });

    it('should accept UUID format', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const messageId = new MessageId(uuid);
      expect(messageId.value).toBe(uuid);
    });

    it('should accept timestamp-based ID', () => {
      const timestampId = 'msg-1234567890-abc';
      const messageId = new MessageId(timestampId);
      expect(messageId.value).toBe(timestampId);
    });

    it('should throw on empty string', () => {
      expect(() => new MessageId('')).toThrow('Invalid MessageId');
    });

    it('should throw on whitespace only', () => {
      expect(() => new MessageId('   ')).toThrow('Invalid MessageId');
    });

    it('should throw on null', () => {
      expect(() => new MessageId(null)).toThrow('Invalid MessageId');
    });

    it('should throw on undefined', () => {
      expect(() => new MessageId(undefined)).toThrow('Invalid MessageId');
    });

    it('should throw on non-string', () => {
      expect(() => new MessageId(123)).toThrow('Invalid MessageId');
    });

    it('should throw on empty object', () => {
      expect(() => new MessageId({})).toThrow('Invalid MessageId');
    });

    it('should throw on array', () => {
      expect(() => new MessageId([])).toThrow('Invalid MessageId');
    });
  });

  describe('isValid', () => {
    it('should return true for valid message ID', () => {
      expect(MessageId.isValid('msg-xyz789')).toBe(true);
    });

    it('should return true for single character', () => {
      expect(MessageId.isValid('a')).toBe(true);
    });

    it('should return true for long message ID', () => {
      expect(MessageId.isValid('msg-' + 'a'.repeat(100))).toBe(true);
    });

    it('should return true for UUID format', () => {
      expect(MessageId.isValid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });

    it('should return false for empty string', () => {
      expect(MessageId.isValid('')).toBe(false);
    });

    it('should return false for whitespace only', () => {
      expect(MessageId.isValid('   ')).toBe(false);
    });

    it('should return false for null', () => {
      expect(MessageId.isValid(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(MessageId.isValid(undefined)).toBe(false);
    });

    it('should return false for non-string', () => {
      expect(MessageId.isValid(123)).toBe(false);
    });

    it('should handle whitespace', () => {
      expect(MessageId.isValid('  msg-xyz789  ')).toBe(true);
    });
  });

  describe('equals', () => {
    it('should return true for equal message IDs', () => {
      const messageId1 = new MessageId('msg-xyz789');
      const messageId2 = new MessageId('msg-xyz789');
      expect(messageId1.equals(messageId2)).toBe(true);
    });

    it('should return false for different message IDs', () => {
      const messageId1 = new MessageId('msg-xyz789');
      const messageId2 = new MessageId('msg-abc123');
      expect(messageId1.equals(messageId2)).toBe(false);
    });

    it('should return false for non-MessageId object', () => {
      const messageId = new MessageId('msg-xyz789');
      expect(messageId.equals('msg-xyz789')).toBe(false);
    });

    it('should return false for null', () => {
      const messageId = new MessageId('msg-xyz789');
      expect(messageId.equals(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      const messageId = new MessageId('msg-xyz789');
      expect(messageId.equals(undefined)).toBe(false);
    });

    it('should handle whitespace in comparison', () => {
      const messageId1 = new MessageId('msg-xyz789');
      const messageId2 = new MessageId('  msg-xyz789  ');
      expect(messageId1.equals(messageId2)).toBe(true);
    });
  });

  describe('toString', () => {
    it('should return message ID string', () => {
      const messageId = new MessageId('msg-xyz789');
      expect(messageId.toString()).toBe('msg-xyz789');
    });
  });

  describe('toJSON', () => {
    it('should return message ID string for JSON serialization', () => {
      const messageId = new MessageId('msg-xyz789');
      expect(messageId.toJSON()).toBe('msg-xyz789');
    });

    it('should serialize correctly in JSON.stringify', () => {
      const messageId = new MessageId('msg-xyz789');
      const json = JSON.stringify({ messageId });
      expect(json).toBe('{"messageId":"msg-xyz789"}');
    });
  });

  describe('immutability', () => {
    it('should be frozen (immutable)', () => {
      const messageId = new MessageId('msg-xyz789');
      expect(Object.isFrozen(messageId)).toBe(true);
    });

    it('should not allow value modification', () => {
      const messageId = new MessageId('msg-xyz789');
      const originalValue = messageId.value;
      
      // Try to modify (will fail silently in non-strict mode, throw in strict mode)
      try {
        messageId.value = 'hacked-message-id';
      } catch (e) {
        // In strict mode, this will throw - that's fine
      }
      
      // Verify value didn't change
      expect(messageId.value).toBe(originalValue);
      expect(messageId.value).toBe('msg-xyz789');
    });
  });
});

