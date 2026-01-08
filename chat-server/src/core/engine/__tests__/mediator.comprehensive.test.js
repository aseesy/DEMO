/**
 * Comprehensive Unit Tests: AI Mediator
 *
 * Extended tests for core AI mediation system focusing on:
 * - Complete analyzeMessage flow
 * - Code layer integration
 * - Language analyzer integration
 * - Context building
 * - Response processing
 * - API failure handling
 * - Edge cases and error scenarios
 *
 * @module src/core/engine/__tests__/mediator.comprehensive.test
 */

const { AIMediator } = require('../mediator');
const stateManager = require('../stateManager');

// Mock stateManager methods to prevent errors
jest.spyOn(stateManager, 'updateEscalationScore').mockReturnValue({});
jest.spyOn(stateManager, 'initializeEmotionalState').mockReturnValue({});
jest.spyOn(stateManager, 'initializePolicyState').mockReturnValue({
  interventionHistory: [],
  interventionThreshold: 0.5,
});

// Mock all dependencies
jest.mock('../client', () => ({
  isConfigured: jest.fn(),
  createChatCompletion: jest.fn(),
}));

jest.mock('../../profiles/userContext', () => ({
  formatContextForAI: jest.fn(),
}));

jest.mock('../messageCache', () => ({
  generateHash: jest.fn((text, sender, receiver) => `hash-${text}-${sender}-${receiver}`),
  get: jest.fn(),
  set: jest.fn().mockResolvedValue(undefined), // Return a Promise so .catch() works
}));

jest.mock('../preFilters', () => ({
  runPreFilters: jest.fn(),
  detectConflictPatterns: jest.fn(),
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
  extractRelationshipInsights: jest.fn(),
  detectNamesInMessage: jest.fn(),
  generateContactSuggestion: jest.fn(),
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
    } catch {
      return null;
    }
  }),
}));

jest.mock('../libraryLoader', () => ({
  codeLayerIntegration: null,
  languageAnalyzer: null,
  communicationProfile: null,
  interventionLearning: null,
}));

jest.mock('../humanUnderstanding', () => ({
  generateHumanUnderstanding: jest.fn().mockImplementation(() => {
    // Return a promise that resolves quickly to avoid timeout
    return Promise.resolve(null);
  }),
  formatUnderstandingForPrompt: jest.fn().mockReturnValue(''),
}));

const openaiClient = require('../client');
const messageCache = require('../messageCache');
const preFilters = require('../preFilters');
const contextBuilder = require('../contextBuilder');
const promptBuilder = require('../promptBuilder');
const responseProcessor = require('../responseProcessor');
const aiService = require('../aiService');
const { handleAnalysisError, safeExecute } = require('../mediatorErrors');
const libs = require('../libraryLoader');

