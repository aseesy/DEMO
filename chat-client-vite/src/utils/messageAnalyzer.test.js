/**
 * messageAnalyzer.js Unit Tests
 *
 * Tests the Observer/Mediator framework traffic control logic.
 * Critical for ensuring AI interventions work correctly:
 * - STAY_SILENT → PASS (send message)
 * - INTERVENE → BLOCK (show Observer Card)
 * - COMMENT → PASS with comment
 * - Error handling → fail-open (PASS)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { analyzeMessage, shouldSendMessage } from './messageAnalyzer.js';

// Mock the API client
vi.mock('../apiClient.js', () => ({
  apiPost: vi.fn(),
}));

vi.mock('../config.js', () => ({
  API_BASE_URL: 'http://localhost:8080',
}));

import { apiPost } from '../apiClient.js';

describe('messageAnalyzer', () => {
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

  describe('shouldSendMessage - Traffic Control Logic', () => {
    describe('SCENARIO A: CLEAN (STAY_SILENT)', () => {
      it('should allow message when action is STAY_SILENT', () => {
        const analysis = { action: 'STAY_SILENT' };

        const result = shouldSendMessage(analysis);

        expect(result.shouldSend).toBe(true);
        expect(result.reason).toBe('clean');
        expect(result.observerData).toBeNull();
      });

      it('should work with full analysis object', () => {
        const analysis = {
          action: 'STAY_SILENT',
          escalation: { riskLevel: 'low', confidence: 0.1, reasons: [] },
          emotion: { currentEmotion: 'neutral', stressLevel: 0 },
          intervention: null,
        };

        const result = shouldSendMessage(analysis);

        expect(result.shouldSend).toBe(true);
        expect(result.reason).toBe('clean');
      });
    });

    describe('SCENARIO B: CONFLICT DETECTED (INTERVENE)', () => {
      it('should block message when action is INTERVENE', () => {
        const analysis = {
          action: 'INTERVENE',
          escalation: { riskLevel: 'high', confidence: 0.9, reasons: ['threat'] },
          intervention: {
            personalMessage: 'This message may escalate conflict.',
            tip1: 'Try using I-statements.',
            rewrite1: 'I feel frustrated when...',
            rewrite2: 'Could we discuss...',
          },
        };

        const result = shouldSendMessage(analysis);

        expect(result.shouldSend).toBe(false);
        expect(result.reason).toBe('intervention_required');
      });

      it('should include observer data with axioms fired', () => {
        const analysis = {
          action: 'INTERVENE',
          escalation: {
            riskLevel: 'high',
            confidence: 0.85,
            reasons: ['threat', 'blame', 'ultimatum'],
          },
          intervention: {
            personalMessage: 'Consider rephrasing.',
            tip1: 'Focus on the issue, not the person.',
            rewrite1: 'Alternative 1',
            rewrite2: 'Alternative 2',
          },
        };

        const result = shouldSendMessage(analysis);

        expect(result.observerData.axiomsFired).toEqual(['threat', 'blame', 'ultimatum']);
        expect(result.observerData.tip).toBe('Focus on the issue, not the person.');
        expect(result.observerData.rewrite1).toBe('Alternative 1');
        expect(result.observerData.rewrite2).toBe('Alternative 2');
      });

      it('should include escalation and emotion data', () => {
        const analysis = {
          action: 'INTERVENE',
          escalation: { riskLevel: 'high', confidence: 0.9, reasons: [] },
          emotion: { currentEmotion: 'angry', stressLevel: 8 },
          intervention: { personalMessage: 'Message' },
        };

        const result = shouldSendMessage(analysis);

        expect(result.observerData.escalation).toEqual(analysis.escalation);
        expect(result.observerData.emotion).toEqual(analysis.emotion);
      });

      it('should handle missing intervention gracefully', () => {
        const analysis = {
          action: 'INTERVENE',
          escalation: { reasons: ['detected_conflict'] },
        };

        const result = shouldSendMessage(analysis);

        expect(result.shouldSend).toBe(false);
        expect(result.observerData.explanation).toBe('');
        expect(result.observerData.tip).toBe('');
        expect(result.observerData.rewrite1).toBe('');
        expect(result.observerData.rewrite2).toBe('');
      });

      it('should handle missing escalation gracefully', () => {
        const analysis = {
          action: 'INTERVENE',
          intervention: { personalMessage: 'Message' },
        };

        const result = shouldSendMessage(analysis);

        expect(result.shouldSend).toBe(false);
        expect(result.observerData.axiomsFired).toEqual([]);
      });
    });

    describe('SCENARIO C: COMMENT', () => {
      it('should allow message with comment', () => {
        const analysis = {
          action: 'COMMENT',
          intervention: {
            comment: 'Consider adding more context.',
          },
        };

        const result = shouldSendMessage(analysis);

        expect(result.shouldSend).toBe(true);
        expect(result.reason).toBe('comment');
        expect(result.observerData.comment).toBe('Consider adding more context.');
      });

      it('should handle missing comment gracefully', () => {
        const analysis = {
          action: 'COMMENT',
          intervention: {},
        };

        const result = shouldSendMessage(analysis);

        expect(result.shouldSend).toBe(true);
        expect(result.observerData.comment).toBe('');
      });

      it('should handle missing intervention gracefully', () => {
        const analysis = {
          action: 'COMMENT',
        };

        const result = shouldSendMessage(analysis);

        expect(result.shouldSend).toBe(true);
        expect(result.observerData.comment).toBe('');
      });
    });

    describe('Edge Cases and Defaults', () => {
      it('should allow message when analysis is null', () => {
        const result = shouldSendMessage(null);

        expect(result.shouldSend).toBe(true);
        expect(result.reason).toBe('no_analysis');
        expect(result.observerData).toBeNull();
      });

      it('should allow message when analysis is undefined', () => {
        const result = shouldSendMessage(undefined);

        expect(result.shouldSend).toBe(true);
        expect(result.reason).toBe('no_analysis');
      });

      it('should default to allow for unknown action', () => {
        const analysis = {
          action: 'UNKNOWN_ACTION',
        };

        const result = shouldSendMessage(analysis);

        expect(result.shouldSend).toBe(true);
        expect(result.reason).toBe('default');
        expect(result.observerData).toBeNull();
      });

      it('should default to allow when action is missing', () => {
        const analysis = {
          escalation: { riskLevel: 'low' },
        };

        const result = shouldSendMessage(analysis);

        expect(result.shouldSend).toBe(true);
        expect(result.reason).toBe('default');
      });

      it('should default to allow for empty object', () => {
        const result = shouldSendMessage({});

        expect(result.shouldSend).toBe(true);
        expect(result.reason).toBe('default');
      });
    });
  });

  describe('analyzeMessage', () => {
    describe('successful API call', () => {
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

        const senderProfile = { role: 'parent' };
        const receiverProfile = { has_new_partner: false };

        await analyzeMessage('Hello', senderProfile, receiverProfile);

        expect(apiPost).toHaveBeenCalledWith('/api/mediate/analyze', {
          text: 'Hello',
          senderProfile,
          receiverProfile,
        });
      });

      it('should return analysis result on success', async () => {
        const analysisResult = {
          action: 'INTERVENE',
          escalation: { riskLevel: 'high', reasons: ['threat'] },
          intervention: { tip1: 'Calm down' },
        };
        const mockResponse = {
          ok: true,
          status: 200,
          json: vi.fn().mockResolvedValue(analysisResult),
        };
        apiPost.mockResolvedValue(mockResponse);

        const result = await analyzeMessage('You always do this!');

        expect(result).toEqual(analysisResult);
      });

      it('should use empty objects as default profiles', async () => {
        const mockResponse = {
          ok: true,
          status: 200,
          json: vi.fn().mockResolvedValue({ action: 'STAY_SILENT' }),
        };
        apiPost.mockResolvedValue(mockResponse);

        await analyzeMessage('Hello');

        expect(apiPost).toHaveBeenCalledWith('/api/mediate/analyze', {
          text: 'Hello',
          senderProfile: {},
          receiverProfile: {},
        });
      });
    });

    describe('API error handling', () => {
      it('should fail-open on API error (return STAY_SILENT)', async () => {
        const mockResponse = {
          ok: false,
          status: 500,
          text: vi.fn().mockResolvedValue('Internal Server Error'),
          statusText: 'Internal Server Error',
        };
        apiPost.mockResolvedValue(mockResponse);

        const result = await analyzeMessage('Test message');

        expect(result.action).toBe('STAY_SILENT');
        expect(result.error).toBeDefined();
      }, 10000); // Increase timeout to 10 seconds

      it('should fail-open on network error', async () => {
        apiPost.mockRejectedValue(new Error('Network error'));

        const result = await analyzeMessage('Test message');

        expect(result.action).toBe('STAY_SILENT');
        expect(result.error).toBe('Network error');
      });

      it('should include safe defaults on error', async () => {
        apiPost.mockRejectedValue(new Error('API failure'));

        const result = await analyzeMessage('Test message');

        expect(result.escalation.riskLevel).toBe('low');
        expect(result.escalation.confidence).toBe(0);
        expect(result.emotion.currentEmotion).toBe('neutral');
        expect(result.emotion.stressLevel).toBe(0);
        expect(result.intervention).toBeNull();
      });

      it('should fail-open on 401 unauthorized', async () => {
        const mockResponse = {
          ok: false,
          status: 401,
          text: vi.fn().mockResolvedValue('Unauthorized'),
          statusText: 'Unauthorized',
        };
        apiPost.mockResolvedValue(mockResponse);

        const result = await analyzeMessage('Test message');

        expect(result.action).toBe('STAY_SILENT');
      });

      it('should fail-open on 403 forbidden', async () => {
        const mockResponse = {
          ok: false,
          status: 403,
          text: vi.fn().mockResolvedValue('Forbidden'),
          statusText: 'Forbidden',
        };
        apiPost.mockResolvedValue(mockResponse);

        const result = await analyzeMessage('Test message');

        expect(result.action).toBe('STAY_SILENT');
      });

      it('should fail-open on timeout', async () => {
        apiPost.mockRejectedValue(new Error('Request timeout'));

        const result = await analyzeMessage('Test message');

        expect(result.action).toBe('STAY_SILENT');
        expect(result.error).toContain('timeout');
      });
    });
  });

  describe('Integration: analyzeMessage + shouldSendMessage', () => {
    it('should pass clean messages through', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ action: 'STAY_SILENT' }),
      };
      apiPost.mockResolvedValue(mockResponse);

      const analysis = await analyzeMessage('Hello, how are you?');
      const result = shouldSendMessage(analysis);

      expect(result.shouldSend).toBe(true);
    });

    it('should block messages requiring intervention', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          action: 'INTERVENE',
          escalation: { reasons: ['hostility'] },
          intervention: { tip1: 'Be kind' },
        }),
      };
      apiPost.mockResolvedValue(mockResponse);

      const analysis = await analyzeMessage('I hate everything about this!');
      const result = shouldSendMessage(analysis);

      expect(result.shouldSend).toBe(false);
      expect(result.observerData).toBeDefined();
    });

    it('should pass messages with comments', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          action: 'COMMENT',
          intervention: { comment: 'Consider elaborating' },
        }),
      };
      apiPost.mockResolvedValue(mockResponse);

      const analysis = await analyzeMessage('Ok');
      const result = shouldSendMessage(analysis);

      expect(result.shouldSend).toBe(true);
      expect(result.observerData.comment).toBe('Consider elaborating');
    });

    it('should pass messages on API failure (fail-open)', async () => {
      apiPost.mockRejectedValue(new Error('Service unavailable'));

      const analysis = await analyzeMessage('This could be hostile');
      const result = shouldSendMessage(analysis);

      // Even if message could be hostile, API failure means pass
      expect(result.shouldSend).toBe(true);
      expect(analysis.error).toBeDefined();
    });
  });
});
