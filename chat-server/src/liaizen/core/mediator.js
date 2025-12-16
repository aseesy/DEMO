/**
 * AI Mediator - Consolidated AI Mediation System
 *
 * This module handles ALL AI-powered mediation features in a single, efficient system:
 * - Conflict escalation detection
 * - Emotional state analysis
 * - Intervention policy decisions
 * - Message mediation and rewriting
 * - Contact name detection
 * - Relationship insights learning
 *
 * OPTIMIZED: Single API call instead of 4-5 separate calls
 *
 * ENHANCED (002-sender-profile-mediation):
 * - Role-aware mediation: distinguishes sender from receiver
 * - Individual communication profiles per user
 * - Sender-focused coaching with receiver context awareness
 *
 * CONSTITUTION REFERENCE (004-ai-mediation-constitution):
 * All AI interventions MUST comply with: ../policies/constitution.md
 * Core principles:
 *   1. Language, Not Emotions - describe phrasing, not emotional states
 *   2. No Diagnostics - no psychological labels or character assessments
 *   3. Child-Centric - frame around child wellbeing when applicable
 *   4. 1-2-3 Framework - ADDRESS + ONE TIP + TWO REWRITES
 */

const openaiClient = require('./client');
const userContext = require('../context/userContext');
const { defaultLogger } = require('../../utils/logger');
const { RetryableError } = require('../../utils/errors');
const { TIME, CACHE, MESSAGE, ESCALATION, AI, DATABASE, ARRAY_LIMITS, VALIDATION } = require('../../utils/constants');
const stateManager = require('./stateManager');

// Language Analyzer Library (Feature 005)
let languageAnalyzer;
try {
  languageAnalyzer = require('../analysis/language-analyzer');
  console.log('✅ AI Mediator: Language analyzer library loaded');
} catch (err) {
  console.warn('⚠️ AI Mediator: Language analyzer library not available, using legacy mode');
  languageAnalyzer = null;
}

// Communication profile library for sender/receiver distinction
let communicationProfile;
try {
  communicationProfile = require('../context/communication-profile');
  console.log('✅ AI Mediator: Communication profile library loaded');
} catch (err) {
  console.warn('⚠️ AI Mediator: Communication profile library not available');
  communicationProfile = null;
}

// Voice signature extraction (Phase 1: Contextual Awareness)
let voiceSignature;
try {
  voiceSignature = require('../context/communication-profile/voiceSignature');
  console.log('✅ AI Mediator: Voice signature extraction loaded');
} catch (err) {
  console.warn('⚠️ AI Mediator: Voice signature extraction not available');
  voiceSignature = null;
}

// Conversation pattern analysis (Phase 1: Contextual Awareness)
let conversationPatterns;
try {
  conversationPatterns = require('../context/communication-profile/conversationPatterns');
  console.log('✅ AI Mediator: Conversation pattern analysis loaded');
} catch (err) {
  console.warn('⚠️ AI Mediator: Conversation pattern analysis not available');
  conversationPatterns = null;
}

// Intervention learning (Phase 2: Enhanced Context)
let interventionLearning;
try {
  interventionLearning = require('../context/communication-profile/interventionLearning');
  console.log('✅ AI Mediator: Intervention learning system loaded');
} catch (err) {
  console.warn('⚠️ AI Mediator: Intervention learning system not available');
  interventionLearning = null;
}

// Rewrite Validator Library (Feature 006)
let rewriteValidator;
try {
  rewriteValidator = require('../analysis/rewrite-validator');
  console.log('✅ AI Mediator: Rewrite validator library loaded');
} catch (err) {
  console.warn('⚠️ AI Mediator: Rewrite validator library not available');
  rewriteValidator = null;
}

// Code Layer Integration (Feature 004 - Hybrid Mediation Engine)
let codeLayerIntegration;
try {
  codeLayerIntegration = require('./codeLayerIntegration');
  if (codeLayerIntegration.isAvailable()) {
    console.log('✅ AI Mediator: Code Layer Integration v' + codeLayerIntegration.getVersion() + ' loaded');
  } else {
    console.warn('⚠️ AI Mediator: Code Layer Integration loaded but Code Layer not available');
  }
} catch (err) {
  console.warn('⚠️ AI Mediator: Code Layer Integration not available:', err.message);
  codeLayerIntegration = null;
}

// Profile Helpers Library (Feature 010 - Comprehensive User Profile)
let profileHelpers;
try {
  profileHelpers = require('../../utils/profileHelpers');
  console.log('✅ AI Mediator: Profile helpers library loaded');
} catch (err) {
  console.warn('⚠️ AI Mediator: Profile helpers library not available');
  profileHelpers = null;
}

// Co-Parent Context Library (Situational context for AI coaching)
let coparentContext;
try {
  coparentContext = require('../context/coparentContext');
  console.log('✅ AI Mediator: Co-parent context library loaded');
} catch (err) {
  console.warn('⚠️ AI Mediator: Co-parent context library not available');
  coparentContext = null;
}

// Graph Context Library (Neo4j relationship insights for AI coaching)
let graphContext;
try {
  graphContext = require('../context/graphContext');
  console.log('✅ AI Mediator: Graph context library loaded (Neo4j integration)');
} catch (err) {
  console.warn('⚠️ AI Mediator: Graph context library not available');
  graphContext = null;
}

// Conversation context tracker (unified state management)
const conversationContext = {
  recentMessages: [],
  userSentiments: new Map(),
  topicChanges: [],
  lastIntervention: null,
  relationshipInsights: new Map(),
  lastCommentTime: new Map(),

  // Escalation tracking (from conflictPredictor)
  escalationState: new Map(), // roomId -> escalation data

  // Emotional tracking (from emotionalModel)
  emotionalState: new Map(), // roomId -> emotional data

  // Policy tracking (from interventionPolicy)
  policyState: new Map(), // roomId -> policy configuration

  // OPTIMIZATION: Cache for similar message analyses (reduces redundant API calls)
  messageAnalysisCache: new Map(), // messageHash -> { result, timestamp }
  cacheMaxAge: CACHE.MESSAGE_CACHE_TTL_MS,
  cacheMaxSize: CACHE.MESSAGE_CACHE_MAX_SIZE
};

// Initialize state manager with conversation context
stateManager.initialize(conversationContext);

/**
 * Initialize escalation state for a room
 */
function initializeEscalationState(roomId) {
  if (!conversationContext.escalationState.has(roomId)) {
    conversationContext.escalationState.set(roomId, {
      escalationScore: 0,
      lastNegativeTime: null,
      patternCounts: {
        accusatory: 0,
        triangulation: 0,
        comparison: 0,
        blaming: 0
      }
    });
  }
  return conversationContext.escalationState.get(roomId);
}

/**
 * Initialize emotional state for a room
 */
function initializeEmotionalState(roomId) {
  if (!conversationContext.emotionalState.has(roomId)) {
    conversationContext.emotionalState.set(roomId, {
      participants: {},
      conversationEmotion: 'neutral',
      escalationRisk: 0,
      lastUpdated: Date.now()
    });
  }
  return conversationContext.emotionalState.get(roomId);
}

/**
 * Initialize policy state for a room
 */
function initializePolicyState(roomId) {
  if (!conversationContext.policyState.has(roomId)) {
    conversationContext.policyState.set(roomId, {
      interventionThreshold: 60,
      interventionStyle: 'moderate',
      preferredMethods: ['suggestion', 'reframing'],
      userPreferences: {},
      lastIntervention: null,
      interventionHistory: []
    });
  }
  return conversationContext.policyState.get(roomId);
}

