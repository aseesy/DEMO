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
    // Call the backend mediation endpoint
    // The backend uses the same Observer/Mediator framework from constitution.md
    const response = await apiPost('/api/mediate/analyze', {
      text: messageText,
      senderProfile,
      receiverProfile,
    });

    // Check if the request was successful
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Mediation API error:', response.status, errorText);
      throw new Error(`API error: ${response.status}`);
    }

    // Parse the JSON response
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error analyzing message:', error);
    // On error, default to PASS (allow message through)
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

