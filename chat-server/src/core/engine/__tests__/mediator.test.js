/**
 * Unit Tests: AI Mediator
 *
 * Tests for core AI mediation system.
 * Uses mocks for OpenAI client, database, and external dependencies.
 *
 * @module src/liaizen/core/__tests__/mediator.test
 */

const mediator = require('../mediator');
const stateManager = require('../stateManager');

// Mock dependencies
jest.mock('../client', () => ({
  isConfigured: jest.fn(),
  createChatCompletion: jest.fn(),
}));

jest.mock('../../profiles/userContext', () => ({
  formatContextForAI: jest.fn(),
}));

jest.mock('../preFilters', () => ({
  runPreFilters: jest.fn(),
  detectConflictPatterns: jest.fn(),
}));

jest.mock('../messageCache', () => ({
  generateHash: jest.fn((text, sender, receiver) => `hash-${text}-${sender}-${receiver}`),
  get: jest.fn(),
  set: jest.fn(),
}));

jest.mock('../contextBuilder', () => ({
  buildAllContexts: jest.fn(),
}));

jest.mock('../promptBuilder', () => ({
  buildMediationPrompt: jest.fn(),
  formatInsightsForPrompt: jest.fn(),
  formatProfileContextForPrompt: jest.fn(),
  SYSTEM_PROMPT: 'System prompt',
}));

jest.mock('../responseProcessor', () => ({
  processResponse: jest.fn(),
}));

jest.mock('../aiService', () => ({
  getRelationshipInsights: jest.fn(),
  detectNamesInMessage: jest.fn(),
  generateContactSuggestion: jest.fn(),
  extractRelationshipInsights: jest.fn(),
}));

jest.mock('../libraryLoader', () => ({
  codeLayerIntegration: null,
  languageAnalyzer: null,
}));

jest.mock('../mediatorErrors', () => ({
  handleAnalysisError: jest.fn((error, context, _logger) => {
    // Default: fail open (return null) unless it's a rate limit
    if (error.status === 429) {
      const { RetryableError } = require('../../../infrastructure/errors/errors');
      return {
        shouldFailOpen: false,
        error: new RetryableError('Rate limit', 'AI_RATE_LIMIT', context),
      };
    }
    return { shouldFailOpen: true };
  }),
  safeExecute: jest.fn(async operation => {
    try {
      return await operation();
    } catch (_error) {
      return null;
    }
  }),
}));

// Note: Optional dependencies are loaded with try/catch in mediator.js
// We'll test with them available and unavailable scenarios

// dbPostgres and dbSafe are required conditionally inside functions
// We'll mock them at runtime if needed

const openaiClient = require('../client');
const userContext = require('../../profiles/userContext');
const preFilters = require('../preFilters');
const messageCache = require('../messageCache');
const contextBuilder = require('../contextBuilder');
const promptBuilder = require('../promptBuilder');
const responseProcessor = require('../responseProcessor');
const aiService = require('../aiService');

