/**
 * validators.js Unit Tests
 *
 * Tests pure validation functions with no React/DOM dependencies.
 * These are business rules for form validation.
 */

import { describe, it, expect } from 'vitest';
import {
  isValidEmail,
  isValidPassword,
  isValidUsername,
  validateLoginCredentials,
  validateSignupCredentials,
  validateRegistrationWithInvite,
  getFirstError,
  VALIDATION_RULES,
} from './validators.js';

describe('isValidEmail', () => {
  describe('valid emails', () => {
    it('should accept standard email format', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
    });

    it('should accept email with subdomain', () => {
      expect(isValidEmail('user@mail.example.com')).toBe(true);
    });

    it('should accept email with plus sign', () => {
      expect(isValidEmail('user+tag@example.com')).toBe(true);
    });

    it('should accept email with dots in local part', () => {
      expect(isValidEmail('first.last@example.com')).toBe(true);
    });

    it('should accept email with numbers', () => {
      expect(isValidEmail('user123@example456.com')).toBe(true);
    });

    it('should trim whitespace and validate', () => {
      expect(isValidEmail('  user@example.com  ')).toBe(true);
    });
  });

  describe('invalid emails', () => {
    it('should reject empty string', () => {
      expect(isValidEmail('')).toBe(false);
    });

    it('should reject null', () => {
      expect(isValidEmail(null)).toBe(false);
    });

    it('should reject undefined', () => {
      expect(isValidEmail(undefined)).toBe(false);
    });

    it('should reject non-string values', () => {
      expect(isValidEmail(123)).toBe(false);
      expect(isValidEmail({})).toBe(false);
      expect(isValidEmail([])).toBe(false);
    });

    it('should reject email without @', () => {
      expect(isValidEmail('userexample.com')).toBe(false);
    });

    it('should reject email without domain', () => {
      expect(isValidEmail('user@')).toBe(false);
    });

    it('should reject email without local part', () => {
      expect(isValidEmail('@example.com')).toBe(false);
    });

    it('should reject email with spaces', () => {
      expect(isValidEmail('user @example.com')).toBe(false);
    });

    it('should reject email without TLD', () => {
      expect(isValidEmail('user@example')).toBe(false);
    });

    it('should reject double @', () => {
      expect(isValidEmail('user@@example.com')).toBe(false);
    });
  });
});

describe('isValidPassword', () => {
  const minLength = VALIDATION_RULES.MIN_PASSWORD_LENGTH; // 10

  describe('valid passwords', () => {
    it('should accept password at minimum length', () => {
      expect(isValidPassword('a'.repeat(minLength))).toBe(true);
    });

    it('should accept password above minimum length', () => {
      expect(isValidPassword('a'.repeat(minLength + 5))).toBe(true);
    });

    it('should accept password with special characters', () => {
      expect(isValidPassword('P@ssw0rd!!')).toBe(true);
    });

    it('should accept password with spaces (counted in length)', () => {
      expect(isValidPassword('pass word!!')).toBe(true);
    });
  });

  describe('invalid passwords', () => {
    it('should reject password below minimum length', () => {
      expect(isValidPassword('a'.repeat(minLength - 1))).toBe(false);
    });

    it('should reject empty string', () => {
      expect(isValidPassword('')).toBe(false);
    });

    it('should reject null', () => {
      expect(isValidPassword(null)).toBe(false);
    });

    it('should reject undefined', () => {
      expect(isValidPassword(undefined)).toBe(false);
    });

    it('should reject non-string values', () => {
      expect(isValidPassword(12345678901)).toBe(false);
      expect(isValidPassword({})).toBe(false);
    });

    it('should reject whitespace-only password after trim', () => {
      expect(isValidPassword('         ')).toBe(false);
    });
  });
});

describe('isValidUsername', () => {
  describe('valid usernames', () => {
    it('should accept single character', () => {
      expect(isValidUsername('A')).toBe(true);
    });

    it('should accept typical name', () => {
      expect(isValidUsername('John Doe')).toBe(true);
    });

    it('should accept name with special characters', () => {
      expect(isValidUsername("Mary O'Brien")).toBe(true);
    });

    it('should trim and validate', () => {
      expect(isValidUsername('  John  ')).toBe(true);
    });
  });

  describe('invalid usernames', () => {
    it('should reject empty string', () => {
      expect(isValidUsername('')).toBe(false);
    });

    it('should reject whitespace only', () => {
      expect(isValidUsername('   ')).toBe(false);
    });

    it('should reject null', () => {
      expect(isValidUsername(null)).toBe(false);
    });

    it('should reject undefined', () => {
      expect(isValidUsername(undefined)).toBe(false);
    });

    it('should reject non-string values', () => {
      expect(isValidUsername(123)).toBe(false);
      expect(isValidUsername({})).toBe(false);
    });
  });
});

