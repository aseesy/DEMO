/**
 * Dual-Brain Context Builder Tests
 *
 * Tests for the runtime synthesis component that queries
 * both PostgreSQL (narrative memory) and Neo4j (social map).
 */

// Mock the logger
jest.mock('../../src/infrastructure/logging/logger', () => {
  const mockLogger = {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnThis(),
  };
  return {
    defaultLogger: mockLogger,
    Logger: jest.fn(() => mockLogger),
  };
});

// Mock dependencies
jest.mock('../../src/core/memory/narrativeMemory', () => ({
  getUserNarrativeProfile: jest.fn(),
  findSimilarMessages: jest.fn(),
  storeMessageEmbedding: jest.fn(),
}));

jest.mock('../../src/core/intelligence/entityExtractor', () => ({
  getMessageEntityContext: jest.fn(),
}));

jest.mock('../../src/core/intelligence/socialMapBuilder', () => ({
  getSensitivePeopleForUser: jest.fn(),
  updateSocialMapFromMessage: jest.fn(),
}));

jest.mock('../../src/infrastructure/database/neo4jClient', () => ({
  getRelationshipContext: jest.fn(),
  isAvailable: jest.fn().mockReturnValue(true),
}));

// Mock preFilters to prevent early returns
jest.mock('../../src/core/engine/preFilters', () => ({
  runPreFilters: jest.fn().mockReturnValue({ shouldSkipAI: false }),
}));

const dualBrainContext = require('../../src/core/engine/contextBuilders/dualBrainContext');

const narrativeMemory = require('../../src/core/memory/narrativeMemory');
const entityExtractor = require('../../src/core/intelligence/entityExtractor');
const socialMapBuilder = require('../../src/core/intelligence/socialMapBuilder');
const neo4jClient = require('../../src/infrastructure/database/neo4jClient');

