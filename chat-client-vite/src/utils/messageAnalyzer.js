/**
 * Message Analyzer - Observer/Mediator Framework Integration
 *
 * This module handles message analysis using the Observer/Mediator framework
 * before sending messages. It implements the traffic control logic:
 * - If action === "STAY_SILENT" → PASS (send message)
 * - If action === "INTERVENE" → Show Observer Card (block message)
 * - If action === "COMMENT" → Show comment (optional)
 */

import { apiPost } from '../apiClient.js';
import { API_BASE_URL } from '../config.js';

/**
 * Analyze a message using the Observer/Mediator framework
 *
 * @param {string} messageText - The message to analyze
 * @param {Object} senderProfile - Sender context (role, position, resources, etc.)
 * @param {Object} receiverProfile - Receiver context (has_new_partner, income_disparity, etc.)
 * @returns {Promise<Object>} Analysis result with action, escalation, emotion, intervention
 */
export async function analyzeMessage(messageText, senderProfile = {}, receiverProfile = {}) {
  try {
    console.log('🔍 Frontend: Calling /api/mediate/analyze with:', {
      text: messageText.substring(0, 50),
    });
    // Call the backend mediation endpoint
    // The backend uses the same Observer/Mediator framework from constitution.md
    const response = await apiPost('/api/mediate/analyze', {
      text: messageText,
      senderProfile,
      receiverProfile,
    });

    console.log('📥 Frontend: Received response status:', response.status);

    // Check if the request was successful
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Mediation API error:', response.status, errorText);
      console.error('Full response:', { status: response.status, statusText: response.statusText });
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    // Parse the JSON response
    const data = await response.json();
    console.log('📊 Frontend: Analysis result:', {
      action: data.action,
      hasIntervention: !!data.intervention,
    });
    return data;
  } catch (error) {
    console.error('❌ Error analyzing message:', error);
    console.error('Error details:', { message: error.message, stack: error.stack });
    // On error, default to PASS (allow message through)
    console.warn('⚠️ Allowing message through due to analysis error (fail open)');
    return {
      action: 'STAY_SILENT',
      escalation: { riskLevel: 'low', confidence: 0, reasons: [] },
      emotion: {
        currentEmotion: 'neutral',
        stressLevel: 0,
        stressTrajectory: 'stable',
        emotionalMomentum: 0,
        triggers: [],
        conversationEmotion: 'neutral',
      },
      intervention: null,
      error: error.message,
    };
  }
}

// Local pre-filter patterns for fast client-side checks (mirrors server preFilters.js)
const POLITE_REQUEST_PATTERNS = [
  /\b(I was wondering if|would it be okay if|would you mind if|could I|can I|may I)\b/i,
  /\b(I know it'?s your|I know its your|I know you have)\b.*\b(but|and)\b/i,
  /\b(would it be possible|is it possible|is it okay if)\b/i,
  /\b(do you think|would you be open to|would you consider)\b/i,
  /\b(I'?d like to|I would like to)\b.*\b(if that'?s okay|if that works|if you don'?t mind)\b/i,
  /\b(can we|could we|shall we)\b.*\b(talk about|discuss|arrange|schedule|plan)\b/i,
  /\b(just wanted to ask|just checking if|quick question)\b/i,
  /\b(let me know if|let me know what you think)\b/i,
];

const POSITIVE_PATTERNS = [
  /\b(thank|thanks)\s+(you|so much|for)\b/i,
  /\b(sounds good|perfect|great|awesome)\b/i,
  /\b(appreciate|grateful)\b/i,
];

const SIMPLE_RESPONSES = [
  'ok',
  'okay',
  'sure',
  'yes',
  'no',
  'got it',
  'sounds good',
  'thanks',
  'thank you',
];

/**
 * Quick local check for obviously safe messages - no API call needed
 */
function quickLocalCheck(messageText) {
  const text = messageText.trim();
  const lower = text.toLowerCase();

  // Simple responses
  if (SIMPLE_RESPONSES.includes(lower)) {
    return { shouldSend: true, reason: 'simple_response' };
  }

  // Polite requests
  if (POLITE_REQUEST_PATTERNS.some(p => p.test(text))) {
    return { shouldSend: true, reason: 'polite_request' };
  }

  // Positive messages
  if (POSITIVE_PATTERNS.some(p => p.test(text))) {
    return { shouldSend: true, reason: 'positive_message' };
  }

  // Short logistics (under 50 chars, no hostile patterns)
  const hostilePatterns = /\b(you always|you never|your fault|because of you)\b/i;
  if (text.length < 50 && !hostilePatterns.test(text)) {
    // Check if it's a simple question or statement
    if (/^(what|when|where|can|could|will|would|is|are|do|does|did|have|has)\b/i.test(text)) {
      return { shouldSend: true, reason: 'simple_question' };
    }
  }

  return null; // Needs full analysis
}

/**
 * Traffic Control Logic
 *
 * Determines whether a message should be sent or blocked based on analysis
 *
 * @param {Object} analysis - The analysis result from analyzeMessage
 * @returns {Object} { shouldSend: boolean, reason: string, observerData: Object }
 */
export function shouldSendMessage(analysis) {
  if (!analysis) {
    return { shouldSend: true, reason: 'no_analysis', observerData: null };
  }

  // QUICK_CHECK: Fast local pre-filter (no API call)
  if (analysis.action === 'QUICK_CHECK' && analysis.messageText) {
    const quickResult = quickLocalCheck(analysis.messageText);
    if (quickResult) {
      return { ...quickResult, observerData: null };
    }
    // No quick pass - needs full analysis
    return { shouldSend: false, reason: 'needs_analysis', observerData: null };
  }

  // SCENARIO A: CLEAN - Send the message
  if (analysis.action === 'STAY_SILENT') {
    return {
      shouldSend: true,
      reason: 'clean',
      observerData: null,
    };
  }

  // SCENARIO B: CONFLICT DETECTED - Block and show Observer Card
  if (analysis.action === 'INTERVENE') {
    return {
      shouldSend: false,
      reason: 'intervention_required',
      observerData: {
        axiomsFired: analysis.escalation?.reasons || [],
        explanation: analysis.intervention?.personalMessage || '',
        tip: analysis.intervention?.tip1 || '',
        refocusQuestions: analysis.intervention?.refocusQuestions || [],
        rewrite1: analysis.intervention?.rewrite1 || '',
        rewrite2: analysis.intervention?.rewrite2 || '',
        escalation: analysis.escalation,
        emotion: analysis.emotion,
        originalText: analysis.originalText || '',
      },
    };
  }

  // SCENARIO C: COMMENT - Optional observation (can send or show comment)
  if (analysis.action === 'COMMENT') {
    return {
      shouldSend: true, // Allow sending, but show comment
      reason: 'comment',
      observerData: {
        comment: analysis.intervention?.comment || '',
      },
    };
  }

  // Default: allow sending
  return { shouldSend: true, reason: 'default', observerData: null };
}
