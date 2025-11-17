const OpenAI = require('openai');
const userContext = require('./userContext');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

// Conversation context tracker
const conversationContext = {
  recentMessages: [],
  userSentiments: new Map(), // Track sentiment per user
  topicChanges: [],
  lastIntervention: null,
  relationshipInsights: new Map(), // roomId -> insights about the relationship dynamic
  lastCommentTime: new Map() // roomId -> timestamp of last comment to avoid spamming
};

/**
 * Detect names in a message using AI
 * @param {string} text - Message text
 * @param {Array} existingContacts - Array of existing contact names
 * @param {Array} participantUsernames - Usernames of active participants
 * @returns {Promise<Array>} - Array of detected names that aren't contacts
 */
async function detectNamesInMessage(text, existingContacts = [], participantUsernames = []) {
  if (!process.env.OPENAI_API_KEY) {
    return [];
  }

  try {
    const existingNames = [...existingContacts.map(c => c.toLowerCase()), ...participantUsernames.map(u => u.toLowerCase())];
    const existingNamesString = existingNames.length > 0 ? `\n\nExisting contacts/participants to EXCLUDE: ${existingNames.join(', ')}` : '';
    
    const prompt = `Analyze this message and extract any PERSON NAMES that appear to be NEW people mentioned (not the message sender).

Message: "${text}"${existingNamesString}

IMPORTANT:
- Only return names that are NEW people (not already in contacts/participants)
- Exclude common words like "the", "and", "or", "but"
- Exclude pronouns like "he", "she", "they", "it"
- Only return proper names (capitalized words that appear to be people's names)
- Return ONLY the names, one per line, or "NONE" if no new names found

Examples:
- "I talked to Sarah yesterday" → Sarah
- "John picked up the kids" → John
- "My therapist Dr. Smith suggested..." → Dr. Smith
- "I need to call the school" → NONE
- "The teacher said..." → NONE (too generic)

Return format (one name per line, or "NONE"):
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a name extractor. Extract only proper names of NEW people mentioned in messages. Return one name per line, or "NONE" if no new names found.'
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

    // Extract names from response (one per line)
    const names = response
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && line !== 'NONE')
      .filter(line => line.length > 1 && /^[A-Z]/.test(line)); // Must start with capital letter

    return names;
  } catch (error) {
    console.error('Error detecting names:', error.message);
    return [];
  }
}

/**
 * Analyze a message and decide if AI intervention is needed
 * @param {Object} message - The message object
 * @param {Array} recentMessages - Last 5 messages for context
 * @param {Array} participantUsernames - Usernames of active participants
 * @param {Array} existingContacts - Existing contacts for the user
 * @param {string} roomId - Room ID for tracking insights and comment frequency
 * @returns {Promise<Object>} - Intervention decision and message
 */
async function analyzeAndIntervene(message, recentMessages, participantUsernames = [], existingContacts = [], contactContextForAI = null, roomId = null) {
  // If no API key, return null (no intervention) - allow all messages
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.trim() === '') {
    console.log('⚠️  AI Mediator: No OPENAI_API_KEY found in environment - allowing all messages through');
    return null;
  }

  // Pre-filter: Allow common greetings and polite messages without AI analysis
  const text = message.text.toLowerCase().trim();
  const allowedGreetings = ['hi', 'hello', 'hey', 'hi there', 'hello there', 'hey there'];
  const allowedPolite = ['thanks', 'thank you', 'ok', 'okay', 'sure', 'yes', 'no', 'got it', 'sounds good'];
  
  if (allowedGreetings.includes(text) || allowedPolite.includes(text)) {
    console.log('✅ AI Mediator: Pre-approved message (common greeting/polite) - allowing without analysis');
    return null; // No intervention needed
  }

  try {
    console.log('🤖 AI Mediator: Analyzing message from', message.username);
    
    // Get user contexts for all participants
    const userContexts = [];
    const allParticipants = [...new Set([message.username, ...participantUsernames])];
    
    for (const username of allParticipants) {
      const context = userContext.formatContextForAI(username);
      if (context && !context.includes('No context available')) {
        userContexts.push(context);
      }
    }
    
    // Build context for AI
    const messageHistory = recentMessages
      .slice(-5) // Last 5 messages for context
      .map(msg => `${msg.username}: ${msg.text}`)
      .join('\n');

    const userContextString = userContexts.length > 0 
      ? `\n\nUser Context Information:\n${userContexts.join('\n')}`
      : '';

    const contactContextString = contactContextForAI 
      ? `\n\n${contactContextForAI}`
      : '';

    // Get relationship insights for this room
    const insights = roomId ? conversationContext.relationshipInsights.get(roomId) : null;
    const insightsString = insights 
      ? `\n\nLEARNED RELATIONSHIP INSIGHTS (use these to be more contextually aware):\n- Communication style: ${insights.communicationStyle || 'Not yet learned'}\n- Common topics: ${insights.commonTopics.join(', ') || 'Not yet learned'}\n- Tension points: ${insights.tensionPoints.join(', ') || 'None identified yet'}\n- Positive patterns: ${insights.positivePatterns.join(', ') || 'Not yet identified'}\n- Questions to explore: ${insights.questionsToAsk?.slice(0, 2).join(', ') || 'None yet'}\n\nUse these insights to ask curious questions or make helpful observations.`
      : '';

    // Check if we should limit COMMENT frequency (don't comment too often)
    const lastCommentTime = roomId ? conversationContext.lastCommentTime.get(roomId) : null;
    const timeSinceLastComment = lastCommentTime ? Date.now() - lastCommentTime : Infinity;
    const shouldLimitComments = timeSinceLastComment < 60000; // Don't comment more than once per minute
    const commentFrequencyNote = shouldLimitComments 
      ? '\n\nIMPORTANT: You recently commented in this conversation. Only use ACTION: COMMENT if it\'s truly valuable and different from your previous comment. Prefer STAY_SILENT if unsure.'
      : '';

    // Build relationship context summary
    const relationshipContext = contactContextForAI 
      ? `\n\nRELATIONSHIP CONTEXT:\n${contactContextForAI}\n\nKEY UNDERSTANDING: These two people share a child/children together but are no longer in a romantic relationship. They are co-parenting, which means they need to communicate about their shared children while navigating the complexities of their separated relationship. This dynamic often involves:\n- Emotional history and potential unresolved feelings\n- Different parenting styles or philosophies\n- Logistics around custody, schedules, and child care\n- Financial matters related to children\n- The challenge of maintaining boundaries while co-parenting effectively\n\nThe AI mediator should be aware that co-parenting conversations can be emotionally charged even when the words seem neutral, because of this underlying relationship dynamic.${insightsString}`
      : `\n\nRELATIONSHIP CONTEXT:\nThese two people are co-parents - they share a child/children together but are no longer in a romantic relationship. This is a co-parenting mediation room designed to help them communicate effectively about their shared children.${insightsString}`;

    const prompt = `You are a warm, empathetic AI mediator named Alex who helps co-parents communicate more effectively. You're not a robot - you're like a trusted friend who understands the unique challenges of co-parenting after separation.

Your personality:
- Warm, conversational, and genuinely caring
- Contextually aware of the co-parenting relationship dynamic
- Curious about their situation so you can help better over time
- Non-judgmental and supportive
- You remember what you learn about their relationship to provide better guidance

${relationshipContext}

Recent conversation:
${messageHistory}${userContextString}

Current message: ${message.username}: "${message.text}"

IMPORTANT CONTEXTUAL AWARENESS:
- These are co-parents who share children but are no longer together
- Co-parenting conversations can be emotionally complex even when words seem neutral
- Reference specific children's names, relationship dynamics, and concerns from the contact information
- **CRITICAL: If a child's name appears in the contact information for BOTH co-parents, that child is their SHARED CHILD. When either co-parent mentions that child's name, they are referring to their shared child together. Use this understanding to provide contextually aware mediation.**
- Be aware that underlying tensions may exist even in seemingly simple messages
- Show curiosity about their dynamic when appropriate to learn and help better

You have THREE possible actions:

1. ACTION: STAY_SILENT - For normal, respectful communication (MOST messages should use this)
   - Normal greetings: "hi", "hello", "hey"
   - Questions: "can we talk?", "what time is pickup?"
   - Polite requests: "can we discuss?", "could you let me know?"
   - Neutral messages: "okay", "thanks", "sounds good"
   - Any respectful, normal communication

2. ACTION: INTERVENE - For messages that could escalate conflict or harm the co-parenting relationship
   - Clear insults: "you suck", "you're terrible"
   - Personal attacks: "you're a bad parent"
   - Hostile comparisons: "I'm better than you"
   - Threats or extremely inappropriate content
   - **Accusatory language**: Messages that imply the other parent is doing something wrong (e.g., "it's just weird", "she is scared to tell you", "you always...", "you never...")
   - **Triangulating the child**: Putting the child in the middle of parental conflict (e.g., "she told me you...", "he said you...", "the kids are afraid to...")
   - **Comparison/competition**: Comparing how the child acts with each parent (e.g., "she's fine with me but...", "he never does that at my house")
   - **Leading/defensive questions**: Questions that put the other parent on the defensive (e.g., "Any thought on why?", "Why would you...", "What did you do to...")
   - **Blaming language**: Messages that assign blame or fault (e.g., "this is your fault", "because of you")
   - **Emotional manipulation**: Using guilt, fear, or obligation to control (e.g., "if you cared about the kids...", "you're making this hard")

3. ACTION: COMMENT - For offering helpful, contextual observations or gentle guidance (use sparingly, maybe 1-2 times per conversation)
   - When you notice a pattern that might be helpful to point out
   - When you want to acknowledge something positive in their communication
   - When you're curious about their dynamic and want to learn more (ask a gentle question)
   - When you can offer a helpful perspective based on their relationship context
   - Use this VERY sparingly - only when it genuinely adds value

If using ACTION: COMMENT, respond in this format:

ACTION: COMMENT

MESSAGE: [A warm, conversational message (2-3 sentences max). Write as if you're a caring friend who understands co-parenting. Be curious, supportive, and contextually aware. Reference their children's names, relationship dynamics, or concerns when relevant. You might ask a gentle question to learn more about their situation, acknowledge something positive, or offer a helpful perspective. Write naturally, not robotically.]

If using ACTION: INTERVENE, respond EXACTLY in this format:

ACTION: INTERVENE

VALIDATION: [1-2 sentences validating their feelings and concerns, being specific about their context, children's names, and relevant relationship dynamics. Write warmly, like a caring friend who understands co-parenting challenges. Acknowledge that their concern about their child is valid, even if the way they're expressing it could be improved. Do NOT include the word "Validation" in your response - just write the validating message directly.]

WHY_THIS_NEEDS_MEDIATION: [Identify the specific conflict triggers in this message. Be specific: "This message contains [accusatory language/triangulation/comparison/etc.] which could escalate tension because [explain the impact]. This could make your co-parent defensive rather than collaborative." Reference the actual phrases from the message. This is for AI processing only and will not be shown to the user.]

TIP1: [One specific, actionable communication tip - one sentence only, directly addressing the conflict trigger. Focus on child-centered communication. Example: "Instead of asking why your co-parent did something, focus on what your child needs."]

TIP2: [One specific, actionable communication tip - one sentence only, directly addressing the conflict trigger. Example: "Avoid putting your child in the middle by sharing what they said directly; instead, focus on collaborative problem-solving."]

TIP3: [One specific, actionable communication tip - one sentence only, directly addressing the conflict trigger. Provide a third perspective or alternative approach.]

REWRITE1: [First rewrite of "${message.text}" using the tips. Make it child-focused, collaborative, and respectful while keeping the core concern. Frame it as a shared problem to solve together, not something to blame. No quotes in rewrite. Example format: "I noticed [child's name] seemed [observation]. She might be having a hard time with [situation]. Could we talk about ways to make her feel [desired outcome]?"]

REWRITE2: [Second rewrite of "${message.text}" with a different approach or tone. Provide an alternative way to express the same concern. Make it child-focused, collaborative, and respectful. No quotes in rewrite.]

If the message is appropriate and respectful, respond with:
ACTION: STAY_SILENT

Remember:
- MOST messages should be STAY_SILENT
- Use COMMENT very sparingly (maybe 1-2 times per conversation) and only when it genuinely helps${commentFrequencyNote}
- INTERVENE proactively for messages that could escalate conflict, including subtle triggers like accusatory language, triangulation, comparisons, leading questions, blaming, or emotional manipulation
- Be warm, conversational, and contextually aware
- Show curiosity about their relationship dynamic when appropriate
- Use the learned relationship insights to ask thoughtful questions or make helpful observations
- When intervening, always explain WHY the message needs mediation by identifying the specific conflict triggers`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are Alex, a warm and empathetic AI mediator for co-parenting. You help co-parents communicate effectively. You understand they share children but are no longer together, and you\'re aware this creates unique emotional complexities. You\'re curious about their relationship dynamic so you can help better over time. MOST messages should use ACTION: STAY_SILENT. Use ACTION: COMMENT very sparingly (1-2 times per conversation) for helpful observations or gentle questions. Use ACTION: INTERVENE for messages that could escalate conflict, including: insults, personal attacks, accusatory language, triangulating children, comparisons between parents, leading/defensive questions, blaming language, or emotional manipulation. Be proactive about catching subtle conflict triggers that could harm the co-parenting relationship, even if the words seem neutral. Write conversationally and warmly, like a caring friend who understands co-parenting challenges.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 600,
      temperature: 0.8
    });

    const response = completion.choices[0].message.content.trim();
    console.log('🤖 AI Mediator: Full response received:', response);
    
    // Parse the response - handle STAY_SILENT, INTERVENE, and COMMENT actions
    const actionMatch = response.match(/ACTION:\s*(\w+)/i);
    
    if (!actionMatch) {
      console.log('🤖 AI Mediator: Could not parse action from response');
      return null;
    }

    const action = actionMatch[1].toUpperCase();

    if (action === 'STAY_SILENT') {
      console.log('🤖 AI Mediator: Decided to stay silent - allowing message');
      return null;
    }

    // Handle COMMENT action (contextual observations/questions)
    if (action === 'COMMENT') {
      // Check frequency limit
      if (shouldLimitComments) {
        console.log('💬 AI Mediator: Skipping comment due to frequency limit');
        return null;
      }

      let messageMatch = response.match(/MESSAGE:\s*(.+?)(?=\n\s*ACTION:|$)/is);
      if (!messageMatch) {
        messageMatch = response.match(/MESSAGE[:\s]+(.+?)(?=$)/is);
      }
      
      const commentMessage = messageMatch ? messageMatch[1].trim() : null;
      
      if (!commentMessage) {
        console.error('❌ AI Mediator: COMMENT action but no MESSAGE found - defaulting to STAY_SILENT');
        return null;
      }

      // Track when we commented
      if (roomId) {
        conversationContext.lastCommentTime.set(roomId, Date.now());
      }

      console.log('💬 AI Mediator: Adding contextual comment:', commentMessage.substring(0, 50) + '...');
      
      return {
        type: 'ai_comment',
        action: 'COMMENT',
        text: commentMessage,
        originalMessage: message
      };
    }

    // Handle INTERVENE action (blocking problematic messages)
    if (action === 'INTERVENE') {
      let validationMatch = response.match(/VALIDATION:\s*(.+?)(?=\n\s*WHY_THIS_NEEDS_MEDIATION|TIP1|$)/is);
      let whyMediationMatch = response.match(/WHY_THIS_NEEDS_MEDIATION:\s*(.+?)(?=\n\s*TIP1|$)/is);
      let tip1Match = response.match(/TIP1:\s*(.+?)(?=\n\s*TIP2|$)/is);
      let tip2Match = response.match(/TIP2:\s*(.+?)(?=\n\s*TIP3|$)/is);
      let tip3Match = response.match(/TIP3:\s*(.+?)(?=\n\s*REWRITE1|$)/is);
      let rewrite1Match = response.match(/REWRITE1:\s*(.+?)(?=\n\s*REWRITE2|$)/is);
      let rewrite2Match = response.match(/REWRITE2:\s*(.+?)(?=\n|$)/is);
      
      // If new format not found, try alternate patterns
      if (!validationMatch) {
        validationMatch = response.match(/VALIDATION[:\s]+(.+?)(?=WHY_THIS_NEEDS_MEDIATION|TIP1|REWRITE|$)/is);
      }
      if (!whyMediationMatch) {
        whyMediationMatch = response.match(/WHY_THIS_NEEDS_MEDIATION[:\s]+(.+?)(?=TIP1|REWRITE|$)/is);
      }
      if (!tip1Match) {
        tip1Match = response.match(/TIP1[:\s]+(.+?)(?=TIP2|REWRITE|$)/is);
      }
      if (!tip2Match) {
        tip2Match = response.match(/TIP2[:\s]+(.+?)(?=TIP3|REWRITE|$)/is);
      }
      if (!tip3Match) {
        tip3Match = response.match(/TIP3[:\s]+(.+?)(?=REWRITE|$)/is);
      }
      if (!rewrite1Match) {
        rewrite1Match = response.match(/REWRITE1[:\s]+(.+?)(?=REWRITE2|$)/is);
      }
      if (!rewrite2Match) {
        rewrite2Match = response.match(/REWRITE2[:\s]+(.+?)(?=$)/is);
      }

      const validation = validationMatch ? validationMatch[1].trim() : null;
      const whyMediation = whyMediationMatch ? whyMediationMatch[1].trim() : null;
      const tip1 = tip1Match ? tip1Match[1].trim() : null;
      const tip2 = tip2Match ? tip2Match[1].trim() : null;
      const tip3 = tip3Match ? tip3Match[1].trim() : null;
      const rewrite1 = rewrite1Match ? rewrite1Match[1].trim() : null;
      const rewrite2 = rewrite2Match ? rewrite2Match[1].trim() : null;

      console.log('🤖 AI Mediator: Parsed intervention components:');
      console.log('  Validation:', validation ? validation.substring(0, 50) + '...' : 'MISSING');
      console.log('  Why Mediation:', whyMediation ? whyMediation.substring(0, 50) + '...' : 'MISSING');
      console.log('  Tip1:', tip1 ? tip1.substring(0, 50) + '...' : 'MISSING');
      console.log('  Tip2:', tip2 ? tip2.substring(0, 50) + '...' : 'MISSING');
      console.log('  Tip3:', tip3 ? tip3.substring(0, 50) + '...' : 'MISSING');
      console.log('  Rewrite1:', rewrite1 ? rewrite1.substring(0, 50) + '...' : 'MISSING');
      console.log('  Rewrite2:', rewrite2 ? rewrite2.substring(0, 50) + '...' : 'MISSING');

      // Validate that we have all required components (whyMediation is optional for backward compatibility)
      if (!validation || !tip1 || !tip2 || !tip3 || !rewrite1 || !rewrite2) {
        console.error('❌ AI Mediator: Missing required components in intervention - defaulting to STAY_SILENT');
        console.error('Full response was:', response);
        return null;
      }

      const intervention = {
        type: 'ai_intervention',
        action: 'INTERVENE',
        validation,
        whyMediation, // For AI processing only, not shown to user
        tip1,
        tip2,
        tip3,
        rewrite1,
        rewrite2,
        originalMessage: message
      };
      
      console.log('✅ AI Mediator: Successfully parsed structured intervention');
      return intervention;
    }

    // Unknown action
    console.log(`🤖 AI Mediator: Unexpected action "${action}" - defaulting to STAY_SILENT`);
    return null;

  } catch (error) {
    console.error('❌ Error in AI mediator:', error.message);
    if (error.response) {
      console.error('OpenAI API Error:', error.response.status, error.response.data);
    }
    return null;
  }
}

/**
 * Generate a contact suggestion message
 * @param {string} detectedName - The name that was detected
 * @param {string} messageContext - The message context where the name appeared
 * @returns {Promise<Object>} - Contact suggestion message
 */
async function generateContactSuggestion(detectedName, messageContext) {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  try {
    const prompt = `A user mentioned the name "${detectedName}" in their message: "${messageContext}"

Generate a friendly, helpful AI message asking if they'd like to add this person to their contacts. The message should:
- Be brief and conversational (1-2 sentences)
- Ask if they want to add ${detectedName} to contacts
- Be helpful and not pushy

Respond with ONLY the message text, no quotes or formatting.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant. Generate brief, friendly messages asking users if they want to add mentioned people to their contacts.'
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
 * Analyze sentiment of a message
 * @param {string} text - Message text
 * @returns {Promise<string>} - Sentiment: 'positive', 'negative', or 'neutral'
 */
async function analyzeSentiment(text) {
  if (!process.env.OPENAI_API_KEY) {
    return 'neutral';
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a sentiment analyzer. Respond with only one word: positive, negative, or neutral.'
        },
        {
          role: 'user',
          content: `What is the sentiment of this message: "${text}"`
        }
      ],
      max_tokens: 10,
      temperature: 0.3
    });

    const sentiment = completion.choices[0].message.content.trim().toLowerCase();
    return sentiment === 'positive' || sentiment === 'negative' ? sentiment : 'neutral';
  } catch (error) {
    console.error('Error analyzing sentiment:', error.message);
    return 'neutral';
  }
}