describe('DualBrainContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('buildDualBrainContext', () => {
    it('should return empty context for missing messageText', async () => {
      const result = await dualBrainContext.buildDualBrainContext(null, 1, 2, 'room-123');
      expect(result.hasContext).toBe(false);
    });

    it('should return empty context for missing senderUserId', async () => {
      const result = await dualBrainContext.buildDualBrainContext(
        'test message',
        null,
        2,
        'room-123'
      );
      expect(result.hasContext).toBe(false);
    });

    it('should return empty context for missing roomId', async () => {
      const result = await dualBrainContext.buildDualBrainContext('test message', 1, 2, null);
      expect(result.hasContext).toBe(false);
    });

    it('should build context with narrative profile', async () => {
      narrativeMemory.getUserNarrativeProfile.mockResolvedValue({
        core_values: ['fairness', 'consistency'],
        known_triggers: ['money topics'],
        communication_patterns: { uses_absolutes: 0.8 },
        conflict_themes: ['schedule'],
      });
      narrativeMemory.findSimilarMessages.mockResolvedValue([]);
      entityExtractor.getMessageEntityContext.mockResolvedValue({ entities: { people: [] } });

      const result = await dualBrainContext.buildDualBrainContext('test message', 1, 2, 'room-123');

      expect(result.hasContext).toBe(true);
      expect(result.narrativeContext.hasProfile).toBe(true);
      expect(result.narrativeContext.senderProfile.known_triggers).toContain('money topics');
    });

    it('should build context with similar messages', async () => {
      narrativeMemory.getUserNarrativeProfile.mockResolvedValue(null);
      narrativeMemory.findSimilarMessages.mockResolvedValue([
        { id: 'msg-1', text: 'Similar message 1', similarity: 0.85 },
        { id: 'msg-2', text: 'Similar message 2', similarity: 0.75 },
      ]);
      entityExtractor.getMessageEntityContext.mockResolvedValue({ entities: { people: [] } });

      const result = await dualBrainContext.buildDualBrainContext('test message', 1, 2, 'room-123');

      expect(result.hasContext).toBe(true);
      expect(result.narrativeContext.hasSimilarMessages).toBe(true);
      expect(result.narrativeContext.similarMessages.length).toBe(2);
    });

    it('should build context with mentioned people', async () => {
      narrativeMemory.getUserNarrativeProfile.mockResolvedValue(null);
      narrativeMemory.findSimilarMessages.mockResolvedValue([]);
      entityExtractor.getMessageEntityContext.mockResolvedValue({
        entities: { people: ['Grandma', 'Teacher'] },
        hasPeople: true,
      });
      neo4jClient.getRelationshipContext.mockResolvedValue({
        senderSentiments: [],
        receiverSentiments: [],
      });
      socialMapBuilder.getSensitivePeopleForUser.mockResolvedValue([]);

      const result = await dualBrainContext.buildDualBrainContext(
        'Grandma is picking up from Teacher',
        1,
        2,
        'room-123'
      );

      expect(result.hasContext).toBe(true);
      expect(result.socialContext.hasPeople).toBe(true);
      expect(result.socialContext.mentionedPeople).toContain('Grandma');
    });

    it('should detect sensitive person mentions', async () => {
      narrativeMemory.getUserNarrativeProfile.mockResolvedValue(null);
      narrativeMemory.findSimilarMessages.mockResolvedValue([]);
      entityExtractor.getMessageEntityContext.mockResolvedValue({
        entities: { people: ['New Partner'] },
        hasPeople: true,
      });
      neo4jClient.getRelationshipContext.mockResolvedValue({
        senderSentiments: [],
        receiverSentiments: [{ person: 'New Partner', type: 'DISLIKES' }],
      });
      socialMapBuilder.getSensitivePeopleForUser.mockResolvedValue(['new partner']);

      const result = await dualBrainContext.buildDualBrainContext(
        'New Partner will be there',
        1,
        2,
        'room-123'
      );

      expect(result.synthesis.warnings.some(w => w.type === 'sensitive_mention')).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      narrativeMemory.getUserNarrativeProfile.mockRejectedValue(new Error('DB error'));
      narrativeMemory.findSimilarMessages.mockRejectedValue(new Error('DB error'));
      entityExtractor.getMessageEntityContext.mockRejectedValue(new Error('API error'));

      const result = await dualBrainContext.buildDualBrainContext('test', 1, 2, 'room-123');

      // Should not throw, returns context with error
      expect(result.hasContext).toBe(false);
    });
  });

  describe('detectPatterns', () => {
    it('should detect absolute language patterns', () => {
      const similarMessages = [{ text: 'You always do this' }, { text: 'You never listen' }];
      const currentMessage = 'You always forget';

      const patterns = dualBrainContext.detectPatterns(similarMessages, currentMessage);

      const absolutePattern = patterns.find(p => p.theme === 'absolutes');
      expect(absolutePattern).toBeDefined();
      expect(absolutePattern.isRecurring).toBe(true);
    });

    it('should detect directive language patterns', () => {
      const similarMessages = [
        { text: 'You should call me first' },
        { text: 'You need to be on time' },
      ];
      const currentMessage = 'You should know better';

      const patterns = dualBrainContext.detectPatterns(similarMessages, currentMessage);

      const directivePattern = patterns.find(p => p.theme === 'directive');
      expect(directivePattern).toBeDefined();
    });

    it('should detect recurring topics', () => {
      const similarMessages = [
        { text: 'The schedule needs to change' },
        { text: 'Can we discuss the schedule again' },
        { text: 'Schedule is not working' },
      ];
      const currentMessage = 'About the schedule...';

      const patterns = dualBrainContext.detectPatterns(similarMessages, currentMessage);

      const topicPattern = patterns.find(p => p.theme === 'recurring_topic');
      expect(topicPattern).toBeDefined();
      expect(topicPattern.topic).toBe('schedule');
    });

    it('should return empty array for insufficient messages', () => {
      const patterns = dualBrainContext.detectPatterns([], 'test');
      expect(patterns).toEqual([]);
    });
  });

  describe('detectSensitivePerson', () => {
    it('should detect sensitive person mention', () => {
      const socialContext = {
        mentionedPeople: ['New Partner', 'Grandma'],
        sensitivePeople: ['new partner'],
      };

      const result = dualBrainContext.detectSensitivePerson(socialContext);

      expect(result.hasSensitiveMention).toBe(true);
      expect(result.people).toContain('new partner');
    });

    it('should return null when no sensitive mentions', () => {
      const socialContext = {
        mentionedPeople: ['Grandma', 'Teacher'],
        sensitivePeople: ['new partner'],
      };

      const result = dualBrainContext.detectSensitivePerson(socialContext);

      expect(result).toBeNull();
    });

    it('should return null for missing data', () => {
      expect(dualBrainContext.detectSensitivePerson(null)).toBeNull();
      expect(dualBrainContext.detectSensitivePerson({})).toBeNull();
    });
  });

  describe('generateSynthesis', () => {
    it('should generate sender insights from profile', () => {
      const narrativeContext = {
        senderProfile: {
          known_triggers: ['money topics', 'schedule changes'],
          communication_patterns: { uses_absolutes: 0.8 },
          conflict_themes: ['custody'],
        },
      };
      const socialContext = {};

      const synthesis = dualBrainContext.generateSynthesis(narrativeContext, socialContext, 'test');

      expect(synthesis.senderInsights.length).toBeGreaterThan(0);
      expect(synthesis.senderInsights.some(i => i.type === 'triggers')).toBe(true);
      expect(synthesis.senderInsights.some(i => i.type === 'pattern')).toBe(true);
    });

    it('should generate receiver insights and trigger warnings', () => {
      const narrativeContext = {
        receiverProfile: {
          known_triggers: ['money'],
        },
      };
      const socialContext = {};

      // The trigger 'money' should match 'money' in the message
      const synthesis = dualBrainContext.generateSynthesis(
        narrativeContext,
        socialContext,
        'Can we discuss money issues?'
      );

      expect(synthesis.receiverInsights.length).toBeGreaterThan(0);
      expect(synthesis.warnings.some(w => w.type === 'trigger_warning')).toBe(true);
    });

    it('should generate relationship insights from social context', () => {
      const narrativeContext = {};
      const socialContext = {
        relationshipContext: {
          // Implementation expects object format keyed by person name
          senderSentiment: { 'New Partner': { type: 'DISLIKES' } },
          receiverSentiment: { 'New Partner': { type: 'TRUSTS' } }, // Opposite sentiment creates contested person
        },
      };

      const synthesis = dualBrainContext.generateSynthesis(narrativeContext, socialContext, 'test');

      expect(synthesis.relationshipInsights.length).toBeGreaterThan(0);
      expect(synthesis.warnings.some(w => w.type === 'contested_person')).toBe(true);
    });

    it('should generate prompt section with high-priority warnings first', () => {
      const narrativeContext = {
        detectedPatterns: [
          { theme: 'absolutes', description: 'Uses absolutes', isRecurring: true },
        ],
      };
      const socialContext = {
        mentionedPeople: ['New Partner'],
        sensitivePeople: ['new partner'],
      };

      const synthesis = dualBrainContext.generateSynthesis(narrativeContext, socialContext, 'test');

      expect(synthesis.promptSection).toContain('⚠️ IMPORTANT CONTEXT');
    });
  });

  describe('formatSynthesisForPrompt', () => {
    it('should format synthesis with all sections', () => {
      const synthesis = {
        senderInsights: [{ type: 'triggers', insight: 'Sender trigger info' }],
        receiverInsights: [{ type: 'triggers', insight: 'Receiver sensitivity info' }],
        relationshipInsights: [{ type: 'sentiment', insight: 'Relationship info' }],
        warnings: [
          { type: 'contested', severity: 'high', message: 'High priority warning' },
          { type: 'pattern', severity: 'low', message: 'Low priority observation' },
        ],
      };

      const formatted = dualBrainContext.formatSynthesisForPrompt(synthesis);

      expect(formatted).toContain('⚠️ IMPORTANT CONTEXT');
      expect(formatted).toContain('SENDER CONTEXT');
      expect(formatted).toContain('RECEIVER CONTEXT');
      expect(formatted).toContain('RELATIONSHIP CONTEXT');
      expect(formatted).toContain('OBSERVED PATTERNS');
    });

    it('should handle empty synthesis', () => {
      const synthesis = {
        senderInsights: [],
        receiverInsights: [],
        relationshipInsights: [],
        warnings: [],
      };

      const formatted = dualBrainContext.formatSynthesisForPrompt(synthesis);

      expect(formatted).toBe('');
    });
  });

  describe('updateDualBrainFromMessage', () => {
    it('should call background update functions', () => {
      const message = { id: 'msg-123', text: 'Test message' };
      narrativeMemory.storeMessageEmbedding.mockResolvedValue(true);
      socialMapBuilder.updateSocialMapFromMessage.mockResolvedValue({ updated: true });

      // This is fire-and-forget, just verify no errors
      dualBrainContext.updateDualBrainFromMessage(message, 1, 'room-123');

      // Give time for promises to execute
      return new Promise(resolve => setTimeout(resolve, 100)).then(() => {
        expect(narrativeMemory.storeMessageEmbedding).toHaveBeenCalledWith(
          'msg-123',
          'Test message'
        );
        expect(socialMapBuilder.updateSocialMapFromMessage).toHaveBeenCalledWith(
          message,
          1,
          'room-123'
        );
      });
    });
  });
});
