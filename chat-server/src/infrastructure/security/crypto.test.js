/**
 * Unit Tests: Crypto Utility
 *
 * @module src/utils/__tests__/crypto.test
 */

const {
  generateToken,
  generateShortCode,
  generateId,
  generateSimpleId,
  generateRoomId,
  generateInviteId,
  generateMessageId,
  generateThreadId,
  generateSessionToken,
  hashString,
  secureCompare,
} = require('../crypto');

describe('Crypto Utility', () => {
  describe('generateToken', () => {
    it('should generate 64-character hex token by default', () => {
      const token = generateToken();
      expect(token).toHaveLength(64);
      expect(/^[0-9a-f]+$/.test(token)).toBe(true);
    });

    it('should generate token with custom length', () => {
      const token = generateToken(16);
      expect(token).toHaveLength(32); // 16 bytes = 32 hex chars
    });

    it('should generate token with custom encoding', () => {
      const token = generateToken(32, 'base64url');
      expect(token).toHaveLength(43); // 32 bytes base64url
      expect(/^[A-Za-z0-9_-]+$/.test(token)).toBe(true);
    });

    it('should generate unique tokens', () => {
      const tokens = new Set();
      for (let i = 0; i < 100; i++) {
        tokens.add(generateToken());
      }
      expect(tokens.size).toBe(100);
    });
  });

  describe('generateShortCode', () => {
    it('should generate 6-character code by default', () => {
      const code = generateShortCode();
      expect(code).toHaveLength(6);
    });

    it('should generate code with custom length', () => {
      const code = generateShortCode(8);
      expect(code).toHaveLength(8);
    });

    it('should only use uppercase letters and digits (no confusing chars)', () => {
      // Run many times to ensure no confusing chars appear
      for (let i = 0; i < 100; i++) {
        const code = generateShortCode();
        expect(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]+$/.test(code)).toBe(true);
        // Ensure no confusing chars
        expect(code).not.toMatch(/[0O1IL]/);
      }
    });

    it('should generate unique codes', () => {
      const codes = new Set();
      for (let i = 0; i < 100; i++) {
        codes.add(generateShortCode());
      }
      expect(codes.size).toBe(100);
    });
  });

  describe('generateId', () => {
    it('should generate ID with default prefix', () => {
      const id = generateId();
      expect(id).toMatch(/^id_\d+_[0-9a-f]+$/);
    });

    it('should generate ID with custom prefix', () => {
      const id = generateId('room');
      expect(id).toMatch(/^room_\d+_[0-9a-f]+$/);
    });

    it('should include timestamp', () => {
      const before = Date.now();
      const id = generateId();
      const after = Date.now();

      const parts = id.split('_');
      const timestamp = parseInt(parts[1], 10);
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });

    it('should generate unique IDs', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(generateId());
      }
      expect(ids.size).toBe(100);
    });
  });

  describe('generateSimpleId', () => {
    it('should generate random string without prefix', () => {
      const id = generateSimpleId();
      expect(id).toHaveLength(10);
      expect(/^[a-z0-9]+$/.test(id)).toBe(true);
    });

    it('should generate ID with prefix', () => {
      const id = generateSimpleId('item');
      expect(id).toMatch(/^item_[a-z0-9]+$/);
    });
  });

  describe('generateRoomId', () => {
    it('should generate room ID with correct format', () => {
      const id = generateRoomId();
      expect(id).toMatch(/^room_\d+_[0-9a-f]+$/);
    });
  });

  describe('generateInviteId', () => {
    it('should generate invite ID with correct format', () => {
      const id = generateInviteId();
      expect(id).toMatch(/^invite_\d+_[0-9a-f]+$/);
    });
  });

  describe('generateMessageId', () => {
    it('should generate message ID with correct format', () => {
      const id = generateMessageId();
      expect(id).toMatch(/^msg_\d+_[0-9a-f]+$/);
    });
  });

  describe('generateThreadId', () => {
    it('should generate thread ID with correct format', () => {
      const id = generateThreadId();
      expect(id).toMatch(/^thread_\d+_[0-9a-f]+$/);
    });
  });

  describe('generateSessionToken', () => {
    it('should generate 64-character hex session token', () => {
      const token = generateSessionToken();
      expect(token).toHaveLength(64);
      expect(/^[0-9a-f]+$/.test(token)).toBe(true);
    });
  });

  describe('hashString', () => {
    it('should generate consistent SHA-256 hash', () => {
      const hash1 = hashString('hello');
      const hash2 = hashString('hello');
      expect(hash1).toBe(hash2);
    });

    it('should generate 64-character hex hash', () => {
      const hash = hashString('test');
      expect(hash).toHaveLength(64);
      expect(/^[0-9a-f]+$/.test(hash)).toBe(true);
    });

    it('should generate different hashes for different inputs', () => {
      const hash1 = hashString('hello');
      const hash2 = hashString('world');
      expect(hash1).not.toBe(hash2);
    });

    it('should match known SHA-256 value', () => {
      // SHA-256 of "hello" is known
      const hash = hashString('hello');
      expect(hash).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
    });
  });

  describe('secureCompare', () => {
    it('should return true for equal strings', () => {
      expect(secureCompare('hello', 'hello')).toBe(true);
      expect(secureCompare('', '')).toBe(true);
    });

    it('should return false for different strings', () => {
      expect(secureCompare('hello', 'world')).toBe(false);
      expect(secureCompare('hello', 'Hello')).toBe(false);
    });

    it('should return false for strings of different lengths', () => {
      expect(secureCompare('hello', 'hell')).toBe(false);
      expect(secureCompare('hi', 'hello')).toBe(false);
    });

    it('should return false for non-strings', () => {
      expect(secureCompare(null, 'hello')).toBe(false);
      expect(secureCompare('hello', null)).toBe(false);
      expect(secureCompare(123, '123')).toBe(false);
    });
  });
});
