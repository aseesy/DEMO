/**
 * Tests for Pattern Intent Connector
 *
 * @module liaizen/core/__tests__/patternIntentConnector.test
 */

const connector = require('../patternIntentConnector');
const behavioralPatternAnalyzer = require('../behavioralPatternAnalyzer');
const intentExtractor = require('../intentExtractor');

describe('Pattern Intent Connector', () => {
  describe('connectPatternToIntent', () => {
    it('should connect character attack to scheduling need', () => {
      const pattern = {
        pattern: {
          id: 'CHARACTER_ATTACK',
          name: 'Character Attack',
          alternative: 'Focusing on specific behaviors',
        },
        confidence: 90,
      };

      const intent = {
        intent: {
          id: 'SCHEDULING_NEED',
          name: 'Scheduling Need',
        },
        confidence: 85,
      };

      const connection = connector.connectPatternToIntent(pattern, intent);

      expect(connection).toBeTruthy();
      expect(connection.pattern.id).toBe('CHARACTER_ATTACK');
      expect(connection.intent.id).toBe('SCHEDULING_NEED');
      expect(connection.explanation).toContain("won't help you change the meeting time");
      expect(connection.alternative).toBeTruthy();
    });

    it('should connect making assumptions to information need', () => {
      const pattern = {
        pattern: {
          id: 'MAKING_ASSUMPTIONS',
          name: 'Making Assumptions',
          alternative: 'Asking questions to understand',
        },
        confidence: 75,
      };

      const intent = {
        intent: {
          id: 'INFORMATION_NEED',
          name: 'Information Need',
        },
        confidence: 80,
      };

      const connection = connector.connectPatternToIntent(pattern, intent);

      expect(connection).toBeTruthy();
      expect(connection.explanation).toContain("won't get you the clarification");
    });

    it('should generate generic connection for unknown combinations', () => {
      const pattern = {
        pattern: {
          id: 'MAKING_ASSUMPTIONS',
          name: 'Making Assumptions',
          alternative: 'Asking questions',
        },
        confidence: 70,
      };

      const intent = {
        intent: {
          id: 'ACKNOWLEDGMENT_NEED',
          name: 'Acknowledgment Need',
        },
        confidence: 65,
      };

      const connection = connector.connectPatternToIntent(pattern, intent);

      expect(connection).toBeTruthy();
      expect(connection.source).toBe('generic');
      expect(connection.explanation).toContain("won't help you");
    });
  });

  describe('connectPatternsToIntent', () => {
    it('should connect behavioral analysis to intent analysis', () => {
      const parsed = {
        raw: 'Your mom is more sane then you at this point',
        axiomsFired: [
          {
            id: 'AXIOM_D101',
            name: 'Direct Insult',
            confidence: 95,
          },
        ],
        linguistic: {
          tokens: [],
          intensifiers: [],
        },
      };

      const behavioralAnalysis = behavioralPatternAnalyzer.analyzeBehavioralPatterns(parsed);
      const intentAnalysis = intentExtractor.extractUserIntent({
        messageText: parsed.raw,
        recentMessages: [
          { username: 'alice', text: 'Can we change the meeting time?' },
          { username: 'alice', text: "3pm doesn't work for me" },
        ],
        senderId: 'alice',
      });

      const connectionResult = connector.connectPatternsToIntent(
        behavioralAnalysis,
        intentAnalysis,
        parsed.raw
      );

      expect(connectionResult.connections.length).toBeGreaterThan(0);
      expect(connectionResult.primaryConnection).toBeTruthy();
      expect(connectionResult.primaryConnection.pattern.id).toBe('CHARACTER_ATTACK');
      expect(connectionResult.primaryConnection.intent.id).toBe('SCHEDULING_NEED');
    });

    it('should handle missing analysis gracefully', () => {
      const result = connector.connectPatternsToIntent(null, null);

      expect(result.connections).toEqual([]);
      expect(result.primaryConnection).toBeNull();
      expect(result.meta.error).toBe('Missing analysis data');
    });

    it('should handle analysis without primary pattern or intent', () => {
      const behavioralAnalysis = {
        patterns: [],
        primaryPattern: null,
        meta: {},
      };

      const intentAnalysis = {
        intents: [],
        primaryIntent: null,
        meta: {},
      };

      const result = connector.connectPatternsToIntent(behavioralAnalysis, intentAnalysis);

      expect(result.connections).toEqual([]);
      expect(result.primaryConnection).toBeNull();
    });
  });

  describe('formatConnectionForPrompt', () => {
    it('should format connection for AI prompt', () => {
      const connection = {
        pattern: {
          id: 'CHARACTER_ATTACK',
          name: 'Character Attack',
        },
        intent: {
          id: 'SCHEDULING_NEED',
          name: 'Scheduling Need',
        },
        explanation: "Attacking their character won't help you change the meeting time",
        alternative: 'Focus on the schedule: "I need to change our meeting time."',
      };

      const formatted = connector.formatConnectionForPrompt(connection);

      expect(formatted).toContain('Character Attack');
      expect(formatted).toContain('Scheduling Need');
      expect(formatted).toContain("won't help you change the meeting time");
      expect(formatted).toContain('Alternative approach');
    });

    it('should return empty string for null connection', () => {
      const formatted = connector.formatConnectionForPrompt(null);

      expect(formatted).toBe('');
    });
  });
});
