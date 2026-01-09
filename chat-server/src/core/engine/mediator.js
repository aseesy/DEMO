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
const { defaultLogger } = require('../../infrastructure/logging/logger');
const { AI } = require('../../infrastructure/config/constants');
const stateManager = require('./stateManager');

const logger = defaultLogger.child({ module: 'mediator' });

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
      logger.warn('⚠️ OpenAI not configured, allowing message through (NO MEDIATION)', {
        messageId: message?.id,
        textPreview:
          typeof message === 'string' ? message.substring(0, 50) : message?.text?.substring(0, 50),
        openaiConfigured: openaiClient.isConfigured(),
        hasOpenaiClient: !!openaiClient,
      });
      return null;
    }

    logger.debug('✅ OpenAI is configured, proceeding with AI mediation', {
      messageId: message?.id,
      textPreview:
        typeof message === 'string' ? message.substring(0, 50) : message?.text?.substring(0, 50),
    });

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
      logger.debug('Using cached analysis', { cacheHit: true, messageId: message?.id });
      return cachedResult;
    }

    // === PRE-FILTERS (Early Exit #1) ===
    const preFilterResult = preFilters.runPreFilters(message.text);
    if (preFilterResult.shouldSkipAI) {
      logger.debug('Pre-approved message, skipping AI', {
        reason: preFilterResult.reason,
        messageId: message?.id,
        messageLength: typeof message === 'string' ? message.length : message?.text?.length,
      });
      return null; // Early exit - no context building needed
    }

    // === CODE LAYER ANALYSIS ===
    // OPTIMIZED: Run with timeout to prevent blocking - if it takes too long, skip it
    let codeLayerResult = null;
    let parsedMessage = null;
    let codeLayerPromptSection = '';

    if (libs.codeLayerIntegration?.isAvailable()) {
      const childNames = existingContacts.filter(c => c.relationship === 'child').map(c => c.name);

      try {
        // Run Code Layer with 500ms timeout - if it takes longer, skip it
        const codeLayerPromise = safeExecute(
          () =>
            libs.codeLayerIntegration.analyzeWithCodeLayer(message.text, {
              senderId,
              receiverId: roleContext?.receiverId,
              childNames,
            }),
          'Code Layer analysis',
          null
        );

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Code Layer timeout')), 500)
        );

        codeLayerResult = await Promise.race([codeLayerPromise, timeoutPromise]);

        if (codeLayerResult) {
          parsedMessage = codeLayerResult.parsed;

          if (parsedMessage) {
            libs.codeLayerIntegration.recordMetrics(parsedMessage, codeLayerResult.quickPass);
            logger.debug('Code layer analysis complete', {
              axiomsFired: parsedMessage.axiomsFired.map(a => a.id),
              quickPass: codeLayerResult.quickPass.canPass,
            });

            // Quick-pass optimization (Early Exit #2)
            if (codeLayerResult.quickPass.canPass) {
              logger.debug('Code layer quick-pass, skipping AI', {
                messageId: message?.id,
                axiomsFired: parsedMessage.axiomsFired.map(a => a.id),
              });
              return null; // Early exit - no context building needed
            }

            codeLayerPromptSection =
              libs.codeLayerIntegration.buildCodeLayerPromptSection(parsedMessage);
          }
        }
      } catch (error) {
        // Code Layer timed out or failed - continue without it (non-blocking)
        logger.debug('Code Layer skipped (timeout or error)', {
          error: error.message,
          messageId: message?.id,
        });
        // Continue without Code Layer - not critical for basic mediation
      }
    }

    try {
      const msgEmail = message.sender?.email || message.user_email || message.username;
      logger.debug('Starting AI analysis', {
        senderEmail: msgEmail,
        messageId: message?.id,
        messageLength: typeof message === 'string' ? message.length : message?.text?.length,
      });

      // === LANGUAGE ANALYSIS ===
      let languageAnalysis = null;
      if (libs.languageAnalyzer) {
        const childNames = existingContacts
          .filter(c => c.relationship === 'child')
          .map(c => c.name);

        languageAnalysis = libs.languageAnalyzer.analyze(message.text, { childNames });
        logger.debug('Language analysis complete', {
          observationCount: languageAnalysis.summary.length,
        });
      }

      // === PATTERN DETECTION & STATE UPDATES ===
      const patterns = preFilters.detectConflictPatterns(message.text);
      stateManager.updateEscalationScore(this.conversationContext, roomId, patterns);

      // === BUILD ALL CONTEXTS ===
      // OPTIMIZED: Build contexts in parallel where possible to reduce latency
      const contextStartTime = Date.now();
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
      const contextLatency = Date.now() - contextStartTime;
      if (contextLatency > 1000) {
        logger.warn('Context building took longer than expected', {
          latencyMs: contextLatency,
          messageId: message?.id,
        });
      }

      // === CONNECT BEHAVIORAL PATTERNS TO USER INTENT ===
      let patternIntentConnection = null;
      if (parsedMessage?.behavioralPatterns && contexts.userIntent?.primaryIntent) {
        const patternIntentConnector = require('./patternIntentConnector');
        patternIntentConnection = patternIntentConnector.connectPatternsToIntent(
          parsedMessage.behavioralPatterns,
          contexts.userIntent,
          message.text
        );
        logger.debug('Pattern-intent connection complete', {
          connectionGenerated: patternIntentConnection.primaryConnection !== null,
        });
      }

      // === GET RELATIONSHIP INSIGHTS ===
      // NOTE: Insights extraction is now user-triggered only (via API endpoint)
      // Automatic extraction removed to reduce costs - insights are low-value for mediation decisions
      // If needed, call extractRelationshipInsights() explicitly via API
      const insightsString = null; // Disabled automatic extraction

      // === GENERATE HUMAN UNDERSTANDING ===
      // OPTIMIZED: Run in parallel with prompt building to reduce latency
      // Reduced timeout to 3 seconds for faster response - understanding is helpful but not critical
      let humanUnderstanding = null;
      const understandingPromise = (async () => {
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

          const understandingCall = generateHumanUnderstanding({
            messageText: message.text,
            senderDisplayName: contexts.senderDisplayName,
            receiverDisplayName: contexts.receiverDisplayName,
            messageHistory: contexts.messageHistory,
            relationshipContext: enrichedRelationshipContext,
            senderProfile: contexts.profileContext?.sender || null,
            receiverProfile: contexts.profileContext?.receiver || null,
            roleContext,
          });

          // Reduced timeout to 3 seconds for faster response
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Human understanding timeout')), 3000)
          );

          return await Promise.race([understandingCall, timeoutPromise]);
        } catch (error) {
          // Log warning but continue - system can still function, just with less context
          logger.debug('Human understanding skipped (non-blocking)', {
            error: error.message,
            messageId: message?.id,
          });
          return null;
        }
      })();

      // Start building prompt immediately (don't wait for human understanding)
      // We'll include it if it completes in time

      // === CHECK COMMENT FREQUENCY ===
      const lastCommentTime = roomId ? this.conversationContext.lastCommentTime.get(roomId) : null;
      const timeSinceLastComment = lastCommentTime ? Date.now() - lastCommentTime : Infinity;
      const shouldLimitComments = timeSinceLastComment < 60000;

      // Extract recent intervention information to help AI vary responses
      // Check both lastIntervention from context and any intervention messages in history
      const recentInterventions = [];

      // Add last intervention from conversation context if available
      if (this.conversationContext.lastIntervention) {
        const lastIntervention = this.conversationContext.lastIntervention;
        // Only include if it has meaningful content
        if (
          lastIntervention.validation ||
          (lastIntervention.refocusQuestions && lastIntervention.refocusQuestions.length > 0)
        ) {
          recentInterventions.push({
            validation: lastIntervention.validation || '',
            refocusQuestions: Array.isArray(lastIntervention.refocusQuestions)
              ? lastIntervention.refocusQuestions
              : [],
          });
          logger.info('📋 Including last intervention for variation', {
            hasValidation: !!lastIntervention.validation,
            questionCount: lastIntervention.refocusQuestions?.length || 0,
            previousQuestions: lastIntervention.refocusQuestions || [],
          });
        }
      }

      // Also check recent messages for any saved intervention data (though they're usually not saved)
      const interventionMessages = recentMessages
        .filter(msg => (msg.type === 'ai_intervention' || msg.validation) && msg.text)
        .slice(-2) // Get last 2 if any exist
        .map(msg => ({
          validation: msg.validation || msg.text?.substring(0, 200) || '',
          refocusQuestions: msg.refocusQuestions || [],
        }));

      recentInterventions.push(...interventionMessages);

      // Try to get human understanding, but don't wait more than 500ms
      // This allows us to include it if it's fast, but proceed without it if slow
      // Reduced from 1 second to 500ms for faster response
      let humanUnderstandingString = '';
      try {
        const quickUnderstanding = await Promise.race([
          understandingPromise,
          new Promise(resolve => setTimeout(() => resolve(null), 500)), // Max 500ms wait
        ]);
        if (quickUnderstanding) {
          humanUnderstandingString = formatUnderstandingForPrompt(quickUnderstanding);
          logger.debug('Human understanding included (fast path)');
        } else {
          logger.debug('Human understanding not available in time, proceeding without it');
        }
      } catch (error) {
        // Continue without understanding - non-blocking
        logger.debug('Human understanding not available in time, proceeding without it');
      }

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
        userIntent: contexts.userIntent,
        patternIntentConnection: patternIntentConnection,
        threadContext, // Add thread context to prompt
        roleAwarePromptSection: contexts.roleAwarePromptSection,
        insightsString,
        humanUnderstandingString, // May be empty if understanding didn't complete in time
        taskContextForAI: contexts.taskContextForAI,
        flaggedMessagesContext: contexts.flaggedMessagesContext,
        dualBrainContextString: contexts.dualBrainContextString,
        recentInterventions, // Include recent interventions to help AI vary responses
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
      logger.debug('Received unified AI response', {
        messageId: message?.id,
        responseLength: responseText.length,
      });

      // === PROCESS RESPONSE ===
      const result = await responseProcessor.processResponse({
        responseText,
        message,
        roleContext,
        participantProfiles: contexts.participantProfiles,
        roomId,
        policyState: this.conversationContext.policyState?.get(roomId) || null, // Deprecated, may be undefined
        parsedMessage,
        languageAnalysis,
        shouldLimitComments,
      });

      // Update emotional state if available
      try {
        // Emotion tracking removed - no evidence it improves outcomes
        // Can be re-added if A/B testing proves value
      } catch (_error) {
        /* ignore */
      }

      // Track comment time
      if (result?.action === 'COMMENT' && roomId) {
        this.conversationContext.lastCommentTime.set(roomId, Date.now());
      }

      // === STORE LAST INTERVENTION FOR VARIATION ===
      // Store intervention data so AI can vary responses in future interventions
      if (result && result.type === 'ai_intervention' && result.validation) {
        // Extract refocusQuestions from result (could be in result.refocusQuestions or result.intervention.refocusQuestions)
        const refocusQuestions =
          result.refocusQuestions || result.intervention?.refocusQuestions || [];
        const questionsArray = Array.isArray(refocusQuestions) ? refocusQuestions : [];

        this.conversationContext.lastIntervention = {
          validation: result.validation || '',
          refocusQuestions: questionsArray,
          timestamp: Date.now(),
        };

        logger.info('✅ Stored last intervention for variation', {
          messageId: message?.id,
          hasValidation: !!result.validation,
          validationPreview: (result.validation || '').substring(0, 100),
          questionCount: questionsArray.length,
          questions: questionsArray, // Log all questions for debugging
          questionsPreview: questionsArray.map(q => q.substring(0, 50)).join(' | '),
        });
      } else if (result && result.type === 'ai_intervention') {
        logger.warn('⚠️ Intervention result missing validation, not storing for variation', {
          messageId: message?.id,
          hasValidation: !!result.validation,
          resultType: result.type,
        });
      }

      // === CACHE RESULT ===
      // Cache asynchronously (don't block response)
      messageCache.set(hash, result).catch(err => {
        logger.warn('Failed to cache analysis result', {
          error: err.message,
          messageId: message?.id,
        });
      });

      return result;
    } catch (error) {
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

      logger.debug('Recorded accepted rewrite', {
        senderId,
      });
      return true;
    } catch (err) {
      logger.error('Failed to record accepted rewrite', {
        error: err.message,
        senderId,
      });
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
