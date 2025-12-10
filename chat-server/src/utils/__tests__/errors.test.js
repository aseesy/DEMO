/**
 * Unit Tests: Error Handling Utilities
 * 
 * Tests for custom error classes and error handling HOC.
 * 
 * @module src/utils/__tests__/errors.test
 */

const { AppError, OperationalError, RetryableError, FatalError, withErrorHandling } = require('../errors');

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create app error with message', () => {
      const error = new AppError('Test error', 'TEST_CODE');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('AppError');
      expect(error.code).toBe('TEST_CODE');
    });

    it('should have timestamp', () => {
      const error = new AppError('Test error', 'TEST_CODE');
      
      expect(error.timestamp).toBeDefined();
      expect(new Date(error.timestamp)).toBeInstanceOf(Date);
    });

    it('should have toJSON method', () => {
      const error = new AppError('Test error', 'TEST_CODE', 'operational', { userId: '123' });
      const json = error.toJSON();
      
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('TEST_CODE');
      expect(json.error.message).toBe('Test error');
      expect(json.error.context.userId).toBe('123');
    });
  });

  describe('OperationalError', () => {
    it('should create operational error with message', () => {
      const error = new OperationalError('Test error');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(OperationalError);
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('OperationalError');
      expect(error.type).toBe('operational');
      expect(error.retryable).toBe(false);
    });

    it('should create operational error with code', () => {
      const error = new OperationalError('Test error', 'TEST_CODE');
      
      expect(error.code).toBe('TEST_CODE');
    });

    it('should create operational error with metadata', () => {
      const metadata = { userId: '123', action: 'test' };
      const error = new OperationalError('Test error', 'TEST_CODE', metadata);
      
      expect(error.metadata).toEqual(metadata);
    });

    it('should capture stack trace', () => {
      const error = new OperationalError('Test error');
      
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('OperationalError');
    });
  });

  describe('RetryableError', () => {
    it('should create retryable error', () => {
      const error = new RetryableError('Retryable error', 'RETRY_CODE');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(RetryableError);
      expect(error.name).toBe('RetryableError');
      expect(error.type).toBe('retryable');
      expect(error.retryable).toBe(true);
    });

    it('should accept metadata', () => {
      const metadata = { retryAfter: 5000 };
      const error = new RetryableError('Retryable error', 'RETRY_CODE', metadata);
      
      expect(error.metadata).toEqual(metadata);
    });
  });

  describe('FatalError', () => {
    it('should create fatal error', () => {
      const error = new FatalError('Fatal error', 'FATAL_CODE');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(FatalError);
      expect(error.name).toBe('FatalError');
      expect(error.type).toBe('fatal');
      expect(error.retryable).toBe(false);
    });

    it('should accept metadata', () => {
      const metadata = { component: 'database' };
      const error = new FatalError('Fatal error', 'FATAL_CODE', metadata);
      
      expect(error.metadata).toEqual(metadata);
    });

    it('should capture stack trace', () => {
      const error = new FatalError('Fatal error');
      
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('FatalError');
    });
  });
});

