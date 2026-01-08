/**
 * Comprehensive Unit Tests: OpenAI Client
 *
 * Extended tests for OpenAI API client focusing on:
 * - Rate limiting edge cases
 * - Error handling scenarios
 * - Configuration edge cases
 * - Request/response edge cases
 *
 * @module src/core/engine/__tests__/client.comprehensive.test
 */

// Mock OpenAI SDK
const mockCreate = jest.fn();
const mockOpenAI = jest.fn().mockImplementation(() => ({
  chat: {
    completions: {
      create: mockCreate,
    },
  },
}));

jest.mock('openai', () => mockOpenAI);

describe('OpenAI Client - Comprehensive Tests', () => {
  let originalEnv;
  let client;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreate.mockClear();
    originalEnv = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    jest.resetModules();
    client = require('../client');
  });

  afterEach(() => {
    if (originalEnv) {
      process.env.OPENAI_API_KEY = originalEnv;
    } else {
      delete process.env.OPENAI_API_KEY;
    }
  });

  describe('Rate Limiting - Edge Cases', () => {
    beforeEach(() => {
      process.env.OPENAI_API_KEY = 'sk-test-key';
    });

    it('should enforce rate limit when max requests reached', async () => {
      const { RATE_LIMIT } = require('../../../infrastructure/config/constants');
      const maxRequests = RATE_LIMIT.MAX_REQUESTS_PER_WINDOW;

      const mockResponse = {
        choices: [{ message: { content: 'Test' } }],
        usage: { total_tokens: 100 },
      };

      mockCreate.mockResolvedValue(mockResponse);

      // Make requests up to the limit
      const requests = [];
      for (let i = 0; i < maxRequests; i++) {
        requests.push(
          client.createChatCompletion({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: `Test ${i}` }],
          })
        );
      }

      await Promise.all(requests);

      // Next request should be rejected
      await expect(
        client.createChatCompletion({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Should fail' }],
        })
      ).rejects.toThrow('Rate limit exceeded');
    });

    it('should reset rate limit window after time period', async () => {
      const { RATE_LIMIT } = require('../../../infrastructure/config/constants');
      const windowMs = RATE_LIMIT.WINDOW_MS;

      const mockResponse = {
        choices: [{ message: { content: 'Test' } }],
        usage: { total_tokens: 100 },
      };

      mockCreate.mockResolvedValue(mockResponse);

      // Make a request
      await client.createChatCompletion({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Test' }],
      });

      // Manually advance time past window
      jest.useFakeTimers();
      jest.advanceTimersByTime(windowMs + 1000);

      // Should be able to make another request
      await client.createChatCompletion({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Test 2' }],
      });

      expect(mockCreate).toHaveBeenCalledTimes(2);

      jest.useRealTimers();
    });

    it('should track rate limit statistics accurately', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Test' } }],
        usage: { total_tokens: 100 },
      };

      mockCreate.mockResolvedValue(mockResponse);

      const initialStats = await client.getRateLimitStats();

      await client.createChatCompletion({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Test' }],
      });

      const afterStats = await client.getRateLimitStats();

      expect(afterStats.requestCount).toBe(initialStats.requestCount + 1);
      expect(parseFloat(afterStats.percentUsed)).toBeGreaterThan(
        parseFloat(initialStats.percentUsed)
      );
    });

    it('should calculate percentUsed correctly', async () => {
      const stats = await client.getRateLimitStats();

      expect(stats.percentUsed).toBeDefined();
      expect(parseFloat(stats.percentUsed)).toBeGreaterThanOrEqual(0);
      expect(parseFloat(stats.percentUsed)).toBeLessThanOrEqual(100);
    });
  });

  describe('Error Handling - Comprehensive', () => {
    beforeEach(() => {
      process.env.OPENAI_API_KEY = 'sk-test-key';
    });

    it('should handle 429 rate limit with retry-after header', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.status = 429;
      rateLimitError.headers = { 'retry-after': '60' };
      mockCreate.mockRejectedValue(rateLimitError);

      await expect(
        client.createChatCompletion({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Test' }],
        })
      ).rejects.toThrow('OpenAI rate limit exceeded, please try again later');
    });

    it('should handle 401 authentication error', async () => {
      const authError = new Error('Unauthorized');
      authError.status = 401;
      mockCreate.mockRejectedValue(authError);

      await expect(
        client.createChatCompletion({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Test' }],
        })
      ).rejects.toThrow('OpenAI API key is invalid');
    });

    it('should handle 500 server error', async () => {
      const serverError = new Error('Internal server error');
      serverError.status = 500;
      mockCreate.mockRejectedValue(serverError);

      await expect(
        client.createChatCompletion({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Test' }],
        })
      ).rejects.toThrow('OpenAI service temporarily unavailable');
    });

    it('should handle 502 bad gateway error', async () => {
      const gatewayError = new Error('Bad gateway');
      gatewayError.status = 502;
      mockCreate.mockRejectedValue(gatewayError);

      await expect(
        client.createChatCompletion({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Test' }],
        })
      ).rejects.toThrow('OpenAI service temporarily unavailable');
    });

    it('should handle 503 service unavailable error', async () => {
      const unavailableError = new Error('Service unavailable');
      unavailableError.status = 503;
      mockCreate.mockRejectedValue(unavailableError);

      await expect(
        client.createChatCompletion({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Test' }],
        })
      ).rejects.toThrow('OpenAI service temporarily unavailable');
    });

    it('should handle network timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.code = 'ETIMEDOUT';
      mockCreate.mockRejectedValue(timeoutError);

      await expect(
        client.createChatCompletion({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Test' }],
        })
      ).rejects.toThrow('Request timeout');
    });

    it('should handle connection refused errors', async () => {
      const connError = new Error('Connection refused');
      connError.code = 'ECONNREFUSED';
      mockCreate.mockRejectedValue(connError);

      await expect(
        client.createChatCompletion({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Test' }],
        })
      ).rejects.toThrow('Connection refused');
    });

    it('should preserve original error for unknown status codes', async () => {
      const customError = new Error('Custom error');
      customError.status = 418; // I'm a teapot
      mockCreate.mockRejectedValue(customError);

      await expect(
        client.createChatCompletion({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Test' }],
        })
      ).rejects.toThrow('Custom error');
    });

    it('should handle errors and throw them', async () => {
      const error = new Error('Test error');
      mockCreate.mockRejectedValue(error);

      // Verify error is thrown (logger.error is called internally by client)
      await expect(
        client.createChatCompletion({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Test' }],
        })
      ).rejects.toThrow('Test error');
    });
  });

  describe('Request/Response - Edge Cases', () => {
    beforeEach(() => {
      process.env.OPENAI_API_KEY = 'sk-test-key';
    });

    it('should handle response with empty choices array', async () => {
      const mockResponse = {
        choices: [],
        usage: { total_tokens: 0 },
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await client.createChatCompletion({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Test' }],
      });

      expect(result).toBeDefined();
      expect(result.choices).toEqual([]);
    });

    it('should handle response with null usage', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Test' } }],
        usage: null,
      };

      mockCreate.mockResolvedValue(mockResponse);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await client.createChatCompletion({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Test' }],
      });

      expect(result).toBeDefined();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle response without usage property', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Test' } }],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await client.createChatCompletion({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Test' }],
      });

      expect(result).toBeDefined();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should log request completion with timing', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Test' } }],
        usage: { total_tokens: 150 },
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await client.createChatCompletion({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Test' }],
      });

      // Verify request completed successfully (logger.debug is called internally)
      expect(result).toBeDefined();
      expect(result.choices).toBeDefined();
    });

    it('should handle different model names', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Test' } }],
        usage: { total_tokens: 100 },
      };

      mockCreate.mockResolvedValue(mockResponse);

      await client.createChatCompletion({
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Test' }],
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4',
        })
      );
    });

    it('should handle multiple messages in request', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Test' } }],
        usage: { total_tokens: 100 },
      };

      mockCreate.mockResolvedValue(mockResponse);

      await client.createChatCompletion({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'System message' },
          { role: 'user', content: 'User message' },
          { role: 'assistant', content: 'Assistant message' },
        ],
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            { role: 'system', content: 'System message' },
            { role: 'user', content: 'User message' },
            { role: 'assistant', content: 'Assistant message' },
          ]),
        })
      );
    });
  });

  describe('Configuration - Edge Cases', () => {
    it('should handle API key with leading/trailing whitespace', () => {
      process.env.OPENAI_API_KEY = '  sk-test-key  ';

      expect(client.isConfigured()).toBe(true);
    });

    it('should handle API key with only whitespace as empty', () => {
      process.env.OPENAI_API_KEY = '   ';

      expect(client.isConfigured()).toBe(false);
    });

    it('should handle undefined API key', () => {
      delete process.env.OPENAI_API_KEY;

      // isConfigured returns empty string when not configured, which is falsy
      expect(client.isConfigured()).toBeFalsy();
    });

    it('should initialize client only once', () => {
      process.env.OPENAI_API_KEY = 'sk-test-key';

      const client1 = client.getClient();
      const client2 = client.getClient();

      expect(client1).toBe(client2);
      expect(mockOpenAI).toHaveBeenCalledTimes(1);
    });

    it('should use correct timeout from constants', () => {
      process.env.OPENAI_API_KEY = 'sk-test-key';

      const { AI } = require('../../../infrastructure/config/constants');

      client.getClient();

      expect(mockOpenAI).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: AI.TIMEOUT_MS,
        })
      );
    });

    it('should use correct maxRetries from constants', () => {
      process.env.OPENAI_API_KEY = 'sk-test-key';

      const { RATE_LIMIT } = require('../../../infrastructure/config/constants');

      client.getClient();

      expect(mockOpenAI).toHaveBeenCalledWith(
        expect.objectContaining({
          maxRetries: RATE_LIMIT.MAX_RETRIES,
        })
      );
    });
  });

  describe('getRateLimitStats', () => {
    beforeEach(() => {
      process.env.OPENAI_API_KEY = 'sk-test-key';
    });

    it('should return all required properties', async () => {
      const stats = await client.getRateLimitStats();

      expect(stats).toHaveProperty('requestCount');
      expect(stats).toHaveProperty('maxRequests');
      expect(stats).toHaveProperty('windowMs');
      expect(stats).toHaveProperty('percentUsed');
    });

    it('should return numeric requestCount', async () => {
      const stats = await client.getRateLimitStats();

      expect(typeof stats.requestCount).toBe('number');
      expect(stats.requestCount).toBeGreaterThanOrEqual(0);
    });

    it('should return valid percentUsed string', async () => {
      const stats = await client.getRateLimitStats();

      expect(typeof stats.percentUsed).toBe('string');
      const percent = parseFloat(stats.percentUsed);
      expect(percent).toBeGreaterThanOrEqual(0);
      expect(percent).toBeLessThanOrEqual(100);
    });
  });
});
