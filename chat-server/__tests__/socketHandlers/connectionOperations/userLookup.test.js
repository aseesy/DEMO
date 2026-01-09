/* eslint-env jest */
/**
 * User Lookup Tests
 */

// Mock the logger before importing the module
jest.mock('../../../src/infrastructure/logging/logger', () => {
  const mockLogger = {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnThis(),
  };
  return {
    defaultLogger: mockLogger,
    Logger: jest.fn(() => mockLogger),
  };
});

const {
  validateUserInput,
  getUserByEmail,
  getUserByUsername,
} = require('../../../socketHandlers/connectionOperations/userLookup');
const { defaultLogger } = require('../../../src/infrastructure/logging/logger');

describe('User Lookup Module', () => {
  let mockLogger;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLogger = defaultLogger;
  });
  describe('validateUserInput', () => {
    it('should return valid result for valid email', () => {
      const result = validateUserInput('test@example.com');

      expect(result.valid).toBe(true);
      expect(result.cleanEmail).toBe('test@example.com');
    });

    it('should normalize email to lowercase', () => {
      const result = validateUserInput('TEST@EXAMPLE.COM');

      expect(result.valid).toBe(true);
      expect(result.cleanEmail).toBe('test@example.com');
    });

    it('should trim whitespace', () => {
      const result = validateUserInput('  test@example.com  ');

      expect(result.valid).toBe(true);
      expect(result.cleanEmail).toBe('test@example.com');
    });

    it('should return error for missing email', () => {
      expect(validateUserInput(null).valid).toBe(false);
      expect(validateUserInput(undefined).valid).toBe(false);
      expect(validateUserInput('').valid).toBe(false);
    });

    it('should return error for invalid email format', () => {
      expect(validateUserInput('notanemail').valid).toBe(false);
      expect(validateUserInput('missing@domain').valid).toBe(false);
      expect(validateUserInput('@nodomain.com').valid).toBe(false);
    });

    it('should include error message for invalid input', () => {
      const result = validateUserInput('notanemail');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid email format.');
    });
  });

  describe('getUserByEmail', () => {
    it('should call auth.getUser with email', async () => {
      const mockAuth = {
        getUser: jest.fn().mockResolvedValue({ id: 1, email: 'test@example.com' }),
      };

      const result = await getUserByEmail('test@example.com', mockAuth);

      expect(mockAuth.getUser).toHaveBeenCalledWith('test@example.com');
      expect(result).toEqual({ id: 1, email: 'test@example.com' });
    });

    it('should return null if user not found', async () => {
      const mockAuth = {
        getUser: jest.fn().mockResolvedValue(null),
      };

      const result = await getUserByEmail('notfound@example.com', mockAuth);

      expect(result).toBeNull();
    });
  });

  describe('getUserByUsername', () => {
    it('should use getUser for email-like input', async () => {
      const mockAuth = {
        getUser: jest.fn().mockResolvedValue({ id: 1, email: 'test@example.com' }),
      };

      const result = await getUserByUsername('test@example.com', mockAuth);

      expect(mockAuth.getUser).toHaveBeenCalledWith('test@example.com');
      expect(result).toEqual({ id: 1, email: 'test@example.com' });
    });

    it('should return null for non-email input (deprecated path)', async () => {
      const mockAuth = {
        getUser: jest.fn(),
      };

      const result = await getUserByUsername('oldusername', mockAuth);

      expect(result).toBeNull();
      expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('Deprecated'));
    });
  });
});
