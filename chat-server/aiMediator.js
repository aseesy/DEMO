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
  lastIntervention: null
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
 * @returns {Promise<Object>} - Intervention decision and message
 */
async function analyzeAndIntervene(message, recentMessages, participantUsernames = [], existingContacts = [], contactContextForAI = null) {
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

    const prompt = `You are an AI mediator for a co-parenting communication chat room. Your role is to help parents communicate more effectively.

Recent conversation:
${messageHistory}${userContextString}${contactContextString}

Current message: ${message.username}: "${message.text}"

IMPORTANT: Use the contact relationships and context information provided above to understand the dynamics between participants. Reference specific children's names, relationship types (e.g., "co-parent", "child"), and any concerns or difficult aspects mentioned in the contact information when providing validation and tips. This contextual information helps you provide more personalized and relevant mediation.

CRITICAL: The DEFAULT action is STAY_SILENT. Only intervene for truly problematic messages.

REQUIRED: Use ACTION: STAY_SILENT for:
- Normal greetings: "hi", "hello", "hey", "how are you"
- Questions: "can we talk?", "what time is pickup?", "when is Vira coming?"
- Polite requests: "can we discuss?", "could you let me know?"
- Statements of concern: "I'm concerned about...", "I'd like to discuss..."
- Neutral messages: "okay", "thanks", "sounds good"
- Any respectful, normal communication

ONLY use ACTION: INTERVENE for:
- Clear insults: "you suck", "you're terrible", "you're stupid"
- Personal attacks: "you're a bad parent", "you never do anything right"
- Hostile comparisons: "I'm better than you", "you're worse at..."
- Threats or extremely inappropriate content

Example decisions:
- "hi" → ACTION: STAY_SILENT (normal greeting)
- "hello" → ACTION: STAY_SILENT (normal greeting)
- "can we talk?" → ACTION: STAY_SILENT (polite request)
- "you suck" → ACTION: INTERVENE (insult)
- "I'm a better parent" → ACTION: INTERVENE (hostile comparison)

If the message needs intervention, respond EXACTLY in this format:

ACTION: INTERVENE

VALIDATION: [1-2 sentences validating their feelings, being specific about their context, children's names, and relevant relationship dynamics from their contacts]

TIP1: [One specific, actionable communication tip related to the blocked message "${message.text}" - one sentence only, directly addressing the issue in that message]

TIP2: [One specific, actionable communication tip related to the blocked message "${message.text}" - one sentence only, directly addressing the issue in that message]

REWRITE: [Rewrite "${message.text}" using the tips. Make it respectful but keep the intent. No quotes in rewrite.]

If the message is appropriate and respectful, respond with:
ACTION: STAY_SILENT

DECISION EXAMPLES (follow these exactly):
"hi" → ACTION: STAY_SILENT
"hello" → ACTION: STAY_SILENT
"hey" → ACTION: STAY_SILENT
"how are you" → ACTION: STAY_SILENT
"can we talk?" → ACTION: STAY_SILENT
"what time is pickup?" → ACTION: STAY_SILENT
"thanks" → ACTION: STAY_SILENT
"you suck" → ACTION: INTERVENE
"you're terrible" → ACTION: INTERVENE
"I'm better than you" → ACTION: INTERVENE

Remember: When in doubt, use STAY_SILENT. Only intervene for clearly problematic messages.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an AI communication coach for co-parenting. You MUST decide FIRST if a message needs intervention. MOST messages should use ACTION: STAY_SILENT. Only use ACTION: INTERVENE for truly problematic messages like insults, attacks, or hostile comparisons. Normal greetings like "hi", "hello", questions, polite requests, and neutral messages should ALWAYS use ACTION: STAY_SILENT. Use the provided user context, contact relationships, and relationship dynamics to provide highly personalized and contextual mediation. When intervening, reference specific children\'s names, relationship dynamics, and concerns from the contact information to make your guidance more relevant and helpful.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    const response = completion.choices[0].message.content.trim();
    console.log('🤖 AI Mediator: Full response received:', response);
    
    // Parse the response - handle both old and new formats
    const actionMatch = response.match(/ACTION:\s*(\w+)/i);
    
    // Try to parse new format first
    let validationMatch = response.match(/VALIDATION:\s*(.+?)(?=\n\s*TIP1|$)/is);
    let tip1Match = response.match(/TIP1:\s*(.+?)(?=\n\s*TIP2|$)/is);
    let tip2Match = response.match(/TIP2:\s*(.+?)(?=\n\s*REWRITE|$)/is);
    let rewriteMatch = response.match(/REWRITE:\s*(.+?)(?=\n|$)/is);
    
    // If new format not found, try alternate patterns
    if (!validationMatch) {
      validationMatch = response.match(/VALIDATION[:\s]+(.+?)(?=TIP1|REWRITE|$)/is);
    }
    if (!tip1Match) {
      tip1Match = response.match(/TIP1[:\s]+(.+?)(?=TIP2|REWRITE|$)/is);
    }
    if (!tip2Match) {
      tip2Match = response.match(/TIP2[:\s]+(.+?)(?=REWRITE|$)/is);
    }
    if (!rewriteMatch) {
      rewriteMatch = response.match(/REWRITE[:\s]+(.+?)(?=$)/is);
    }
    
    if (!actionMatch) {
      console.log('🤖 AI Mediator: Could not parse action from response');
      return null;
    }

    const action = actionMatch[1].toUpperCase();

    if (action === 'STAY_SILENT') {
      console.log('🤖 AI Mediator: Decided to stay silent - allowing message');
      return null;
    }

    // Only proceed with intervention if action is explicitly "INTERVENE"
    if (action !== 'INTERVENE') {
      console.log(`🤖 AI Mediator: Unexpected action "${action}" - defaulting to STAY_SILENT`);
      return null;
    }

    const validation = validationMatch ? validationMatch[1].trim() : null;
    const tip1 = tip1Match ? tip1Match[1].trim() : null;
    const tip2 = tip2Match ? tip2Match[1].trim() : null;
    const rewrite = rewriteMatch ? rewriteMatch[1].trim() : null;

    console.log('🤖 AI Mediator: Parsed components:');
    console.log('  Validation:', validation ? validation.substring(0, 50) + '...' : 'MISSING');
    console.log('  Tip1:', tip1 ? tip1.substring(0, 50) + '...' : 'MISSING');
    console.log('  Tip2:', tip2 ? tip2.substring(0, 50) + '...' : 'MISSING');
    console.log('  Rewrite:', rewrite ? rewrite.substring(0, 50) + '...' : 'MISSING');

    // Validate that we have all required components
    if (!validation || !tip1 || !tip2 || !rewrite) {
      console.error('❌ AI Mediator: Missing required components in response - defaulting to STAY_SILENT');
      console.error('Full response was:', response);
      // Don't return intervention if format is wrong - allow message through
      return null;
    }

    const intervention = {
      type: action === 'INTERVENE' ? 'ai_intervention' : 'ai_comment',
      action,
      validation,
      tip1,
      tip2,
      rewrite,
      originalMessage: message
    };
    
    console.log('✅ AI Mediator: Successfully parsed structured intervention');
    return intervention;

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
  generateContactSuggestion
};

