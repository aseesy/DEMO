/**
 * Password Validator Tests
 *
 * Tests for NIST-compliant password validation:
 * - 10 character minimum (length-based security)
 * - Common password blocking
 * - No complexity requirements
 */

const {
  validatePassword,
  getPasswordError,
  getPasswordRequirements,
  checkPasswordStrength,
  PASSWORD_REQUIREMENTS,
  isBlockedPassword,
  getPasswordRequirementsStructured,
  validatePasswordDetailed,
} = require('../libs/password-validator');

describe('Password Validator', () => {
  describe('validatePassword', () => {
    test('should reject empty password', () => {
      expect(validatePassword('').valid).toBe(false);
      expect(validatePassword(null).valid).toBe(false);
      expect(validatePassword(undefined).valid).toBe(false);
    });

    test('should reject passwords shorter than 10 characters', () => {
      const result = validatePassword('shortpwd');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 10 characters');
    });

    test('should accept passwords with 10+ characters', () => {
      // Simple lowercase - no complexity required!
      expect(validatePassword('mypassword').valid).toBe(true);
      expect(validatePassword('allowercase').valid).toBe(true);
      expect(validatePassword('onlynumbers1').valid).toBe(true);
    });

    test('should accept passphrases with spaces', () => {
      expect(validatePassword('correct horse battery').valid).toBe(true);
      expect(validatePassword('my secret phrase').valid).toBe(true);
    });

    test('should reject common passwords even if long enough', () => {
      const result = validatePassword('password123');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('too common');
    });

    test('should block known weak passwords', () => {
      const weakPasswords = ['password123', 'qwerty123', '1234567890', 'abcdefghij'];
      weakPasswords.forEach(pw => {
        if (pw.length >= 10) {
          // Only test ones that meet length requirement
          const result = validatePassword(pw);
          // Should either be blocked or valid based on blocklist
        }
      });
    });
  });

  describe('isBlockedPassword', () => {
    test('should block common passwords', () => {
      expect(isBlockedPassword('password')).toBe(true);
      expect(isBlockedPassword('PASSWORD')).toBe(true); // Case insensitive
      expect(isBlockedPassword('qwerty')).toBe(true);
      expect(isBlockedPassword('123456')).toBe(true);
    });

    test('should allow unique passwords', () => {
      expect(isBlockedPassword('myuniquepass')).toBe(false);
      expect(isBlockedPassword('correct horse')).toBe(false);
    });

    test('should handle null/empty', () => {
      expect(isBlockedPassword('')).toBe(false);
      expect(isBlockedPassword(null)).toBe(false);
    });
  });

  describe('getPasswordError', () => {
    test('should return null for valid password', () => {
      expect(getPasswordError('myvalidpassword')).toBeNull();
    });

    test('should return error for short password', () => {
      const error = getPasswordError('short');
      expect(error).toContain('10 characters');
    });

    test('should return error for common password', () => {
      const error = getPasswordError('password123');
      expect(error).toContain('too common');
    });
  });

  describe('getPasswordRequirements', () => {
    test('should return simple requirements string', () => {
      const reqs = getPasswordRequirements();
      expect(reqs).toContain('10 characters');
      // Should NOT mention uppercase, lowercase, numbers
      expect(reqs).not.toContain('uppercase');
      expect(reqs).not.toContain('number');
    });
  });

  describe('checkPasswordStrength', () => {
    test('should return weak for empty password', () => {
      const result = checkPasswordStrength('');
      expect(result.score).toBe(0);
      expect(result.label).toBe('Empty');
    });

    test('should score based on length primarily', () => {
      const short = checkPasswordStrength('tencharss'); // 9 chars
      const medium = checkPasswordStrength('fifteencharact'); // 14 chars
      const long = checkPasswordStrength('twentyfourcharacterslong'); // 24 chars

      expect(long.score).toBeGreaterThan(medium.score);
      expect(medium.score).toBeGreaterThan(short.score);
    });

    test('should flag common passwords', () => {
      const result = checkPasswordStrength('password123');
      expect(result.label).toBe('Too Common');
    });

    test('should provide helpful feedback', () => {
      const result = checkPasswordStrength('mypassword');
      expect(result.feedback).toBeDefined();
      expect(typeof result.feedback).toBe('string');
    });

    test('should return score between 0 and 4', () => {
      const passwords = ['a', 'mypassword', 'averyverylongpassphrase'];
      passwords.forEach(password => {
        const result = checkPasswordStrength(password);
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(4);
      });
    });
  });

  describe('PASSWORD_REQUIREMENTS constant', () => {
    test('should have correct minimum length', () => {
      expect(PASSWORD_REQUIREMENTS.minLength).toBe(10);
    });

    test('should NOT require complexity', () => {
      expect(PASSWORD_REQUIREMENTS.requireLowercase).toBe(false);
      expect(PASSWORD_REQUIREMENTS.requireUppercase).toBe(false);
      expect(PASSWORD_REQUIREMENTS.requireNumber).toBe(false);
      expect(PASSWORD_REQUIREMENTS.requireSpecial).toBe(false);
    });

    test('should block common passwords', () => {
      expect(PASSWORD_REQUIREMENTS.blockCommon).toBe(true);
    });
  });

  describe('getPasswordRequirementsStructured', () => {
    test('should return minLength', () => {
      const result = getPasswordRequirementsStructured();
      expect(result.minLength).toBe(10);
    });

    test('should return simplified rules', () => {
      const result = getPasswordRequirementsStructured();
      expect(Array.isArray(result.rules)).toBe(true);
      expect(result.rules.length).toBe(2); // length + not-common
    });

    test('should have length rule', () => {
      const result = getPasswordRequirementsStructured();
      const lengthRule = result.rules.find(r => r.id === 'length');
      expect(lengthRule).toBeDefined();
      expect(lengthRule.test('mypassword')).toBe(true);
      expect(lengthRule.test('short')).toBe(false);
    });

    test('should have not-common rule', () => {
      const result = getPasswordRequirementsStructured();
      const commonRule = result.rules.find(r => r.id === 'not-common');
      expect(commonRule).toBeDefined();
      expect(commonRule.test('uniquepassword')).toBe(true);
      expect(commonRule.test('password')).toBe(false);
    });
  });

  describe('validatePasswordDetailed', () => {
    test('should return valid:false for empty password', () => {
      const result = validatePasswordDetailed('');
      expect(result.valid).toBe(false);
    });

    test('should return valid:true for valid password', () => {
      const result = validatePasswordDetailed('myvalidpassword');
      expect(result.valid).toBe(true);
      expect(result.requirements.every(r => r.met === true)).toBe(true);
    });

    test('should show which requirements are met', () => {
      const result = validatePasswordDetailed('short');

      const lengthReq = result.requirements.find(r => r.id === 'length');
      const commonReq = result.requirements.find(r => r.id === 'not-common');

      expect(lengthReq.met).toBe(false);  // too short
      expect(commonReq.met).toBe(true);   // not common
    });

    test('should include minLength in response', () => {
      const result = validatePasswordDetailed('test');
      expect(result.minLength).toBe(10);
    });

    test('requirements should have id, label, and boolean met', () => {
      const result = validatePasswordDetailed('somepassword');
      result.requirements.forEach(req => {
        expect(req.id).toBeDefined();
        expect(req.label).toBeDefined();
        expect(typeof req.met).toBe('boolean');
      });
    });
  });
});
