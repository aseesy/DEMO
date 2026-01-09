/**
 * Tests for Behavioral Pattern Analyzer
 *
 * @module liaizen/core/__tests__/behavioralPatternAnalyzer.test
 */

const analyzer = require('../behavioralPatternAnalyzer');

describe('Behavioral Pattern Analyzer', () => {
  describe('analyzeBehavioralPatterns', () => {
    it('should detect character attack from direct insult axiom', () => {
      const parsed = {
        raw: "You're such a bitch",
        axiomsFired: [
          {
            id: 'AXIOM_D101',
            name: 'Direct Insult',
            category: 'direct_hostility',
            confidence: 95,
          },
        ],
        linguistic: {
          tokens: [],
          intensifiers: [],
        },
      };

      const result = analyzer.analyzeBehavioralPatterns(parsed);

      expect(result.patterns.length).toBeGreaterThan(0);
      expect(result.primaryPattern).toBeTruthy();
      expect(result.primaryPattern.pattern.id).toBe('CHARACTER_ATTACK');
    });

    it('should detect making assumptions pattern', () => {
      const parsed = {
        raw: "You're always late and you don't care",
        axiomsFired: [],
        linguistic: {
          tokens: [],
          intensifiers: ['always'],
        },
      };

      const result = analyzer.analyzeBehavioralPatterns(parsed);

      const makingAssumptions = result.patterns.find(p => p.pattern.id === 'MAKING_ASSUMPTIONS');
      expect(makingAssumptions).toBeTruthy();
    });

    it('should detect avoiding responsibility', () => {
      const parsed = {
        raw: "It's all your fault that this happened",
        axiomsFired: [],
        linguistic: {
          tokens: [],
          intensifiers: [],
        },
      };

      const result = analyzer.analyzeBehavioralPatterns(parsed);

      const avoidingResponsibility = result.patterns.find(
        p => p.pattern.id === 'AVOIDING_RESPONSIBILITY'
      );
      expect(avoidingResponsibility).toBeTruthy();
    });

    it('should detect triangulation from child as messenger axiom', () => {
      const parsed = {
        raw: 'She said you forgot to pick her up again',
        axiomsFired: [
          {
            id: 'AXIOM_010',
            name: 'Child as Messenger',
            category: 'indirect_communication',
            confidence: 90,
          },
        ],
        linguistic: {
          tokens: [],
          intensifiers: [],
        },
      };

      const result = analyzer.analyzeBehavioralPatterns(parsed);

      const triangulation = result.patterns.find(p => p.pattern.id === 'TRIANGULATION');
      expect(triangulation).toBeTruthy();
    });

    it('should detect escalation from threat axiom', () => {
      const parsed = {
        raw: "Do this or I'll call my lawyer",
        axiomsFired: [
          {
            id: 'AXIOM_D102',
            name: 'Threat / Ultimatum',
            category: 'direct_hostility',
            confidence: 85,
          },
        ],
        linguistic: {
          tokens: [],
          intensifiers: [],
        },
      };

      const result = analyzer.analyzeBehavioralPatterns(parsed);

      const escalation = result.patterns.find(p => p.pattern.id === 'ESCALATION');
      expect(escalation).toBeTruthy();
    });

    it('should return empty patterns for clean messages', () => {
      const parsed = {
        raw: 'Can we meet at 3pm instead?',
        axiomsFired: [
          {
            id: 'AXIOM_D001',
            name: 'Clean Request',
            category: 'clean',
            confidence: 90,
          },
        ],
        linguistic: {
          tokens: [],
          intensifiers: [],
        },
      };

      const result = analyzer.analyzeBehavioralPatterns(parsed);

      // Clean axioms don't map to problematic behavioral patterns
      expect(result.patterns.length).toBe(0);
      expect(result.primaryPattern).toBeNull();
    });

    it('should handle invalid input gracefully', () => {
      const result = analyzer.analyzeBehavioralPatterns(null);

      expect(result.patterns).toEqual([]);
      expect(result.primaryPattern).toBeNull();
      expect(result.meta.error).toBe('Invalid parsed message');
    });

    it('should detect multiple patterns', () => {
      const parsed = {
        raw: "Your mom is more sane then you at this point. It's all your fault.",
        axiomsFired: [
          {
            id: 'AXIOM_D101',
            name: 'Direct Insult',
            category: 'direct_hostility',
            confidence: 90,
          },
        ],
        linguistic: {
          tokens: [],
          intensifiers: [],
        },
      };

      const result = analyzer.analyzeBehavioralPatterns(parsed);

      expect(result.patterns.length).toBeGreaterThan(1);
      expect(result.primaryPattern).toBeTruthy();
    });
  });

  describe('getBehavioralPattern', () => {
    it('should return pattern definition by ID', () => {
      const pattern = analyzer.getBehavioralPattern('MAKING_ASSUMPTIONS');

      expect(pattern).toBeTruthy();
      expect(pattern.id).toBe('MAKING_ASSUMPTIONS');
      expect(pattern.name).toBe('Making Assumptions');
      expect(pattern.description).toBeTruthy();
    });

    it('should return null for invalid pattern ID', () => {
      const pattern = analyzer.getBehavioralPattern('INVALID_PATTERN');

      expect(pattern).toBeNull();
    });
  });

  describe('listAllBehavioralPatterns', () => {
    it('should return all behavioral pattern definitions', () => {
      const patterns = analyzer.listAllBehavioralPatterns();

      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns.every(p => p.id && p.name && p.description)).toBe(true);
    });
  });
});
