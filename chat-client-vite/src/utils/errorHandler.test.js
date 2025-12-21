/**
 * errorHandler Utility Tests
 *
 * Tests the error handling utilities to ensure:
 * - Error code mapping works correctly
 * - User-friendly messages are generated
 * - Retry logic works correctly
 * - Error categorization is accurate
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getErrorMessage,
  isRetryableError,
  calculateRetryDelay,
  categorizeError,
  ErrorCategory,
  retryWithBackoff,
  logError,
} from './errorHandler.jsx';

// Mock analytics
vi.mock('./analyticsEnhancements.js', () => ({
  trackError: vi.fn(),
  trackAPIError: vi.fn(),
  trackConnectionError: vi.fn(),
  trackFormError: vi.fn(),
}));

describe('ErrorCategory', () => {
  it('should have all error categories defined', () => {
    expect(ErrorCategory.NETWORK).toBe('network');
    expect(ErrorCategory.VALIDATION).toBe('validation');
    expect(ErrorCategory.SERVER).toBe('server');
    expect(ErrorCategory.AUTHENTICATION).toBe('authentication');
    expect(ErrorCategory.BUSINESS_LOGIC).toBe('business_logic');
  });
});

describe('categorizeError', () => {
  it('should categorize fetch errors as network', () => {
    const fetchError = new TypeError('fetch failed');
    expect(categorizeError(fetchError)).toBe(ErrorCategory.NETWORK);
  });

  it('should categorize 401 as authentication', () => {
    expect(categorizeError({}, 401)).toBe(ErrorCategory.AUTHENTICATION);
  });

  it('should categorize 5xx as server', () => {
    expect(categorizeError({}, 500)).toBe(ErrorCategory.SERVER);
    expect(categorizeError({}, 502)).toBe(ErrorCategory.SERVER);
    expect(categorizeError({}, 503)).toBe(ErrorCategory.SERVER);
  });

  it('should categorize 400 and 422 as validation', () => {
    expect(categorizeError({}, 400)).toBe(ErrorCategory.VALIDATION);
    expect(categorizeError({}, 422)).toBe(ErrorCategory.VALIDATION);
  });

  it('should categorize unhandled 4xx as server (default)', () => {
    // 404 is not explicitly categorized, falls through to default
    expect(categorizeError({}, 404)).toBe(ErrorCategory.SERVER);
  });
});

describe('getErrorMessage', () => {
  describe('Registration Errors', () => {
    it('should return correct message for REG_001 (email exists)', () => {
      const error = { code: 'REG_001' };
      const result = getErrorMessage(error);

      expect(result.code).toBe('REG_001');
      expect(result.userMessage).toContain('already registered');
      expect(result.action).toBe('sign_in');
      expect(result.retryable).toBe(false);
    });

    it('should return correct message for REG_002 (invalid token)', () => {
      const error = { code: 'REG_002' };
      const result = getErrorMessage(error);

      expect(result.code).toBe('REG_002');
      expect(result.userMessage).toContain('not valid');
      expect(result.retryable).toBe(false);
    });

    it('should return correct message for REG_003 (expired invitation)', () => {
      const error = { code: 'REG_003' };
      const result = getErrorMessage(error);

      expect(result.code).toBe('REG_003');
      expect(result.userMessage).toContain('expired');
      expect(result.retryable).toBe(false);
    });

    it('should return correct message for REG_005 (retryable)', () => {
      const error = { code: 'REG_005' };
      const result = getErrorMessage(error);

      expect(result.retryable).toBe(true);
      expect(result.action).toBe('retry');
    });
  });

  describe('Invitation Errors', () => {
    it('should return correct message for TOKEN_REQUIRED', () => {
      const error = { code: 'TOKEN_REQUIRED' };
      const result = getErrorMessage(error);

      expect(result.code).toBe('TOKEN_REQUIRED');
      expect(result.userMessage).toContain('missing');
    });

    it('should return correct message for INVALID_TOKEN', () => {
      const error = { code: 'INVALID_TOKEN' };
      const result = getErrorMessage(error);

      expect(result.code).toBe('INVALID_TOKEN');
      expect(result.userMessage).toContain('not valid');
    });

    it('should detect ALREADY_PAIRED from error message', () => {
      const error = { message: 'You already have an active co-parent connection' };
      const result = getErrorMessage(error);

      expect(result.code).toBe('ALREADY_PAIRED');
    });
  });

  describe('OAuth Errors', () => {
    it('should return correct message for popup_blocked', () => {
      const error = { code: 'popup_blocked' };
      const result = getErrorMessage(error);

      expect(result.userMessage).toContain('popup');
      expect(result.action).toBe('allow_popups');
      expect(result.retryable).toBe(true);
    });

    it('should return correct message for access_denied', () => {
      const error = { code: 'access_denied' };
      const result = getErrorMessage(error);

      expect(result.userMessage).toContain('cancelled');
      expect(result.retryable).toBe(true);
    });

    it('should return correct message for invalid_client', () => {
      const error = { code: 'invalid_client' };
      const result = getErrorMessage(error);

      expect(result.userMessage).toContain('configuration error');
      expect(result.action).toBe('contact_support');
      expect(result.retryable).toBe(false);
    });
  });

  describe('HTTP Status Errors', () => {
    it('should return correct message for 401', () => {
      const result = getErrorMessage({}, { statusCode: 401 });

      expect(result.code).toBe('HTTP_401');
      expect(result.userMessage).toContain('session has expired');
      expect(result.action).toBe('sign_in');
    });

    it('should return correct message for 403', () => {
      const result = getErrorMessage({}, { statusCode: 403 });

      expect(result.code).toBe('HTTP_403');
      expect(result.userMessage).toContain('permission');
    });

    it('should return correct message for 404', () => {
      const result = getErrorMessage({}, { statusCode: 404 });

      expect(result.code).toBe('HTTP_404');
      expect(result.userMessage).toContain('not found');
    });

    it('should return correct message for 429 (rate limit)', () => {
      const result = getErrorMessage({}, { statusCode: 429 });

      expect(result.code).toBe('HTTP_429');
      expect(result.userMessage).toContain('Too many requests');
      expect(result.retryable).toBe(true);
    });

    it('should return correct message for 500', () => {
      const result = getErrorMessage({}, { statusCode: 500 });

      expect(result.code).toBe('HTTP_500');
      expect(result.userMessage).toContain('unexpected error');
      expect(result.retryable).toBe(true);
    });

    it('should return correct message for 503', () => {
      const result = getErrorMessage({}, { statusCode: 503 });

      expect(result.code).toBe('HTTP_503');
      expect(result.userMessage).toContain('temporarily unavailable');
      expect(result.retryable).toBe(true);
    });
  });

  describe('Default Error Handling', () => {
    it('should return default message for unknown error', () => {
      const error = { unknownField: 'value' };
      const result = getErrorMessage(error);

      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.userMessage).toContain('unexpected error');
      expect(result.retryable).toBe(true);
    });

    it('should preserve original error message', () => {
      const error = { message: 'Custom error message' };
      const result = getErrorMessage(error);

      expect(result.originalMessage).toBe('Custom error message');
    });

    it('should handle error string in error field', () => {
      const error = { error: 'Simple error string' };
      const result = getErrorMessage(error);

      expect(result.originalMessage).toBe('Simple error string');
    });

    it('should handle nested error object', () => {
      const error = { error: { message: 'Nested error message' } };
      const result = getErrorMessage(error);

      expect(result.originalMessage).toBe('Nested error message');
    });
  });
});

describe('isRetryableError', () => {
  it('should return true for network errors', () => {
    const networkError = new TypeError('fetch failed');
    expect(isRetryableError(networkError)).toBe(true);
  });

  it('should return true for 5xx errors', () => {
    expect(isRetryableError({}, 500)).toBe(true);
    expect(isRetryableError({}, 502)).toBe(true);
    expect(isRetryableError({}, 503)).toBe(true);
    expect(isRetryableError({}, 504)).toBe(true);
  });

  it('should return true for 429 rate limit', () => {
    expect(isRetryableError({}, 429)).toBe(true);
  });

  it('should return false for 4xx client errors', () => {
    expect(isRetryableError({}, 400)).toBe(false);
    expect(isRetryableError({}, 401)).toBe(false);
    expect(isRetryableError({}, 403)).toBe(false);
    expect(isRetryableError({}, 404)).toBe(false);
  });

  it('should return false for non-retryable error codes', () => {
    expect(isRetryableError({ code: 'REG_001' })).toBe(false); // Email exists
    expect(isRetryableError({ code: 'REG_002' })).toBe(false); // Invalid token
    expect(isRetryableError({ code: 'invalid_client' })).toBe(false); // OAuth config error
  });

  it('should return true for explicitly retryable error codes', () => {
    expect(isRetryableError({ code: 'REG_005' })).toBe(true); // Room creation failed
    expect(isRetryableError({ code: 'popup_blocked' })).toBe(true); // Popup blocked
  });
});

describe('calculateRetryDelay', () => {
  it('should return 1000ms for first attempt', () => {
    expect(calculateRetryDelay(0)).toBe(1000);
  });

  it('should return 2000ms for second attempt', () => {
    expect(calculateRetryDelay(1)).toBe(2000);
  });

  it('should return 4000ms for third attempt', () => {
    expect(calculateRetryDelay(2)).toBe(4000);
  });

  it('should cap at 4000ms for higher attempts', () => {
    expect(calculateRetryDelay(3)).toBe(4000);
    expect(calculateRetryDelay(10)).toBe(4000);
  });
});

describe('retryWithBackoff', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return result on first success', async () => {
    const fn = vi.fn().mockResolvedValue({ ok: true, data: 'success' });

    const resultPromise = retryWithBackoff(fn);
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result).toEqual({ ok: true, data: 'success' });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on retryable error', async () => {
    const fn = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Server Error',
        clone: () => ({
          json: () => Promise.resolve({ error: 'Server Error' }),
        }),
      })
      .mockResolvedValueOnce({ ok: true, data: 'success' });

    const resultPromise = retryWithBackoff(fn, { maxRetries: 3 });
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result).toEqual({ ok: true, data: 'success' });
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should not retry on non-retryable error', async () => {
    const fn = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      clone: () => ({
        json: () => Promise.resolve({ error: 'Unauthorized' }),
      }),
    });

    const resultPromise = retryWithBackoff(fn, { maxRetries: 3 });
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result.ok).toBe(false);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should call onRetry callback', async () => {
    const onRetry = vi.fn();
    const fn = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Error',
        clone: () => ({
          json: () => Promise.resolve({ error: 'Error' }),
        }),
      })
      .mockResolvedValueOnce({ ok: true });

    const resultPromise = retryWithBackoff(fn, { maxRetries: 3, onRetry });
    await vi.runAllTimersAsync();
    await resultPromise;

    expect(onRetry).toHaveBeenCalledWith(1, expect.any(Number), expect.any(Object));
  });

  it('should handle thrown errors', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValueOnce({ ok: true, data: 'success' });

    const resultPromise = retryWithBackoff(fn, { maxRetries: 3 });
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result).toEqual({ ok: true, data: 'success' });
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe('logError', () => {
  it('should return structured log data', () => {
    const error = new Error('Test error');
    const result = logError(error, { endpoint: '/api/test' });

    expect(result).toHaveProperty('timestamp');
    expect(result).toHaveProperty('code');
    expect(result).toHaveProperty('message');
    expect(result).toHaveProperty('category');
    expect(result.context.endpoint).toBe('/api/test');
  });

  it('should handle error objects with code', () => {
    const error = { code: 'REG_001', message: 'Email exists' };
    const result = logError(error, { operation: 'register' });

    expect(result.code).toBe('REG_001');
    expect(result.context.operation).toBe('register');
  });

  it('should include stack trace when available', () => {
    const error = new Error('Test error');
    const result = logError(error);

    expect(result.stack).toBeDefined();
  });

  it('should categorize the error', () => {
    const error = { code: 'REG_001' };
    const result = logError(error);

    expect(result.category).toBe(ErrorCategory.BUSINESS_LOGIC);
  });
});
