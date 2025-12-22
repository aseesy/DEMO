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
 * CONSTITUTION REFERENCE (004-ai-mediation-constitution):
 * All AI interventions MUST comply with: ../policies/constitution.md
 *
 * @module liaizen/core/mediator
 */

const openaiClient = require('./client');
const userContext = require('../context/userContext');
const { defaultLogger } = require('../../utils/logger');
const { AI } = require('../../utils/constants');
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

// Conversation context tracker (unified state management)
const conversationContext = {
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

// Initialize state manager
stateManager.initialize(conversationContext);

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

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
async function analyzeMessage(
  message,
  recentMessages,
  participantUsernames = [],
  existingContacts = [],
  contactContextForAI = null,
  roomId = null,
  taskContextForAI = null,
  flaggedMessagesContext = null,
  roleContext = null
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
  const senderId = roleContext?.senderId || message.username;
  const receiverId =
    roleContext?.receiverId || participantUsernames.find(u => u !== message.username) || 'unknown';
  const hash = messageCache.generateHash(message.text, senderId, receiverId);
  const cachedResult = messageCache.get(hash);

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
    console.log('🤖 AI Mediator: Analyzing message from', message.username);

    // === LANGUAGE ANALYSIS ===
    let languageAnalysis = null;
    if (libs.languageAnalyzer) {
      const childNames = existingContacts.filter(c => c.relationship === 'child').map(c => c.name);

      languageAnalysis = libs.languageAnalyzer.analyze(message.text, { childNames });
      console.log(`📊 Language Analysis: ${languageAnalysis.summary.length} observations`);
    }

    // === PATTERN DETECTION & STATE UPDATES ===
    const patterns = preFilters.detectConflictPatterns(message.text);
    stateManager.updateEscalationScore(roomId, patterns);
    stateManager.initializeEmotionalState(roomId);
    const policyState = stateManager.initializePolicyState(roomId);

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
    });

    // === GET RELATIONSHIP INSIGHTS ===
    const insights = await aiService.getRelationshipInsights(
      roomId,
      conversationContext.relationshipInsights
    );
    const insightsString = promptBuilder.formatInsightsForPrompt(insights);

    // === CHECK COMMENT FREQUENCY ===
    const lastCommentTime = roomId ? conversationContext.lastCommentTime.get(roomId) : null;
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
      roleAwarePromptSection: contexts.roleAwarePromptSection,
      insightsString,
      taskContextForAI: contexts.taskContextForAI,
      flaggedMessagesContext: contexts.flaggedMessagesContext,
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
        stateManager.updateEmotionalState(roomId, message.username, parsed.emotion);
      }
    } catch (e) {
      /* ignore */
    }

    // Track comment time
    if (result?.action === 'COMMENT' && roomId) {
      conversationContext.lastCommentTime.set(roomId, Date.now());
    }

    // === CACHE RESULT ===
    messageCache.set(hash, result);

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

    // Fail open - allow message through
    return null;
  }
}

// ============================================================================
// CONTEXT MANAGEMENT
// ============================================================================

/**
 * Update conversation context with new message
 */
function updateContext(message) {
  conversationContext.recentMessages.push({
    username: message.username,
    text: message.text,
    timestamp: message.timestamp,
  });

  if (conversationContext.recentMessages.length > 30) {
    conversationContext.recentMessages.shift();
  }
}

/**
 * Get conversation context
 */
function getContext() {
  return {
    recentMessages: [...conversationContext.recentMessages],
    userSentiments: new Map(conversationContext.userSentiments),
  };
}

/**
 * Record intervention feedback for learning
 */
function recordInterventionFeedback(roomId, helpful) {
  stateManager.recordInterventionFeedback(roomId, helpful);
}

// ============================================================================
// ACCEPTED REWRITE RECORDING
// ============================================================================

/**
 * Record when a user accepts an AI rewrite suggestion
 *
 * @param {string} senderId - The sender's user ID
 * @param {Object} rewriteData - { original, rewrite, tip }
 * @returns {Promise<boolean>} Success status
 */
async function recordAcceptedRewrite(senderId, rewriteData) {
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

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Main unified function
  analyzeMessage,

  // Utility functions
  detectNamesInMessage: aiService.detectNamesInMessage,
  generateContactSuggestion: aiService.generateContactSuggestion,
  extractRelationshipInsights: (recentMessages, roomId, roleContext) =>
    aiService.extractRelationshipInsights(
      recentMessages,
      roomId,
      conversationContext.relationshipInsights,
      roleContext
    ),
  updateContext,
  getContext,
  recordInterventionFeedback,

  // Communication profile functions
  recordAcceptedRewrite,
};
