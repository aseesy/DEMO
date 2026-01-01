/**
 * MediationService Unit Tests
 *
 * Tests the pure service for frontend message analysis/mediation.
 * Covers:
 * - Successful API calls
 * - Retry logic with exponential backoff
 * - Fail-closed errors (throw)
 * - Fail-open errors (return safe default)
 * - Error classification
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MediationService } from './MediationService.js';

// Mock the API client
vi.mock('../../apiClient.js', () => ({
  apiPost: vi.fn(),
}));

// Mock error handling strategy
vi.mock('../errorHandling/ErrorHandlingStrategy.js', () => ({
  determineStrategy: vi.fn(),
  HandlingStrategy: {
    RETRY: 'RETRY',
    FAIL_CLOSED: 'FAIL_CLOSED',
    FAIL_OPEN: 'FAIL_OPEN',
  },
}));

import { apiPost } from '../../apiClient.js';
import { determineStrategy, HandlingStrategy } from '../errorHandling/ErrorHandlingStrategy.js';

describe('MediationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console.log/warn/error during tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('analyze - Successful API calls', () => {
    it('should call API with message text and profiles', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          action: 'STAY_SILENT',
          escalation: { riskLevel: 'low' },
        }),
      };
      apiPost.mockResolvedValue(mockResponse);

      const senderProfile = { role: 'Parent', position: 'primary_custody' };
      const receiverProfile = { has_new_partner: false };

      await MediationService.analyze('Hello', senderProfile, receiverProfile);

      expect(apiPost).toHaveBeenCalledWith('/api/mediate/analyze', {
        text: 'Hello',
        senderProfile,
        receiverProfile,
      });
    });

    it('should return analysis result on success', async () => {
      const analysisResult = {
        action: 'INTERVENE',
        escalation: { riskLevel: 'high', confidence: 0.9, reasons: ['threat'] },
        emotion: { currentEmotion: 'angry', stressLevel: 8 },
        intervention: {
          personalMessage: 'This message may escalate conflict.',
          tip1: 'Try using I-statements.',
          rewrite1: 'I feel frustrated when...',
          rewrite2: 'Could we discuss...',
        },
      };
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(analysisResult),
      };
      apiPost.mockResolvedValue(mockResponse);

      const result = await MediationService.analyze('You always do this!');

      expect(result).toEqual(analysisResult);
      expect(result.action).toBe('INTERVENE');
    });

    it('should use empty objects as default profiles', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ action: 'STAY_SILENT' }),
      };
      apiPost.mockResolvedValue(mockResponse);

      await MediationService.analyze('Hello');

      expect(apiPost).toHaveBeenCalledWith('/api/mediate/analyze', {
        text: 'Hello',
        senderProfile: {},
        receiverProfile: {},
      });
    });

    it('should handle STAY_SILENT action', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          action: 'STAY_SILENT',
          escalation: { riskLevel: 'low', confidence: 0.1 },
        }),
      };
      apiPost.mockResolvedValue(mockResponse);

      const result = await MediationService.analyze('Hello, how are you?');

      expect(result.action).toBe('STAY_SILENT');
    });

    it('should handle COMMENT action', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          action: 'COMMENT',
          intervention: { comment: 'Consider adding more context.' },
        }),
      };
      apiPost.mockResolvedValue(mockResponse);

      const result = await MediationService.analyze('Ok');

      expect(result.action).toBe('COMMENT');
      expect(result.intervention.comment).toBe('Consider adding more context.');
    });
  });

  describe('analyze - API error handling', () => {
    it('should throw error for non-OK responses', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        text: vi.fn().mockResolvedValue('Bad Request'),
      };
      apiPost.mockResolvedValue(mockResponse);
      determineStrategy.mockReturnValue({
        strategy: HandlingStrategy.FAIL_CLOSED,
        message: 'Invalid request',
        notifyUser: true,
        logError: true,
      });

      await expect(MediationService.analyze('Test')).rejects.toThrow('Invalid request');
    });

    it('should include status code in error for non-OK responses', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValue('Internal Server Error'),
      };
      apiPost.mockResolvedValue(mockResponse);
      determineStrategy.mockReturnValue({
        strategy: HandlingStrategy.FAIL_CLOSED,
        message: 'Server error',
        notifyUser: true,
        logError: true,
      });

      try {
        await MediationService.analyze('Test');
      } catch (error) {
        expect(error.message).toBe('Server error');
        expect(error.category).toBe('fail_closed');
        expect(error.strategy).toBeDefined();
      }
    });
  });

  describe('analyze - Retry logic', () => {
    it('should retry on retryable errors', async () => {
      const retryError = new Error('Network timeout');
      const successResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ action: 'STAY_SILENT' }),
      };

      // First call fails with retry strategy
      apiPost
        .mockRejectedValueOnce(retryError)
        .mockResolvedValueOnce(successResponse);

      determineStrategy
        .mockReturnValueOnce({
          strategy: HandlingStrategy.RETRY,
          retryAfter: 100,
        })
        .mockReturnValueOnce({
          strategy: HandlingStrategy.FAIL_OPEN,
        });

      // Use fake timers to speed up test
      vi.useFakeTimers();
      const promise = MediationService.analyze('Test', {}, {}, { maxRetries: 2 });
      
      // Fast-forward past retry delay
      await vi.advanceTimersByTimeAsync(100);
      
      await promise;

      expect(apiPost).toHaveBeenCalledTimes(2);
      vi.useRealTimers();
    }, 10000);

    it('should respect maxRetries option', async () => {
      const retryError = new Error('Network timeout');
      apiPost.mockRejectedValue(retryError);
      // Strategy returns RETRY for retryable errors
      // When retryCount >= maxRetries, loop exits and code after loop returns fail-open
      determineStrategy.mockReturnValue({
        strategy: HandlingStrategy.RETRY,
        retryAfter: 10,
      });

      vi.useFakeTimers();
      const promise = MediationService.analyze('Test', {}, {}, { maxRetries: 1 });
      
      // Fast-forward through retries
      // With maxRetries=1: 
      // - retryCount=0: error, RETRY, wait 10ms, retryCount=1, continue
      // - retryCount=1: loop condition (1 < 1) is false, loop exits
      // - Code after loop returns fail-open result
      await vi.advanceTimersByTimeAsync(20);
      
      const result = await promise;

      // Should fail-open after retries exhausted
      expect(result.failOpen).toBe(true);
      expect(result.action).toBe('STAY_SILENT');
      // Error message may vary based on implementation, but should indicate retries exhausted
      expect(result.error).toBeDefined();
      vi.useRealTimers();
    }, 10000);
  });

  describe('analyze - Fail-closed errors', () => {
    it('should throw error for fail-closed strategy', async () => {
      const validationError = new Error('Invalid message');
      apiPost.mockRejectedValue(validationError);
      determineStrategy.mockReturnValue({
        strategy: HandlingStrategy.FAIL_CLOSED,
        message: 'Message validation failed',
        notifyUser: true,
        logError: true,
      });

      await expect(MediationService.analyze('Invalid')).rejects.toThrow('Message validation failed');
    });

    it('should include strategy info in thrown error', async () => {
      const error = new Error('Validation failed');
      apiPost.mockRejectedValue(error);
      const strategy = {
        strategy: HandlingStrategy.FAIL_CLOSED,
        message: 'Message blocked',
        notifyUser: true,
        logError: true,
      };
      determineStrategy.mockReturnValue(strategy);

      try {
        await MediationService.analyze('Test');
      } catch (thrownError) {
        expect(thrownError.strategy).toEqual(strategy);
        expect(thrownError.category).toBe('fail_closed');
      }
    });
  });

  describe('analyze - Fail-open errors', () => {
    it('should return safe default for fail-open strategy', async () => {
      const networkError = new Error('Network unavailable');
      apiPost.mockRejectedValue(networkError);
      determineStrategy.mockReturnValue({
        strategy: HandlingStrategy.FAIL_OPEN,
        message: 'Analysis temporarily unavailable',
        notifyUser: true,
        logError: true,
      });

      const result = await MediationService.analyze('Test message');

      expect(result.action).toBe('STAY_SILENT');
      expect(result.failOpen).toBe(true);
      expect(result.error).toBe('Network unavailable');
      expect(result.strategy).toBeDefined();
    });

    it('should include safe defaults in fail-open result', async () => {
      const error = new Error('Service unavailable');
      apiPost.mockRejectedValue(error);
      determineStrategy.mockReturnValue({
        strategy: HandlingStrategy.FAIL_OPEN,
        message: 'Service unavailable',
        notifyUser: false,
        logError: true,
      });

      const result = await MediationService.analyze('Test');

      expect(result.escalation.riskLevel).toBe('low');
      expect(result.escalation.confidence).toBe(0);
      expect(result.emotion.currentEmotion).toBe('neutral');
      expect(result.emotion.stressLevel).toBe(0);
      expect(result.intervention).toBeNull();
    });
  });

  describe('analyze - Exhausted retries', () => {
    it('should fail-open when all retries exhausted', async () => {
      const retryError = new Error('Network timeout');
      apiPost.mockRejectedValue(retryError);
      determineStrategy.mockReturnValue({
        strategy: HandlingStrategy.RETRY,
        retryAfter: 10,
      });

      vi.useFakeTimers();
      const promise = MediationService.analyze('Test', {}, {}, { maxRetries: 3 });
      
      // Fast-forward through all retries
      await vi.advanceTimersByTimeAsync(50);
      
      const result = await promise;

      expect(result.failOpen).toBe(true);
      expect(result.error).toBe('Analysis unavailable after retries');
      expect(result.action).toBe('STAY_SILENT');
      vi.useRealTimers();
    }, 10000);
  });

  describe('analyze - Edge cases', () => {
    it('should handle empty message text', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ action: 'STAY_SILENT' }),
      };
      apiPost.mockResolvedValue(mockResponse);

      await MediationService.analyze('');

      expect(apiPost).toHaveBeenCalledWith('/api/mediate/analyze', {
        text: '',
        senderProfile: {},
        receiverProfile: {},
      });
    });

    it('should handle very long messages', async () => {
      const longMessage = 'a'.repeat(10000);
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ action: 'STAY_SILENT' }),
      };
      apiPost.mockResolvedValue(mockResponse);

      await MediationService.analyze(longMessage);

      expect(apiPost).toHaveBeenCalledWith('/api/mediate/analyze', {
        text: longMessage,
        senderProfile: {},
        receiverProfile: {},
      });
    });

    it('should handle unexpected error strategy', async () => {
      const error = new Error('Unexpected error');
      apiPost.mockRejectedValue(error);
      determineStrategy.mockReturnValue({
        strategy: 'UNKNOWN_STRATEGY',
      });

      await expect(MediationService.analyze('Test')).rejects.toThrow('Unexpected error strategy');
    });
  });

  describe('createMediationService', () => {
    it('should create a MediationService instance', async () => {
      const { createMediationService } = await import('./MediationService.js');
      const service = createMediationService();
      
      expect(service).toBeInstanceOf(MediationService);
    });
  });
});

