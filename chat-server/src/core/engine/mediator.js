/**
 * AI Mediator - Facade
 *
 * Orchestrates all AI-powered mediation features:
 * - Conflict escalation detection
 * - Emotional state analysis
 * - Intervention policy decisions
 * - Message mediation and rewriting
 * - Contact name detection
 * - Relationship insights learning
 *
 * ARCHITECTURE: This file is a FACADE that delegates to specialized modules:
 * - libraryLoader.js - Optional dependency management
 * - messageCache.js - LRU cache for API responses
 * - preFilters.js - Fast local filtering before AI
 * - contextBuilder.js - Build all AI contexts
 * - promptBuilder.js - Construct AI prompts
 * - responseProcessor.js - Handle AI responses
 * - aiService.js - Secondary AI functions
 *
 * REFACTORED: Now uses instance-based state instead of global module variable.
 * Each mediator instance has its own conversationContext, preventing state leakage.
 *
 * CONSTITUTION REFERENCE (004-ai-mediation-constitution):
 * All AI interventions MUST comply with: ../policies/constitution.md
 *
 * @module liaizen/core/mediator
 */

const openaiClient = require('./client');
const userContext = require('../profiles/userContext');
const { defaultLogger } = require('../../infrastructure/logging/logger');
const { AI } = require('../../infrastructure/config/constants');
const stateManager = require('./stateManager');

// Extracted modules
const libs = require('./libraryLoader');
const messageCache = require('./messageCache');
const preFilters = require('./preFilters');
const contextBuilder = require('./contextBuilder');
const promptBuilder = require('./promptBuilder');
const responseProcessor = require('./responseProcessor');
const aiService = require('./aiService');
const { handleAnalysisError, safeExecute } = require('./mediatorErrors');
const {
  generateHumanUnderstanding,
  formatUnderstandingForPrompt,
} = require('./humanUnderstanding');

/**
 * Create a new conversation context
 * @returns {Object} Fresh conversation context
 */
