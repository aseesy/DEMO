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
 * All AI interventions MUST comply with: ./ai-mediation-constitution.md
 * Core principles:
 *   1. Language, Not Emotions - describe phrasing, not emotional states
 *   2. No Diagnostics - no psychological labels or character assessments
 *   3. Child-Centric - frame around child wellbeing when applicable
 *   4. 1-2-3 Framework - ADDRESS + ONE TIP + TWO REWRITES
 */

const openaiClient = require('./openaiClient');
const userContext = require('./userContext');

// Language Analyzer Library (Feature 005)
let languageAnalyzer;
try {
  languageAnalyzer = require('./libs/language-analyzer');
  console.log('✅ AI Mediator: Language analyzer library loaded');
} catch (err) {
  console.warn('⚠️ AI Mediator: Language analyzer library not available, using legacy mode');
  languageAnalyzer = null;
}

// Communication profile library for sender/receiver distinction
let communicationProfile;
try {
  communicationProfile = require('./libs/communication-profile');
  console.log('✅ AI Mediator: Communication profile library loaded');
} catch (err) {
  console.warn('⚠️ AI Mediator: Communication profile library not available, using legacy mode');
  communicationProfile = null;
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
  policyState: new Map() // roomId -> policy configuration
};

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
 */
function detectConflictPatterns(messageText) {
  const text = messageText.toLowerCase();

  const patterns = {
    hasAccusatory: /\b(you always|you never|you're|you are)\b/.test(text),
    hasTriangulation: /\b(she told me|he said|the kids|child.*said)\b/.test(text),
    hasComparison: /\b(fine with me|never does that|at my house|at your house)\b/.test(text),
    hasBlaming: /\b(your fault|because of you|you made|you caused)\b/.test(text)
  };

  return patterns;
}

/**
 * Update escalation score based on detected patterns
 */
function updateEscalationScore(roomId, patterns) {
  const state = initializeEscalationState(roomId);

  if (patterns.hasAccusatory) state.patternCounts.accusatory++;
  if (patterns.hasTriangulation) state.patternCounts.triangulation++;
  if (patterns.hasComparison) state.patternCounts.comparison++;
  if (patterns.hasBlaming) state.patternCounts.blaming++;

  // Increase escalation score based on detected patterns
  if (Object.values(patterns).some(p => p === true)) {
    state.escalationScore += 10;
    state.lastNegativeTime = Date.now();
  }

  // Decay escalation score over time (reduce by 1 every 5 minutes)
  const timeSinceLastNegative = state.lastNegativeTime
    ? Date.now() - state.lastNegativeTime
    : Infinity;
  if (timeSinceLastNegative > 300000) { // 5 minutes
    state.escalationScore = Math.max(0, state.escalationScore - 1);
  }

  return state;
}

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
async function analyzeMessage(message, recentMessages, participantUsernames = [], existingContacts = [], contactContextForAI = null, roomId = null, taskContextForAI = null, flaggedMessagesContext = null, roleContext = null) {
  // Check if OpenAI is configured
  if (!openaiClient.isConfigured()) {
    console.log('⚠️  AI Mediator: OpenAI not configured - allowing all messages through');
    return null;
  }

  // Pre-filter: Allow common greetings and polite messages without AI analysis
  const text = message.text.toLowerCase().trim();
  const allowedGreetings = ['hi', 'hello', 'hey', 'hi there', 'hello there', 'hey there'];
  const allowedPolite = ['thanks', 'thank you', 'ok', 'okay', 'sure', 'yes', 'no', 'got it', 'sounds good'];

  if (allowedGreetings.includes(text) || allowedPolite.includes(text)) {
    console.log('✅ AI Mediator: Pre-approved message (greeting/polite) - allowing without analysis');
    return null;
  }

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
    const escalationState = updateEscalationScore(roomId, patterns);

    // Initialize states
    const emotionalState = initializeEmotionalState(roomId);
    const policyState = initializePolicyState(roomId);

    // === ROLE-AWARE MEDIATION (002-sender-profile-mediation) ===
    // Load sender and receiver profiles if roleContext is provided
    let roleAwareContext = null;
    if (communicationProfile && roleContext?.senderId && roleContext?.receiverId) {
      try {
        const dbPostgres = require('./dbPostgres');

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
      const db = await require('./db').getDb();
      const dbSafe = require('./dbSafe');

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

    // Build context for AI
    const messageHistory = recentMessages
      .slice(-15)
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

    // Get relationship insights
    let insights = null;
    if (roomId) {
      try {
        const db = await require('./db').getDb();
        const dbSafe = require('./dbSafe');
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

    // Get previous emotional state for this user
    const username = message.username;
    if (!emotionalState.participants[username]) {
      emotionalState.participants[username] = {
        currentEmotion: 'neutral',
        emotionHistory: [],
        stressLevel: 0,
        stressTrajectory: 'stable',
        emotionalMomentum: 0,
        stressPoints: [],
        recentTriggers: []
      };
    }
    const participantState = emotionalState.participants[username];

    // Build relationship context
    const relationshipContext = contactContextForAI
      ? `\n\nRELATIONSHIP CONTEXT:\n${contactContextForAI}\n\nThese two people are co-parents who share children but are no longer together. They need to communicate about shared children while navigating their separated relationship.${insightsString}${taskContextString}${flaggedContextString}`
      : `\n\nRELATIONSHIP CONTEXT:\nThese are co-parents sharing children but no longer together.${insightsString}${taskContextString}${flaggedContextString}`;

    // === ROLE-AWARE CONTEXT (002-sender-profile-mediation) ===
    // Build sender/receiver specific context if available
    let roleAwarePromptSection = '';
    let senderDisplayName = message.username;
    let receiverDisplayName = 'the other co-parent';

    if (roleAwareContext && communicationProfile) {
      const mediationContext = require('./libs/communication-profile/mediationContext');
      roleAwarePromptSection = mediationContext.formatFullContext(roleAwareContext);
      senderDisplayName = roleAwareContext.roles?.sender?.display_name || message.username;
      receiverDisplayName = roleAwareContext.roles?.receiver?.display_name || 'the other co-parent';
    }
    // === END ROLE-AWARE CONTEXT ===

    // UNIFIED PROMPT: Get ALL information in ONE API call
    // CONSTITUTION: ./ai-mediation-constitution.md defines all rules
    const prompt = `You are LiaiZen - a COMMUNICATION COACH helping co-parents communicate effectively.

=== CONSTITUTION (IMMUTABLE RULES) ===

PRINCIPLE I: LANGUAGE, NOT EMOTIONS
- Talk about PHRASING and LANGUAGE, never emotional states
- CORRECT: "This phrasing implies blame", "This word choice sounds accusatory"
- PROHIBITED: "You're angry", "You're frustrated", "You're being defensive"
- We describe what words DO, not what people FEEL

PRINCIPLE II: NO DIAGNOSTICS
- NEVER apply psychological labels or character assessments
- PROHIBITED: narcissist, insecure, manipulative, gaslighting, controlling, toxic, abusive, passive-aggressive
- ALLOWED: "This approach may backfire", "This phrasing might not achieve your goal"

PRINCIPLE III: CHILD-CENTRIC WHEN APPLICABLE
- When a child is mentioned, frame feedback around child wellbeing
- Flag triangulation (using child as messenger/weapon)
- Consider: "Would I be okay if my child read this?"

=== YOUR IDENTITY ===
- Communication COACH (not therapist)
- Neutral third party (not on either "team")
- Skill-builder (not judge)
- You are NOT part of their relationship - NEVER use "we/us/our/both"
- Address ONLY the sender using "you/your"

=== 1-2-3 COACHING FRAMEWORK ===

When you INTERVENE, you MUST provide ALL THREE:

1. ADDRESS (personalMessage): Describe what the message is DOING mechanically
   - Focus on: structure, word choice, phrasing, implications
   - Explain why this approach will backfire for THE SENDER
   - Max 2 sentences
   - Format: "[Observation about phrasing] + [consequence for sender's goals]"
   - Examples:
     * "Name-calling shuts down any chance of being heard, so your concerns won't get addressed."
     * "Absolute statements like 'never' trigger defensiveness, which means the help you need won't happen."
     * "Blaming language makes people defensive rather than collaborative, so solving the problem becomes impossible."

2. ONE TIP (tip1): Single, precise adjustment (max 10 words)
   - Must be specific to THIS message
   - Actionable immediately
   - Examples:
     * For insults: "Name the feeling, not the person."
     * For blame: "Describe the impact, not their intent."
     * For demands: "Make a request, not a command."
     * For absolutes: "Replace 'always' with 'recently' or 'often'."
     * For triangulation: "Speak directly, not through your child."

3. TWO REWRITES (rewrite1, rewrite2): Complete message alternatives
   - Preserve sender's underlying intent/concern
   - Improve clarity and dignity
   - Ready to send as-is
   - Use DIFFERENT approaches:
     * Rewrite 1: I-statement (feeling + need) - "I feel... when... I need..."
     * Rewrite 2: Observation + request - "I've noticed... Can we..."

=== CONTEXT ===

${roleAwarePromptSection ? roleAwarePromptSection + '\n' : ''}${relationshipContext}

Recent conversation:
${messageHistory}${userContextString}

Current message from ${senderDisplayName}: "${message.text}"

${languageAnalysisContext ? languageAnalysisContext + '\n' : ''}
Analysis context:
- Escalation score: ${escalationState.escalationScore}/100
- Conversation state: ${emotionalState.conversationEmotion}${commentFrequencyNote}

=== RESPOND WITH JSON ===

{
  "action": "STAY_SILENT|INTERVENE|COMMENT",

  "escalation": {
    "riskLevel": "low|medium|high|critical",
    "confidence": 0-100,
    "reasons": ["specific phrasing issue 1", "phrasing issue 2"]
  },

  "emotion": {
    "currentEmotion": "neutral|frustrated|calm|defensive|collaborative|anxious|angry",
    "stressLevel": 0-100,
    "stressTrajectory": "increasing|decreasing|stable",
    "emotionalMomentum": 0-100,
    "triggers": ["trigger1"],
    "conversationEmotion": "neutral|tense|collaborative|escalating"
  },

  "intervention": {
    "personalMessage": "ADDRESS: Describe what the phrasing is DOING and why it will backfire. Max 2 sentences. NO emotional diagnoses.",
    "tip1": "ONE TIP: Max 10 words. Specific to THIS message. Actionable skill.",
    "rewrite1": "I-statement rewrite preserving their intent. Complete message.",
    "rewrite2": "Observation+request rewrite. Different approach. Complete message.",
    "comment": "For COMMENT action only. Brief tactical observation."
  }
}

=== DECISION CRITERIA ===

STAY_SILENT (80-90%): Any respectful communication
- "I'm concerned about...", "Can we discuss...", "The teacher said..."
- Even imperfect phrasing if not hostile

INTERVENE (5-15%): Clear conflict escalation only
- Direct blame/attacks, name-calling, insults
- Threats, ultimatums, contemptuous language
- Triangulation (using child against other parent)

COMMENT (1-5%): Rare, helpful observation only

=== VALIDATION REMINDERS ===

🚨 If ACTION=INTERVENE, ALL fields are REQUIRED:
   - personalMessage (describes phrasing, not emotions)
   - tip1 (max 10 words, specific)
   - rewrite1 (I-statement approach)
   - rewrite2 (observation+request approach)

🚨 NEVER diagnose emotions ("You're angry")
🚨 NEVER use labels ("manipulative", "narcissistic")
🚨 NEVER use "we/us/our/both"
🚨 ALWAYS describe PHRASING, not FEELINGS`;

    // Make single unified API call
    const completion = await openaiClient.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are LiaiZen - a communication COACH (not therapist) for co-parents. CONSTITUTION RULES: 1) Talk about LANGUAGE/PHRASING, never emotions ("this phrasing implies blame" not "you\'re angry"). 2) NO psychological labels (narcissist, manipulative, insecure - PROHIBITED). 3) Child-centric when child mentioned. 4) Use 1-2-3 framework: ADDRESS (what phrasing does) + ONE TIP (max 10 words) + TWO REWRITES (different approaches). CRITICAL: Only use "you/your" - NEVER "we/us/our/both". Respond ONLY with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1500,
      temperature: 0.85  // Higher temperature for more varied, less repetitive responses
    });

    const response = completion.choices[0].message.content.trim();
    console.log('🤖 AI Mediator: Received unified response');

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
      const previousStress = participantState.stressLevel;
      const previousEmotion = participantState.currentEmotion;

      participantState.currentEmotion = result.emotion.currentEmotion || 'neutral';
      participantState.stressLevel = result.emotion.stressLevel || 0;
      participantState.stressTrajectory = result.emotion.stressTrajectory || 'stable';
      participantState.emotionalMomentum = result.emotion.emotionalMomentum || 0;

      // Track emotion history
      participantState.emotionHistory.push({
        timestamp: Date.now(),
        emotion: result.emotion.currentEmotion,
        intensity: result.emotion.stressLevel,
        triggers: result.emotion.triggers || []
      });
      if (participantState.emotionHistory.length > 20) {
        participantState.emotionHistory.shift();
      }

      // Update recent triggers
      if (result.emotion.triggers && result.emotion.triggers.length > 0) {
        participantState.recentTriggers.push(...result.emotion.triggers);
        if (participantState.recentTriggers.length > 10) {
          participantState.recentTriggers = participantState.recentTriggers.slice(-10);
        }
      }

      // Update conversation-level emotion
      emotionalState.conversationEmotion = result.emotion.conversationEmotion || 'neutral';

      // Calculate overall escalation risk
      const allStressLevels = Object.values(emotionalState.participants).map(p => p.stressLevel);
      const avgStress = allStressLevels.length > 0
        ? allStressLevels.reduce((a, b) => a + b, 0) / allStressLevels.length
        : 0;
      emotionalState.escalationRisk = avgStress;
      emotionalState.lastUpdated = Date.now();
    }

    // Process action
    const action = (result.action || 'STAY_SILENT').toUpperCase();

    if (action === 'STAY_SILENT') {
      console.log('🤖 AI Mediator: STAY_SILENT - allowing message');
      return null;
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

      return {
        type: 'ai_comment',
        action: 'COMMENT',
        text: result.intervention.comment,
        originalMessage: message,
        escalation: result.escalation,
        emotion: result.emotion
      };
    }

    if (action === 'INTERVENE') {
      const intervention = result.intervention || {};

      // Validate required fields
      if (!intervention.personalMessage || !intervention.tip1 || !intervention.rewrite1 || !intervention.rewrite2) {
        console.error('❌ INTERVENE action missing required fields - ALLOWING message (safety fallback)');
        console.error('Missing fields:', {
          personalMessage: !intervention.personalMessage,
          tip1: !intervention.tip1,
          rewrite1: !intervention.rewrite1,
          rewrite2: !intervention.rewrite2
        });
        console.error('Full response:', result);

        // SAFETY FALLBACK: If AI chooses INTERVENE but doesn't provide complete intervention,
        // err on the side of allowing the message rather than blocking valid communication
        console.log('⚠️  Safety fallback: Allowing message to prevent false positives');
        return { type: 'allow', action: 'STAY_SILENT' };
      }

      console.log('✅ AI Mediator: INTERVENE - blocking message');
      console.log('📊 AI Decision:', {
        action: action,
        riskLevel: result.escalation?.riskLevel,
        confidence: result.escalation?.confidence,
        messagePreview: message.text.substring(0, 50),
        hasAllFields: true
      });

      // Record intervention
      policyState.interventionHistory.push({
        timestamp: Date.now(),
        type: 'intervene',
        escalationRisk: result.escalation?.riskLevel || 'unknown',
        emotionalState: result.emotion?.currentEmotion || 'unknown'
      });
      if (policyState.interventionHistory.length > 20) {
        policyState.interventionHistory.shift();
      }

      // === RECORD TO SENDER'S PROFILE (002-sender-profile-mediation) ===
      // Persist intervention to sender's communication profile for future personalization
      if (communicationProfile && roleContext?.senderId) {
        try {
          const dbPostgres = require('./dbPostgres');
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

      return {
        type: 'ai_intervention',
        action: 'INTERVENE',
        personalMessage: intervention.personalMessage,
        tip1: intervention.tip1,
        rewrite1: intervention.rewrite1,
        rewrite2: intervention.rewrite2,
        originalMessage: message,
        escalation: result.escalation,
        emotion: result.emotion
      };
    }

    // Unknown action
    console.log(`🤖 AI Mediator: Unknown action "${action}" - defaulting to STAY_SILENT`);
    return null;

  } catch (error) {
    console.error('❌ Error in AI mediator:', error.message);
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
      model: 'gpt-3.5-turbo',
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
      max_tokens: 50,
      temperature: 0.3
    });

    const response = completion.choices[0].message.content.trim();
    if (response === 'NONE' || !response) {
      return [];
    }

    const names = response
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && line !== 'NONE')
      .filter(line => line.length > 1 && /^[A-Z]/.test(line));

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
      model: 'gpt-3.5-turbo',
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
      max_tokens: 100,
      temperature: 0.7
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
async function extractRelationshipInsights(recentMessages, roomId) {
  if (!openaiClient.isConfigured() || recentMessages.length < 3) {
    return;
  }

  try {
    const messageHistory = recentMessages
      .slice(-10)
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
      model: 'gpt-3.5-turbo',
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
      max_tokens: 300,
      temperature: 0.5
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
      const db = await require('./db').getDb();
      const dbSafe = require('./dbSafe');
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
        await dbSafe.safeInsert('relationship_insights', {
          room_id: roomId,
          insights_json: JSON.stringify(merged),
          created_at: now,
          updated_at: now
        });
      }

      require('./db').saveDatabase();
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

  if (conversationContext.recentMessages.length > 20) {
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
function recordInterventionFeedback(roomId, helpful) {
  const policyState = initializePolicyState(roomId);

  if (policyState.interventionHistory.length > 0) {
    const lastIntervention = policyState.interventionHistory[policyState.interventionHistory.length - 1];
    lastIntervention.outcome = helpful ? 'helpful' : 'unhelpful';
    lastIntervention.feedback = helpful ? 'User found helpful' : 'User found unhelpful';

    // Adjust threshold based on feedback
    if (!helpful) {
      policyState.interventionThreshold = Math.min(100, policyState.interventionThreshold + 5);
    } else {
      policyState.interventionThreshold = Math.max(30, policyState.interventionThreshold - 2);
    }
  }
}

/**
 * Reset escalation after successful intervention
 */
function resetEscalation(roomId) {
  const escalationState = conversationContext.escalationState.get(roomId);
  if (escalationState) {
    escalationState.escalationScore = Math.max(0, escalationState.escalationScore - 20);
    escalationState.lastNegativeTime = null;
  }
}

/**
 * Get policy state for a room
 */
function getPolicyState(roomId) {
  return conversationContext.policyState.get(roomId) || null;
}

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
    const dbPostgres = require('./dbPostgres');
    await communicationProfile.recordAcceptedRewrite(senderId, rewriteData, dbPostgres);
    console.log(`✅ AI Mediator: Recorded accepted rewrite for ${senderId}`);
    return true;
  } catch (err) {
    console.error(`❌ AI Mediator: Failed to record accepted rewrite:`, err.message);
    return false;
  }
}

/**
 * Get a user's communication profile
 * @param {string} userId - The user's ID
 * @returns {Promise<Object|null>} - User's profile or null
 */
async function getUserProfile(userId) {
  if (!communicationProfile || !userId) {
    return null;
  }

  try {
    const dbPostgres = require('./dbPostgres');
    return await communicationProfile.loadProfile(userId, dbPostgres);
  } catch (err) {
    console.error(`❌ AI Mediator: Failed to load user profile:`, err.message);
    return null;
  }
}

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
  resetEscalation,
  getPolicyState,

  // Communication profile functions (Feature 002)
  recordAcceptedRewrite,
  getUserProfile,

  // Legacy function name for backwards compatibility
  analyzeAndIntervene: analyzeMessage
};
