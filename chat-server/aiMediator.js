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
 */

const openaiClient = require('./openaiClient');
const userContext = require('./userContext');

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
 * @returns {Promise<Object>} - Unified mediation result
 */
async function analyzeMessage(message, recentMessages, participantUsernames = [], existingContacts = [], contactContextForAI = null, roomId = null, taskContextForAI = null, flaggedMessagesContext = null) {
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

    // Local pattern detection (no API call)
    const patterns = detectConflictPatterns(message.text);
    const escalationState = updateEscalationScore(roomId, patterns);

    // Initialize states
    const emotionalState = initializeEmotionalState(roomId);
    const policyState = initializePolicyState(roomId);

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

    // UNIFIED PROMPT: Get ALL information in ONE API call
    const prompt = `You are LiaiZen's AI mediator - a neutral, unbiased third party helping co-parents communicate effectively. Your expertise includes:
- Nonviolent Communication (Marshall Rosenberg)
- Gottman Method relationship dynamics
- Trauma-informed communication
- Motivational interviewing

CRITICAL: You are NOT part of either parent's "team" or relationship. You are a neutral mediator.

Your role is to help ${message.username} communicate more effectively while maintaining complete neutrality between co-parents.

${relationshipContext}

Recent conversation (last 15 messages):
${messageHistory}${userContextString}

Current message from ${message.username}: "${message.text}"

CONTEXT:
- Conflict patterns detected: ${patternSummary || 'none'}
- Escalation score: ${escalationState.escalationScore}/100
- ${message.username}'s emotional state: ${participantState.currentEmotion} (stress: ${participantState.stressLevel}/100)
- Emotional trajectory: ${participantState.stressTrajectory}
- Recent triggers: ${participantState.recentTriggers.slice(-3).join(', ') || 'none'}${commentFrequencyNote}

YOUR TASK:
Analyze this message and provide a response that makes ${message.username} feel:
1. SAFE - you understand their feelings and perspective
2. EMPOWERED - they can communicate effectively
3. SUPPORTED - you're on their team, helping them succeed

🚨 CRITICAL REQUIREMENT: If you choose ACTION=INTERVENE, you MUST provide ALL of these fields:
   - personalMessage
   - tip1, tip2, tip3
   - rewrite1, rewrite2 (complete rewrites of their entire message)

   If ANY field is missing, the intervention will FAIL and their hurtful message will be sent!

RESPOND WITH JSON:

{
  "action": "STAY_SILENT|INTERVENE|COMMENT",

  "escalation": {
    "riskLevel": "low|medium|high|critical",
    "confidence": 0-100,
    "reasons": ["specific reason 1", "reason 2"]
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
    "personalMessage": "REQUIRED if ACTION=INTERVENE. A tactical insight (NOT emotional validation) explaining the communication pattern. 1-2 sentences maximum. BE SPECIFIC TO THE MESSAGE CONTENT - analyze WHAT they're actually doing wrong (name-calling? blaming? contempt? demanding?). AVOID GENERIC PHRASES like 'focus on the child's needs' - be precise about the actual problem. Examples: 'Name-calling shuts down any chance of being heard.' or 'Blaming someone for past behavior doesn't create space for change.' or 'Character attacks make it impossible to discuss the real issue.' CRITICAL: Address ONLY the sender using 'you/your' - NEVER use 'we/us/our/both'.",

    "tip1": "REQUIRED if ACTION=INTERVENE. Ultra-short skill-building cue (max 10 words). MUST BE DIRECTLY RELEVANT TO THIS SPECIFIC MESSAGE. For insults: 'Name the feeling, not the person.' For blame: 'Describe the impact, not their intent.' For demands: 'Make a request, not a command.' For contempt: 'Express your need, not your judgment.' AVOID GENERIC CHILD-FOCUSED TIPS. NEVER use 'we/us/our/both'.",

    "tip2": "REQUIRED if ACTION=INTERVENE. Ultra-short skill-building cue (max 10 words). COMPLETELY DIFFERENT from tip1. Match the message type: For rage/hostility: 'Take a breath before hitting send.' For accusations: 'Ask questions instead of making assumptions.' For dismissiveness: 'Acknowledge their role before stating yours.' NEVER use 'we/us/our/both'.",

    "tip3": "REQUIRED if ACTION=INTERVENE. Ultra-short skill-building cue (max 10 words). DIFFERENT from tip1/tip2. Focus on forward movement: 'What outcome do you actually want here?' or 'What would help solve this problem?' or 'State what you need, not what you blame.' NEVER use 'we/us/our/both'.",

    "rewrite1": "REQUIRED if ACTION=INTERVENE. Rewrite their ENTIRE message using 'I feel' or 'I need' statements. For hostile/attacking messages: Transform into emotion + need. Example: 'you're a bitch' → 'I feel really frustrated right now and I need us to communicate more respectfully.' For blame messages: Shift to impact statement. Example: 'you never help' → 'When pickup responsibilities fall on me, I feel overwhelmed and I need more consistency.' PRESERVE THEIR UNDERLYING EMOTION but express it constructively. NO CHILD-CENTRIC REWRITES for personal attacks - they need to express THEIR feelings. Complete message ready to send.",

    "rewrite2": "REQUIRED if ACTION=INTERVENE. Rewrite with a COMPLETELY DIFFERENT approach from rewrite1. For personal attacks: Use observation + request. Example: 'you're a bitch' → 'When you [specific behavior], it bothers me. Can we find a better way to handle [specific issue]?' For general hostility: Name the pattern + suggest change. Example: 'I notice we're both getting frustrated. Can we start over and focus on [specific issue]?' BE CONCRETE AND SPECIFIC TO THEIR ACTUAL MESSAGE. Complete message ready to send.",

    "comment": "REQUIRED if ACTION=COMMENT. Brief tactical observation about communication dynamic. NEVER use 'we/us/our/both'."
  }
}

LIAIZEN'S ROLE: COMMUNICATION COACH, NOT THERAPIST
- You are teaching communication SKILLS, not providing emotional support
- Focus on PATTERNS and DYNAMICS, not feelings
- Help the sender become a MORE EFFECTIVE communicator
- Address ONLY the sender - NEVER use "we/us/our/both" (they are NOT a team you're part of)
- Tips are TOOLS, not empathy - short, tactical, immediately actionable
- Rewrites should model collaborative, child-focused communication
- NO therapeutic language - be direct about what works and what doesn't

CRITICAL: BE DYNAMIC AND CONTEXT-SPECIFIC
- ANALYZE THE ACTUAL MESSAGE: What exactly are they doing wrong? (insulting? blaming? threatening? dismissing?)
- AVOID REPETITIVE LANGUAGE: Don't default to "focus on the child" for every message
- MATCH YOUR RESPONSE TO THE PROBLEM: Personal attacks need emotion work, blame needs perspective shifts, demands need softening
- VARY YOUR APPROACH: Use different frameworks (I-statements, observations, requests, questions)
- NO GENERIC TEMPLATES: "You're a bitch" needs emotional translation ("I feel frustrated"), not child-focus
- PRESERVE THEIR EMOTION: If they're angry, help them express anger constructively, don't suppress it
- BE PRACTICAL: Give them words they can actually use in THIS situation

IMPORTANT CONTEXT RULES:
- If the message is expressing a genuine concern about the child (e.g., "I'm concerned about..."), this is HEALTHY communication and should be STAY_SILENT unless it contains blame/attacks
- Partial/incomplete messages (ending mid-word) should be given benefit of the doubt - assume positive intent
- Focus on TONE and INTENT, not just trigger words

DECISION CRITERIA:
- **STAY_SILENT**: Use this for 80-90% of messages. Any respectful communication, including:
  - Expressing concerns about the child ("I'm concerned about...", "I'm worried that...")
  - Asking questions ("Can we discuss...", "What do you think about...")
  - Sharing information ("She mentioned...", "The teacher said...")
  - Stating boundaries ("I need...", "I would prefer...")
  - Incomplete messages (give benefit of the doubt)

- **INTERVENE**: ONLY for clear conflict escalation:
  - Direct blame/attacks ("It's YOUR fault", "YOU never...")
  - Name-calling or insults
  - Threats or ultimatums
  - Contemptuous language ("stupid", "pathetic", "worthless")
  - Triangulation attempts that pit child against other parent

- **COMMENT**: RARE - only if a gentle observation would significantly help (max 1-2 per conversation)

EXAMPLES:
✅ STAY_SILENT: "I'm concerned about our daughter's behavior at school"
✅ STAY_SILENT: "Can we talk about the pickup schedule this weekend?"
✅ STAY_SILENT: "She seemed upset after the visit"
❌ INTERVENE: "It's all your fault that she's failing"
❌ INTERVENE: "You're a terrible parent and you never listen"`;

    // Make single unified API call
    const completion = await openaiClient.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are LiaiZen - a tactical communication coach for co-parents. Your job: teach effective communication SKILLS, not provide therapy. Focus on PATTERNS and DYNAMICS, not feelings. Be direct about what works and what doesn\'t. CRITICAL: Address ONLY the sender using "you/your" - NEVER use "we/us/our/both". Tips must be ultra-short (max 10 words), tactical, and immediately actionable. Rewrites must model collaborative, child-focused language. Respond ONLY with valid JSON in the exact format specified.'
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
      if (!intervention.personalMessage || !intervention.tip1 || !intervention.tip2 ||
          !intervention.tip3 || !intervention.rewrite1 || !intervention.rewrite2) {
        console.error('❌ INTERVENE action missing required fields - ALLOWING message (safety fallback)');
        console.error('Missing fields:', {
          personalMessage: !intervention.personalMessage,
          tip1: !intervention.tip1,
          tip2: !intervention.tip2,
          tip3: !intervention.tip3,
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

      return {
        type: 'ai_intervention',
        action: 'INTERVENE',
        personalMessage: intervention.personalMessage,
        tip1: intervention.tip1,
        tip2: intervention.tip2,
        tip3: intervention.tip3,
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

  // Legacy function name for backwards compatibility
  analyzeAndIntervene: analyzeMessage
};
