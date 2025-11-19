const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

// Policy state per room/user
const policyState = new Map(); // roomId -> policy configuration

/**
 * Adaptive intervention policy structure:
 * {
 *   interventionThreshold: 0-100, // When to intervene
 *   interventionStyle: 'gentle' | 'moderate' | 'firm',
 *   preferredMethods: ['suggestion', 'reframing', 'tone_smoothing', 'delay_prompt'],
 *   userPreferences: {
 *     username: {
 *       preferredTone: 'warm' | 'direct' | 'gentle',
 *       interventionFrequency: 'minimal' | 'moderate' | 'comprehensive',
 *       feedbackHistory: []
 *     }
 *   },
 *   lastIntervention: timestamp,
 *   interventionHistory: [{ timestamp, type, outcome, feedback }]
 * }
 */

/**
 * Generate adaptive intervention policy for a conversation
 * @param {Object} emotionalState - Current emotional state analysis
 * @param {Object} escalationAssessment - Escalation risk assessment
 * @param {Array} recentInterventions - Recent intervention history
 * @param {Object} userFeedback - User feedback on previous interventions
 * @param {string} roomId - Room identifier
 * @returns {Promise<Object>} - Intervention policy decision
 */
async function generateInterventionPolicy(emotionalState, escalationAssessment, recentInterventions = [], userFeedback = {}, roomId) {
  if (!process.env.OPENAI_API_KEY) {
    return getDefaultPolicy();
  }

  try {
    // Initialize or get existing policy
    if (!policyState.has(roomId)) {
      policyState.set(roomId, {
        interventionThreshold: 60,
        interventionStyle: 'moderate',
        preferredMethods: ['suggestion', 'reframing'],
        userPreferences: {},
        lastIntervention: null,
        interventionHistory: []
      });
    }

    const currentPolicy = policyState.get(roomId);

    // Analyze what intervention is needed
    const emotionalContext = emotionalState ? JSON.stringify(emotionalState, null, 2) : 'No emotional data';
    const escalationContext = escalationAssessment ? JSON.stringify(escalationAssessment, null, 2) : 'No escalation data';
    const feedbackContext = Object.keys(userFeedback).length > 0 
      ? `User feedback: ${JSON.stringify(userFeedback, null, 2)}`
      : 'No user feedback yet';

    const prompt = `You are an adaptive intervention policy generator for co-parenting mediation.

Current emotional state:
${emotionalContext}

Escalation assessment:
${escalationContext}

${feedbackContext}

Recent interventions (last 5):
${recentInterventions.slice(-5).map(i => `${i.type} at ${i.timestamp}: ${i.outcome || 'unknown'}`).join('\n') || 'None'}

Current policy:
- Intervention threshold: ${currentPolicy.interventionThreshold}/100
- Intervention style: ${currentPolicy.interventionStyle}
- Preferred methods: ${currentPolicy.preferredMethods.join(', ')}

Generate an adaptive intervention policy that:
1. Decides IF intervention is needed (yes/no)
2. Determines intervention TYPE (suggestion, reframing, tone_smoothing, delay_prompt, or none)
3. Sets intervention STYLE (gentle, moderate, firm)
4. Adjusts threshold based on feedback and effectiveness
5. Customizes approach based on user preferences and emotional state

Consider:
- If users found previous interventions unhelpful, be more conservative
- If emotional momentum is high, intervention may be more urgent
- If escalation risk is high, intervention may be more proactive
- User preferences should guide style and frequency

Respond in JSON:
{
  "shouldIntervene": true/false,
  "interventionType": "suggestion|reframing|tone_smoothing|delay_prompt|none",
  "interventionStyle": "gentle|moderate|firm",
  "urgency": "low|medium|high",
  "reasoning": "Explanation of why this policy was chosen",
  "adjustedThreshold": 0-100,
  "confidence": 0-100,
  "fallbackPlan": "What to do if this intervention doesn't work"
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in adaptive intervention policies for conflict mediation. Generate policies that are context-aware, user-preferred, and evidence-based. Respond only with valid JSON.'
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
    const policy = JSON.parse(response);

    // Update policy state
    currentPolicy.interventionThreshold = policy.adjustedThreshold || currentPolicy.interventionThreshold;
    currentPolicy.interventionStyle = policy.interventionStyle || currentPolicy.interventionStyle;
    currentPolicy.lastIntervention = Date.now();

    return {
      shouldIntervene: policy.shouldIntervene !== false,
      interventionType: policy.interventionType || 'none',
      interventionStyle: policy.interventionStyle || 'moderate',
      urgency: policy.urgency || 'medium',
      reasoning: policy.reasoning || '',
      confidence: policy.confidence || 0,
      fallbackPlan: policy.fallbackPlan || 'Monitor and reassess',
      threshold: currentPolicy.interventionThreshold
    };

  } catch (error) {
    console.error('Error generating intervention policy:', error.message);
    return getDefaultPolicy();
  }
}

/**
 * Get default policy (fallback)
 */
function getDefaultPolicy() {
  return {
    shouldIntervene: false,
    interventionType: 'none',
    interventionStyle: 'moderate',
    urgency: 'low',
    reasoning: 'Default policy - insufficient data',
    confidence: 0,
    fallbackPlan: 'Monitor conversation',
    threshold: 60
  };
}

/**
 * Record intervention outcome for learning
 * @param {string} roomId - Room identifier
 * @param {Object} intervention - Intervention details
 * @param {string} outcome - 'helpful' | 'unhelpful' | 'neutral' | 'unknown'
 * @param {string} feedback - User feedback if available
 */
function recordInterventionOutcome(roomId, intervention, outcome, feedback = null) {
  if (!policyState.has(roomId)) {
    policyState.set(roomId, {
      interventionThreshold: 60,
      interventionStyle: 'moderate',
      preferredMethods: ['suggestion', 'reframing'],
      userPreferences: {},
      lastIntervention: null,
      interventionHistory: []
    });
  }

  const state = policyState.get(roomId);
  state.interventionHistory.push({
    timestamp: Date.now(),
    type: intervention.interventionType,
    style: intervention.interventionStyle,
    outcome: outcome,
    feedback: feedback,
    emotionalState: intervention.emotionalState,
    escalationRisk: intervention.escalationRisk
  });

  // Keep last 20 interventions
  if (state.interventionHistory.length > 20) {
    state.interventionHistory.shift();
  }

  // Adjust policy based on outcomes
  if (outcome === 'unhelpful') {
    // Increase threshold (be more conservative)
    state.interventionThreshold = Math.min(100, state.interventionThreshold + 5);
  } else if (outcome === 'helpful') {
    // Decrease threshold slightly (can be more proactive)
    state.interventionThreshold = Math.max(30, state.interventionThreshold - 2);
  }
}

/**
 * Get policy state for a room
 */
function getPolicyState(roomId) {
  return policyState.get(roomId) || null;
}

module.exports = {
  generateInterventionPolicy,
  recordInterventionOutcome,
  getPolicyState
};

