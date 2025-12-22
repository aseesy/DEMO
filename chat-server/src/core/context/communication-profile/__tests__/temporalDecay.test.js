/**
 * Unit Tests: Temporal Decay
 *
 * Tests for the step-function decay algorithm used for
 * weighting communication patterns by recency.
 *
 * Feature: 002-sender-profile-mediation
 */

const temporalDecay = require('../temporalDecay');

describe('Temporal Decay Module', () => {
  describe('calculateWeight', () => {
    it('should return 1.0 for timestamps within 30 days', () => {
      const now = new Date();
      const recent = new Date(now - 15 * 24 * 60 * 60 * 1000); // 15 days ago

      expect(temporalDecay.calculateWeight(recent)).toBe(1.0);
    });

    it('should return 1.0 for today', () => {
      expect(temporalDecay.calculateWeight(new Date())).toBe(1.0);
    });

    it('should return 0.7 for timestamps 31-60 days old', () => {
      const now = new Date();
      const mediumAge = new Date(now - 45 * 24 * 60 * 60 * 1000); // 45 days ago

      expect(temporalDecay.calculateWeight(mediumAge)).toBe(0.7);
    });

    it('should return 0.3 for timestamps 61-90 days old', () => {
      const now = new Date();
      const old = new Date(now - 75 * 24 * 60 * 60 * 1000); // 75 days ago

      expect(temporalDecay.calculateWeight(old)).toBe(0.3);
    });

    it('should return 0.0 for timestamps older than 90 days', () => {
      const now = new Date();
      const veryOld = new Date(now - 100 * 24 * 60 * 60 * 1000); // 100 days ago

      expect(temporalDecay.calculateWeight(veryOld)).toBe(0.0);
    });

    it('should return 0.0 for null timestamp', () => {
      expect(temporalDecay.calculateWeight(null)).toBe(0.0);
    });

    it('should return 0.0 for undefined timestamp', () => {
      expect(temporalDecay.calculateWeight(undefined)).toBe(0.0);
    });

    it('should handle ISO string timestamps', () => {
      const now = new Date();
      const recent = new Date(now - 10 * 24 * 60 * 60 * 1000);

      expect(temporalDecay.calculateWeight(recent.toISOString())).toBe(1.0);
    });
  });

  describe('applyDecay', () => {
    it('should filter out expired items (>90 days)', () => {
      const now = new Date();
      const items = [
        { value: 'recent', timestamp: now.toISOString() },
        { value: 'old', timestamp: new Date(now - 100 * 24 * 60 * 60 * 1000).toISOString() },
      ];

      const result = temporalDecay.applyDecay(items, 'timestamp');

      expect(result).toHaveLength(1);
      expect(result[0].value).toBe('recent');
    });

    it('should add _weight property to items', () => {
      const now = new Date();
      const items = [{ value: 'test', timestamp: now.toISOString() }];

      const result = temporalDecay.applyDecay(items, 'timestamp');

      expect(result[0]._weight).toBe(1.0);
    });

    it('should sort by weight (higher first), then by timestamp (newer first)', () => {
      const now = new Date();
      const items = [
        { value: 'old', timestamp: new Date(now - 50 * 24 * 60 * 60 * 1000).toISOString() }, // 0.7
        { value: 'recent', timestamp: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString() }, // 1.0
        { value: 'medium', timestamp: new Date(now - 40 * 24 * 60 * 60 * 1000).toISOString() }, // 0.7
      ];

      const result = temporalDecay.applyDecay(items, 'timestamp');

      expect(result[0].value).toBe('recent'); // 1.0 weight
      expect(result[1].value).toBe('medium'); // 0.7 weight, newer
      expect(result[2].value).toBe('old'); // 0.7 weight, older
    });

    it('should return empty array for null input', () => {
      expect(temporalDecay.applyDecay(null)).toEqual([]);
    });

    it('should return empty array for non-array input', () => {
      expect(temporalDecay.applyDecay('not an array')).toEqual([]);
    });

    it('should use default timestamp field', () => {
      const now = new Date();
      const items = [{ value: 'test', timestamp: now.toISOString() }];

      const result = temporalDecay.applyDecay(items);

      expect(result).toHaveLength(1);
    });
  });

  describe('getDecayedPatterns', () => {
    it('should return null for null profile', () => {
      expect(temporalDecay.getDecayedPatterns(null)).toBeNull();
    });

    it('should return stale patterns for expired profile', () => {
      const now = new Date();
      const profile = {
        last_profile_update: new Date(now - 100 * 24 * 60 * 60 * 1000).toISOString(),
        communication_patterns: { tone_tendencies: ['assertive'] },
      };

      const result = temporalDecay.getDecayedPatterns(profile);

      expect(result.is_stale).toBe(true);
      expect(result.relevance_weight).toBe(0);
      expect(result.tone_tendencies).toEqual([]);
    });

    it('should preserve patterns for fresh profile', () => {
      const now = new Date();
      const profile = {
        last_profile_update: now.toISOString(),
        communication_patterns: {
          tone_tendencies: ['assertive', 'direct'],
          common_phrases: ['I think', 'In my opinion'],
          avg_message_length: 150,
        },
        triggers: {
          topics: ['schedule', 'money'],
          phrases: ['always late'],
          intensity: 0.8,
        },
      };

      const result = temporalDecay.getDecayedPatterns(profile);

      expect(result.is_stale).toBe(false);
      expect(result.relevance_weight).toBe(1.0);
      expect(result.tone_tendencies).toEqual(['assertive', 'direct']);
      expect(result.triggers.intensity).toBe(0.8);
    });

    it('should scale trigger intensity by freshness', () => {
      const now = new Date();
      const profile = {
        last_profile_update: new Date(now - 45 * 24 * 60 * 60 * 1000).toISOString(), // 0.7 weight
        triggers: {
          intensity: 1.0,
        },
      };

      const result = temporalDecay.getDecayedPatterns(profile);

      expect(result.triggers.intensity).toBe(0.7); // 1.0 * 0.7
    });

    it('should apply decay to successful rewrites', () => {
      const now = new Date();
      const profile = {
        last_profile_update: now.toISOString(),
        successful_rewrites: [
          { original: 'test1', accepted_at: now.toISOString() },
          {
            original: 'test2',
            accepted_at: new Date(now - 100 * 24 * 60 * 60 * 1000).toISOString(),
          }, // expired
        ],
      };

      const result = temporalDecay.getDecayedPatterns(profile);

      expect(result.successful_rewrites).toHaveLength(1);
      expect(result.successful_rewrites[0].original).toBe('test1');
    });

    it('should limit successful rewrites to 10', () => {
      const now = new Date();
      const rewrites = [];
      for (let i = 0; i < 15; i++) {
        rewrites.push({ original: `test${i}`, accepted_at: now.toISOString() });
      }

      const profile = {
        last_profile_update: now.toISOString(),
        successful_rewrites: rewrites,
      };

      const result = temporalDecay.getDecayedPatterns(profile);

      expect(result.successful_rewrites).toHaveLength(10);
    });
  });

  describe('needsRefresh', () => {
    it('should return true for null profile', () => {
      expect(temporalDecay.needsRefresh(null)).toBe(true);
    });

    it('should return true for profile without last_profile_update', () => {
      expect(temporalDecay.needsRefresh({})).toBe(true);
    });

    it('should return false for recently updated profile', () => {
      const profile = {
        last_profile_update: new Date().toISOString(),
      };

      expect(temporalDecay.needsRefresh(profile)).toBe(false);
    });

    it('should return true for profile older than 30 days', () => {
      const now = new Date();
      const profile = {
        last_profile_update: new Date(now - 35 * 24 * 60 * 60 * 1000).toISOString(),
      };

      expect(temporalDecay.needsRefresh(profile)).toBe(true);
    });
  });

  describe('THRESHOLDS and WEIGHTS constants', () => {
    it('should export correct thresholds', () => {
      expect(temporalDecay.THRESHOLDS.FULL).toBe(30);
      expect(temporalDecay.THRESHOLDS.REDUCED).toBe(60);
      expect(temporalDecay.THRESHOLDS.MINIMAL).toBe(90);
    });

    it('should export correct weights', () => {
      expect(temporalDecay.WEIGHTS.FULL).toBe(1.0);
      expect(temporalDecay.WEIGHTS.REDUCED).toBe(0.7);
      expect(temporalDecay.WEIGHTS.MINIMAL).toBe(0.3);
      expect(temporalDecay.WEIGHTS.EXPIRED).toBe(0.0);
    });
  });
});
