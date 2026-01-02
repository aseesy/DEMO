/**
 * Error Boundary Tests
 *
 * Tests for the socket handler error boundary wrapper.
 */

const { wrapSocketHandler } = require('../errorBoundary');

describe('errorBoundary', () => {
  let mockSocket;
  let errorHandler;

  beforeEach(() => {
    mockSocket = {
      id: 'test-socket-id',
      connected: true,
      emit: jest.fn(),
    };
    errorHandler = jest.fn();
  });

  describe('wrapSocketHandler', () => {
    it('should execute handler successfully', async () => {
      const handler = jest.fn().mockResolvedValue('success');
      const wrapped = wrapSocketHandler(handler, 'test_handler');

      await wrapped({});

      expect(handler).toHaveBeenCalled();
    });

    it('should catch and log errors without re-throwing', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Test error');
      const handler = jest.fn().mockRejectedValue(error);
      const wrapped = wrapSocketHandler(handler, 'test_handler');

      // Should not throw - error is caught and handled
      await expect(wrapped({})).resolves.not.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Socket Handler Error] test_handler:'),
        expect.objectContaining({
          error: 'Test error',
        })
      );

      consoleErrorSpy.mockRestore();
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
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const error = { code: 'ECONNREFUSED', message: 'Connection refused' };
      const handler = jest.fn().mockRejectedValue(error);
      const wrapped = wrapSocketHandler(handler, 'test_handler');

      await wrapped({});

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Socket Handler] Database connection error'),
        expect.any(Object)
      );

      consoleWarnSpy.mockRestore();
    });

    it('should support retry option', async () => {
      const handler = jest.fn().mockResolvedValue('success');
      const wrapped = wrapSocketHandler(handler, 'test_handler', { retry: true });

      await wrapped({});

      expect(handler).toHaveBeenCalled();
    });

    it('should handle errors with retry option', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Test error');
      const handler = jest.fn().mockRejectedValue(error);
      const wrapped = wrapSocketHandler(handler, 'test_handler', { retry: true });

      // Should not throw even with retry enabled
      await expect(wrapped({})).resolves.not.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });
});
