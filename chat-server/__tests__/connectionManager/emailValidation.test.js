/* eslint-env jest */
/**
 * Email Validation Tests
 */

const { validateEmail, emailExists, getUserByEmail } = require('../../connectionManager/emailValidation');

// Mock dbSafe
jest.mock('../../dbSafe', () => ({
  safeSelect: jest.fn(),
  parseResult: jest.fn(result => result),
}));

const dbSafe = require('../../dbSafe');

describe('Email Validation Module', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateEmail', () => {
    it('should return true for valid email', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.org')).toBe(true);
      expect(validateEmail('user+tag@company.co.uk')).toBe(true);
    });

    it('should return false for invalid email', () => {
      expect(validateEmail('notanemail')).toBe(false);
      expect(validateEmail('missing@domain')).toBe(false);
      expect(validateEmail('@nodomain.com')).toBe(false);
      expect(validateEmail('spaces in@email.com')).toBe(false);
    });

    it('should return false for null or undefined', () => {
      expect(validateEmail(null)).toBe(false);
      expect(validateEmail(undefined)).toBe(false);
      expect(validateEmail('')).toBe(false);
    });

    it('should return false for non-string types', () => {
      expect(validateEmail(123)).toBe(false);
      expect(validateEmail({ email: 'test@example.com' })).toBe(false);
      expect(validateEmail(['test@example.com'])).toBe(false);
    });

    it('should handle emails with whitespace', () => {
      expect(validateEmail('  test@example.com  ')).toBe(true);
    });
  });

  describe('emailExists', () => {
    it('should return true if email exists in database', async () => {
      dbSafe.safeSelect.mockResolvedValue([{ id: 1, email: 'test@example.com' }]);
      dbSafe.parseResult.mockReturnValue([{ id: 1, email: 'test@example.com' }]);

      const result = await emailExists('test@example.com');

      expect(result).toBe(true);
      expect(dbSafe.safeSelect).toHaveBeenCalledWith(
        'users',
        { email: 'test@example.com' },
        { limit: 1 }
      );
    });

    it('should return false if email does not exist', async () => {
      dbSafe.safeSelect.mockResolvedValue([]);
      dbSafe.parseResult.mockReturnValue([]);

      const result = await emailExists('notfound@example.com');

      expect(result).toBe(false);
    });

    it('should return false for invalid email without querying database', async () => {
      const result = await emailExists('invalidemail');

      expect(result).toBe(false);
      expect(dbSafe.safeSelect).not.toHaveBeenCalled();
    });

    it('should normalize email to lowercase', async () => {
      dbSafe.safeSelect.mockResolvedValue([]);
      dbSafe.parseResult.mockReturnValue([]);

      await emailExists('TEST@EXAMPLE.COM');

      expect(dbSafe.safeSelect).toHaveBeenCalledWith(
        'users',
        { email: 'test@example.com' },
        { limit: 1 }
      );
    });
  });

  describe('getUserByEmail', () => {
    it('should return user object if found', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        first_name: 'Test',
      };
      dbSafe.safeSelect.mockResolvedValue([mockUser]);
      dbSafe.parseResult.mockReturnValue([mockUser]);

      const result = await getUserByEmail('test@example.com');

      expect(result).toEqual({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
      });
    });

    it('should return null if user not found', async () => {
      dbSafe.safeSelect.mockResolvedValue([]);
      dbSafe.parseResult.mockReturnValue([]);

      const result = await getUserByEmail('notfound@example.com');

      expect(result).toBeNull();
    });

    it('should return null for invalid email without querying database', async () => {
      const result = await getUserByEmail('invalidemail');

      expect(result).toBeNull();
      expect(dbSafe.safeSelect).not.toHaveBeenCalled();
    });

    it('should normalize email to lowercase', async () => {
      dbSafe.safeSelect.mockResolvedValue([]);
      dbSafe.parseResult.mockReturnValue([]);

      await getUserByEmail('  TEST@EXAMPLE.COM  ');

      expect(dbSafe.safeSelect).toHaveBeenCalledWith(
        'users',
        { email: 'test@example.com' },
        { limit: 1 }
      );
    });
  });
});
