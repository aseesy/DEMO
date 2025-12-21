/**
 * Unit Tests: Email Value Object
 *
 * @module domain/valueObjects/__tests__/Email.test
 */

const Email = require('../Email');

describe('Email', () => {
  describe('constructor', () => {
    it('should create valid email', () => {
      const email = new Email('test@example.com');
      expect(email.value).toBe('test@example.com');
    });

    it('should normalize email to lowercase', () => {
      const email = new Email('Test@Example.COM');
      expect(email.value).toBe('test@example.com');
    });

    it('should trim whitespace', () => {
      const email = new Email('  test@example.com  ');
      expect(email.value).toBe('test@example.com');
    });

    it('should throw on invalid email format', () => {
      expect(() => new Email('not-an-email')).toThrow('Invalid email: not-an-email');
    });

    it('should throw on empty string', () => {
      expect(() => new Email('')).toThrow('Invalid email');
    });

    it('should throw on whitespace only', () => {
      expect(() => new Email('   ')).toThrow('Invalid email');
    });

    it('should throw on null', () => {
      expect(() => new Email(null)).toThrow('Invalid email');
    });

    it('should throw on undefined', () => {
      expect(() => new Email(undefined)).toThrow('Invalid email');
    });

    it('should throw on non-string', () => {
      expect(() => new Email(123)).toThrow('Invalid email');
    });

    it('should throw on missing @ symbol', () => {
      expect(() => new Email('testexample.com')).toThrow('Invalid email');
    });

    it('should throw on missing domain', () => {
      expect(() => new Email('test@')).toThrow('Invalid email');
    });

    it('should throw on missing local part', () => {
      expect(() => new Email('@example.com')).toThrow('Invalid email');
    });

    it('should throw on missing TLD', () => {
      expect(() => new Email('test@example')).toThrow('Invalid email');
    });
  });

  describe('isValid', () => {
    it('should return true for valid email', () => {
      expect(Email.isValid('test@example.com')).toBe(true);
    });

    it('should return false for invalid email', () => {
      expect(Email.isValid('not-an-email')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(Email.isValid('')).toBe(false);
    });

    it('should return false for null', () => {
      expect(Email.isValid(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(Email.isValid(undefined)).toBe(false);
    });

    it('should return false for non-string', () => {
      expect(Email.isValid(123)).toBe(false);
    });

    it('should handle whitespace', () => {
      expect(Email.isValid('  test@example.com  ')).toBe(true);
    });
  });

  describe('equals', () => {
    it('should return true for equal emails', () => {
      const email1 = new Email('test@example.com');
      const email2 = new Email('test@example.com');
      expect(email1.equals(email2)).toBe(true);
    });

    it('should return true for equal emails (case insensitive)', () => {
      const email1 = new Email('Test@Example.COM');
      const email2 = new Email('test@example.com');
      expect(email1.equals(email2)).toBe(true);
    });

    it('should return false for different emails', () => {
      const email1 = new Email('test1@example.com');
      const email2 = new Email('test2@example.com');
      expect(email1.equals(email2)).toBe(false);
    });

    it('should return false for non-Email object', () => {
      const email = new Email('test@example.com');
      expect(email.equals('test@example.com')).toBe(false);
    });

    it('should return false for null', () => {
      const email = new Email('test@example.com');
      expect(email.equals(null)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return email string', () => {
      const email = new Email('test@example.com');
      expect(email.toString()).toBe('test@example.com');
    });
  });

  describe('toJSON', () => {
    it('should return email string for JSON serialization', () => {
      const email = new Email('test@example.com');
      expect(email.toJSON()).toBe('test@example.com');
    });

    it('should serialize correctly in JSON.stringify', () => {
      const email = new Email('test@example.com');
      const json = JSON.stringify({ email });
      expect(json).toBe('{"email":"test@example.com"}');
    });
  });

  describe('immutability', () => {
    it('should be frozen (immutable)', () => {
      const email = new Email('test@example.com');
      expect(Object.isFrozen(email)).toBe(true);
    });

    it('should not allow value modification', () => {
      const email = new Email('test@example.com');
      const originalValue = email.value;

      // Try to modify (will fail silently in non-strict mode, throw in strict mode)
      try {
        email.value = 'hacked@example.com';
      } catch (e) {
        // In strict mode, this will throw - that's fine
      }

      // Verify value didn't change
      expect(email.value).toBe(originalValue);
      expect(email.value).toBe('test@example.com');
    });
  });
});
