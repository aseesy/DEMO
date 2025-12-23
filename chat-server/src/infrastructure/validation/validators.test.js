/**
 * Unit Tests: Validators Utility
 *
 * @module src/utils/__tests__/validators.test
 */

const {
  isValidEmail,
  isValidPhone,
  isNonEmpty,
  isValidUrl,
  isValidUsername,
  sanitizeString,
  EMAIL_REGEX,
} = require('../validators');

describe('Validators Utility', () => {
  describe('isValidEmail', () => {
    describe('valid emails', () => {
      const validEmails = [
        'user@example.com',
        'user.name@example.com',
        'user+tag@example.com',
        'user@subdomain.example.com',
        'user123@example.co.uk',
        'USER@EXAMPLE.COM',
        '  user@example.com  ', // with whitespace (should trim)
      ];

      validEmails.forEach(email => {
        it(`should accept: "${email}"`, () => {
          expect(isValidEmail(email)).toBe(true);
        });
      });
    });

    describe('invalid emails', () => {
      const invalidEmails = [
        'invalid',
        'invalid@',
        '@example.com',
        'invalid@.com',
        'invalid@example',
        'invalid email@example.com',
        '',
        null,
        undefined,
        123,
        {},
      ];

      invalidEmails.forEach(email => {
        it(`should reject: ${JSON.stringify(email)}`, () => {
          expect(isValidEmail(email)).toBe(false);
        });
      });
    });
  });

  describe('isValidPhone', () => {
    describe('valid phone numbers', () => {
      const validPhones = [
        '5551234567',
        '555-123-4567',
        '(555) 123-4567',
        '+15551234567',
        '+1 555 123 4567',
        '18003569377', // 1-800-FLOWERS as digits
      ];

      validPhones.forEach(phone => {
        it(`should accept: "${phone}"`, () => {
          expect(isValidPhone(phone)).toBe(true);
        });
      });
    });

    describe('invalid phone numbers', () => {
      const invalidPhones = [
        '123', // too short
        '12345678901234567', // too long (16 digits)
        '',
        null,
        undefined,
        'abc',
      ];

      invalidPhones.forEach(phone => {
        it(`should reject: ${JSON.stringify(phone)}`, () => {
          expect(isValidPhone(phone)).toBe(false);
        });
      });
    });
  });

  describe('isNonEmpty', () => {
    it('should return true for strings with content', () => {
      expect(isNonEmpty('hello')).toBe(true);
      expect(isNonEmpty('  hello  ')).toBe(true);
      expect(isNonEmpty('a')).toBe(true);
    });

    it('should return false for empty or whitespace-only strings', () => {
      expect(isNonEmpty('')).toBe(false);
      expect(isNonEmpty('   ')).toBe(false);
      expect(isNonEmpty('\t\n')).toBe(false);
    });

    it('should return false for non-strings', () => {
      expect(isNonEmpty(null)).toBe(false);
      expect(isNonEmpty(undefined)).toBe(false);
      expect(isNonEmpty(123)).toBe(false);
      expect(isNonEmpty({})).toBe(false);
    });
  });

  describe('isValidUrl', () => {
    describe('valid URLs', () => {
      const validUrls = [
        'https://example.com',
        'http://example.com',
        'http://localhost:3000',
        'https://subdomain.example.com/path?query=1',
        'ftp://files.example.com',
      ];

      validUrls.forEach(url => {
        it(`should accept: "${url}"`, () => {
          expect(isValidUrl(url)).toBe(true);
        });
      });
    });

    describe('invalid URLs', () => {
      const invalidUrls = [
        'not-a-url',
        'example.com', // missing protocol
        '',
        null,
        undefined,
      ];

      invalidUrls.forEach(url => {
        it(`should reject: ${JSON.stringify(url)}`, () => {
          expect(isValidUrl(url)).toBe(false);
        });
      });
    });
  });

  describe('isValidUsername', () => {
    describe('valid usernames', () => {
      const validUsernames = [
        'john',
        'john_doe',
        'john-doe',
        'JohnDoe123',
        'abc', // minimum 3 chars
        'a'.repeat(30), // maximum 30 chars
      ];

      validUsernames.forEach(username => {
        it(`should accept: "${username}"`, () => {
          expect(isValidUsername(username)).toBe(true);
        });
      });
    });

    describe('invalid usernames', () => {
      const invalidUsernames = [
        'ab', // too short
        'a'.repeat(31), // too long
        'john doe', // spaces not allowed
        'john@doe', // @ not allowed
        'john.doe', // . not allowed
        '',
        null,
        undefined,
      ];

      invalidUsernames.forEach(username => {
        it(`should reject: ${JSON.stringify(username)}`, () => {
          expect(isValidUsername(username)).toBe(false);
        });
      });
    });
  });

  describe('sanitizeString', () => {
    it('should remove HTML-dangerous characters', () => {
      expect(sanitizeString('<script>alert("xss")</script>')).toBe('scriptalert(xss)/script');
      expect(sanitizeString('Hello <b>World</b>')).toBe('Hello bWorld/b');
    });

    it('should trim whitespace', () => {
      expect(sanitizeString('  hello  ')).toBe('hello');
    });

    it('should respect maxLength', () => {
      expect(sanitizeString('hello world', 5)).toBe('hello');
      expect(sanitizeString('short', 100)).toBe('short');
    });

    it('should handle empty/null input', () => {
      expect(sanitizeString('')).toBe('');
      expect(sanitizeString(null)).toBe('');
      expect(sanitizeString(undefined)).toBe('');
    });

    it('should use default maxLength of 255', () => {
      const longString = 'a'.repeat(300);
      expect(sanitizeString(longString).length).toBe(255);
    });
  });

  describe('EMAIL_REGEX', () => {
    it('should be exported for direct use', () => {
      expect(EMAIL_REGEX).toBeInstanceOf(RegExp);
      expect(EMAIL_REGEX.test('user@example.com')).toBe(true);
    });
  });
});