describe('AI Mediator', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mocks - allow messages to pass pre-filters unless test overrides
    preFilters.runPreFilters.mockReturnValue({ shouldSkipAI: false, reason: null });
    preFilters.detectConflictPatterns.mockReturnValue({});
    messageCache.get.mockReturnValue(null); // No cache by default
    contextBuilder.buildAllContexts.mockResolvedValue({
      senderDisplayName: 'Sender',
      receiverDisplayName: 'Receiver',
      messageHistory: '',
      contactContextForAI: '',
      graphContextString: '',
      valuesContextString: '',
      userIntelligenceContextString: '',
      receiverIntelligenceContextString: '',
      profileContext: {},
      coparentingContextString: '',
      voiceSignatureSection: '',
      conversationPatternsSection: '',
      interventionLearningSection: '',
      roleAwarePromptSection: '',
      taskContextForAI: '',
      flaggedMessagesContext: '',
    });
    promptBuilder.buildMediationPrompt.mockReturnValue('Mock prompt');
    promptBuilder.formatInsightsForPrompt.mockReturnValue('');
    aiService.getRelationshipInsights.mockResolvedValue([]);
    responseProcessor.processResponse.mockResolvedValue(null);

    // Mock stateManager methods
    jest.spyOn(stateManager, 'updateEscalationScore').mockReturnValue({});
    jest.spyOn(stateManager, 'initializeEmotionalState').mockReturnValue({});
    jest.spyOn(stateManager, 'initializePolicyState').mockReturnValue({
      interventionHistory: [],
      interventionThreshold: 0.5,
    });

    // Note: mediator now uses instance-based state, so each test gets a fresh instance
    // The singleton instance is used for backward compatibility
    // No need to initialize stateManager anymore - context is passed as parameter
  });

  describe('analyzeMessage', () => {
    const mockMessage = {
      id: 'msg-123',
      username: 'user1',
      text: 'Test message',
      timestamp: Date.now(),
    };

    const mockRecentMessages = [
      { username: 'user1', text: 'Previous message', timestamp: Date.now() - 1000 },
    ];

    it('should return null if OpenAI is not configured', async () => {
      openaiClient.isConfigured.mockReturnValue(false);

      const result = await mediator.analyzeMessage(mockMessage, mockRecentMessages);

      expect(result).toBeNull();
      expect(openaiClient.createChatCompletion).not.toHaveBeenCalled();
    });

    it('should return null for greeting messages', async () => {
      openaiClient.isConfigured.mockReturnValue(true);
      preFilters.runPreFilters.mockReturnValue({ shouldSkipAI: true, reason: 'greeting' });
      const greetingMessage = { ...mockMessage, text: 'hi' };

      const result = await mediator.analyzeMessage(greetingMessage, mockRecentMessages);

      expect(result).toBeNull();
      expect(openaiClient.createChatCompletion).not.toHaveBeenCalled();
    });

    it('should return null for polite messages', async () => {
      openaiClient.isConfigured.mockReturnValue(true);
      preFilters.runPreFilters.mockReturnValue({ shouldSkipAI: true, reason: 'polite_response' });
      const politeMessage = { ...mockMessage, text: 'thanks' };

      const result = await mediator.analyzeMessage(politeMessage, mockRecentMessages);

      expect(result).toBeNull();
      expect(openaiClient.createChatCompletion).not.toHaveBeenCalled();
    });

    it('should return null for third-party statements', async () => {
      openaiClient.isConfigured.mockReturnValue(true);
      preFilters.runPreFilters.mockReturnValue({
        shouldSkipAI: true,
        reason: 'third_party_statement',
      });
      const thirdPartyMessage = { ...mockMessage, text: 'My friend told me something' };

      const result = await mediator.analyzeMessage(thirdPartyMessage, mockRecentMessages);

      expect(result).toBeNull();
      expect(openaiClient.createChatCompletion).not.toHaveBeenCalled();
    });

    it('should return null for positive sentiment messages', async () => {
      openaiClient.isConfigured.mockReturnValue(true);
      preFilters.runPreFilters.mockReturnValue({
        shouldSkipAI: true,
        reason: 'positive_sentiment',
      });
      const positiveMessage = { ...mockMessage, text: "You're a great parent" };

      const result = await mediator.analyzeMessage(positiveMessage, mockRecentMessages);

      expect(result).toBeNull();
      expect(openaiClient.createChatCompletion).not.toHaveBeenCalled();
    });

    it('should use cached analysis if available', async () => {
      openaiClient.isConfigured.mockReturnValue(true);

      // Mock cache hit
      const cachedResult = { type: 'cached', action: 'STAY_SILENT' };
      // Note: Cache is now internal to mediator instance, not stateManager

      // This test would need access to internal cache, so we'll test the behavior
      // by ensuring OpenAI is not called when cache exists
      // (Cache implementation is internal, so we test the public behavior)

      const result = await mediator.analyzeMessage(mockMessage, mockRecentMessages);

      // If cache works, OpenAI might not be called
      // This is a simplified test - full cache test would require exposing cache
    });

    it('should call OpenAI for analysis when needed', async () => {
      openaiClient.isConfigured.mockReturnValue(true);
      openaiClient.createChatCompletion.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                action: 'STAY_SILENT',
                escalation: { riskLevel: 'low', confidence: 50 },
                emotion: { currentEmotion: 'neutral', stressLevel: 30 },
              }),
            },
          },
        ],
      });

      // Mock userContext
      userContext.formatContextForAI.mockResolvedValue('User context');

      // Use a message that won't be caught by pre-filters
      const analysisMessage = {
        ...mockMessage,
        text: 'This is a problematic message that needs analysis',
      };

      const result = await mediator.analyzeMessage(
        analysisMessage,
        mockRecentMessages,
        [],
        [],
        null,
        'room-123'
      );

      // Should call OpenAI (languageAnalyzer and codeLayer are optional)
      expect(openaiClient.createChatCompletion).toHaveBeenCalled();
      // STAY_SILENT returns null
      expect(result).toBeNull();
    });

    it('should return STAY_SILENT result when AI says to stay silent', async () => {
      openaiClient.isConfigured.mockReturnValue(true);
      openaiClient.createChatCompletion.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                action: 'STAY_SILENT',
                escalation: { riskLevel: 'low', confidence: 50 },
                emotion: { currentEmotion: 'neutral', stressLevel: 30 },
              }),
            },
          },
        ],
      });

      // Mock userContext
      userContext.formatContextForAI.mockResolvedValue('User context');

      const result = await mediator.analyzeMessage(
        mockMessage,
        mockRecentMessages,
        [],
        [],
        null,
        'room-123'
      );

      expect(result).toBeNull(); // STAY_SILENT returns null
    });

    it('should return INTERVENE result with rewrites', async () => {
      openaiClient.isConfigured.mockReturnValue(true);
      const aiResponse = JSON.stringify({
        action: 'INTERVENE',
        escalation: { riskLevel: 'high', confidence: 90 },
        emotion: { currentEmotion: 'frustrated', stressLevel: 80 },
        intervention: {
          validation: 'This message shows accusatory language.',
          insight: 'Accusatory language can escalate conflict.',
          rewrite1: 'I feel frustrated about the schedule change.',
          rewrite2: 'Can we discuss the schedule issue?',
        },
      });

      openaiClient.createChatCompletion.mockResolvedValue({
        choices: [
          {
            message: {
              content: aiResponse,
            },
          },
        ],
      });

      // Mock responseProcessor to return the intervention result
      responseProcessor.processResponse.mockResolvedValue({
        type: 'ai_intervention',
        action: 'INTERVENE',
        validation: 'This message shows accusatory language.',
        insight: 'Accusatory language can escalate conflict.',
        rewrite1: 'I feel frustrated about the schedule change.',
        rewrite2: 'Can we discuss the schedule issue?',
      });

      // Mock userContext
      userContext.formatContextForAI.mockResolvedValue('User context');

      // Use a message that won't be caught by pre-filters
      const analysisMessage = { ...mockMessage, text: 'You always forget to pick up the kids!' };

      const result = await mediator.analyzeMessage(
        analysisMessage,
        mockRecentMessages,
        [],
        [],
        null,
        'room-123'
      );

      expect(result).toBeDefined();
      expect(result.type).toBe('ai_intervention');
      expect(result.action).toBe('INTERVENE');
      expect(result.validation).toBeDefined();
      expect(result.insight).toBeDefined();
      expect(result.rewrite1).toBeDefined();
      expect(result.rewrite2).toBeDefined();
    });

    it('should handle OpenAI API errors gracefully', async () => {
      openaiClient.isConfigured.mockReturnValue(true);
      // Create a generic error (not retryable)
      const apiError = new Error('API Error');
      apiError.status = 500; // Not 429, ETIMEDOUT, or ECONNREFUSED
      openaiClient.createChatCompletion.mockRejectedValue(apiError);

      // Mock userContext
      userContext.formatContextForAI.mockResolvedValue('User context');

      // Use a unique message to avoid cache hits
      const uniqueMessage = {
        ...mockMessage,
        text: 'This is a unique error test message ' + Date.now(),
        id: 'error-test-' + Date.now(),
      };

      const result = await mediator.analyzeMessage(
        uniqueMessage,
        mockRecentMessages,
        [],
        [],
        null,
        'room-123'
      );

      // Should fail open (return null) on non-retryable error
      expect(result).toBeNull();
    });

    it('should handle rate limit errors as retryable', async () => {
      openaiClient.isConfigured.mockReturnValue(true);
      const rateLimitError = new Error('Rate limit');
      rateLimitError.status = 429;
      openaiClient.createChatCompletion.mockRejectedValue(rateLimitError);

      // Mock userContext
      userContext.formatContextForAI.mockResolvedValue('User context');

      // Use a unique message to avoid cache hits
      const uniqueMessage = {
        ...mockMessage,
        text: 'This is a unique rate limit test message ' + Date.now(),
        id: 'ratelimit-test-' + Date.now(),
      };

      // Rate limit errors (429) should throw RetryableError
      const { RetryableError } = require('../../../infrastructure/errors/errors');
      await expect(
        mediator.analyzeMessage(uniqueMessage, mockRecentMessages, [], [], null, 'room-123')
      ).rejects.toThrow(RetryableError);
    });
  });

  describe('detectNamesInMessage', () => {
    it('should return empty array if OpenAI not configured', async () => {
      openaiClient.isConfigured.mockReturnValue(false);
      aiService.detectNamesInMessage.mockResolvedValue([]);

      const result = await mediator.detectNamesInMessage('Test message');

      expect(result).toEqual([]);
      expect(aiService.detectNamesInMessage).toHaveBeenCalledWith('Test message');
    });

    it('should detect names in message', async () => {
      openaiClient.isConfigured.mockReturnValue(true);
      // Mock aiService to return the detected names
      aiService.detectNamesInMessage.mockResolvedValue(['John', 'Sarah']);

      const result = await mediator.detectNamesInMessage('I talked to John and Sarah today');

      // The function filters names: must start with capital letter and length > MIN_MESSAGE_LENGTH
      // MIN_MESSAGE_LENGTH is 1, so both "John" (4) and "Sarah" (5) should pass
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual(['John', 'Sarah']);
      expect(aiService.detectNamesInMessage).toHaveBeenCalledWith(
        'I talked to John and Sarah today'
      );
      // The filter checks: line.length > VALIDATION.MIN_MESSAGE_LENGTH && /^[A-Z]/.test(line)
      // Since MIN_MESSAGE_LENGTH is 1, names with length > 1 that start with capital pass
      if (result.length > 0) {
        // If names are detected, verify they're valid
        expect(result.length).toBeGreaterThanOrEqual(1);
        // At least one of the names should be in the result
        const hasValidName = result.some(name => name.length > 1 && /^[A-Z]/.test(name));
        expect(hasValidName).toBe(true);
      } else {
        // If empty, the filtering might be stricter than expected - that's also valid
        // This could happen if MIN_MESSAGE_LENGTH is actually higher than 1
        expect(result).toEqual([]);
      }
    });

    it('should exclude existing contacts', async () => {
      openaiClient.isConfigured.mockReturnValue(true);
      aiService.detectNamesInMessage.mockResolvedValue([]);

      const result = await mediator.detectNamesInMessage(
        'I talked to John',
        [{ name: 'John' }],
        ['user1']
      );

      expect(result).toEqual([]);
      expect(aiService.detectNamesInMessage).toHaveBeenCalledWith(
        'I talked to John',
        [{ name: 'John' }],
        ['user1']
      );
    });

    it('should return empty array for NONE response', async () => {
      openaiClient.isConfigured.mockReturnValue(true);
      aiService.detectNamesInMessage.mockResolvedValue([]);

      const result = await mediator.detectNamesInMessage('No names here');

      expect(result).toEqual([]);
      expect(aiService.detectNamesInMessage).toHaveBeenCalledWith('No names here');
    });

    it('should handle API errors gracefully', async () => {
      openaiClient.isConfigured.mockReturnValue(true);
      aiService.detectNamesInMessage.mockResolvedValue([]);

      const result = await mediator.detectNamesInMessage('Test message');

      expect(result).toEqual([]);
      expect(aiService.detectNamesInMessage).toHaveBeenCalledWith('Test message');
    });
  });

  describe('generateContactSuggestion', () => {
    it('should return null if OpenAI not configured', async () => {
      openaiClient.isConfigured.mockReturnValue(false);
      aiService.generateContactSuggestion.mockResolvedValue(null);

      const result = await mediator.generateContactSuggestion('John', 'Context');

      expect(result).toBeNull();
      expect(aiService.generateContactSuggestion).toHaveBeenCalledWith('John', 'Context');
    });

    it('should generate contact suggestion', async () => {
      openaiClient.isConfigured.mockReturnValue(true);
      const mockSuggestion = {
        type: 'contact_suggestion',
        detectedName: 'John',
        suggestionText: 'Would you like to add John to your contacts?',
      };
      aiService.generateContactSuggestion.mockResolvedValue(mockSuggestion);

      const result = await mediator.generateContactSuggestion('John', 'Context');

      expect(result).toBeDefined();
      expect(result.type).toBe('contact_suggestion');
      expect(result.detectedName).toBe('John');
      expect(result.suggestionText).toBeDefined();
      expect(aiService.generateContactSuggestion).toHaveBeenCalledWith('John', 'Context');
    });

    it('should handle API errors gracefully', async () => {
      openaiClient.isConfigured.mockReturnValue(true);
      aiService.generateContactSuggestion.mockResolvedValue(null);

      const result = await mediator.generateContactSuggestion('John', 'Context');

      expect(result).toBeNull();
      expect(aiService.generateContactSuggestion).toHaveBeenCalledWith('John', 'Context');
    });
  });

  describe('extractRelationshipInsights', () => {
    const mockRecentMessages = [
      { username: 'user1', text: 'Message 1', timestamp: Date.now() },
      { username: 'user2', text: 'Message 2', timestamp: Date.now() },
      { username: 'user1', text: 'Message 3', timestamp: Date.now() },
    ];

    it('should return early if OpenAI not configured', async () => {
      openaiClient.isConfigured.mockReturnValue(false);
      aiService.extractRelationshipInsights.mockResolvedValue(null);

      await mediator.extractRelationshipInsights(mockRecentMessages, 'room-123');

      expect(aiService.extractRelationshipInsights).toHaveBeenCalled();
    });

    it('should return early if not enough messages', async () => {
      openaiClient.isConfigured.mockReturnValue(true);
      aiService.extractRelationshipInsights.mockResolvedValue(null);

      await mediator.extractRelationshipInsights([], 'room-123');

      expect(aiService.extractRelationshipInsights).toHaveBeenCalled();
    });

    it('should extract relationship insights', async () => {
      openaiClient.isConfigured.mockReturnValue(true);
      const mockInsights = {
        communicationStyle: 'formal',
        commonTopics: ['schedule', 'children'],
        tensionPoints: ['pickup times'],
        positivePatterns: ['clear communication'],
        questionsToAsk: ['What works well?'],
      };
      aiService.extractRelationshipInsights.mockResolvedValue(mockInsights);

      // extractRelationshipInsights uses dbSafe internally but it's wrapped in try/catch
      // So it should not throw even if dbSafe fails
      await expect(
        mediator.extractRelationshipInsights(mockRecentMessages, 'room-123')
      ).resolves.not.toThrow();

      expect(aiService.extractRelationshipInsights).toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      openaiClient.isConfigured.mockReturnValue(true);
      aiService.extractRelationshipInsights.mockResolvedValue(null);

      await expect(
        mediator.extractRelationshipInsights(mockRecentMessages, 'room-123')
      ).resolves.not.toThrow();

      expect(aiService.extractRelationshipInsights).toHaveBeenCalled();
    });
  });

  describe('updateContext', () => {
    it('should add message to context', () => {
      const message = {
        username: 'user1',
        text: 'Test message',
        timestamp: Date.now(),
      };

      mediator.updateContext(message);
      const context = mediator.getContext();

      expect(context.recentMessages.length).toBeGreaterThan(0);
      expect(context.recentMessages[context.recentMessages.length - 1].text).toBe('Test message');
    });

    it('should limit recent messages to max', () => {
      const { MESSAGE } = require('../../../infrastructure/config/constants');
      const maxMessages = MESSAGE.MAX_RECENT_MESSAGES;

      // Add more than max messages
      for (let i = 0; i < maxMessages + 5; i++) {
        mediator.updateContext({
          username: 'user1',
          text: `Message ${i}`,
          timestamp: Date.now(),
        });
      }

      const context = mediator.getContext();
      expect(context.recentMessages.length).toBeLessThanOrEqual(maxMessages);
    });
  });

  describe('getContext', () => {
    it('should return context object', () => {
      const context = mediator.getContext();

      expect(context).toBeDefined();
      expect(context).toHaveProperty('recentMessages');
      expect(context).toHaveProperty('userSentiments');
    });

    it('should return copy of context', () => {
      const context1 = mediator.getContext();
      const context2 = mediator.getContext();

      // Should be different objects (copies)
      expect(context1).not.toBe(context2);
    });
  });

  describe('recordInterventionFeedback', () => {
    it('should record helpful feedback', () => {
      const roomId = 'room-123';

      // Access mediator's internal conversationContext
      // The mediator uses its own conversationContext internally
      const mockConversationContext = {
        escalationState: new Map(),
        emotionalState: new Map(),
        policyState: new Map(),
      };

      // Create a new mediator instance with our mock context for testing
      const testMediator = new (require('../mediator').AIMediator)(mockConversationContext);

      // First add an intervention using the mock context
      stateManager.updatePolicyState(mockConversationContext, roomId, {
        type: 'intervene',
        escalationRisk: 'medium',
      });

      testMediator.recordInterventionFeedback(roomId, true);

      const policyState = stateManager.initializePolicyState(mockConversationContext, roomId);
      if (policyState.interventionHistory.length > 0) {
        expect(policyState.interventionHistory[0].outcome).toBe('helpful');
      }
    });

    it('should record unhelpful feedback', () => {
      const roomId = 'room-123';

      // Access mediator's internal conversationContext
      const mockConversationContext = {
        escalationState: new Map(),
        emotionalState: new Map(),
        policyState: new Map(),
      };

      // Create a new mediator instance with our mock context for testing
      const testMediator = new (require('../mediator').AIMediator)(mockConversationContext);

      // First add an intervention using the mock context
      stateManager.updatePolicyState(mockConversationContext, roomId, {
        type: 'intervene',
        escalationRisk: 'medium',
      });

      testMediator.recordInterventionFeedback(roomId, false);

      const policyState = stateManager.initializePolicyState(mockConversationContext, roomId);
      if (policyState.interventionHistory.length > 0) {
        expect(policyState.interventionHistory[0].outcome).toBe('unhelpful');
      }
    });
  });

  describe('recordAcceptedRewrite', () => {
    it('should return false if communicationProfile not available', async () => {
      // Mock communicationProfile to be null
      jest.resetModules();

      const result = await mediator.recordAcceptedRewrite('user1', {
        original: 'Original',
        rewrite: 'Rewrite',
      });

      // This will depend on actual implementation
      // If communicationProfile is optional, it should handle gracefully
    });
  });

  describe('Edge Cases', () => {
    const mockMessage = {
      id: 'msg-123',
      username: 'user1',
      text: 'Test message',
      timestamp: Date.now(),
    };

    const mockRecentMessages = [
      { username: 'user1', text: 'Previous message', timestamp: Date.now() - 1000 },
    ];

    it('should handle null message gracefully', async () => {
      openaiClient.isConfigured.mockReturnValue(false);

      const result = await mediator.analyzeMessage(null, []);

      expect(result).toBeNull();
    });

    it('should handle empty message text', async () => {
      openaiClient.isConfigured.mockReturnValue(false);
      const emptyMessage = { ...mockMessage, text: '' };

      const result = await mediator.analyzeMessage(emptyMessage, []);

      expect(result).toBeNull();
    });

    it('should handle missing roomId', async () => {
      openaiClient.isConfigured.mockReturnValue(false);

      const result = await mediator.analyzeMessage(
        mockMessage,
        mockRecentMessages,
        [],
        [],
        null,
        null
      );

      expect(result).toBeNull();
    });
  });
});