describe('validateLoginCredentials', () => {
  describe('valid credentials', () => {
    it('should return valid for correct email and password', () => {
      const result = validateLoginCredentials('user@example.com', 'password1234');

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
      expect(result.cleanEmail).toBe('user@example.com');
      expect(result.cleanPassword).toBe('password1234');
    });

    it('should normalize email to lowercase', () => {
      const result = validateLoginCredentials('USER@EXAMPLE.COM', 'password1234');

      expect(result.valid).toBe(true);
      expect(result.cleanEmail).toBe('user@example.com');
    });

    it('should trim whitespace from credentials', () => {
      const result = validateLoginCredentials('  user@example.com  ', '  password1234  ');

      expect(result.valid).toBe(true);
      expect(result.cleanEmail).toBe('user@example.com');
      expect(result.cleanPassword).toBe('password1234');
    });
  });

  describe('invalid email', () => {
    it('should return error for invalid email format', () => {
      const result = validateLoginCredentials('notanemail', 'password1234');

      expect(result.valid).toBe(false);
      expect(result.errors.email).toBeDefined();
      expect(result.errors.password).toBeUndefined();
    });

    it('should return error for empty email', () => {
      const result = validateLoginCredentials('', 'password1234');

      expect(result.valid).toBe(false);
      expect(result.errors.email).toBeDefined();
    });
  });

  describe('invalid password', () => {
    it('should return error for short password', () => {
      const result = validateLoginCredentials('user@example.com', 'short');

      expect(result.valid).toBe(false);
      expect(result.errors.password).toBeDefined();
      expect(result.errors.password).toContain('10');
      expect(result.errors.email).toBeUndefined();
    });

    it('should return error for empty password', () => {
      const result = validateLoginCredentials('user@example.com', '');

      expect(result.valid).toBe(false);
      expect(result.errors.password).toBeDefined();
    });
  });

  describe('multiple errors', () => {
    it('should return errors for both invalid email and password', () => {
      const result = validateLoginCredentials('notanemail', 'short');

      expect(result.valid).toBe(false);
      expect(result.errors.email).toBeDefined();
      expect(result.errors.password).toBeDefined();
    });

    it('should handle null values gracefully', () => {
      const result = validateLoginCredentials(null, null);

      expect(result.valid).toBe(false);
      expect(result.errors.email).toBeDefined();
      expect(result.errors.password).toBeDefined();
    });
  });
});

describe('validateSignupCredentials', () => {
  describe('valid signup', () => {
    it('should return valid for correct credentials', () => {
      const result = validateSignupCredentials('user@example.com', 'password1234', 'John');

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
      expect(result.cleanData.email).toBe('user@example.com');
      expect(result.cleanData.password).toBe('password1234');
      expect(result.cleanData.username).toBe('John');
    });

    it('should allow empty username (optional)', () => {
      const result = validateSignupCredentials('user@example.com', 'password1234');

      expect(result.valid).toBe(true);
      expect(result.cleanData.username).toBe('');
    });
  });

  describe('invalid signup', () => {
    it('should return error for missing email', () => {
      const result = validateSignupCredentials('', 'password1234', 'John');

      expect(result.valid).toBe(false);
      expect(result.errors.email).toContain('required');
    });

    it('should return error for invalid email format', () => {
      const result = validateSignupCredentials('notanemail', 'password1234', 'John');

      expect(result.valid).toBe(false);
      expect(result.errors.email).toContain('valid email');
    });

    it('should return error for short password', () => {
      const result = validateSignupCredentials('user@example.com', 'short', 'John');

      expect(result.valid).toBe(false);
      expect(result.errors.password).toBeDefined();
    });
  });
});

