/**
 * Unit Tests: Logger Utility
 *
 * Tests for structured logging functionality.
 *
 * @module src/utils/__tests__/logger.test
 */

const { Logger, defaultLogger, ERROR_TYPES, LOG_LEVELS } = require('../logger');

describe('Logger', () => {
  let originalEnv;
  let logOutput;

  beforeEach(() => {
    // Save original environment
    originalEnv = process.env.NODE_ENV;

    // Capture console.log output
    logOutput = [];
    console.log = jest.fn((...args) => {
      logOutput.push(args);
    });
  });

  afterEach(() => {
    // Restore original environment
    process.env.NODE_ENV = originalEnv;
    console.log = jest.restoreAllMocks();
  });

  describe('Logger initialization', () => {
    it('should create logger with context', () => {
      const logger = new Logger({ service: 'test', userId: '123' });

      expect(logger.context).toEqual({ service: 'test', userId: '123' });
    });

    it('should create logger without context', () => {
      const logger = new Logger();

      expect(logger.context).toEqual({});
    });

    it('should detect production environment', () => {
      process.env.NODE_ENV = 'production';
      const logger = new Logger();

      expect(logger.isProduction).toBe(true);
    });

    it('should detect development environment', () => {
      process.env.NODE_ENV = 'development';
      const logger = new Logger();

      expect(logger.isProduction).toBe(false);
    });
  });

  describe('child logger', () => {
    it('should create child logger with additional context', () => {
      const parent = new Logger({ service: 'test' });
      const child = parent.child({ userId: '123' });

      expect(child.context).toEqual({ service: 'test', userId: '123' });
      expect(child).toBeInstanceOf(Logger);
    });

    it('should merge context from parent', () => {
      const parent = new Logger({ service: 'test', version: '1.0' });
      const child = parent.child({ userId: '123' });

      expect(child.context.service).toBe('test');
      expect(child.context.version).toBe('1.0');
      expect(child.context.userId).toBe('123');
    });

    it('should override parent context with child context', () => {
      const parent = new Logger({ service: 'test', version: '1.0' });
      const child = parent.child({ version: '2.0' });

      expect(child.context.version).toBe('2.0'); // Child overrides
    });
  });

  describe('error logging', () => {
    it('should log error with message', () => {
      process.env.NODE_ENV = 'production';
      const logger = new Logger();
      const error = new Error('Test error');

      logger.error('Something went wrong', error);

      expect(console.log).toHaveBeenCalled();
      const logEntry = JSON.parse(logOutput[0][0]);
      expect(logEntry.message).toBe('Something went wrong');
    });

    it('should include error details in log', () => {
      process.env.NODE_ENV = 'production';
      const logger = new Logger();
      const error = new Error('Test error');
      error.stack = 'Error stack trace';

      logger.error('Error occurred', error);

      expect(console.log).toHaveBeenCalled();
      const logEntry = JSON.parse(logOutput[0][0]);
      expect(logEntry.error).toBeDefined();
      expect(logEntry.error.message).toBe('Test error');
    });

    it('should log error without error object', () => {
      process.env.NODE_ENV = 'production';
      const logger = new Logger();

      logger.error('Error message');

      expect(console.log).toHaveBeenCalled();
      const logEntry = JSON.parse(logOutput[0][0]);
      expect(logEntry.message).toBe('Error message');
    });

    it('should include metadata in error log', () => {
      process.env.NODE_ENV = 'production';
      const logger = new Logger({ service: 'test' });
      const error = new Error('Test error');

      logger.error('Error occurred', error, { userId: '123', action: 'test' });

      expect(console.log).toHaveBeenCalled();
      const logEntry = JSON.parse(logOutput[0][0]);
      expect(logEntry.userId).toBe('123');
      expect(logEntry.action).toBe('test');
    });

    it('should return log entry', () => {
      const logger = new Logger();
      const error = new Error('Test error');

      const entry = logger.error('Error occurred', error);

      expect(entry).toBeDefined();
      expect(entry.level).toBe(LOG_LEVELS.ERROR);
      expect(entry.message).toBe('Error occurred');
    });
  });

  describe('warn logging', () => {
    it('should log warning message', () => {
      process.env.NODE_ENV = 'production';
      const logger = new Logger();

      logger.warn('Warning message');

      expect(console.log).toHaveBeenCalled();
      const logEntry = JSON.parse(logOutput[0][0]);
      expect(logEntry.message).toBe('Warning message');
      expect(logEntry.level).toBe(LOG_LEVELS.WARN);
    });

    it('should include context in warning', () => {
      process.env.NODE_ENV = 'production';
      const logger = new Logger({ service: 'test' });

      logger.warn('Warning', { userId: '123' });

      expect(console.log).toHaveBeenCalled();
      const logEntry = JSON.parse(logOutput[0][0]);
      expect(logEntry.service).toBe('test');
      expect(logEntry.userId).toBe('123');
    });
  });

  describe('info logging', () => {
    it('should log info message', () => {
      process.env.NODE_ENV = 'production';
      const logger = new Logger();

      logger.info('Info message');

      expect(console.log).toHaveBeenCalled();
      const logEntry = JSON.parse(logOutput[0][0]);
      expect(logEntry.message).toBe('Info message');
      expect(logEntry.level).toBe(LOG_LEVELS.INFO);
    });

    it('should include context in info', () => {
      process.env.NODE_ENV = 'production';
      const logger = new Logger({ service: 'test' });

      logger.info('Info', { userId: '123' });

      expect(console.log).toHaveBeenCalled();
      const logEntry = JSON.parse(logOutput[0][0]);
      expect(logEntry.service).toBe('test');
      expect(logEntry.userId).toBe('123');
    });
  });

  describe('debug logging', () => {
    it('should log debug in development', () => {
      process.env.NODE_ENV = 'development';
      const logger = new Logger();

      logger.debug('Debug message');

      expect(console.log).toHaveBeenCalled();
    });

    it('should not log debug in production', () => {
      process.env.NODE_ENV = 'production';
      const logger = new Logger();

      logger.debug('Debug message');

      expect(console.log).not.toHaveBeenCalled();
    });
  });

  describe('error categorization', () => {
    it('should categorize network timeout as retryable', () => {
      const logger = new Logger();
      const error = { code: 'ETIMEDOUT', message: 'Timeout' };

      const entry = logger.error('Network error', error);

      expect(entry.error.type).toBe(ERROR_TYPES.RETRYABLE);
    });

    it('should categorize connection refused as retryable', () => {
      const logger = new Logger();
      const error = { code: 'ECONNREFUSED', message: 'Connection refused' };

      const entry = logger.error('Connection error', error);

      expect(entry.error.type).toBe(ERROR_TYPES.RETRYABLE);
    });

    it('should categorize rate limit as retryable', () => {
      const logger = new Logger();
      const error = { status: 429, message: 'Rate limit' };

      const entry = logger.error('Rate limit error', error);

      expect(entry.error.type).toBe(ERROR_TYPES.RETRYABLE);
    });

    it('should categorize auth error as fatal', () => {
      const logger = new Logger();
      const error = { status: 401, message: 'Unauthorized' };

      const entry = logger.error('Auth error', error);

      expect(entry.error.type).toBe(ERROR_TYPES.FATAL);
    });

    it('should categorize forbidden as fatal', () => {
      const logger = new Logger();
      const error = { status: 403, message: 'Forbidden' };

      const entry = logger.error('Forbidden error', error);

      expect(entry.error.type).toBe(ERROR_TYPES.FATAL);
    });

    it('should categorize validation error as operational', () => {
      const logger = new Logger();
      const error = { name: 'ValidationError', message: 'Invalid input' };

      const entry = logger.error('Validation error', error);

      expect(entry.error.type).toBe(ERROR_TYPES.OPERATIONAL);
    });

    it('should categorize 400 error as operational', () => {
      const logger = new Logger();
      const error = { status: 400, message: 'Bad request' };

      const entry = logger.error('Bad request', error);

      expect(entry.error.type).toBe(ERROR_TYPES.OPERATIONAL);
    });

    it('should categorize 500 error as retryable', () => {
      const logger = new Logger();
      const error = { status: 500, message: 'Server error' };

      const entry = logger.error('Server error', error);

      expect(entry.error.type).toBe(ERROR_TYPES.RETRYABLE);
    });

    it('should default to operational for unknown errors', () => {
      const logger = new Logger();
      const error = { message: 'Unknown error' };

      const entry = logger.error('Unknown error', error);

      expect(entry.error.type).toBe(ERROR_TYPES.OPERATIONAL);
    });
  });

  describe('production vs development output', () => {
    it('should output JSON in production', () => {
      process.env.NODE_ENV = 'production';
      const logger = new Logger();

      logger.info('Test message');

      expect(console.log).toHaveBeenCalled();
      const output = logOutput[0][0];
      expect(() => JSON.parse(output)).not.toThrow();
    });

    it('should output pretty format in development', () => {
      process.env.NODE_ENV = 'development';
      const logger = new Logger();

      logger.info('Test message');

      expect(console.log).toHaveBeenCalled();
      // In development, output is pretty-printed (not JSON)
      const output = logOutput[0].join(' ');
      expect(output).toContain('Test message');
    });
  });

  describe('defaultLogger', () => {
    it('should export default logger instance', () => {
      expect(defaultLogger).toBeInstanceOf(Logger);
    });

    it('should have default context', () => {
      expect(defaultLogger.context.service).toBe('chat-server');
      expect(defaultLogger.context.environment).toBeDefined();
    });

    it('should allow creating child from default logger', () => {
      const child = defaultLogger.child({ userId: '123' });

      expect(child).toBeInstanceOf(Logger);
      expect(child.context.service).toBe('chat-server');
      expect(child.context.userId).toBe('123');
    });
  });

  describe('timestamp', () => {
    it('should include timestamp in log entries', () => {
      process.env.NODE_ENV = 'production';
      const logger = new Logger();

      logger.info('Test message');

      expect(console.log).toHaveBeenCalled();
      const logEntry = JSON.parse(logOutput[0][0]);
      expect(logEntry.timestamp).toBeDefined();
      expect(typeof logEntry.timestamp).toBe('string');
      expect(new Date(logEntry.timestamp)).toBeInstanceOf(Date);
    });

    it('should use ISO format for timestamp', () => {
      process.env.NODE_ENV = 'production';
      const logger = new Logger();

      logger.info('Test message');

      expect(console.log).toHaveBeenCalled();
      const logEntry = JSON.parse(logOutput[0][0]);
      expect(logEntry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });
});