describe('withErrorHandling', () => {
  it('should return result from successful function', async () => {
    const testFn = async () => {
      return 'success';
    };

    const wrapped = withErrorHandling(testFn);
    const result = await wrapped();

    expect(result).toBe('success');
  });

  it('should pass arguments to wrapped function', async () => {
    const testFn = async (arg1, arg2) => {
      return `${arg1}-${arg2}`;
    };

    const wrapped = withErrorHandling(testFn);
    const result = await wrapped('a', 'b');

    expect(result).toBe('a-b');
  });

  it('should wrap unknown errors in OperationalError', async () => {
    const testFn = async () => {
      throw new Error('Unknown error');
    };

    const wrapped = withErrorHandling(testFn);

    await expect(wrapped()).rejects.toThrow(OperationalError);
    // withErrorHandling preserves the original error message
    await expect(wrapped()).rejects.toThrow('Unknown error');
    
    try {
      await wrapped();
    } catch (error) {
      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error.metadata.originalError).toBe('Error');
    }
  });

  it('should preserve AppError subclasses', async () => {
    const testFn = async () => {
      throw new OperationalError('Operational error', 'OP_CODE');
    };

    const wrapped = withErrorHandling(testFn);

    await expect(wrapped()).rejects.toThrow(OperationalError);
    await expect(wrapped()).rejects.toThrow('Operational error');
    
    try {
      await wrapped();
    } catch (error) {
      expect(error.code).toBe('OP_CODE');
      expect(error.type).toBe('operational');
    }
  });

  it('should preserve RetryableError', async () => {
    const testFn = async () => {
      throw new RetryableError('Retryable error', 'RETRY_CODE');
    };

    const wrapped = withErrorHandling(testFn);

    await expect(wrapped()).rejects.toThrow(RetryableError);
    await expect(wrapped()).rejects.toThrow('Retryable error');
    
    try {
      await wrapped();
    } catch (error) {
      expect(error.retryable).toBe(true);
      expect(error.type).toBe('retryable');
    }
  });

  it('should preserve FatalError', async () => {
    const testFn = async () => {
      throw new FatalError('Fatal error', 'FATAL_CODE');
    };

    const wrapped = withErrorHandling(testFn);

    await expect(wrapped()).rejects.toThrow(FatalError);
    await expect(wrapped()).rejects.toThrow('Fatal error');
    
    try {
      await wrapped();
    } catch (error) {
      expect(error.type).toBe('fatal');
    }
  });

  it('should handle synchronous functions', async () => {
    const testFn = () => {
      return 'sync success';
    };

    const wrapped = withErrorHandling(testFn);
    const result = await wrapped();

    expect(result).toBe('sync success');
  });

  it('should handle synchronous errors', async () => {
    const testFn = () => {
      throw new Error('Sync error');
    };

    const wrapped = withErrorHandling(testFn);

    // withErrorHandling returns async function, so we need to await
    await expect(wrapped()).rejects.toThrow(OperationalError);
  });

  it('should log error with function name', async () => {
    // Mock console.log to capture log output
    const originalLog = console.log;
    const logCalls = [];
    console.log = jest.fn((...args) => {
      logCalls.push(args);
    });

    const myTestFunction = async () => {
      throw new Error('Test error');
    };

    const wrapped = withErrorHandling(myTestFunction);

    try {
      await wrapped();
    } catch (error) {
      // Error should be wrapped
      expect(error).toBeInstanceOf(OperationalError);
    }

    // Restore console.log
    console.log = originalLog;

    // Verify error was logged (withErrorHandling logs errors)
    expect(logCalls.length).toBeGreaterThan(0);
  });
});

describe('Error Inheritance', () => {
  it('should allow instanceof checks', () => {
    const opError = new OperationalError('Op error');
    const retryError = new RetryableError('Retry error');
    const fatalError = new FatalError('Fatal error');

    expect(opError instanceof Error).toBe(true);
    expect(opError instanceof AppError).toBe(true);
    expect(opError instanceof OperationalError).toBe(true);
    
    expect(retryError instanceof Error).toBe(true);
    expect(retryError instanceof AppError).toBe(true);
    expect(retryError instanceof RetryableError).toBe(true);
    
    expect(fatalError instanceof Error).toBe(true);
    expect(fatalError instanceof AppError).toBe(true);
    expect(fatalError instanceof FatalError).toBe(true);
  });

  it('should allow type checking with type property', () => {
    const opError = new OperationalError('Op error');
    const retryError = new RetryableError('Retry error');
    const fatalError = new FatalError('Fatal error');

    expect(opError.type).toBe('operational');
    expect(retryError.type).toBe('retryable');
    expect(fatalError.type).toBe('fatal');
  });

  it('should allow type checking with retryable property', () => {
    const retryError = new RetryableError('Retry error');
    const opError = new OperationalError('Op error');
    const fatalError = new FatalError('Fatal error');

    expect(retryError.retryable).toBe(true);
    expect(opError.retryable).toBe(false);
    expect(fatalError.retryable).toBe(false);
  });
});