/**
 * Extract relationship insights from conversation
 * @param {Array} recentMessages - Recent conversation messages
 * @param {string} roomId - Room ID for storing insights
 * @returns {Promise<void>}
 */
async function extractRelationshipInsights(recentMessages, roomId) {
  if (!process.env.OPENAI_API_KEY || recentMessages.length < 3) {
    return; // Need at least a few messages to extract insights
  }

  try {
    const messageHistory = recentMessages
      .slice(-10) // Last 10 messages for context
      .map(msg => `${msg.username}: ${msg.text}`)
      .join('\n');

    const existingInsights = conversationContext.relationshipInsights.get(roomId) || {
      communicationStyle: null,
      commonTopics: [],
      tensionPoints: [],
      positivePatterns: [],
      questionsToAsk: []
    };

    const prompt = `You are analyzing a co-parenting conversation to understand the relationship dynamic. These two people share children but are no longer together.

Recent conversation:
${messageHistory}

Existing insights:
${JSON.stringify(existingInsights, null, 2)}

Extract insights about:
1. Communication style (formal/casual, direct/indirect, collaborative/defensive)
2. Common topics they discuss (pickup times, child activities, etc.)
3. Tension points or recurring issues
4. Positive patterns (what works well)
5. Questions you should ask to learn more about their dynamic

Respond with ONLY a JSON object in this format:
{
  "communicationStyle": "brief description",
  "commonTopics": ["topic1", "topic2"],
  "tensionPoints": ["point1", "point2"],
  "positivePatterns": ["pattern1"],
  "questionsToAsk": ["question1", "question2"]
}

Keep it concise. Only include new or updated insights.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an analyst extracting insights about co-parenting relationship dynamics. Return only valid JSON.'
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
    console.log('📚 Relationship insights updated for room:', roomId);
  } catch (error) {
    console.error('Error extracting relationship insights:', error.message);
    // Don't fail the whole process if insight extraction fails
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

  // Keep only last 20 messages
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

module.exports = {
  analyzeAndIntervene,
  analyzeSentiment,
  updateContext,
  getContext,
  detectNamesInMessage,
  generateContactSuggestion,
  extractRelationshipInsights
};

