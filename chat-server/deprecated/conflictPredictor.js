const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Track conversation state per room
const roomState = new Map(); // roomId -> { sentimentHistory, escalationScore, lastNegativeTime, patternCounts }

/**
 * Analyze message for conflict escalation risk
 * @param {Object} message - The message object
 * @param {Array} recentMessages - Recent conversation history
 * @param {string} roomId - Room identifier
 * @returns {Promise<Object>} - Escalation risk assessment
 */
async function assessEscalationRisk(message, recentMessages, roomId) {
  if (!process.env.OPENAI_API_KEY) {
    return { riskLevel: 'low', confidence: 0, reasons: [] };
  }

  try {
    // Initialize room state if needed
    if (!roomState.has(roomId)) {
      roomState.set(roomId, {
        sentimentHistory: [],
        escalationScore: 0,
        lastNegativeTime: null,
        patternCounts: {
          accusatory: 0,
          triangulation: 0,
          comparison: 0,
          blaming: 0,
        },
      });
    }

    const state = roomState.get(roomId);

    // Analyze recent conversation patterns
    const recentNegative = recentMessages.filter(msg => {
      const text = (msg.text || '').toLowerCase();
      return (
        text.includes('always') ||
        text.includes('never') ||
        (text.includes('you') && (text.includes('wrong') || text.includes('fault')))
      );
    }).length;

    // Calculate escalation score based on patterns
    let escalationScore = state.escalationScore;

    // Check for escalation indicators
    const text = message.text.toLowerCase();
    const hasAccusatory = /\b(you always|you never|you're|you are)\b/.test(text);
    const hasTriangulation = /\b(she told me|he said|the kids|child.*said)\b/.test(text);
    const hasComparison = /\b(fine with me|never does that|at my house|at your house)\b/.test(text);
    const hasBlaming = /\b(your fault|because of you|you made|you caused)\b/.test(text);

    if (hasAccusatory) state.patternCounts.accusatory++;
    if (hasTriangulation) state.patternCounts.triangulation++;
    if (hasComparison) state.patternCounts.comparison++;
    if (hasBlaming) state.patternCounts.blaming++;

    // Increase escalation score based on detected patterns
    if (hasAccusatory || hasTriangulation || hasComparison || hasBlaming) {
      escalationScore += 10;
      state.lastNegativeTime = Date.now();
    }

    // Decay escalation score over time (reduce by 1 every 5 minutes)
    const timeSinceLastNegative = state.lastNegativeTime
      ? Date.now() - state.lastNegativeTime
      : Infinity;
    if (timeSinceLastNegative > 300000) {
      // 5 minutes
      escalationScore = Math.max(0, escalationScore - 1);
    }

    state.escalationScore = escalationScore;

    // Use AI to assess overall risk
    const patternSummary = Object.entries(state.patternCounts)
      .filter(([_, count]) => count > 0)
      .map(([pattern, count]) => `${pattern}: ${count}`)
      .join(', ');

    const prompt = `Analyze this co-parenting message for conflict escalation risk.

Recent conversation context (last 5 messages):
${recentMessages
  .slice(-5)
  .map(m => `${m.username}: ${m.text}`)
  .join('\n')}

Current message: ${message.username}: "${message.text}"

Detected patterns in conversation: ${patternSummary || 'none'}
Escalation score: ${escalationScore}/100

Assess the escalation risk level (low, medium, high, critical) and provide:
1. Risk level
2. Confidence (0-100)
3. Specific reasons for the risk assessment
4. Recommended intervention urgency (none, gentle, moderate, urgent)

Respond in JSON format:
{
  "riskLevel": "low|medium|high|critical",
  "confidence": 0-100,
  "reasons": ["reason1", "reason2"],
  "urgency": "none|gentle|moderate|urgent"
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert conflict mediator analyzing co-parenting communication for escalation risk. Respond only with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 300,
    });

    const response = completion.choices[0].message.content.trim();
    const assessment = JSON.parse(response);

    return {
      riskLevel: assessment.riskLevel || 'low',
      confidence: assessment.confidence || 0,
      reasons: assessment.reasons || [],
      urgency: assessment.urgency || 'none',
      escalationScore: escalationScore,
    };
  } catch (error) {
    console.error('Error assessing escalation risk:', error.message);
    return { riskLevel: 'low', confidence: 0, reasons: [], urgency: 'none' };
  }
}

/**
 * Get escalation trend for a room
 * @param {string} roomId - Room identifier
 * @returns {Object} - Current escalation state
 */
function getEscalationTrend(roomId) {
  const state = roomState.get(roomId);
  if (!state) {
    return { escalationScore: 0, patternCounts: {}, trend: 'stable' };
  }

  let trend = 'stable';
  if (state.escalationScore > 50) trend = 'escalating';
  if (state.escalationScore > 75) trend = 'critical';
  if (state.escalationScore < 10) trend = 'calming';

  return {
    escalationScore: state.escalationScore,
    patternCounts: { ...state.patternCounts },
    trend: trend,
    lastNegativeTime: state.lastNegativeTime,
  };
}

/**
 * Reset escalation tracking for a room (after successful mediation)
 * @param {string} roomId - Room identifier
 */
function resetEscalationTracking(roomId) {
  if (roomState.has(roomId)) {
    const state = roomState.get(roomId);
    state.escalationScore = Math.max(0, state.escalationScore - 20); // Reduce score after intervention
    state.lastNegativeTime = null;
  }
}

module.exports = {
  assessEscalationRisk,
  getEscalationTrend,
  resetEscalationTracking,
};