describe('validateRegistrationWithInvite', () => {
  const validData = {
    email: 'user@example.com',
    password: 'password1234',
    username: 'John Doe',
    coParentEmail: 'coparent@example.com',
  };

  describe('valid registration', () => {
    it('should return valid for complete registration data', () => {
      const result = validateRegistrationWithInvite(validData);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
      expect(result.cleanData.email).toBe('user@example.com');
      expect(result.cleanData.coParentEmail).toBe('coparent@example.com');
    });

    it('should normalize emails to lowercase', () => {
      const result = validateRegistrationWithInvite({
        ...validData,
        email: 'USER@EXAMPLE.COM',
        coParentEmail: 'COPARENT@EXAMPLE.COM',
      });

      expect(result.valid).toBe(true);
      expect(result.cleanData.email).toBe('user@example.com');
      expect(result.cleanData.coParentEmail).toBe('coparent@example.com');
    });
  });

  describe('missing required fields', () => {
    it('should return error for missing username', () => {
      const result = validateRegistrationWithInvite({
        ...validData,
        username: '',
      });

      expect(result.valid).toBe(false);
      expect(result.errors.username).toContain('required');
    });

    it('should return error for missing email', () => {
      const result = validateRegistrationWithInvite({
        ...validData,
        email: '',
      });

      expect(result.valid).toBe(false);
      expect(result.errors.email).toContain('required');
    });

    it('should return error for missing co-parent email', () => {
      const result = validateRegistrationWithInvite({
        ...validData,
        coParentEmail: '',
      });

      expect(result.valid).toBe(false);
      expect(result.errors.coParentEmail).toContain('required');
    });
  });

  describe('invalid formats', () => {
    it('should return error for invalid user email', () => {
      const result = validateRegistrationWithInvite({
        ...validData,
        email: 'notanemail',
      });

      expect(result.valid).toBe(false);
      expect(result.errors.email).toContain('valid email');
    });

    it('should return error for invalid co-parent email', () => {
      const result = validateRegistrationWithInvite({
        ...validData,
        coParentEmail: 'notanemail',
      });

      expect(result.valid).toBe(false);
      expect(result.errors.coParentEmail).toContain('valid email');
    });

    it('should return error for short password', () => {
      const result = validateRegistrationWithInvite({
        ...validData,
        password: 'short',
      });

      expect(result.valid).toBe(false);
      expect(result.errors.password).toBeDefined();
    });
  });

  describe('self-invite prevention', () => {
    it('should return error when inviting yourself', () => {
      const result = validateRegistrationWithInvite({
        ...validData,
        email: 'user@example.com',
        coParentEmail: 'user@example.com',
      });

      expect(result.valid).toBe(false);
      expect(result.errors.coParentEmail).toContain('cannot invite yourself');
    });

    it('should detect self-invite regardless of case', () => {
      const result = validateRegistrationWithInvite({
        ...validData,
        email: 'USER@example.com',
        coParentEmail: 'user@EXAMPLE.com',
      });

      expect(result.valid).toBe(false);
      expect(result.errors.coParentEmail).toContain('cannot invite yourself');
    });
  });

  describe('multiple errors', () => {
    it('should return all errors when multiple fields are invalid', () => {
      const result = validateRegistrationWithInvite({
        email: '',
        password: 'short',
        username: '',
        coParentEmail: 'notanemail',
      });

      expect(result.valid).toBe(false);
      expect(result.errors.email).toBeDefined();
      expect(result.errors.password).toBeDefined();
      expect(result.errors.username).toBeDefined();
      expect(result.errors.coParentEmail).toBeDefined();
    });
  });
});

describe('getFirstError', () => {
  it('should return first error from errors object', () => {
    const errors = { email: 'Invalid email', password: 'Too short' };
    expect(getFirstError(errors)).toBe('Invalid email');
  });

  it('should return null for empty errors object', () => {
    expect(getFirstError({})).toBe(null);
  });

  it('should return null for null input', () => {
    expect(getFirstError(null)).toBe(null);
  });

  it('should return null for undefined input', () => {
    expect(getFirstError(undefined)).toBe(null);
  });

  it('should return null for non-object input', () => {
    expect(getFirstError('string')).toBe(null);
    expect(getFirstError(123)).toBe(null);
  });
});

describe('VALIDATION_RULES', () => {
  it('should export MIN_PASSWORD_LENGTH as 10', () => {
    expect(VALIDATION_RULES.MIN_PASSWORD_LENGTH).toBe(10);
  });

  it('should export EMAIL_REGEX', () => {
    expect(VALIDATION_RULES.EMAIL_REGEX).toBeInstanceOf(RegExp);
    expect(VALIDATION_RULES.EMAIL_REGEX.test('test@example.com')).toBe(true);
  });
});
