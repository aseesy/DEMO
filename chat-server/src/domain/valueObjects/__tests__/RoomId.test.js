/**
 * Unit Tests: RoomId Value Object
 *
 * @module domain/valueObjects/__tests__/RoomId.test
 */

const RoomId = require('../RoomId');

describe('RoomId', () => {
  describe('constructor', () => {
    it('should create valid room ID', () => {
      const roomId = new RoomId('room-abc123');
      expect(roomId.value).toBe('room-abc123');
    });

    it('should trim whitespace', () => {
      const roomId = new RoomId('  room-abc123  ');
      expect(roomId.value).toBe('room-abc123');
    });

    it('should accept single character', () => {
      const roomId = new RoomId('a');
      expect(roomId.value).toBe('a');
    });

    it('should accept long room ID', () => {
      const longId = 'room-' + 'a'.repeat(100);
      const roomId = new RoomId(longId);
      expect(roomId.value).toBe(longId);
    });

    it('should throw on empty string', () => {
      expect(() => new RoomId('')).toThrow('Invalid RoomId');
    });

    it('should throw on whitespace only', () => {
      expect(() => new RoomId('   ')).toThrow('Invalid RoomId');
    });

    it('should throw on null', () => {
      expect(() => new RoomId(null)).toThrow('Invalid RoomId');
    });

    it('should throw on undefined', () => {
      expect(() => new RoomId(undefined)).toThrow('Invalid RoomId');
    });

    it('should throw on non-string', () => {
      expect(() => new RoomId(123)).toThrow('Invalid RoomId');
    });

    it('should throw on empty object', () => {
      expect(() => new RoomId({})).toThrow('Invalid RoomId');
    });

    it('should throw on array', () => {
      expect(() => new RoomId([])).toThrow('Invalid RoomId');
    });
  });

  describe('isValid', () => {
    it('should return true for valid room ID', () => {
      expect(RoomId.isValid('room-abc123')).toBe(true);
    });

    it('should return true for single character', () => {
      expect(RoomId.isValid('a')).toBe(true);
    });

    it('should return true for long room ID', () => {
      expect(RoomId.isValid('room-' + 'a'.repeat(100))).toBe(true);
    });

    it('should return false for empty string', () => {
      expect(RoomId.isValid('')).toBe(false);
    });

    it('should return false for whitespace only', () => {
      expect(RoomId.isValid('   ')).toBe(false);
    });

    it('should return false for null', () => {
      expect(RoomId.isValid(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(RoomId.isValid(undefined)).toBe(false);
    });

    it('should return false for non-string', () => {
      expect(RoomId.isValid(123)).toBe(false);
    });

    it('should handle whitespace', () => {
      expect(RoomId.isValid('  room-abc123  ')).toBe(true);
    });
  });

  describe('equals', () => {
    it('should return true for equal room IDs', () => {
      const roomId1 = new RoomId('room-abc123');
      const roomId2 = new RoomId('room-abc123');
      expect(roomId1.equals(roomId2)).toBe(true);
    });

    it('should return false for different room IDs', () => {
      const roomId1 = new RoomId('room-abc123');
      const roomId2 = new RoomId('room-xyz789');
      expect(roomId1.equals(roomId2)).toBe(false);
    });

    it('should return false for non-RoomId object', () => {
      const roomId = new RoomId('room-abc123');
      expect(roomId.equals('room-abc123')).toBe(false);
    });

    it('should return false for null', () => {
      const roomId = new RoomId('room-abc123');
      expect(roomId.equals(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      const roomId = new RoomId('room-abc123');
      expect(roomId.equals(undefined)).toBe(false);
    });

    it('should handle whitespace in comparison', () => {
      const roomId1 = new RoomId('room-abc123');
      const roomId2 = new RoomId('  room-abc123  ');
      expect(roomId1.equals(roomId2)).toBe(true);
    });
  });

  describe('toString', () => {
    it('should return room ID string', () => {
      const roomId = new RoomId('room-abc123');
      expect(roomId.toString()).toBe('room-abc123');
    });
  });

  describe('toJSON', () => {
    it('should return room ID string for JSON serialization', () => {
      const roomId = new RoomId('room-abc123');
      expect(roomId.toJSON()).toBe('room-abc123');
    });

    it('should serialize correctly in JSON.stringify', () => {
      const roomId = new RoomId('room-abc123');
      const json = JSON.stringify({ roomId });
      expect(json).toBe('{"roomId":"room-abc123"}');
    });
  });

  describe('immutability', () => {
    it('should be frozen (immutable)', () => {
      const roomId = new RoomId('room-abc123');
      expect(Object.isFrozen(roomId)).toBe(true);
    });

    it('should not allow value modification', () => {
      const roomId = new RoomId('room-abc123');
      const originalValue = roomId.value;

      // Try to modify (will fail silently in non-strict mode, throw in strict mode)
      try {
        roomId.value = 'hacked-room-id';
      } catch (e) {
        // In strict mode, this will throw - that's fine
      }

      // Verify value didn't change
      expect(roomId.value).toBe(originalValue);
      expect(roomId.value).toBe('room-abc123');
    });
  });
});