function createConversationContext() {
  return {
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
}

/**
 * AI Mediator Class
 *
 * Each instance has its own conversationContext, preventing state leakage between rooms.
 */
class AIMediator {
  constructor(conversationContext = null) {
    // Use provided context or create a new one
    this.conversationContext = conversationContext || createConversationContext();
  }

  /**
   * Analyze message with unified AI call
   *
   * This orchestrates all mediation components:
   * 1. Check cache for previous analysis
   * 2. Run pre-filters for quick decisions
   * 3. Run Code Layer analysis (if available)
   * 4. Build all contexts
   * 5. Construct prompt and call AI
   * 6. Process and validate response
   *
   * @param {Object} message - The message object
   * @param {Array} recentMessages - Last 15 messages for context
   * @param {Array} participantUsernames - Usernames of active participants
   * @param {Array} existingContacts - Existing contacts for the user
   * @param {string} contactContextForAI - Formatted contact context string
   * @param {string} roomId - Room ID
   * @param {string} taskContextForAI - Formatted task context string
   * @param {string} flaggedMessagesContext - Context from previously flagged messages
   * @param {Object} roleContext - Optional sender/receiver context
   * @returns {Promise<Object|null>} Mediation result or null to allow
   */
  async analyzeMessage(
    message,
    recentMessages,
    participantUsernames = [],
    existingContacts = [],
    contactContextForAI = null,
    roomId = null,
    taskContextForAI = null,
    flaggedMessagesContext = null,
    roleContext = null,
    threadContext = null
  ) {
    const logger = defaultLogger.child({
      operation: 'analyzeMessage',
      roomId,
      messageId: typeof message === 'string' ? null : message?.id,
      username: typeof message === 'string' ? null : message?.username,
      messageLength: typeof message === 'string' ? message.length : message?.text?.length,
    });

    // Check if OpenAI is configured
    if (!openaiClient.isConfigured()) {
      console.log('⚠️  AI Mediator: OpenAI not configured - allowing all messages through');
      return null;
    }

    // === CACHE CHECK ===
    // Use email as identifier (username is deprecated, set to email for backward compatibility)
    const senderId =
      roleContext?.senderId || message.sender?.email || message.user_email || message.username;
    const receiverId =
      roleContext?.receiverId ||
      participantUsernames.find(u => {
        const msgEmail = message.sender?.email || message.user_email || message.username;
        return u !== msgEmail;
      }) ||
      'unknown';
    const hash = messageCache.generateHash(message.text, senderId, receiverId);
    const cachedResult = await messageCache.get(hash);

    if (cachedResult) {
      console.log('✅ AI Mediator: Using cached analysis (cache hit)');
      return cachedResult;
    }

    // === PRE-FILTERS ===
    const preFilterResult = preFilters.runPreFilters(message.text);
    if (preFilterResult.shouldSkipAI) {
      console.log(
        `✅ AI Mediator: Pre-approved message (${preFilterResult.reason}) - allowing without analysis`
      );
      return null;
    }

    // === CODE LAYER ANALYSIS ===
    let codeLayerResult = null;
    let parsedMessage = null;
    let codeLayerPromptSection = '';

    if (libs.codeLayerIntegration?.isAvailable()) {
      const childNames = existingContacts.filter(c => c.relationship === 'child').map(c => c.name);

      codeLayerResult = await safeExecute(
        () =>
          libs.codeLayerIntegration.analyzeWithCodeLayer(message.text, {
            senderId,
            receiverId: roleContext?.receiverId,
            childNames,
          }),
        'Code Layer analysis',
        null
      );

      if (codeLayerResult) {
        parsedMessage = codeLayerResult.parsed;

        if (parsedMessage) {
          libs.codeLayerIntegration.recordMetrics(parsedMessage, codeLayerResult.quickPass);
          console.log(
            `📊 Code Layer: Axioms fired: ${parsedMessage.axiomsFired.map(a => a.id).join(', ') || 'none'}`
          );

          // Quick-pass optimization
          if (codeLayerResult.quickPass.canPass) {
            console.log(
              '✅ AI Mediator: Quick-pass (Code Layer clean) - allowing without AI analysis'
            );
            return null;
          }

          codeLayerPromptSection =
            libs.codeLayerIntegration.buildCodeLayerPromptSection(parsedMessage);
        }
      }
    }

    try {
      const msgEmail = message.sender?.email || message.user_email || message.username;
      console.log('🤖 AI Mediator: Analyzing message from', msgEmail);

      // === LANGUAGE ANALYSIS ===
      let languageAnalysis = null;
      if (libs.languageAnalyzer) {
        const childNames = existingContacts
          .filter(c => c.relationship === 'child')
          .map(c => c.name);

        languageAnalysis = libs.languageAnalyzer.analyze(message.text, { childNames });
        console.log(`📊 Language Analysis: ${languageAnalysis.summary.length} observations`);
      }

      // === PATTERN DETECTION & STATE UPDATES ===
      const patterns = preFilters.detectConflictPatterns(message.text);
      stateManager.updateEscalationScore(this.conversationContext, roomId, patterns);
      stateManager.initializeEmotionalState(this.conversationContext, roomId);
      const policyState = stateManager.initializePolicyState(this.conversationContext, roomId);

      // === BUILD ALL CONTEXTS ===
      const contexts = await contextBuilder.buildAllContexts({
        message,
        recentMessages,
        participantUsernames,
        existingContacts,
        contactContextForAI,
        roomId,
        taskContextForAI,
        flaggedMessagesContext,
        roleContext,
        threadContext, // Pass thread context from analyzeMessage
      });

      // === GET RELATIONSHIP INSIGHTS ===
      const insights = await aiService.getRelationshipInsights(
        roomId,
        this.conversationContext.relationshipInsights
      );
      const insightsString = promptBuilder.formatInsightsForPrompt(insights);

      // === GENERATE HUMAN UNDERSTANDING ===
      // Generate deep insights about human nature, psychology, and relationships
      // This creates understanding FIRST, which informs impactful responses
      // CRITICAL: This understanding is essential for contextual, situation-aware responses
      // Increased timeout to 10 seconds to ensure completion
      let humanUnderstanding = null;
      try {
        // Build enriched relationship context that includes situation details
        const enrichedRelationshipContext = [
          contexts.contactContextForAI || '',
          contexts.coparentingContextString || '',
          contexts.taskContextForAI || '',
          contexts.flaggedMessagesContext || '',
        ]
          .filter(Boolean)
          .join('\n\n');

        const understandingPromise = generateHumanUnderstanding({
          messageText: message.text,
          senderDisplayName: contexts.senderDisplayName,
          receiverDisplayName: contexts.receiverDisplayName,
          messageHistory: contexts.messageHistory,
          relationshipContext: enrichedRelationshipContext,
          senderProfile: contexts.profileContext?.sender || null,
          receiverProfile: contexts.profileContext?.receiver || null,
          roleContext,
        });

        // Increased timeout to 10 seconds - this understanding is critical for quality responses
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Human understanding timeout')), 10000)
        );

        humanUnderstanding = await Promise.race([understandingPromise, timeoutPromise]);
        console.log('✅ Human Understanding: Generated successfully');
      } catch (error) {
        // Log warning but continue - system can still function, just with less context
        console.warn('⚠️ Human Understanding: Skipped due to error or timeout:', error.message);
        // Continue without understanding, but responses may be less contextual
        humanUnderstanding = null;
      }

      const humanUnderstandingString = humanUnderstanding
        ? formatUnderstandingForPrompt(humanUnderstanding)
        : '';

      // === CHECK COMMENT FREQUENCY ===
      const lastCommentTime = roomId ? this.conversationContext.lastCommentTime.get(roomId) : null;
      const timeSinceLastComment = lastCommentTime ? Date.now() - lastCommentTime : Infinity;
      const shouldLimitComments = timeSinceLastComment < 60000;

      // === BUILD PROMPT ===
      const prompt = promptBuilder.buildMediationPrompt({
        messageText: message.text,
        senderDisplayName: contexts.senderDisplayName,
        receiverDisplayName: contexts.receiverDisplayName,
        messageHistory: contexts.messageHistory,
        contactContextForAI: contexts.contactContextForAI,
        graphContextString: contexts.graphContextString,
        valuesContextString: contexts.valuesContextString,
        userIntelligenceContextString: contexts.userIntelligenceContextString,
        receiverIntelligenceContextString: contexts.receiverIntelligenceContextString,
        profileContextString: promptBuilder.formatProfileContextForPrompt(contexts.profileContext),
        coparentingContextString: contexts.coparentingContextString,
        codeLayerPromptSection,
        voiceSignatureSection: contexts.voiceSignatureSection,
        conversationPatternsSection: contexts.conversationPatternsSection,
        interventionLearningSection: contexts.interventionLearningSection,
        threadContext, // Add thread context to prompt
        roleAwarePromptSection: contexts.roleAwarePromptSection,
        insightsString,
        humanUnderstandingString,
        taskContextForAI: contexts.taskContextForAI,
        flaggedMessagesContext: contexts.flaggedMessagesContext,
        dualBrainContextString: contexts.dualBrainContextString,
      });

      // === MAKE AI CALL ===
      const completion = await openaiClient.createChatCompletion({
        model: AI.DEFAULT_MODEL,
        messages: [
          { role: 'system', content: promptBuilder.SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        max_tokens: AI.DEFAULT_MAX_TOKENS,
        temperature: AI.DEFAULT_TEMPERATURE,
      });

      const responseText = completion.choices[0].message.content.trim();
      console.log('🤖 AI Mediator: Received unified response');

      // === PROCESS RESPONSE ===
      const result = await responseProcessor.processResponse({
        responseText,
        message,
        roleContext,
        participantProfiles: contexts.participantProfiles,
        roomId,
        policyState,
        parsedMessage,
        languageAnalysis,
        shouldLimitComments,
      });

      // Update emotional state if available
      try {
        const parsed = JSON.parse(responseText);
        if (parsed.emotion) {
          stateManager.updateEmotionalState(
            this.conversationContext,
            roomId,
            message.sender?.email || message.user_email || message.username,
            parsed.emotion
          );
        }
      } catch (e) {
        /* ignore */
      }

      // Track comment time
      if (result?.action === 'COMMENT' && roomId) {
        this.conversationContext.lastCommentTime.set(roomId, Date.now());
      }

      // === CACHE RESULT ===
      // Cache asynchronously (don't block response)
      messageCache.set(hash, result).catch(err => {
        console.warn('[AI Mediator] Failed to cache result:', err.message);
      });

      return result;
    } catch (error) {
      // Log error for debugging (especially in tests)
      if (process.env.NODE_ENV === 'test' || process.env.DEBUG) {
        console.error('❌ Mediator Error:', error.message);
        console.error('Stack:', error.stack);
      }
      
      // Delegate to centralized error handler
      const errorContext = {
        messageLength: typeof message === 'string' ? message.length : message?.text?.length,
        recentMessagesCount: recentMessages?.length,
        hasContacts: existingContacts?.length > 0,
        roomId,
        username: typeof message === 'string' ? null : message?.username,
      };

      const handling = handleAnalysisError(error, errorContext, logger);

      if (handling.error) {
        throw handling.error;
      }

      // Fail open - allow message through (handling.shouldFailOpen === true)
      return null;
    }
  }

  /**
   * Update conversation context with new message
   */
  updateContext(message) {
    // Extract email identifier (username is deprecated, set to email for backward compatibility)
    const messageEmail = message.sender?.email || message.user_email || message.username;
    this.conversationContext.recentMessages.push({
      username: messageEmail, // Store email as username for backward compatibility
      text: message.text,
      timestamp: message.timestamp,
    });

    if (this.conversationContext.recentMessages.length > 30) {
      this.conversationContext.recentMessages.shift();
    }
  }

  /**
   * Get conversation context
   */
  getContext() {
    return {
      recentMessages: [...this.conversationContext.recentMessages],
      userSentiments: new Map(this.conversationContext.userSentiments),
    };
  }

  /**
   * Record intervention feedback for learning
   */
  recordInterventionFeedback(roomId, helpful) {
    stateManager.recordInterventionFeedback(this.conversationContext, roomId, helpful);
  }

  /**
   * Record when a user accepts an AI rewrite suggestion
   *
   * @param {string} senderId - The sender's user ID
   * @param {Object} rewriteData - { original, rewrite, tip }
   * @returns {Promise<boolean>} Success status
   */
  async recordAcceptedRewrite(senderId, rewriteData) {
    if (!libs.communicationProfile || !senderId) {
      return false;
    }

    try {
      const dbPostgres = require('../../../dbPostgres');

      await libs.communicationProfile.recordAcceptedRewrite(senderId, rewriteData, dbPostgres);

      if (libs.interventionLearning) {
        await libs.interventionLearning.recordInterventionOutcome(
          senderId,
          {
            type: 'rewrite',
            pattern: rewriteData.pattern || 'unknown',
            outcome: 'accepted',
            feedback: 'helpful',
            original_message: rewriteData.original,
            rewrite: rewriteData.rewrite,
          },
          dbPostgres
        );
      }

      console.log(`✅ AI Mediator: Recorded accepted rewrite for ${senderId}`);
      return true;
    } catch (err) {
      console.error(`❌ AI Mediator: Failed to record accepted rewrite:`, err.message);
      return false;
    }
  }

  /**
   * Extract relationship insights (delegates to aiService)
   */
  extractRelationshipInsights(recentMessages, roomId, roleContext) {
    return aiService.extractRelationshipInsights(
      recentMessages,
      roomId,
      this.conversationContext.relationshipInsights,
      roleContext
    );
  }
}

// ============================================================================
// SINGLETON INSTANCE (for backward compatibility)
// ============================================================================

// Create a default singleton instance for backward compatibility
// This maintains the existing API while allowing new code to create instances
const defaultInstance = new AIMediator();

// Export both the class and the singleton instance
module.exports = {
  // Class for creating new instances
  AIMediator,

  // Singleton instance (backward compatibility)
  analyzeMessage: (...args) => defaultInstance.analyzeMessage(...args),
  updateContext: (...args) => defaultInstance.updateContext(...args),
  getContext: (...args) => defaultInstance.getContext(...args),
  recordInterventionFeedback: (...args) => defaultInstance.recordInterventionFeedback(...args),
  recordAcceptedRewrite: (...args) => defaultInstance.recordAcceptedRewrite(...args),
  extractRelationshipInsights: (...args) => defaultInstance.extractRelationshipInsights(...args),

  // Utility functions (delegated to aiService)
  detectNamesInMessage: aiService.detectNamesInMessage,
  generateContactSuggestion: aiService.generateContactSuggestion,
};
