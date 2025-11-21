const openaiClient = require('./openaiClient');

/**
 * Analyze a draft message before sending and provide proactive coaching
 * @param {string} draftText - The message text user is about to send
 * @param {Array} recentMessages - Recent conversation history
 * @param {Object} userContext - User's context and preferences
 * @param {Object} contactContext - Contact/relationship context
 * @param {Array} flaggedMessages - Previously flagged messages for learning
 * @returns {Promise<Object>} - Coaching suggestions and rewrite options
 */
async function analyzeDraftMessage(draftText, recentMessages = [], userContext = {}, contactContext = null, flaggedMessages = []) {
  if (!openaiClient.isConfigured() || !draftText || draftText.trim().length === 0) {
    return null;
  }

  try {
    const recentHistory = recentMessages.slice(-5).map(m => `${m.username}: ${m.text}`).join('\n');
    const flaggedContext = flaggedMessages.length > 0
      ? `\n\nPreviously flagged messages (learn from these):\n${flaggedMessages.slice(0, 3).map(f => `"${f.text}" - Flagged because: ${f.reason}`).join('\n')}`
      : '';

    const prompt = `You are a proactive communication coach helping a co-parent craft a better message before they send it.

User's draft message: "${draftText}"

Recent conversation:
${recentHistory || 'No recent messages'}

${contactContext ? `Relationship context:\n${contactContext}\n` : ''}
${flaggedContext}

Analyze this draft message and provide:
1. Risk assessment (low/medium/high) - how likely is this to escalate conflict?
2. Specific issues identified (if any)
3. A gentle, helpful coaching message (1-2 sentences)
4. Two alternative rewrites that are more collaborative and child-focused

Respond in JSON format:
{
  "riskLevel": "low|medium|high",
  "issues": ["issue1", "issue2"],
  "coachingMessage": "A warm, supportive message explaining what could be improved",
  "rewrite1": "First alternative rewrite",
  "rewrite2": "Second alternative rewrite",
  "shouldSend": true/false
}

If the message is fine as-is, set shouldSend to true and provide minimal feedback.`;

    const completion = await openaiClient.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a warm, supportive communication coach for co-parents. Help them communicate more effectively while being encouraging and non-judgmental. Respond only with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.4,
      max_tokens: 500
    });

    const response = completion.choices[0].message.content.trim();
    const coaching = JSON.parse(response);

    return {
      riskLevel: coaching.riskLevel || 'low',
      issues: coaching.issues || [],
      coachingMessage: coaching.coachingMessage || '',
      rewrite1: coaching.rewrite1 || null,
      rewrite2: coaching.rewrite2 || null,
      shouldSend: coaching.shouldSend !== false // Default to true if not specified
    };

  } catch (error) {
    console.error('Error in proactive coaching:', error.message);
    return null;
  }
}

module.exports = {
  analyzeDraftMessage
};

