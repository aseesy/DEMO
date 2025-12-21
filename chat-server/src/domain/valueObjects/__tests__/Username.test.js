/**
 * Unit Tests: Username Value Object
 *
 * @module domain/valueObjects/__tests__/Username.test
 */

const Username = require('../Username');

describe('Username', () => {
  describe('constructor', () => {
    it('should create valid username', () => {
      const username = new Username('alice');
      expect(username.value).toBe('alice');
    });

    it('should normalize username to lowercase', () => {
      const username = new Username('Alice');
      expect(username.value).toBe('alice');
    });

    it('should trim whitespace', () => {
      const username = new Username('  alice  ');
      expect(username.value).toBe('alice');
    });

    it('should accept minimum length (3 characters)', () => {
      const username = new Username('abc');
      expect(username.value).toBe('abc');
    });

    it('should accept maximum length (50 characters)', () => {
      const longUsername = 'a'.repeat(50);
      const username = new Username(longUsername);
      expect(username.value).toBe(longUsername);
    });

    it('should throw on too short username', () => {
      expect(() => new Username('ab')).toThrow('must be at least 3 characters');
    });

    it('should throw on too long username', () => {
      const tooLong = 'a'.repeat(51);
      expect(() => new Username(tooLong)).toThrow('must be less than 50 characters');
    });

    it('should throw on empty string', () => {
      expect(() => new Username('')).toThrow('Invalid username');
    });

    it('should throw on whitespace only', () => {
      expect(() => new Username('   ')).toThrow('Invalid username');
    });

    it('should throw on null', () => {
      expect(() => new Username(null)).toThrow('Invalid username');
    });

    it('should throw on undefined', () => {
      expect(() => new Username(undefined)).toThrow('Invalid username');
    });

    it('should throw on non-string', () => {
      expect(() => new Username(123)).toThrow('Invalid username');
    });
  });

  describe('isValid', () => {
    it('should return true for valid username', () => {
      expect(Username.isValid('alice')).toBe(true);
    });

    it('should return true for minimum length', () => {
      expect(Username.isValid('abc')).toBe(true);
    });

    it('should return true for maximum length', () => {
      expect(Username.isValid('a'.repeat(50))).toBe(true);
    });

    it('should return false for too short', () => {
      expect(Username.isValid('ab')).toBe(false);
    });

    it('should return false for too long', () => {
      expect(Username.isValid('a'.repeat(51))).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(Username.isValid('')).toBe(false);
    });

    it('should return false for null', () => {
      expect(Username.isValid(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(Username.isValid(undefined)).toBe(false);
    });

    it('should return false for non-string', () => {
      expect(Username.isValid(123)).toBe(false);
    });

    it('should handle whitespace', () => {
      expect(Username.isValid('  alice  ')).toBe(true);
    });
  });

  describe('equals', () => {
    it('should return true for equal usernames', () => {
      const username1 = new Username('alice');
      const username2 = new Username('alice');
      expect(username1.equals(username2)).toBe(true);
    });

    it('should return true for equal usernames (case insensitive)', () => {
      const username1 = new Username('Alice');
      const username2 = new Username('alice');
      expect(username1.equals(username2)).toBe(true);
    });

    it('should return false for different usernames', () => {
      const username1 = new Username('alice');
      const username2 = new Username('bob');
      expect(username1.equals(username2)).toBe(false);
    });

    it('should return false for non-Username object', () => {
      const username = new Username('alice');
      expect(username.equals('alice')).toBe(false);
    });

    it('should return false for null', () => {
      const username = new Username('alice');
      expect(username.equals(null)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return username string', () => {
      const username = new Username('alice');
      expect(username.toString()).toBe('alice');
    });
  });

  describe('toJSON', () => {
    it('should return username string for JSON serialization', () => {
      const username = new Username('alice');
      expect(username.toJSON()).toBe('alice');
    });

    it('should serialize correctly in JSON.stringify', () => {
      const username = new Username('alice');
      const json = JSON.stringify({ username });
      expect(json).toBe('{"username":"alice"}');
    });
  });

  describe('immutability', () => {
    it('should be frozen (immutable)', () => {
      const username = new Username('alice');
      expect(Object.isFrozen(username)).toBe(true);
    });

    it('should not allow value modification', () => {
      const username = new Username('alice');
      const originalValue = username.value;

      // Try to modify (will fail silently in non-strict mode, throw in strict mode)
      try {
        username.value = 'hacked';
      } catch (e) {
        // In strict mode, this will throw - that's fine
      }

      // Verify value didn't change
      expect(username.value).toBe(originalValue);
      expect(username.value).toBe('alice');
    });
  });
});
