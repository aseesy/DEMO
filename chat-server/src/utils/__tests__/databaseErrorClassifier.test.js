/**
 * Database Error Classifier Tests
 *
 * Tests for the centralized database error classification utility.
 */

const {
  classifyDatabaseError,
  isDatabaseConnectionError,
  isDatabaseError,
  isRetryableDatabaseError,
  getDatabaseErrorStatusCode,
  getDatabaseErrorResponse,
} = require('../databaseErrorClassifier');

describe('databaseErrorClassifier', () => {
  describe('classifyDatabaseError', () => {
    it('should return false for null/undefined errors', () => {
      expect(classifyDatabaseError(null).isDatabaseError).toBe(false);
      expect(classifyDatabaseError(undefined).isDatabaseError).toBe(false);
    });

    it('should detect DATABASE_NOT_READY marker', () => {
      const error = new Error('DATABASE_NOT_READY');
      const result = classifyDatabaseError(error);

      expect(result.isDatabaseError).toBe(true);
      expect(result.type).toBe('CONNECTION');
      expect(result.category).toBe('NOT_READY');
      expect(result.isRetryable).toBe(true);
    });

    it('should detect PostgreSQL connection error codes', () => {
      const codes = ['08000', '08003', '08006'];

      codes.forEach(code => {
        const error = { code, message: 'Connection error' };
        const result = classifyDatabaseError(error);

        expect(result.isDatabaseError).toBe(true);
        expect(result.type).toBe('CONNECTION');
        expect(result.category).toBe('POSTGRES_CONNECTION');
        expect(result.isRetryable).toBe(true);
      });
    });

    it('should detect PostgreSQL shutdown error codes', () => {
      const codes = ['57P01', '57P02', '57P03'];

      codes.forEach(code => {
        const error = { code, message: 'Shutdown error' };
        const result = classifyDatabaseError(error);

        expect(result.isDatabaseError).toBe(true);
        expect(result.type).toBe('CONNECTION');
        expect(result.category).toBe('SHUTDOWN');
        expect(result.isRetryable).toBe(true);
      });
    });

    it('should detect system connection error codes', () => {
      const codes = ['ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EPIPE'];

      codes.forEach(code => {
        const error = { code, message: 'System error' };
        const result = classifyDatabaseError(error);

        expect(result.isDatabaseError).toBe(true);
        expect(result.type).toBe('CONNECTION');
        expect(result.category).toBe('SYSTEM');
        expect(result.isRetryable).toBe(true);
      });
    });

    it('should detect connection errors from message keywords', () => {
      const messages = [
        'Connection refused',
        'Database connection failed',
        'PostgreSQL connection error',
        'ECONNREFUSED',
        'Connection timeout',
        'Socket error',
        'Network error',
      ];

      messages.forEach(message => {
        const error = { message };
        const result = classifyDatabaseError(error);

        expect(result.isDatabaseError).toBe(true);
        expect(result.type).toBe('CONNECTION');
        expect(result.category).toBe('MESSAGE_MATCH');
        expect(result.isRetryable).toBe(true);
      });
    });

    it('should not classify query errors as connection errors', () => {
      const error = {
        message: 'syntax error at or near "SELECT"',
        code: '42601',
      };
      const result = classifyDatabaseError(error);

      // Should be detected as database error but not connection
      expect(result.isDatabaseError).toBe(true);
      expect(result.type).toBe('QUERY');
      expect(result.category).toBe('QUERY_ERROR');
    });

    it('should detect PostgreSQL error objects', () => {
      const error = {
        severity: 'ERROR',
        code: '23505',
        message: 'duplicate key value',
        hint: 'Key already exists',
      };

      const result = classifyDatabaseError(error);

      expect(result.isDatabaseError).toBe(true);
      expect(result.type).toBe('QUERY');
      expect(result.category).toBe('POSTGRES_QUERY');
      expect(result.isRetryable).toBe(false);
    });

    it('should return false for non-database errors', () => {
      const error = new Error('File not found');
      const result = classifyDatabaseError(error);

      expect(result.isDatabaseError).toBe(false);
    });
  });

  describe('isDatabaseConnectionError', () => {
    it('should return true for connection errors', () => {
      const errors = [
        { code: 'ECONNREFUSED' },
        { code: '08000' },
        { message: 'Connection refused' },
        new Error('DATABASE_NOT_READY'),
      ];

      errors.forEach(error => {
        expect(isDatabaseConnectionError(error)).toBe(true);
      });
    });

    it('should return false for query errors', () => {
      const error = {
        severity: 'ERROR',
        code: '23505',
        message: 'duplicate key value',
      };

      expect(isDatabaseConnectionError(error)).toBe(false);
    });

    it('should return false for non-database errors', () => {
      const error = new Error('File not found');
      expect(isDatabaseConnectionError(error)).toBe(false);
    });
  });

  describe('isDatabaseError', () => {
    it('should return true for any database error', () => {
      const errors = [
        { code: 'ECONNREFUSED' },
        { code: '08000' },
        { message: 'Connection refused' },
        { severity: 'ERROR', code: '23505' },
      ];

      errors.forEach(error => {
        expect(isDatabaseError(error)).toBe(true);
      });
    });

    it('should return false for non-database errors', () => {
      const error = new Error('File not found');
      expect(isDatabaseError(error)).toBe(false);
    });
  });

  describe('isRetryableDatabaseError', () => {
    it('should return true for connection errors', () => {
      const errors = [
        { code: 'ECONNREFUSED' },
        { code: '08000' },
        { message: 'Connection refused' },
      ];

      errors.forEach(error => {
        expect(isRetryableDatabaseError(error)).toBe(true);
      });
    });

    it('should return false for query errors', () => {
      const error = {
        severity: 'ERROR',
        code: '23505',
        message: 'duplicate key value',
      };

      expect(isRetryableDatabaseError(error)).toBe(false);
    });
  });

  describe('getDatabaseErrorStatusCode', () => {
    it('should return 503 for connection errors', () => {
      const errors = [
        { code: 'ECONNREFUSED' },
        { code: '08000' },
        { message: 'Connection refused' },
      ];

      errors.forEach(error => {
        expect(getDatabaseErrorStatusCode(error)).toBe(503);
      });
    });

    it('should return 500 for query errors', () => {
      const error = {
        severity: 'ERROR',
        code: '23505',
        message: 'duplicate key value',
      };

      expect(getDatabaseErrorStatusCode(error)).toBe(500);
    });

    it('should return 500 for non-database errors', () => {
      const error = new Error('File not found');
      expect(getDatabaseErrorStatusCode(error)).toBe(500);
    });
  });

  describe('getDatabaseErrorResponse', () => {
    it('should return formatted response for connection errors', () => {
      const error = { code: 'ECONNREFUSED' };
      const response = getDatabaseErrorResponse(error);

      expect(response).toEqual({
        error: 'Service temporarily unavailable',
        code: 'DATABASE_NOT_READY',
        message: 'Database connection is being established. Please try again in a moment.',
        retryAfter: 5,
      });
    });

    it('should return formatted response for query errors', () => {
      const error = {
        severity: 'ERROR',
        code: '23505',
        message: 'duplicate key value',
      };
      const response = getDatabaseErrorResponse(error);

      expect(response).toEqual({
        error: 'Database operation failed',
        code: 'DATABASE_ERROR',
        message: 'An error occurred while processing your request. Please try again.',
      });
    });

    it('should return null for non-database errors', () => {
      const error = new Error('File not found');
      expect(getDatabaseErrorResponse(error)).toBe(null);
    });
  });
});