describe('AI Mediator - Comprehensive Tests', () => {
  let mediator;
  let mockConversationContext;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create fresh mediator instance for each test
    mockConversationContext = {
      recentMessages: [],
      userSentiments: new Map(),
      topicChanges: [],
      lastIntervention: null,
      relationshipInsights: new Map(),
      lastCommentTime: new Map(),
      escalationState: new Map(),
      emotionalState: new Map(),
      policyState: new Map(),
    };
    mediator = new AIMediator(mockConversationContext);

    // Default mocks
    openaiClient.isConfigured.mockReturnValue(true);
    messageCache.get.mockReturnValue(null); // No cache by default
    preFilters.runPreFilters.mockReturnValue({ shouldSkipAI: false, reason: null });
    preFilters.detectConflictPatterns.mockReturnValue([]);
    contextBuilder.buildAllContexts.mockResolvedValue({
      senderDisplayName: 'User1',
      receiverDisplayName: 'User2',
      messageHistory: 'History',
      contactContextForAI: 'Contacts',
      graphContextString: 'Graph',
      valuesContextString: 'Values',
      userIntelligenceContextString: 'Intelligence',
      receiverIntelligenceContextString: 'Receiver Intelligence',
      profileContext: {},
      coparentingContextString: 'Co-parenting',
      voiceSignatureSection: 'Voice',
      conversationPatternsSection: 'Patterns',
      interventionLearningSection: 'Learning',
      roleAwarePromptSection: 'Role',
      taskContextForAI: 'Tasks',
      participantProfiles: [],
    });
    aiService.getRelationshipInsights.mockResolvedValue({});
    promptBuilder.formatInsightsForPrompt.mockReturnValue('Insights');
    promptBuilder.formatProfileContextForPrompt.mockReturnValue('Profile');
    promptBuilder.buildMediationPrompt.mockReturnValue('Full prompt');
    responseProcessor.processResponse.mockResolvedValue(null);

    // Mock userContext
    const userContext = require('../../profiles/userContext');
    userContext.formatContextForAI.mockResolvedValue('User context');
  });

  describe('analyzeMessage - Complete Flow', () => {
    const mockMessage = {
      id: 'msg-123',
      username: 'user1',
      text: 'This is a problematic message that needs analysis',
      timestamp: Date.now(),
    };

    const mockRecentMessages = [
      { username: 'user1', text: 'Previous message', timestamp: Date.now() - 1000 },
    ];

    it('should return null when OpenAI is not configured', async () => {
      openaiClient.isConfigured.mockReturnValue(false);

      const result = await mediator.analyzeMessage(mockMessage, mockRecentMessages);

      expect(result).toBeNull();
      expect(openaiClient.createChatCompletion).not.toHaveBeenCalled();
    });

    it('should check cache before making API call', async () => {
      const cachedResult = { type: 'ai_intervention', action: 'INTERVENE' };
      messageCache.get.mockReturnValue(cachedResult);

      const result = await mediator.analyzeMessage(mockMessage, mockRecentMessages);

      expect(result).toBe(cachedResult);
      expect(messageCache.get).toHaveBeenCalled();
      expect(openaiClient.createChatCompletion).not.toHaveBeenCalled();
    });

    it('should skip AI for pre-filtered messages', async () => {
      preFilters.runPreFilters.mockReturnValue({ shouldSkipAI: true, reason: 'greeting' });

      const result = await mediator.analyzeMessage(mockMessage, mockRecentMessages);

      expect(result).toBeNull();
      expect(openaiClient.createChatCompletion).not.toHaveBeenCalled();
    });

    it('should use code layer quick-pass when available', async () => {
      libs.codeLayerIntegration = {
        isAvailable: jest.fn().mockReturnValue(true),
        analyzeWithCodeLayer: jest.fn().mockResolvedValue({
          parsed: { axiomsFired: [] },
          quickPass: { canPass: true },
        }),
        recordMetrics: jest.fn(),
        buildCodeLayerPromptSection: jest.fn(),
      };

      const result = await mediator.analyzeMessage(
        mockMessage,
        mockRecentMessages,
        [],
        [],
        null,
        'room-123'
      );

      expect(result).toBeNull();
      expect(openaiClient.createChatCompletion).not.toHaveBeenCalled();
      expect(libs.codeLayerIntegration.analyzeWithCodeLayer).toHaveBeenCalled();
    });

    it('should proceed to AI when code layer does not quick-pass', async () => {
      libs.codeLayerIntegration = {
        isAvailable: jest.fn().mockReturnValue(true),
        analyzeWithCodeLayer: jest.fn().mockResolvedValue({
          parsed: { axiomsFired: [{ id: 'axiom1' }] },
          quickPass: { canPass: false },
        }),
        recordMetrics: jest.fn(),
        buildCodeLayerPromptSection: jest.fn().mockReturnValue('Code layer section'),
      };

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

      responseProcessor.processResponse.mockResolvedValue(null);

      const result = await mediator.analyzeMessage(
        mockMessage,
        mockRecentMessages,
        [],
        [],
        null,
        'room-123'
      );

      expect(openaiClient.createChatCompletion).toHaveBeenCalled();
      expect(libs.codeLayerIntegration.buildCodeLayerPromptSection).toHaveBeenCalled();
    });

    it('should use language analyzer when available', async () => {
      libs.languageAnalyzer = {
        analyze: jest.fn().mockReturnValue({
          summary: ['Observation 1', 'Observation 2'],
        }),
      };

      openaiClient.createChatCompletion.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                action: 'STAY_SILENT',
              }),
            },
          },
        ],
      });

      responseProcessor.processResponse.mockResolvedValue(null);

      await mediator.analyzeMessage(mockMessage, mockRecentMessages, [], [], null, 'room-123');

      expect(libs.languageAnalyzer.analyze).toHaveBeenCalled();
      expect(responseProcessor.processResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          languageAnalysis: expect.objectContaining({
            summary: expect.any(Array),
          }),
        })
      );
    });

    it('should build all contexts before making API call', async () => {
      openaiClient.createChatCompletion.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                action: 'STAY_SILENT',
              }),
            },
          },
        ],
      });

      responseProcessor.processResponse.mockResolvedValue(null);

      await mediator.analyzeMessage(
        mockMessage,
        mockRecentMessages,
        ['user1', 'user2'],
        [{ name: 'Contact', relationship: 'child' }],
        'Contact context',
        'room-123',
        'Task context',
        'Flagged context',
        { senderId: 'user1', receiverId: 'user2' }
      );

      expect(contextBuilder.buildAllContexts).toHaveBeenCalledWith({
        message: mockMessage,
        recentMessages: mockRecentMessages,
        participantUsernames: ['user1', 'user2'],
        existingContacts: [{ name: 'Contact', relationship: 'child' }],
        contactContextForAI: 'Contact context',
        roomId: 'room-123',
        taskContextForAI: 'Task context',
        flaggedMessagesContext: 'Flagged context',
        roleContext: { senderId: 'user1', receiverId: 'user2' },
        threadContext: null,
      });
    });

    it('should call OpenAI with correct parameters', async () => {
      openaiClient.createChatCompletion.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                action: 'STAY_SILENT',
              }),
            },
          },
        ],
      });

      responseProcessor.processResponse.mockResolvedValue(null);

      await mediator.analyzeMessage(mockMessage, mockRecentMessages, [], [], null, 'room-123');

      expect(openaiClient.createChatCompletion).toHaveBeenCalledWith({
        model: expect.any(String),
        messages: [
          { role: 'system', content: 'System prompt' },
          { role: 'user', content: 'Full prompt' },
        ],
        max_tokens: expect.any(Number),
        temperature: expect.any(Number),
      });
    });

    it('should process response and return intervention', async () => {
      const mockIntervention = {
        type: 'ai_intervention',
        action: 'INTERVENE',
        validation: 'Validation',
        insight: 'Insight',
        rewrite1: 'Rewrite 1',
        rewrite2: 'Rewrite 2',
      };

      // Ensure code layer doesn't quick-pass (would return null)
      // libs is already set to null in the mock, but ensure it stays null
      libs.codeLayerIntegration = null;

      openaiClient.createChatCompletion.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                action: 'INTERVENE',
                intervention: mockIntervention,
              }),
            },
          },
        ],
      });

      // Mock responseProcessor to return the intervention result
      // Reset the mock to ensure it returns the intervention
      responseProcessor.processResponse.mockReset();
      responseProcessor.processResponse.mockResolvedValue(mockIntervention);

      // Mock userContext for the mediator
      const userContext = require('../../profiles/userContext');
      userContext.formatContextForAI.mockResolvedValue('User context');

      const result = await mediator.analyzeMessage(
        mockMessage,
        mockRecentMessages,
        [],
        [],
        null,
        'room-123'
      );

      expect(responseProcessor.processResponse).toHaveBeenCalled();
      expect(result).toEqual(mockIntervention);
      expect(messageCache.set).toHaveBeenCalled();
    });

    it('should process response without emotional state tracking', async () => {
      // Emotional state tracking was removed - no evidence it improves outcomes
      // This test verifies the mediator still processes responses correctly
      openaiClient.createChatCompletion.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                action: 'STAY_SILENT',
              }),
            },
          },
        ],
      });

      responseProcessor.processResponse.mockResolvedValue(null);

      await mediator.analyzeMessage(mockMessage, mockRecentMessages, [], [], null, 'room-123');

      // Verify response was processed (even if emotional state tracking is disabled)
      expect(responseProcessor.processResponse).toHaveBeenCalled();
    });

    it('should track comment time for COMMENT actions', async () => {
      const mockComment = {
        type: 'ai_intervention',
        action: 'COMMENT',
        comment: 'Comment text',
      };

      openaiClient.createChatCompletion.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                action: 'COMMENT',
              }),
            },
          },
        ],
      });

      responseProcessor.processResponse.mockResolvedValue(mockComment);

      await mediator.analyzeMessage(mockMessage, mockRecentMessages, [], [], null, 'room-123');

      expect(mockConversationContext.lastCommentTime.get('room-123')).toBeDefined();
      expect(mockConversationContext.lastCommentTime.get('room-123')).toBeGreaterThan(0);
    });

    it('should limit comments based on frequency', async () => {
      // Set last comment time to recent
      mockConversationContext.lastCommentTime.set('room-123', Date.now() - 30000); // 30 seconds ago

      openaiClient.createChatCompletion.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                action: 'COMMENT',
              }),
            },
          },
        ],
      });

      responseProcessor.processResponse.mockResolvedValue({
        action: 'COMMENT',
        comment: 'Should be limited',
      });

      await mediator.analyzeMessage(mockMessage, mockRecentMessages, [], [], null, 'room-123');

      expect(responseProcessor.processResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          shouldLimitComments: true,
        })
      );
    });
  });

  describe('analyzeMessage - Error Handling', () => {
    const mockMessage = {
      id: 'msg-123',
      username: 'user1',
      text: 'Test message',
      timestamp: Date.now(),
    };

    it('should handle OpenAI API errors gracefully', async () => {
      const apiError = new Error('API Error');
      apiError.status = 500;
      openaiClient.createChatCompletion.mockRejectedValue(apiError);

      handleAnalysisError.mockReturnValue({
        error: null, // Fail open
      });

      const result = await mediator.analyzeMessage(mockMessage, [], [], [], null, 'room-123');

      expect(result).toBeNull();
      expect(handleAnalysisError).toHaveBeenCalled();
    });

    it('should throw retryable errors', async () => {
      const rateLimitError = new Error('Rate limit');
      rateLimitError.status = 429;
      openaiClient.createChatCompletion.mockRejectedValue(rateLimitError);

      const retryableError = new Error('Retryable');
      handleAnalysisError.mockReturnValue({
        error: retryableError,
      });

      await expect(
        mediator.analyzeMessage(mockMessage, [], [], [], null, 'room-123')
      ).rejects.toThrow('Retryable');
    });

    it('should handle context building errors', async () => {
      contextBuilder.buildAllContexts.mockRejectedValue(new Error('Context error'));

      handleAnalysisError.mockReturnValue({
        error: null,
      });

      const result = await mediator.analyzeMessage(mockMessage, [], [], [], null, 'room-123');

      expect(result).toBeNull();
    });

    it('should handle code layer errors safely', async () => {
      libs.codeLayerIntegration = {
        isAvailable: jest.fn().mockReturnValue(true),
        analyzeWithCodeLayer: jest.fn().mockRejectedValue(new Error('Code layer error')),
      };

      safeExecute.mockResolvedValue(null); // safeExecute returns null on error

      openaiClient.createChatCompletion.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                action: 'STAY_SILENT',
              }),
            },
          },
        ],
      });

      responseProcessor.processResponse.mockResolvedValue(null);

      await mediator.analyzeMessage(mockMessage, [], [], [], null, 'room-123');

      // Should continue even if code layer fails
      expect(openaiClient.createChatCompletion).toHaveBeenCalled();
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('ETIMEDOUT');
      timeoutError.code = 'ETIMEDOUT';
      openaiClient.createChatCompletion.mockRejectedValue(timeoutError);

      handleAnalysisError.mockReturnValue({
        error: null,
      });

      const result = await mediator.analyzeMessage(mockMessage, [], [], [], null, 'room-123');

      expect(result).toBeNull();
    });

    it('should handle connection errors', async () => {
      const connError = new Error('ECONNREFUSED');
      connError.code = 'ECONNREFUSED';
      openaiClient.createChatCompletion.mockRejectedValue(connError);

      handleAnalysisError.mockReturnValue({
        error: null,
      });

      const result = await mediator.analyzeMessage(mockMessage, [], [], [], null, 'room-123');

      expect(result).toBeNull();
    });
  });

  describe('analyzeMessage - Edge Cases', () => {
    it('should handle string message input', async () => {
      openaiClient.isConfigured.mockReturnValue(false);

      const result = await mediator.analyzeMessage('Just a string', []);

      expect(result).toBeNull();
    });

    it('should handle message without username', async () => {
      const messageWithoutUsername = {
        id: 'msg-123',
        text: 'Test',
        timestamp: Date.now(),
      };

      openaiClient.isConfigured.mockReturnValue(false);

      const result = await mediator.analyzeMessage(messageWithoutUsername, []);

      expect(result).toBeNull();
    });

    it('should handle role context for sender/receiver', async () => {
      const message = {
        id: 'msg-123',
        text: 'Test',
        timestamp: Date.now(),
      };

      const roleContext = {
        senderId: 'sender-123',
        receiverId: 'receiver-456',
      };

      messageCache.generateHash.mockReturnValue('hash-123');
      messageCache.get.mockReturnValue(null);

      openaiClient.createChatCompletion.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                action: 'STAY_SILENT',
              }),
            },
          },
        ],
      });

      responseProcessor.processResponse.mockResolvedValue(null);

      await mediator.analyzeMessage(message, [], [], [], null, 'room-123', null, null, roleContext);

      expect(messageCache.generateHash).toHaveBeenCalledWith('Test', 'sender-123', 'receiver-456');
    });

    it('should handle empty participant usernames', async () => {
      const message = {
        id: 'msg-123',
        username: 'user1',
        text: 'Test',
        timestamp: Date.now(),
      };

      messageCache.generateHash.mockReturnValue('hash-123');
      messageCache.get.mockReturnValue(null);

      openaiClient.createChatCompletion.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                action: 'STAY_SILENT',
              }),
            },
          },
        ],
      });

      responseProcessor.processResponse.mockResolvedValue(null);

      await mediator.analyzeMessage(message, [], [], [], null, 'room-123');

      expect(messageCache.generateHash).toHaveBeenCalledWith('Test', 'user1', 'unknown');
    });
  });

  describe('updateContext', () => {
    it('should add message to context', () => {
      const message = {
        username: 'user1',
        text: 'New message',
        timestamp: Date.now(),
      };

      mediator.updateContext(message);

      expect(mockConversationContext.recentMessages.length).toBe(1);
      expect(mockConversationContext.recentMessages[0].text).toBe('New message');
    });

    it('should limit context to 30 messages', () => {
      for (let i = 0; i < 35; i++) {
        mediator.updateContext({
          username: 'user1',
          text: `Message ${i}`,
          timestamp: Date.now(),
        });
      }

      expect(mockConversationContext.recentMessages.length).toBe(30);
      expect(mockConversationContext.recentMessages[0].text).toBe('Message 5');
    });
  });

  describe('getContext', () => {
    it('should return copy of context', () => {
      mediator.updateContext({
        username: 'user1',
        text: 'Test',
        timestamp: Date.now(),
      });

      const context1 = mediator.getContext();
      const context2 = mediator.getContext();

      expect(context1).not.toBe(context2);
      expect(context1.recentMessages).not.toBe(context2.recentMessages);
    });
  });

  describe('recordInterventionFeedback', () => {
    it('should delegate to stateManager', () => {
      const recordSpy = jest.spyOn(stateManager, 'recordInterventionFeedback');

      mediator.recordInterventionFeedback('room-123', true);

      expect(recordSpy).toHaveBeenCalledWith(mockConversationContext, 'room-123', true);

      recordSpy.mockRestore();
    });
  });

  describe('recordAcceptedRewrite', () => {
    it('should return false if communicationProfile not available', async () => {
      libs.communicationProfile = null;

      const result = await mediator.recordAcceptedRewrite('user1', {
        original: 'Original',
        rewrite: 'Rewrite',
      });

      expect(result).toBe(false);
    });

    it('should return false if senderId not provided', async () => {
      const result = await mediator.recordAcceptedRewrite(null, {
        original: 'Original',
        rewrite: 'Rewrite',
      });

      expect(result).toBe(false);
    });

    it('should record rewrite when communicationProfile available', async () => {
      // Mock dbPostgres at the module level
      jest.mock('../../../../dbPostgres', () => ({
        query: jest.fn(),
      }));

      libs.communicationProfile = {
        recordAcceptedRewrite: jest.fn().mockResolvedValue(true),
      };

      libs.interventionLearning = {
        recordInterventionOutcome: jest.fn().mockResolvedValue(true),
      };

      const result = await mediator.recordAcceptedRewrite('user1', {
        original: 'Original',
        rewrite: 'Rewrite',
        pattern: 'pattern1',
      });

      expect(result).toBe(true);
      expect(libs.communicationProfile.recordAcceptedRewrite).toHaveBeenCalled();
    });
  });

  describe('extractRelationshipInsights', () => {
    it('should delegate to aiService', () => {
      const extractSpy = jest.spyOn(aiService, 'extractRelationshipInsights');

      mediator.extractRelationshipInsights([], 'room-123', {});

      expect(extractSpy).toHaveBeenCalledWith(
        [],
        'room-123',
        mockConversationContext.relationshipInsights,
        {}
      );

      extractSpy.mockRestore();
    });
  });
});
