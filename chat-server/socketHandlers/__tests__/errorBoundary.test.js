/**
 * Error Boundary Tests
 *
 * Tests for the socket handler error boundary wrapper.
 */

const { wrapSocketHandler } = require('../errorBoundary');
const { defaultLogger } = require('../../src/infrastructure/logging/logger');

// Mock the logger
jest.mock('../../src/infrastructure/logging/logger', () => {
  const mockLogger = {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    child: jest.fn(function (additionalContext) {
      return {
        ...this,
        context: { ...this.context, ...additionalContext },
      };
    }),
    context: {},
  };
  return {
    defaultLogger: mockLogger,
    Logger: jest.fn(() => mockLogger),
  };
});

describe('errorBoundary', () => {
  let mockSocket;
  let errorHandler;
  let mockLogger;

  beforeEach(() => {
    mockSocket = {
      id: 'test-socket-id',
      connected: true,
      emit: jest.fn(),
    };
    errorHandler = jest.fn();

    // Get the mocked logger
    mockLogger = defaultLogger;
    jest.clearAllMocks();
  });

  describe('wrapSocketHandler', () => {
    it('should execute handler successfully', async () => {
      const handler = jest.fn().mockResolvedValue('success');
      const wrapped = wrapSocketHandler(handler, 'test_handler');

      await wrapped({});

      expect(handler).toHaveBeenCalled();
    });

    it('should catch and log errors without re-throwing', async () => {
      const error = new Error('Test error');
      const handler = jest.fn().mockRejectedValue(error);
      const wrapped = wrapSocketHandler(handler, 'test_handler');

      // Should not throw - error is caught and handled
      await expect(wrapped({})).resolves.not.toThrow();

      // Verify logger.error was called with correct parameters
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Socket handler error',
        error,
        expect.objectContaining({
          errorCode: 'UNKNOWN',
          handlerName: 'test_handler',
        })
      );
    });

    it('should not cause unhandled promise rejection', async () => {
      const error = new Error('Test error');
      const handler = jest.fn().mockRejectedValue(error);
      const wrapped = wrapSocketHandler(handler, 'test_handler');

      // Should not throw or cause unhandled rejection
      await wrapped({});

      // If we get here, no unhandled rejection occurred
      expect(true).toBe(true);
    });

    it('should handle database connection errors specially', async () => {
      const error = { code: 'ECONNREFUSED', message: 'Connection refused' };
      const handler = jest.fn().mockRejectedValue(error);
      const wrapped = wrapSocketHandler(handler, 'test_handler');

      await wrapped({});

      // Verify logger.warn was called for database connection errors
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Database connection error in socket handler',
        expect.objectContaining({
          errorCode: 'ECONNREFUSED',
          handlerName: 'test_handler',
        })
      );
    });

    it('should support retry option', async () => {
      const handler = jest.fn().mockResolvedValue('success');
      const wrapped = wrapSocketHandler(handler, 'test_handler', { retry: true });

      await wrapped({});

      expect(handler).toHaveBeenCalled();
    });

    it('should handle errors with retry option', async () => {
      const error = new Error('Test error');
      const handler = jest.fn().mockRejectedValue(error);
      const wrapped = wrapSocketHandler(handler, 'test_handler', { retry: true });

      // Should not throw even with retry enabled
      await expect(wrapped({})).resolves.not.toThrow();

      // Verify logger.error was called
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
