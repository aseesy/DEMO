const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

// Extended emotional state tracking per room
const emotionalStates = new Map(); // roomId -> emotional state object

/**
 * Emotional state structure:
 * {
 *   participants: {
 *     username: {
 *       currentEmotion: 'neutral' | 'frustrated' | 'calm' | 'defensive' | 'collaborative',
 *       emotionHistory: [{ timestamp, emotion, intensity, triggers }],
 *       stressLevel: 0-100,
 *       stressTrajectory: 'increasing' | 'decreasing' | 'stable',
 *       emotionalMomentum: 0-100, // How quickly emotions are changing
 *       stressPoints: [{ timestamp, trigger, intensity }],
 *       recentTriggers: []
 *     }
 *   },
 *   conversationEmotion: 'neutral' | 'tense' | 'collaborative' | 'escalating',
 *   escalationRisk: 0-100,
 *   lastUpdated: timestamp
 * }
 */

/**
 * Analyze emotional state from a message and update trajectory
 * @param {Object} message - The message object
 * @param {Array} recentMessages - Last 20 messages for context
 * @param {string} roomId - Room identifier
 * @returns {Promise<Object>} - Updated emotional state analysis
 */
async function analyzeEmotionalState(message, recentMessages, roomId) {
  if (!process.env.OPENAI_API_KEY) {
    return getDefaultState(roomId, message.username);
  }

  try {
    // Initialize or get existing state
    if (!emotionalStates.has(roomId)) {
      emotionalStates.set(roomId, {
        participants: {},
        conversationEmotion: 'neutral',
        escalationRisk: 0,
        lastUpdated: Date.now()
      });
    }

    const state = emotionalStates.get(roomId);
    const username = message.username;

    // Initialize participant state if needed
    if (!state.participants[username]) {
      state.participants[username] = {
        currentEmotion: 'neutral',
        emotionHistory: [],
        stressLevel: 0,
        stressTrajectory: 'stable',
        emotionalMomentum: 0,
        stressPoints: [],
        recentTriggers: []
      };
    }

    const participantState = state.participants[username];

    // Analyze current message emotion
    const recentHistory = recentMessages.slice(-10).map(m => `${m.username}: ${m.text}`).join('\n');
    
    const prompt = `Analyze the emotional state and trajectory in this co-parenting conversation.

Recent conversation (last 10 messages):
${recentHistory}

Current message from ${username}: "${message.text}"

Previous emotional state for ${username}:
- Current emotion: ${participantState.currentEmotion}
- Stress level: ${participantState.stressLevel}/100
- Stress trajectory: ${participantState.stressTrajectory}
- Recent triggers: ${participantState.recentTriggers.slice(-3).join(', ') || 'none'}

Analyze:
1. Current emotion (neutral, frustrated, calm, defensive, collaborative, anxious, angry)
2. Emotion intensity (0-100)
3. Stress level change (0-100, relative to previous)
4. Stress trajectory (increasing, decreasing, stable)
5. Emotional momentum (0-100, how quickly emotions are changing)
6. Specific triggers in this message (if any)
7. Overall conversation emotion (neutral, tense, collaborative, escalating)

Respond in JSON:
{
  "currentEmotion": "emotion",
  "intensity": 0-100,
  "stressLevel": 0-100,
  "stressTrajectory": "increasing|decreasing|stable",
  "emotionalMomentum": 0-100,
  "triggers": ["trigger1", "trigger2"],
  "conversationEmotion": "neutral|tense|collaborative|escalating",
  "confidence": 0-100
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in emotional analysis for co-parenting communication. Analyze emotional states, trajectories, and stress patterns. Respond only with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 400
    });

    const response = completion.choices[0].message.content.trim();
    const analysis = JSON.parse(response);

    // Update emotional state
    const previousStress = participantState.stressLevel;
    const previousEmotion = participantState.currentEmotion;

    participantState.currentEmotion = analysis.currentEmotion || 'neutral';
    participantState.stressLevel = analysis.stressLevel || 0;
    participantState.stressTrajectory = analysis.stressTrajectory || 'stable';
    participantState.emotionalMomentum = analysis.emotionalMomentum || 0;

    // Calculate emotional momentum (rate of change)
    const stressChange = Math.abs(analysis.stressLevel - previousStress);
    const emotionChange = analysis.currentEmotion !== previousEmotion ? 1 : 0;
    participantState.emotionalMomentum = Math.min(100, stressChange + (emotionChange * 20));

    // Track emotion history (keep last 20)
    participantState.emotionHistory.push({
      timestamp: Date.now(),
      emotion: analysis.currentEmotion,
      intensity: analysis.intensity || 0,
      triggers: analysis.triggers || []
    });
    if (participantState.emotionHistory.length > 20) {
      participantState.emotionHistory.shift();
    }

    // Track stress points
    if (analysis.stressLevel > 50 || analysis.triggers.length > 0) {
      participantState.stressPoints.push({
        timestamp: Date.now(),
        trigger: analysis.triggers.join(', ') || 'general stress',
        intensity: analysis.stressLevel
      });
      // Keep last 10 stress points
      if (participantState.stressPoints.length > 10) {
        participantState.stressPoints.shift();
      }
    }

    // Update recent triggers
    if (analysis.triggers && analysis.triggers.length > 0) {
      participantState.recentTriggers.push(...analysis.triggers);
      // Keep last 10 triggers
      if (participantState.recentTriggers.length > 10) {
        participantState.recentTriggers = participantState.recentTriggers.slice(-10);
      }
    }

    // Update conversation-level emotion
    state.conversationEmotion = analysis.conversationEmotion || 'neutral';

    // Calculate overall escalation risk based on all participants
    const allStressLevels = Object.values(state.participants).map(p => p.stressLevel);
    const avgStress = allStressLevels.length > 0 
      ? allStressLevels.reduce((a, b) => a + b, 0) / allStressLevels.length 
      : 0;
    
    const maxMomentum = Math.max(...Object.values(state.participants).map(p => p.emotionalMomentum), 0);
    
    state.escalationRisk = Math.min(100, (avgStress * 0.6) + (maxMomentum * 0.4));
    state.lastUpdated = Date.now();

    return {
      participant: {
        username: username,
        currentEmotion: participantState.currentEmotion,
        stressLevel: participantState.stressLevel,
        stressTrajectory: participantState.stressTrajectory,
        emotionalMomentum: participantState.emotionalMomentum,
        recentTriggers: participantState.recentTriggers.slice(-3)
      },
      conversation: {
        emotion: state.conversationEmotion,
        escalationRisk: state.escalationRisk
      },
      confidence: analysis.confidence || 0
    };

  } catch (error) {
    console.error('Error analyzing emotional state:', error.message);
    return getDefaultState(roomId, message.username);
  }
}

/**
 * Get default emotional state (fallback)
 */
function getDefaultState(roomId, username) {
  if (!emotionalStates.has(roomId)) {
    emotionalStates.set(roomId, {
      participants: {},
      conversationEmotion: 'neutral',
      escalationRisk: 0,
      lastUpdated: Date.now()
    });
  }
  
  const state = emotionalStates.get(roomId);
  if (!state.participants[username]) {
    state.participants[username] = {
      currentEmotion: 'neutral',
      emotionHistory: [],
      stressLevel: 0,
      stressTrajectory: 'stable',
      emotionalMomentum: 0,
      stressPoints: [],
      recentTriggers: []
    };
  }

  return {
    participant: {
      username: username,
      currentEmotion: 'neutral',
      stressLevel: 0,
      stressTrajectory: 'stable',
      emotionalMomentum: 0,
      recentTriggers: []
    },
    conversation: {
      emotion: 'neutral',
      escalationRisk: 0
    },
    confidence: 0
  };
}

/**
 * Get emotional trajectory summary for a room
 * @param {string} roomId - Room identifier
 * @returns {Object} - Emotional trajectory summary
 */
function getEmotionalTrajectory(roomId) {
  const state = emotionalStates.get(roomId);
  if (!state) {
    return null;
  }

  const trajectories = {};
  for (const [username, participant] of Object.entries(state.participants)) {
    trajectories[username] = {
      currentEmotion: participant.currentEmotion,
      stressLevel: participant.stressLevel,
      stressTrajectory: participant.stressTrajectory,
      emotionalMomentum: participant.emotionalMomentum,
      recentStressPoints: participant.stressPoints.slice(-5),
      emotionTrend: calculateEmotionTrend(participant.emotionHistory)
    };
  }

  return {
    participants: trajectories,
    conversationEmotion: state.conversationEmotion,
    escalationRisk: state.escalationRisk,
    lastUpdated: state.lastUpdated
  };
}

/**
 * Calculate emotion trend from history
 */
function calculateEmotionTrend(emotionHistory) {
  if (emotionHistory.length < 3) return 'stable';
  
  const recent = emotionHistory.slice(-5);
  const negativeEmotions = ['frustrated', 'defensive', 'angry', 'anxious'];
  
  const recentNegative = recent.filter(e => negativeEmotions.includes(e.emotion)).length;
  const earlierNegative = emotionHistory.slice(-10, -5).filter(e => negativeEmotions.includes(e.emotion)).length;
  
  if (recentNegative > earlierNegative) return 'worsening';
  if (recentNegative < earlierNegative) return 'improving';
  return 'stable';
}

/**
 * Reset emotional state (after successful intervention or conversation reset)
 */
function resetEmotionalState(roomId, username = null) {
  if (!emotionalStates.has(roomId)) return;
  
  const state = emotionalStates.get(roomId);
  if (username && state.participants[username]) {
    // Reset specific participant
    state.participants[username].stressLevel = Math.max(0, state.participants[username].stressLevel - 20);
    state.participants[username].emotionalMomentum = Math.max(0, state.participants[username].emotionalMomentum - 10);
  } else {
    // Reset entire room
    for (const participant of Object.values(state.participants)) {
      participant.stressLevel = Math.max(0, participant.stressLevel - 15);
      participant.emotionalMomentum = Math.max(0, participant.emotionalMomentum - 10);
    }
  }
  
  // Recalculate escalation risk
  const allStressLevels = Object.values(state.participants).map(p => p.stressLevel);
  state.escalationRisk = allStressLevels.length > 0 
    ? allStressLevels.reduce((a, b) => a + b, 0) / allStressLevels.length 
    : 0;
}

module.exports = {
  analyzeEmotionalState,
  getEmotionalTrajectory,
  resetEmotionalState
};