/**
 * Detect conflict patterns in message (local analysis, no API call)
 * Feature 006: Refined to exclude positive contexts from accusatory detection
 */
function detectConflictPatterns(messageText) {
  const text = messageText.toLowerCase();

  // Positive context words that indicate friendly intent (Feature 006)
  const positiveContextWords = /\b(friend|best|great|awesome|amazing|wonderful|helpful|kind|love|appreciate|proud|happy|good|fantastic|incredible|well|person)\b/i;

  // Check if "you're/you are" is in a positive context
  const hasYouAre = /\b(you'?re|you are)\b/i.test(text);
  const isPositiveContext = positiveContextWords.test(text);

  // Negative words that make "you're/you are" accusatory
  const negativeContextWords = /\b(wrong|bad|stupid|crazy|irresponsible|useless|terrible|awful|horrible|pathetic|lazy|selfish|rude|mean|inconsiderate|careless)\b/i;

  const patterns = {
    // Only flag "you're/you are" as accusatory if NOT in positive context
    // AND either uses "always/never" OR has negative context words
    hasAccusatory: /\b(you always|you never)\b/.test(text) ||
      (hasYouAre && !isPositiveContext && negativeContextWords.test(text)),
    hasTriangulation: /\b(she told me|he said|the kids|child.*said)\b/.test(text),
    hasComparison: /\b(fine with me|never does that|at my house|at your house)\b/.test(text),
    hasBlaming: /\b(your fault|because of you|you made|you caused)\b/.test(text)
  };

  return patterns;
}

/**
 * Update escalation score based on detected patterns
 */
// updateEscalationScore moved to stateManager.js

/**
 * MAIN FUNCTION: Analyze message with unified AI call
 *
 * This replaces the previous separate calls to:
 * - conflictPredictor.assessEscalationRisk()
 * - emotionalModel.analyzeEmotionalState()
 * - interventionPolicy.generateInterventionPolicy()
 * - aiMediator.analyzeAndIntervene()
 *
 * @param {Object} message - The message object
 * @param {Array} recentMessages - Last 15 messages for context
 * @param {Array} participantUsernames - Usernames of active participants
 * @param {Array} existingContacts - Existing contacts for the user
 * @param {string} contactContextForAI - Formatted contact context string
 * @param {string} roomId - Room ID for tracking insights and comment frequency
 * @param {string} taskContextForAI - Formatted task context string
 * @param {string} flaggedMessagesContext - Context from previously flagged messages
 * @param {Object} roleContext - Optional sender/receiver context {senderId, receiverId}
 * @returns {Promise<Object>} - Unified mediation result
 */
/**
 * Generate a simple hash for message caching (based on message text and key context)
 */
function generateMessageHash(messageText, senderId, receiverId) {
  const crypto = require('crypto');
  const hashInput = `${messageText.toLowerCase().trim()}|${senderId}|${receiverId}`;
  return crypto.createHash('md5').update(hashInput).digest('hex');
}

/**
 * Check cache for similar message analysis
 */
function getCachedAnalysis(messageHash) {
  const cache = conversationContext.messageAnalysisCache;
  const cached = cache.get(messageHash);
  
  if (!cached) {
    return null;
  }
  
  // Check if cache entry is still valid
  const age = Date.now() - cached.timestamp;
  if (age > conversationContext.cacheMaxAge) {
    cache.delete(messageHash);
    return null;
  }
  
  return cached.result;
}

/**
 * Store analysis result in cache
 */
function cacheAnalysis(messageHash, result) {
  const cache = conversationContext.messageAnalysisCache;
  
  // Enforce max cache size (LRU-like: remove oldest if at limit)
  if (cache.size >= conversationContext.cacheMaxSize) {
    // Remove oldest entry
    let oldestKey = null;
    let oldestTime = Infinity;
    for (const [key, value] of cache.entries()) {
      if (value.timestamp < oldestTime) {
        oldestTime = value.timestamp;
        oldestKey = key;
      }
    }
    if (oldestKey) {
      cache.delete(oldestKey);
    }
  }
  
  cache.set(messageHash, {
    result: result,
    timestamp: Date.now()
  });
}

async function analyzeMessage(message, recentMessages, participantUsernames = [], existingContacts = [], contactContextForAI = null, roomId = null, taskContextForAI = null, flaggedMessagesContext = null, roleContext = null) {
  const logger = defaultLogger.child({
    operation: 'analyzeMessage',
    roomId,
    messageId: typeof message === 'string' ? null : message?.id,
    username: typeof message === 'string' ? null : message?.username,
    messageLength: typeof message === 'string' ? message.length : message?.text?.length
  });
  // Check if OpenAI is configured
  if (!openaiClient.isConfigured()) {
    console.log('⚠️  AI Mediator: OpenAI not configured - allowing all messages through');
    return null;
  }

  // OPTIMIZATION: Check cache for similar messages
  const senderId = roleContext?.senderId || message.username;
  const receiverId = roleContext?.receiverId || participantUsernames.find(u => u !== message.username) || 'unknown';
  const messageHash = generateMessageHash(message.text, senderId, receiverId);
  const cachedResult = getCachedAnalysis(messageHash);
  
  if (cachedResult) {
    console.log('✅ AI Mediator: Using cached analysis (cache hit)');
    return cachedResult;
  }

  // Pre-filter: Allow common greetings and polite messages without AI analysis
  const text = message.text.toLowerCase().trim();
  const allowedGreetings = ['hi', 'hello', 'hey', 'hi there', 'hello there', 'hey there'];
  const allowedPolite = ['thanks', 'thank you', 'ok', 'okay', 'sure', 'yes', 'no', 'got it', 'sounds good'];

  if (allowedGreetings.includes(text) || allowedPolite.includes(text)) {
    console.log('✅ AI Mediator: Pre-approved message (greeting/polite) - allowing without analysis');
    return null;
  }

  // === NEUTRAL THIRD-PARTY STATEMENTS PRE-FILTER (Feature 006) ===
  // Messages about third parties (not the co-parent) should NOT be mediated
  // If the message doesn't mention "you" and talks about someone else, it's not conflict
  const mentionsYou = /\b(you|your|you'?re|you'?ve|you'?d|you'?ll)\b/i.test(message.text);
  const mentionsThirdParty = /\b(my\s+)?(friend|teacher|boss|neighbor|colleague|coworker|brother|sister|mother|father|parent|grandma|grandpa|aunt|uncle|cousin)\b/i.test(message.text);

  // If talking about a third party (not "you") and no accusatory patterns, allow it
  if (!mentionsYou && mentionsThirdParty) {
    console.log('✅ AI Mediator: Pre-approved message (third-party statement) - allowing without analysis');
    return null;
  }

  // === POSITIVE SENTIMENT PRE-FILTER (Feature 006) ===
  // Friendly, positive messages should NEVER be mediated
  const positivePatterns = [
    /\b(you'?re|you are)\s+(my\s+)?(friend|best|great|awesome|amazing|wonderful|the best|so kind|so helpful|so great|incredible|fantastic)\b/i,
    /\b(love|appreciate|thankful|grateful)\s+(you|that|this)\b/i,
    /\b(thank|thanks)\s+(you|so much|for)\b/i,
    /\b(good job|well done|nice work|great work|great job)\b/i,
    /\bI\s+(love|appreciate|value|admire|respect)\s+(you|this|that|our)\b/i,
    /\b(you'?re|you are)\s+(doing\s+)?(great|well|good|amazing|awesome)\b/i,
    /\b(miss|missed)\s+you\b/i,
    /\b(proud of|happy for)\s+you\b/i,
    /\byou('?re| are)\s+a\s+(great|good|wonderful|amazing)\s+(parent|dad|mom|father|mother|person)\b/i,
    // Additional positive patterns for compliments
    /\b(I\s+)?love\s+(how|when|that)\s+you\b/i,  // "I love how you...", "love when you..."
    /\b(I\s+)?love\s+(it|this)\s+when\s+you\b/i, // "I love it when you..."
    /\byou\s+(make|made)\s+me\s+(happy|smile|laugh|feel\s+(good|better|loved|special))\b/i,
    /\b(you'?re|you are)\s+(so\s+)?(sweet|kind|thoughtful|caring|supportive|helpful)\b/i,
  ];

  for (const pattern of positivePatterns) {
    if (pattern.test(message.text)) {
      console.log('✅ AI Mediator: Pre-approved message (positive sentiment) - allowing without analysis');
      return null;
    }
  }
  // === END POSITIVE SENTIMENT PRE-FILTER ===

  // === CODE LAYER ANALYSIS (Feature 004 - Hybrid Mediation Engine) ===
  // Run structural analysis BEFORE AI call for pattern detection
  let codeLayerResult = null;
  let parsedMessage = null;
  let codeLayerPromptSection = '';

  if (codeLayerIntegration && codeLayerIntegration.isAvailable()) {
    try {
      // Extract child names from contacts for context
      const childNames = existingContacts
        .filter(c => c.relationship === 'child')
        .map(c => c.name);

      // Build Code Layer context
      const codeLayerContext = {
        senderId: roleContext?.senderId || message.username,
        receiverId: roleContext?.receiverId,
        childNames,
      };

      // Run Code Layer analysis
      codeLayerResult = await codeLayerIntegration.analyzeWithCodeLayer(message.text, codeLayerContext);
      parsedMessage = codeLayerResult.parsed;

      if (parsedMessage) {
        // Record metrics
        codeLayerIntegration.recordMetrics(parsedMessage, codeLayerResult.quickPass);

        console.log(`📊 Code Layer: Axioms fired: ${parsedMessage.axiomsFired.map(a => a.id).join(', ') || 'none'}`);
        console.log(`📊 Code Layer: Conflict potential: ${parsedMessage.assessment.conflict_potential}, QuickPass: ${codeLayerResult.quickPass.canPass}`);

        // === QUICK-PASS OPTIMIZATION ===
        // If Code Layer says message is clean, skip AI call entirely
        if (codeLayerResult.quickPass.canPass) {
          console.log('✅ AI Mediator: Quick-pass (Code Layer clean) - allowing without AI analysis');
          return null;
        }

        // Build Code Layer context for AI prompt
        codeLayerPromptSection = codeLayerIntegration.buildCodeLayerPromptSection(parsedMessage);
      }
    } catch (err) {
      console.warn('⚠️ AI Mediator: Code Layer analysis failed, continuing with AI:', err.message);
      codeLayerResult = null;
      parsedMessage = null;
    }
  }
  // === END CODE LAYER ANALYSIS ===

  try {
    console.log('🤖 AI Mediator: Analyzing message from', message.username);

    // === LANGUAGE ANALYSIS (Feature 005) ===
    // Run structured language analysis before AI call
    let languageAnalysis = null;
    let languageAnalysisContext = '';
    if (languageAnalyzer) {
      const childNames = existingContacts
        .filter(c => c.relationship === 'child')
        .map(c => c.name);

      languageAnalysis = languageAnalyzer.analyze(message.text, { childNames });
      languageAnalysisContext = languageAnalyzer.formatForPrompt(languageAnalysis);

      console.log(`📊 Language Analysis: ${languageAnalysis.summary.length} observations, ${languageAnalysis.meta.processing_time_ms}ms`);

      // Quick optimization: if no issues detected and confidence is high, consider skipping AI
      if (languageAnalysis.meta.confidence > 80 &&
          !languageAnalysis.patterns.global_negative &&
          !languageAnalysis.patterns.evaluative_character &&
          !languageAnalysis.patterns.child_as_weapon &&
          !languageAnalysis.patterns.child_triangulation &&
          languageAnalysis.structure.sentence_type !== 'threat' &&
          languageAnalysis.structure.sentence_type !== 'accusation') {
        // Low-risk message - could skip AI, but let's still run for now
        console.log('📊 Language Analysis: Low-risk message detected');
      }
    }
    // === END LANGUAGE ANALYSIS ===

    // Local pattern detection (no API call) - legacy, kept for escalation tracking
    const patterns = detectConflictPatterns(message.text);
    const escalationState = stateManager.updateEscalationScore(roomId, patterns);

    // Initialize states
    const emotionalState = stateManager.initializeEmotionalState(roomId);
    const policyState = stateManager.initializePolicyState(roomId);

    // === ROLE-AWARE MEDIATION (002-sender-profile-mediation) ===
    // Load sender and receiver profiles if roleContext is provided
    let roleAwareContext = null;
    if (communicationProfile && roleContext?.senderId && roleContext?.receiverId) {
      try {
        const dbPostgres = require('../../../dbPostgres');

        // Load both profiles efficiently
        const profiles = await communicationProfile.loadProfiles(
          [roleContext.senderId, roleContext.receiverId],
          dbPostgres
        );

        const senderProfile = profiles.get(roleContext.senderId.toLowerCase());
        const receiverProfile = profiles.get(roleContext.receiverId.toLowerCase());

        // Build role-aware mediation context
        roleAwareContext = communicationProfile.buildMediationContext({
          senderId: roleContext.senderId,
          receiverId: roleContext.receiverId,
          senderProfile,
          receiverProfile,
          messageText: message.text,
          recentMessages,
        });

        console.log(`🎯 AI Mediator: Role-aware mode - Sender: ${roleContext.senderId}, Receiver: ${roleContext.receiverId}`);
      } catch (err) {
        console.warn('⚠️ AI Mediator: Failed to load role-aware context, using legacy mode:', err.message);
        roleAwareContext = null;
      }
    }
    // === END ROLE-AWARE MEDIATION ===

    // Get user contexts for all participants
    const userContexts = [];
    const allParticipants = [...new Set([message.username, ...participantUsernames])];

    // Fetch profile data for all participants
    const participantProfiles = new Map();
    try {
      const db = require('../../../dbPostgres');
      const dbSafe = require('../../../dbSafe');

      for (const username of allParticipants) {
        try {
          const userResult = await dbSafe.safeSelect('users', { username: username.toLowerCase() }, { limit: 1 });
          const users = dbSafe.parseResult(userResult);
          if (users.length > 0) {
            participantProfiles.set(username.toLowerCase(), users[0]);
          }
        } catch (err) {
          console.error(`Error fetching profile for ${username}:`, err.message);
        }
      }
    } catch (err) {
      console.error('Error fetching participant profiles:', err.message);
    }

    for (const username of allParticipants) {
      const profileData = participantProfiles.get(username.toLowerCase());
      const context = await userContext.formatContextForAI(username, profileData);
      if (context && !context.includes('No context available')) {
        userContexts.push(context);
      }
    }

    // === COMPREHENSIVE PROFILE CONTEXT (Feature 010) ===
    // Build rich profile context for empathetic AI coaching
    let profileContextForAI = null;
    if (profileHelpers && roleContext?.senderId && roleContext?.receiverId) {
      try {
        const senderUsername = roleContext.senderId.toLowerCase();
        const receiverUsername = roleContext.receiverId.toLowerCase();

        // Get raw profiles (already fetched above)
        let senderProfile = participantProfiles.get(senderUsername);
        let receiverProfile = participantProfiles.get(receiverUsername);

        // Decrypt sensitive fields for AI context building
        // Note: AI only gets abstracted flags, not raw sensitive data
        if (senderProfile) {
          senderProfile = profileHelpers.decryptSensitiveFields(senderProfile);
        }
        if (receiverProfile) {
          receiverProfile = profileHelpers.decryptSensitiveFields(receiverProfile);
        }

        // Build dual profile context (sender and receiver)
        profileContextForAI = profileHelpers.buildDualProfileContext(
          senderProfile,
          receiverProfile
        );

        if (profileContextForAI?.combinedSummary) {
          console.log('📋 AI Mediator: Comprehensive profile context loaded for sender and receiver');
        }
      } catch (err) {
        console.warn('⚠️ AI Mediator: Failed to build profile context:', err.message);
        profileContextForAI = null;
      }
    }
    // === END COMPREHENSIVE PROFILE CONTEXT ===

    // Build context for AI
    const messageHistory = recentMessages
      .slice(-MESSAGE.RECENT_MESSAGES_COUNT)
      .map(msg => `${msg.username}: ${msg.text}`)
      .join('\n');

    const userContextString = userContexts.length > 0
      ? `\n\nUser Context Information:\n${userContexts.join('\n')}`
      : '';

    const contactContextString = contactContextForAI
      ? `\n\n${contactContextForAI}`
      : '';

    const taskContextString = taskContextForAI
      ? `\n\nACTIVE PARENTING TASKS:\n${taskContextForAI}`
      : '';

    const flaggedContextString = flaggedMessagesContext || '';

    // Build comprehensive profile context string (Feature 010)
    const profileContextString = profileContextForAI?.combinedSummary
      ? `\n\n=== PARTICIPANT CONTEXT (for empathetic coaching) ===
${profileContextForAI.combinedSummary}

COACHING GUIDANCE: Use this context to provide more understanding coaching. If a sender is under financial stress, be gentle when coaching messages about expenses. If someone is in recovery, be mindful about discussions involving substances. This context helps you coach with empathy.`
      : '';

    // === CO-PARENTING SITUATION CONTEXT ===
    // Build rich context from sender's contacts for situational coaching
    let coparentingContextString = '';
    if (coparentContext && roleContext?.senderId) {
      try {
        const situationContext = coparentContext.buildCoparentingContext(
          roleContext.senderId,
          roleContext.receiverId,
          existingContacts,
          null, // senderProfile - not needed, we have existingContacts
          null  // receiverProfile
        );

        if (situationContext.hasContext) {
          coparentingContextString = '\n\n' + coparentContext.formatContextForPrompt(situationContext);

          // Also extract the sender's goal from this message for more targeted rewrites
          const messageGoal = coparentContext.extractMessageGoal(message.text, situationContext);
          if (messageGoal.topic !== 'general') {
            coparentingContextString += `\n\nMESSAGE TOPIC DETECTED: ${messageGoal.topic}`;
            if (messageGoal.specificDetail) {
              coparentingContextString += ` (mentions: ${messageGoal.specificDetail})`;
            }
            if (messageGoal.goal !== 'unknown') {
              coparentingContextString += `\nUNDERLYING GOAL: ${messageGoal.goal}`;
            }
            if (situationContext.childNames.length > 0) {
              coparentingContextString += `\nCHILD NAME(S) TO USE IN REWRITES: ${situationContext.childNames.join(', ')}`;
            }
          }

          console.log('📋 AI Mediator: Co-parenting situation context loaded');
        }
      } catch (err) {
        console.warn('⚠️ AI Mediator: Failed to build co-parenting context:', err.message);
      }
    }
    // === END CO-PARENTING SITUATION CONTEXT ===

    // === GRAPH DATABASE CONTEXT (Neo4j relationship insights) ===
    // Fetch relationship history and metrics from graph database
    let graphContextString = '';
    if (graphContext && roleContext?.senderId && roleContext?.receiverId && roomId) {
      try {
        // Get sender's user ID from the participants map if available
        const senderProfile = participantProfiles.get(roleContext.senderId.toLowerCase());
        const receiverProfile = participantProfiles.get(roleContext.receiverId.toLowerCase());

        // Debug logging to diagnose graph context issues
        console.log('📊 GraphContext Debug:', {
          senderId: roleContext.senderId,
          receiverId: roleContext.receiverId,
          roomId: roomId,
          senderProfileFound: !!senderProfile,
          senderProfileId: senderProfile?.id,
          receiverProfileFound: !!receiverProfile,
          receiverProfileId: receiverProfile?.id
        });

        if (senderProfile?.id && receiverProfile?.id) {
          const relationshipData = await graphContext.getRelationshipContext(
            senderProfile.id,
            receiverProfile.id,
            roomId
          );

          if (relationshipData?.formattedContext) {
            graphContextString = `\n\n=== RELATIONSHIP HISTORY (from graph database) ===
${relationshipData.formattedContext}

ATTUNEMENT GUIDANCE: Use this relationship history to calibrate your response. For high-conflict relationships, be extra gentle. For new relationships, provide more foundational guidance. For established relationships with few interventions, acknowledge their progress.`;

            console.log('📊 AI Mediator: Graph context loaded -', relationshipData.insights?.healthIndicator || 'unknown', 'relationship health');
          }
        }
      } catch (err) {
        console.warn('⚠️ AI Mediator: Failed to build graph context:', err.message);
      }
    }
    // === END GRAPH DATABASE CONTEXT ===

    // Get relationship insights
    let insights = null;
    if (roomId) {
      try {
        const db = require('../../../dbPostgres');
        const dbSafe = require('../../../dbSafe');
        const insightsResult = await dbSafe.safeSelect('relationship_insights', { room_id: roomId }, { limit: 1 });
        const insightsRows = dbSafe.parseResult(insightsResult);
        if (insightsRows.length > 0) {
          insights = JSON.parse(insightsRows[0].insights_json);
          conversationContext.relationshipInsights.set(roomId, insights);
        } else {
          insights = conversationContext.relationshipInsights.get(roomId);
        }
      } catch (err) {
        console.error('Error loading relationship insights:', err.message);
        insights = conversationContext.relationshipInsights.get(roomId);
      }
    }

    const insightsString = insights
      ? `\n\nLEARNED RELATIONSHIP INSIGHTS:\n- Communication style: ${insights.communicationStyle || 'Not yet learned'}\n- Common topics: ${insights.commonTopics.join(', ') || 'Not yet learned'}\n- Tension points: ${insights.tensionPoints.join(', ') || 'None identified'}\n- Positive patterns: ${insights.positivePatterns.join(', ') || 'Not yet identified'}`
      : '';

    // Check comment frequency
    const lastCommentTime = roomId ? conversationContext.lastCommentTime.get(roomId) : null;
    const timeSinceLastComment = lastCommentTime ? Date.now() - lastCommentTime : Infinity;
    const shouldLimitComments = timeSinceLastComment < 60000;
    const commentFrequencyNote = shouldLimitComments
      ? '\n\nIMPORTANT: You recently commented. Only use COMMENT if truly valuable.'
      : '';

    // Build escalation context
    const patternSummary = Object.entries(escalationState.patternCounts)
      .filter(([_, count]) => count > 0)
      .map(([pattern, count]) => `${pattern}: ${count}`)
      .join(', ');

    // Get previous emotional state for this user (will be initialized by stateManager if needed)
    const username = message.username;

    // Build relationship context
    const relationshipContext = contactContextForAI
      ? `\n\nRELATIONSHIP CONTEXT:\n${contactContextForAI}\n\nThese two people are co-parents who share children but are no longer together. They need to communicate about shared children while navigating their separated relationship.${insightsString}${taskContextString}${flaggedContextString}`
      : `\n\nRELATIONSHIP CONTEXT:\nThese are co-parents sharing children but no longer together.${insightsString}${taskContextString}${flaggedContextString}`;

    // === ROLE-AWARE CONTEXT (002-sender-profile-mediation) ===
    // Build sender/receiver specific context if available
    let roleAwarePromptSection = '';
    let senderDisplayName = message.username;
    let receiverDisplayName = 'the other co-parent';
    let voiceSignatureSection = '';
    let conversationPatternsSection = '';
    let interventionLearningSection = '';

    if (roleAwareContext && communicationProfile) {
      const mediationContext = require('../context/communication-profile/mediationContext');
      roleAwarePromptSection = mediationContext.formatFullContext(roleAwareContext);
      senderDisplayName = roleAwareContext.roles?.sender?.display_name || message.username;
      receiverDisplayName = roleAwareContext.roles?.receiver?.display_name || 'the other co-parent';

      // === VOICE SIGNATURE EXTRACTION (Phase 1: Contextual Awareness) ===
      if (voiceSignature && roleContext?.senderId) {
        try {
          // Get sender's recent messages (last 20) to build voice signature
          const senderMessages = recentMessages
            .filter(msg => msg.username === roleContext.senderId)
            .slice(-20)
            .map(msg => msg.text);

          if (senderMessages.length >= 3) {
            // Build voice signature from recent messages
            const signature = voiceSignature.buildVoiceSignature(senderMessages);
            
            // Format for AI prompt
            voiceSignatureSection = voiceSignature.formatVoiceSignatureForAI(signature);
            
            // Update profile with voice signature (async, don't block)
            if (signature.sample_count >= 5) {
              const dbPostgres = require('../../../dbPostgres');
              const senderProfile = await communicationProfile.loadProfile(roleContext.senderId, dbPostgres);
              const existingPatterns = senderProfile?.communication_patterns || {};
              const updatedPatterns = voiceSignature.mergeVoiceSignature(existingPatterns, signature);
              
              // Update profile asynchronously (don't block message processing)
              communicationProfile.updateProfile(roleContext.senderId, {
                communication_patterns: updatedPatterns
              }, dbPostgres).catch(err => {
                console.warn('⚠️ AI Mediator: Failed to update voice signature:', err.message);
              });
            }
          }
        } catch (err) {
          console.warn('⚠️ AI Mediator: Voice signature extraction failed:', err.message);
        }
      }
      // === END VOICE SIGNATURE EXTRACTION ===

      // === CONVERSATION PATTERN ANALYSIS (Phase 1: Contextual Awareness) ===
      if (conversationPatterns && roleContext?.senderId && roleContext?.receiverId && recentMessages.length >= 2) {
        try {
          // Analyze conversation patterns from recent messages
          const patterns = conversationPatterns.analyzeConversationPatterns(
            recentMessages,
            roleContext.senderId,
            roleContext.receiverId
          );

          // Format for AI prompt
          if (patterns.sample_size >= 2) {
            conversationPatternsSection = conversationPatterns.formatPatternsForAI(patterns);
          }
        } catch (err) {
          console.warn('⚠️ AI Mediator: Conversation pattern analysis failed:', err.message);
        }
      }
      // === END CONVERSATION PATTERN ANALYSIS ===

      // === INTERVENTION LEARNING (Phase 2: Enhanced Context) ===
      if (interventionLearning && roleContext?.senderId) {
        try {
          const dbPostgres = require('../../../dbPostgres');
          const learningData = await interventionLearning.getInterventionLearning(roleContext.senderId, dbPostgres);
          
          if (learningData && learningData.successful_interventions.length > 0) {
            interventionLearningSection = interventionLearning.formatLearningForAI(learningData);
          }
        } catch (err) {
          console.warn('⚠️ AI Mediator: Failed to load intervention learning:', err.message);
        }
      }
      // === END INTERVENTION LEARNING ===
    }
    // === END ROLE-AWARE CONTEXT ===

    // UNIFIED PROMPT: Validate, provide clarity, offer rewrites
    const prompt = `Analyze this co-parenting message. Decide: STAY_SILENT, INTERVENE, or COMMENT.

STAY_SILENT (default): Allow respectful messages, logistics, questions, imperfect-but-not-hostile phrasing.
INTERVENE: Only for messages that attack, blame, use contempt, guilt-trip, or weaponize the child.

MESSAGE FROM ${senderDisplayName}: "${message.text}"

${relationshipContext}
${graphContextString || ''}
${profileContextString || ''}
${coparentingContextString || ''}
${messageHistory ? `Recent messages:\n${messageHistory}\n` : ''}
${codeLayerPromptSection || ''}
${voiceSignatureSection ? `\n${voiceSignatureSection}\n` : ''}
${conversationPatternsSection ? `\n${conversationPatternsSection}\n` : ''}
${interventionLearningSection ? `\n${interventionLearningSection}\n` : ''}
${roleAwarePromptSection ? `\n${roleAwarePromptSection}\n` : ''}

IF YOU INTERVENE, provide THREE parts:

1. validation: Connect their feeling to the situation. Down to earth, not clinical.
   
   RULES:
   - Relate the feeling to what's actually happening (the situation, not the emotion label)
   - Don't name their emotion directly ("you're angry") — describe the situation that would cause it
   - Don't give advice
   - Sound like a friend who gets it, not a therapist
   - 1-2 sentences max
   
   GOOD EXAMPLES:
   - "Schedules falling apart at the last minute is exhausting, especially when you've already rearranged your day."
   - "Finding out plans changed through the kids instead of directly — that's a rough way to get news."
   - "When you've asked for something multiple times and it keeps not happening, it starts to feel like you're invisible."
   - "Watching pickup time get pushed later and later, with your evening disappearing — that's a lot."
   
   BAD EXAMPLES:
   ❌ "I hear your frustration" (clinical, uses "I")
   ❌ "You seem angry" (labeling emotion)
   ❌ "That must be hard" (generic, not connected to situation)
   ❌ "Communication breakdowns are difficult" (clinical)

2. insight: ONE practical tip — explain WHY the current approach won't work and WHAT would work better.

   RULES:
   - Explain the EFFECT of their current phrasing (what it will cause)
   - Suggest a better APPROACH (not just "be nicer")
   - Be specific to THIS message
   - 1-2 sentences max
   - Focus on what will actually GET RESULTS, not just being polite

   GOOD EXAMPLES:
   - "Criticism builds resentment and won't lead to healthier meals. Focus on what you want to grow."
   - "'Always' and 'never' shut down the conversation. Share the specific instance instead."
   - "Starting with what went wrong puts them on defense. Lead with what you need going forward."
   - "Telling them what to do invites pushback. Sharing the child's experience invites problem-solving."
   - "Abstract principles sound preachy. The child's actual experience is harder to argue with."

   BAD EXAMPLES:
   ❌ "Try to see it from their perspective" (too abstract)
   ❌ "Communication is key" (generic platitude)
   ❌ "Be more positive" (vague, not actionable)
   ❌ "Remember you're both on the same team" (relationship advice, not message tip)

3. rewrite1 and rewrite2: The SAME message, transformed. Keep the exact intent but make it COLLABORATIVE.

   RULES:
   - START WITH ACKNOWLEDGMENT when possible — find something they did right first
   - FOCUS ON THE CHILD'S SPECIFIC EXPERIENCE, not abstract principles
     - "She says her tummy hurts after" NOT "healthy eating is important"
     - "He had trouble sleeping" NOT "consistent bedtimes matter"
   - OFFER PRACTICAL ALTERNATIVES OR SOLUTIONS — not just criticism
   - END WITH A COLLABORATIVE QUESTION — invite problem-solving together
   - Sound like a real person who cares — NOT corporate or preachy
   - Vary the approach between rewrite1 and rewrite2

   GOOD EXAMPLES:
   - "Thanks for feeding Vira dinner. I know she loves McDonald's, but she says her tummy hurts after. I usually grab Chinese and get her rice when we're rushed. Do you have any quick backups that work?"
   - "I worry about Vira when she eats McDonald's because she says her tummy hurts later. Just wanted to run that by you."
   - "The pickup time shifted and it threw off bedtime. I know things come up — is there a way we can flag changes earlier?"
   - "Thanks for taking him to practice. He mentioned he forgot his water bottle — maybe we can keep one in your car too?"

   BAD EXAMPLES:
   ❌ "Per our agreement, pickup was scheduled for 7:30" (corporate/legal)
   ❌ "Healthy eating is important for children" (preachy/abstract)
   ❌ "You should consider healthier options" (judgmental)
   ❌ "I would appreciate if you could..." (stiff)
   ❌ "Let's ensure better communication going forward" (corporate)

Respond with JSON only:
{
  "action": "STAY_SILENT|INTERVENE|COMMENT",
  "escalation": {"riskLevel": "low|medium|high", "confidence": 0-100, "reasons": []},
  "emotion": {"currentEmotion": "neutral|frustrated|defensive", "stressLevel": 0-100},
  "intervention": {
    "validation": "Connect feeling to situation — down to earth, not clinical",
    "insight": "WHY current approach won't work + WHAT would work better (1-2 sentences)",
    "rewrite1": "Acknowledge + child's experience + solution + collaborative question",
    "rewrite2": "Different approach, same pattern: acknowledge, experience, solution, question"
  }
}`;

    // Make single unified API call
    // OPTIMIZED: Using gpt-4o-mini for cost efficiency while maintaining quality
    // Main mediation requires nuanced understanding, but gpt-4o-mini handles this well
    const completion = await openaiClient.createChatCompletion({
      model: AI.DEFAULT_MODEL, // ~10x cheaper than gpt-3.5-turbo, similar quality for this task
      messages: [
        {
          role: 'system',
          content: 'You analyze co-parenting messages. When intervening, provide: (1) validation - connect their feeling to the situation like a friend would, (2) insight - explain WHY their approach won\'t work and WHAT would work better, (3) two rewrites - start with acknowledgment, focus on child\'s actual experience not abstract principles, offer solutions, end with collaborative question. JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: AI.DEFAULT_MAX_TOKENS,
      temperature: AI.DEFAULT_TEMPERATURE
    });

    const response = completion.choices[0].message.content.trim();
    console.log('🤖 AI Mediator: Received unified response');

    // DEBUG: Log the full AI response to see what's being returned
    try {
      const debugParsed = JSON.parse(response);
      if (debugParsed.intervention) {
        console.log('📝 VALIDATION:', debugParsed.intervention.validation);
        console.log('📝 INSIGHT:', debugParsed.intervention.insight);
        console.log('📝 REWRITE 1:', debugParsed.intervention.rewrite1);
        console.log('📝 REWRITE 2:', debugParsed.intervention.rewrite2);
        console.log('📝 FULL INTERVENTION:', JSON.stringify(debugParsed.intervention, null, 2));
      }
    } catch (e) { /* ignore parse errors for debug */ }

    // Parse unified response
    let result;
    try {
      result = JSON.parse(response);
    } catch (parseError) {
      console.error('❌ Failed to parse AI response as JSON:', parseError.message);
      console.error('Response was:', response);
      return null;
    }

    // Update emotional state
    if (result.emotion) {
      stateManager.updateEmotionalState(roomId, message.username, result.emotion);
    }

    // Process action
    const action = (result.action || 'STAY_SILENT').toUpperCase();

    if (action === 'STAY_SILENT') {
      console.log('🤖 AI Mediator: STAY_SILENT - allowing message');
      const silentResult = null;
      
      // OPTIMIZATION: Cache null results (to avoid re-analyzing safe messages)
      cacheAnalysis(messageHash, silentResult);
      
      return silentResult;
    }

    if (action === 'COMMENT') {
      if (shouldLimitComments) {
        console.log('💬 AI Mediator: Skipping comment due to frequency limit');
        return null;
      }

      if (!result.intervention?.comment) {
        console.error('❌ COMMENT action but no comment text');
        return null;
      }

      // Track comment time
      if (roomId) {
        conversationContext.lastCommentTime.set(roomId, Date.now());
      }

      console.log('💬 AI Mediator: Adding comment');

      const commentResult = {
        type: 'ai_comment',
        action: 'COMMENT',
        text: result.intervention.comment,
        originalMessage: message,
        escalation: result.escalation,
        emotion: result.emotion
      };

      // OPTIMIZATION: Cache the result
      cacheAnalysis(messageHash, commentResult);
      
      return commentResult;
    }

    if (action === 'INTERVENE') {
      const intervention = result.intervention || {};

      // Validate required fields - validation, insight, rewrite1, rewrite2
      if (!intervention.validation || !intervention.insight || !intervention.rewrite1 || !intervention.rewrite2) {
        console.error('❌ INTERVENE action missing required fields - ALLOWING message (safety fallback)');
        console.error('Missing fields:', {
          validation: !intervention.validation,
          insight: !intervention.insight,
          rewrite1: !intervention.rewrite1,
          rewrite2: !intervention.rewrite2
        });
        console.error('Full response:', result);

        // SAFETY FALLBACK: If AI chooses INTERVENE but doesn't provide complete intervention,
        // err on the side of allowing the message rather than blocking valid communication
        console.log('⚠️  Safety fallback: Allowing message to prevent false positives');
        return { type: 'allow', action: 'STAY_SILENT' };
      }

      // === VALIDATE REWRITE PERSPECTIVE (Feature 006) ===
      // Ensure rewrites are from sender perspective, not receiver response
      if (rewriteValidator) {
        const validationResult = rewriteValidator.validateIntervention(
          { rewrite1: intervention.rewrite1, rewrite2: intervention.rewrite2 },
          message.text
        );

        if (!validationResult.valid) {
          console.warn('⚠️ AI Mediator: Rewrite perspective validation failed:', {
            rewrite1: validationResult.rewrite1,
            rewrite2: validationResult.rewrite2,
            originalMessage: message.text.substring(0, MESSAGE.PREVIEW_LENGTH),
          });

          // Apply fallbacks for failed rewrites
          const fallbackModule = require('../analysis/rewrite-validator/fallbacks');
          const fallbacks = fallbackModule.getFallbackRewrites(message.text, languageAnalysis);

          if (!validationResult.rewrite1.valid) {
            console.log('📝 Applying fallback for rewrite1');
            intervention.rewrite1 = fallbacks.rewrite1;
          }
          if (!validationResult.rewrite2.valid) {
            console.log('📝 Applying fallback for rewrite2');
            intervention.rewrite2 = fallbacks.rewrite2;
          }

          console.log('📊 Perspective validation applied fallbacks:', {
            category: fallbacks.category,
            originalRewrite1Failed: !validationResult.rewrite1.valid,
            originalRewrite2Failed: !validationResult.rewrite2.valid,
          });
        }
      }
      // === END REWRITE PERSPECTIVE VALIDATION ===

      // === CODE LAYER RESPONSE VALIDATION (Feature 004) ===
      // Validate that AI response references the Axioms that fired
      if (codeLayerIntegration && parsedMessage) {
        const codeLayerValidation = codeLayerIntegration.validateAIResponse(result, parsedMessage);

        if (!codeLayerValidation.valid && codeLayerValidation.errors.length > 0) {
          console.warn('⚠️ AI Mediator: Code Layer response validation issues:');
          codeLayerValidation.errors.forEach(err => console.warn(`   - ${err}`));
          // Note: We log warnings but don't block the intervention
          // Future enhancement: request AI retry with explicit axiom references
        }
      }
      // === END CODE LAYER RESPONSE VALIDATION ===

      console.log('✅ AI Mediator: INTERVENE - blocking message');
      console.log('📊 AI Decision:', {
        action: action,
        riskLevel: result.escalation?.riskLevel,
        confidence: result.escalation?.confidence,
        messagePreview: message.text.substring(0, MESSAGE.PREVIEW_LENGTH),
        hasAllFields: true
      });

      // Record intervention
      policyState.interventionHistory.push({
        timestamp: Date.now(),
        type: 'intervene',
        escalationRisk: result.escalation?.riskLevel || 'unknown',
        emotionalState: result.emotion?.currentEmotion || 'unknown'
      });
      if (policyState.interventionHistory.length > MESSAGE.MAX_INTERVENTION_HISTORY) {
        policyState.interventionHistory.shift();
      }

      // === RECORD TO SENDER'S PROFILE (002-sender-profile-mediation) ===
      // Persist intervention to sender's communication profile for future personalization
      if (communicationProfile && roleContext?.senderId) {
        try {
          const dbPostgres = require('../../../dbPostgres');
          await communicationProfile.recordIntervention(
            roleContext.senderId,
            {
              type: 'intervene',
              escalation_level: result.escalation?.riskLevel,
              original_message: message.text,
            },
            dbPostgres
          );
        } catch (err) {
          console.warn('⚠️ AI Mediator: Failed to record intervention to profile:', err.message);
          // Non-fatal - don't block the intervention
        }
      }
      // === END PROFILE RECORDING ===

      // === UPDATE GRAPH DATABASE METRICS ===
      // Track intervention in Neo4j for relationship insights
      if (graphContext && roleContext?.senderId && roleContext?.receiverId && roomId) {
        try {
          const senderProfile = participantProfiles.get(roleContext.senderId.toLowerCase());
          const receiverProfile = participantProfiles.get(roleContext.receiverId.toLowerCase());

          if (senderProfile?.id && receiverProfile?.id) {
            await graphContext.updateMetrics(
              senderProfile.id,
              receiverProfile.id,
              roomId,
              { incrementInterventions: true }
            );
            console.log('📊 AI Mediator: Updated Neo4j intervention count');
          }
        } catch (err) {
          console.warn('⚠️ AI Mediator: Failed to update graph metrics:', err.message);
          // Non-fatal - don't block the intervention
        }
      }
      // === END GRAPH DATABASE METRICS ===

      const interventionResult = {
        type: 'ai_intervention',
        action: 'INTERVENE',
        // 3-part response: validation, insight, rewrites
        validation: intervention.validation,
        insight: intervention.insight,
        rewrite1: intervention.rewrite1,
        rewrite2: intervention.rewrite2,
        originalMessage: message,
        escalation: result.escalation,
        emotion: result.emotion,
        // Code Layer analysis (Feature 004)
        codeLayerAnalysis: parsedMessage ? {
          axiomsFired: parsedMessage.axiomsFired,
          conflictPotential: parsedMessage.assessment.conflictPotential,
          attackSurface: parsedMessage.assessment.attackSurface,
          childAsInstrument: parsedMessage.assessment.childAsInstrument,
          vector: parsedMessage.vector,
          latencyMs: parsedMessage.meta.latencyMs
        } : null
      };

      // OPTIMIZATION: Cache the result for future similar messages
      cacheAnalysis(messageHash, interventionResult);
      
      return interventionResult;
    }

    // Unknown action
    logger.warn('Unknown action from AI, defaulting to STAY_SILENT', {
      action,
      roomId
    });
    const silentResult = null;
    
    // OPTIMIZATION: Cache null results too (to avoid re-analyzing safe messages)
    cacheAnalysis(messageHash, silentResult);
    
    return silentResult;

  } catch (error) {
    logger.error('AI mediator analysis failed', error, {
      messageLength: typeof message === 'string' ? message.length : message?.text?.length,
      recentMessagesCount: recentMessages?.length,
      hasContacts: existingContacts?.length > 0,
      roomId
    });

    // Categorize error for appropriate handling
    if (error.status === 429 || error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      // Retryable errors - throw to allow caller to handle retry
      throw new RetryableError(
        'AI analysis temporarily unavailable, please try again',
        'AI_RATE_LIMIT',
        { roomId, username: typeof message === 'string' ? null : message?.username }
      );
    }

    // For graceful degradation (fail open), return null but log with full context
    // This allows messages through when AI fails, preventing system-wide outages
    logger.warn('AI mediator failed, allowing message through (fail open)', {
      errorType: error.name,
      errorCode: error.code,
      errorStatus: error.status,
      roomId,
      username: typeof message === 'string' ? null : message?.username
    });

    return null;
  }
}

/**
 * Detect names in a message using AI
 */
async function detectNamesInMessage(text, existingContacts = [], participantUsernames = []) {
  if (!openaiClient.isConfigured()) {
    return [];
  }

  try {
    const existingNames = [...existingContacts.map(c => c.toLowerCase()), ...participantUsernames.map(u => u.toLowerCase())];
    const existingNamesString = existingNames.length > 0 ? `\n\nExisting contacts/participants to EXCLUDE: ${existingNames.join(', ')}` : '';

    const prompt = `Extract NEW person names from this message (not already in contacts).

Message: "${text}"${existingNamesString}

Return ONLY names, one per line, or "NONE" if no new names found.`;

    const completion = await openaiClient.createChatCompletion({
      model: AI.NAME_DETECTION_MODEL,
      messages: [
        {
          role: 'system',
          content: 'Extract proper names of NEW people. Return one name per line, or "NONE".'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: AI.NAME_DETECTION_MAX_TOKENS,
      temperature: AI.NAME_DETECTION_TEMPERATURE
    });

    const response = completion.choices[0].message.content.trim();
    if (response === 'NONE' || !response) {
      return [];
    }

    const names = response
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && line !== 'NONE')
      .filter(line => line.length > VALIDATION.MIN_MESSAGE_LENGTH && /^[A-Z]/.test(line));

    return names;
  } catch (error) {
    console.error('Error detecting names:', error.message);
    return [];
  }
}

/**
 * Generate a contact suggestion message
 */
async function generateContactSuggestion(detectedName, messageContext) {
  if (!openaiClient.isConfigured()) {
    return null;
  }

  try {
    const prompt = `Generate a brief, friendly message asking if user wants to add "${detectedName}" to contacts. Context: "${messageContext}"

Respond with ONLY the message text (1-2 sentences), no quotes.`;

    const completion = await openaiClient.createChatCompletion({
      model: 'gpt-4o-mini', // Cheaper and faster for simple generation tasks
      messages: [
        {
          role: 'system',
          content: 'Generate brief, friendly contact suggestion messages.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 60, // Reduced - suggestions are brief
      temperature: 0.5 // Lower for more consistent suggestions
    });

    const suggestionText = completion.choices[0].message.content.trim().replace(/^["']|["']$/g, '');

    return {
      type: 'contact_suggestion',
      detectedName,
      suggestionText,
      messageContext
    };
  } catch (error) {
    console.error('Error generating contact suggestion:', error.message);
    return null;
  }
}

/**
 * Extract relationship insights from conversation
 */
async function extractRelationshipInsights(recentMessages, roomId, roleContext = null) {
  if (!openaiClient.isConfigured() || recentMessages.length < MESSAGE.MIN_MESSAGES_FOR_INSIGHTS) {
    return;
  }

  try {
    const messageHistory = recentMessages
      .slice(-MESSAGE.RECENT_MESSAGES_COUNT)
      .map(msg => `${msg.username}: ${msg.text}`)
      .join('\n');

    const existingInsights = conversationContext.relationshipInsights.get(roomId) || {
      communicationStyle: null,
      commonTopics: [],
      tensionPoints: [],
      positivePatterns: [],
      questionsToAsk: []
    };

    const prompt = `Analyze this co-parenting conversation to understand relationship dynamics.

Recent conversation:
${messageHistory}

Existing insights:
${JSON.stringify(existingInsights, null, 2)}

Extract insights about:
1. Communication style (formal/casual, direct/indirect, collaborative/defensive)
2. Common topics they discuss
3. Tension points or recurring issues
4. Positive patterns (what works well)
5. Questions to ask to learn more

Respond with ONLY valid JSON:
{
  "communicationStyle": "description",
  "commonTopics": ["topic1", "topic2"],
  "tensionPoints": ["point1"],
  "positivePatterns": ["pattern1"],
  "questionsToAsk": ["question1", "question2"]
}`;

    const completion = await openaiClient.createChatCompletion({
      model: 'gpt-4o-mini', // Cheaper for relationship insights analysis
      messages: [
        {
          role: 'system',
          content: 'Analyze co-parenting dynamics. Return only valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 250, // Reduced - insights are concise
      temperature: 0.4 // Slightly lower for more consistent analysis
    });

    const response = completion.choices[0].message.content.trim();
    const insights = JSON.parse(response);

    // Merge with existing insights
    const merged = {
      communicationStyle: insights.communicationStyle || existingInsights.communicationStyle,
      commonTopics: [...new Set([...existingInsights.commonTopics, ...(insights.commonTopics || [])])],
      tensionPoints: [...new Set([...existingInsights.tensionPoints, ...(insights.tensionPoints || [])])],
      positivePatterns: [...new Set([...existingInsights.positivePatterns, ...(insights.positivePatterns || [])])],
      questionsToAsk: insights.questionsToAsk || existingInsights.questionsToAsk,
      lastUpdated: new Date().toISOString()
    };

    conversationContext.relationshipInsights.set(roomId, merged);

    // Persist to database
    try {
      const db = require('../../../dbPostgres');
      const dbSafe = require('../../../dbSafe');
      const now = new Date().toISOString();

      const existingResult = await dbSafe.safeSelect('relationship_insights', { room_id: roomId }, { limit: 1 });
      const existingRows = dbSafe.parseResult(existingResult);

      if (existingRows.length > 0) {
        await dbSafe.safeUpdate('relationship_insights',
          { room_id: roomId },
          {
            insights_json: JSON.stringify(merged),
            updated_at: now
          }
        );
      } else {
        // Include sender_id and receiver_id if available (Phase 2 enhancement)
        const insertData = {
          room_id: roomId,
          insights_json: JSON.stringify(merged),
          created_at: now,
          updated_at: now
        };
        
        // Add sender_id and receiver_id if roleContext is available
        if (roleContext?.senderId && roleContext?.receiverId) {
          insertData.sender_id = roleContext.senderId.toLowerCase();
          insertData.receiver_id = roleContext.receiverId.toLowerCase();
        }
        
        await dbSafe.safeInsert('relationship_insights', insertData);
      }

      // PostgreSQL handles persistence automatically - no saveDatabase() needed
      console.log('📚 Relationship insights saved for room:', roomId);
    } catch (err) {
      console.error('Error saving relationship insights:', err.message);
    }
  } catch (error) {
    console.error('Error extracting relationship insights:', error.message);
  }
}

/**
 * Update conversation context with new message
 */
function updateContext(message) {
  conversationContext.recentMessages.push({
    username: message.username,
    text: message.text,
    timestamp: message.timestamp
  });

  if (conversationContext.recentMessages.length > MESSAGE.MAX_RECENT_MESSAGES) {
    conversationContext.recentMessages.shift();
  }
}

/**
 * Get conversation context
 */
function getContext() {
  return {
    recentMessages: [...conversationContext.recentMessages],
    userSentiments: new Map(conversationContext.userSentiments)
  };
}

/**
 * Record intervention feedback for learning
 */
// recordInterventionFeedback moved to stateManager.js
function recordInterventionFeedback(roomId, helpful) {
  stateManager.recordInterventionFeedback(roomId, helpful);
}

// Note: resetEscalation and getPolicyState removed - unused (only in deprecated files)

/**
 * Record when a user accepts an AI rewrite suggestion
 * Updates the sender's communication profile for future personalization
 *
 * @param {string} senderId - The sender's user ID
 * @param {Object} rewriteData - {original, rewrite, tip}
 * @returns {Promise<boolean>} - Success status
 */
async function recordAcceptedRewrite(senderId, rewriteData) {
  if (!communicationProfile || !senderId) {
    return false;
  }

  try {
    const dbPostgres = require('../../../dbPostgres');
    
    // Record in communication profile (existing functionality)
    await communicationProfile.recordAcceptedRewrite(senderId, rewriteData, dbPostgres);
    
    // Also record in intervention learning system (Phase 2)
    if (interventionLearning) {
      await interventionLearning.recordInterventionOutcome(senderId, {
        type: 'rewrite',
        pattern: rewriteData.pattern || 'unknown',
        outcome: 'accepted',
        feedback: 'helpful', // Implied by acceptance
        original_message: rewriteData.original,
        rewrite: rewriteData.rewrite,
      }, dbPostgres);
    }
    
    console.log(`✅ AI Mediator: Recorded accepted rewrite for ${senderId}`);
    return true;
  } catch (err) {
    console.error(`❌ AI Mediator: Failed to record accepted rewrite:`, err.message);
    return false;
  }
}

// Note: getUserProfile and getCodeLayerMetrics removed - unused

module.exports = {
  // Main unified function (replaces 4-5 separate calls)
  analyzeMessage,

  // Utility functions
  detectNamesInMessage,
  generateContactSuggestion,
  extractRelationshipInsights,
  updateContext,
  getContext,
  recordInterventionFeedback,

  // Communication profile functions (Feature 002)
  recordAcceptedRewrite,

  // Note: Legacy function name removed - analyzeAndIntervene was unused alias
};
