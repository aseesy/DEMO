/**
 * Rewrite Validator Library
 *
 * Validates AI-generated rewrites to ensure they maintain sender perspective.
 * Detects and flags rewrites that appear to be receiver responses.
 *
 * Feature: 006-mediator-speaker-perspective
 *
 * Key Principle: Rewrites are ALTERNATIVE messages the sender could send
 * INSTEAD of their original message - NOT responses the receiver would
 * send back after receiving the original.
 */

const VERSION = '1.0.0';

/**
 * Patterns that indicate a rewrite is from receiver's perspective
 * (i.e., a response TO the message rather than an alternative FOR the sender)
 */
const RECEIVER_INDICATORS = [
  // Empathy/understanding openers (receiver responding to attack)
  /^I understand you('re| are)/i,
  /^I (can )?see (that )?you('re| are)/i,
  /^I hear (that )?you/i,

  // Hurt/reaction statements (receiver reacting to message)
  /that (hurt|upset|bothered|offended|made) me/i,
  /I('m| am) hurt by/i,
  /that was (hurtful|painful|offensive)/i,

  // Referencing what was said (processing received message)
  /when you said (that|this)/i,
  /what you (just )?said/i,
  /hearing (that|this|you say)/i,

  // Reactive phrases
  /^in response to/i,
  /^that('s| is) (not )?(fair|nice|okay|acceptable)/i,
  /^that('s| is) (really )?(hurtful|mean|unkind)/i,

  // Defensive patterns (defending against attack)
  /^I (don't|do not) (deserve|appreciate)/i,
  /^I (didn't|did not) (mean|intend|do)/i,

  // "Sorry you feel" pattern (dismissive receiver response)
  /^I('m| am) sorry you feel/i,

  // Request for explanation (receiver asking for clarification)
  /^(can|could) you explain (what|why)/i,
  /^what (exactly |specifically )?(do you mean|did I do)/i,
];

/**
 * Patterns that strongly indicate sender perspective (positive signals)
 */
const SENDER_INDICATORS = [
  /^I('m| am) feeling/i,
  /^I feel /i,
  /^I need /i,
  /^I('ve| have) noticed/i,
  /^I('m| am) (concerned|worried|frustrated)/i,
  /^I would like/i,
  /^I('d| would) prefer/i,
  /^can we (discuss|talk|figure|find|work)/i,
  /^something (isn't|is not) working/i,
  /^this (situation|isn't|is not)/i,
  /^I('m| am) having (a hard time|trouble|difficulty)/i,
];

/**
 * Validate a single rewrite for sender perspective
 *
 * @param {string} rewrite - The rewrite text to validate
 * @param {string} originalMessage - The original message (for context)
 * @returns {Object} { valid: boolean, reason?: string, confidence: number }
 */
function validateRewritePerspective(rewrite, originalMessage = '') {
  if (!rewrite || typeof rewrite !== 'string') {
    return { valid: false, reason: 'empty_or_invalid', confidence: 0 };
  }

  const trimmedRewrite = rewrite.trim();

  if (trimmedRewrite.length === 0) {
    return { valid: false, reason: 'empty_or_invalid', confidence: 0 };
  }

  // Check for receiver indicators
  for (const pattern of RECEIVER_INDICATORS) {
    if (pattern.test(trimmedRewrite)) {
      return {
        valid: false,
        reason: 'receiver_perspective_detected',
        pattern: pattern.toString(),
        confidence: 85,
      };
    }
  }

  // Check for sender indicators (positive signal)
  let senderSignalStrength = 0;
  for (const pattern of SENDER_INDICATORS) {
    if (pattern.test(trimmedRewrite)) {
      senderSignalStrength += 20;
    }
  }

  // Additional heuristics
  const startsWithI = /^I('m| am|'ve| have|'d| would| feel| need)/i.test(trimmedRewrite);
  const hasCanWe = /can we/i.test(trimmedRewrite);
  const hasSenderNeed = /I need|I('d| would) like/i.test(trimmedRewrite);

  if (startsWithI) senderSignalStrength += 10;
  if (hasCanWe) senderSignalStrength += 10;
  if (hasSenderNeed) senderSignalStrength += 15;

  // Calculate confidence
  const confidence = Math.min(95, 60 + senderSignalStrength);

  return {
    valid: true,
    confidence,
    senderSignals: senderSignalStrength > 0,
  };
}

/**
 * Validate both rewrites from an intervention
 *
 * @param {Object} intervention - { rewrite1, rewrite2 }
 * @param {string} originalMessage - The original message
 * @returns {Object} { valid: boolean, rewrite1Result, rewrite2Result, anyFailed, bothFailed }
 */
function validateIntervention(intervention, originalMessage = '') {
  const rewrite1Result = validateRewritePerspective(intervention.rewrite1, originalMessage);
  const rewrite2Result = validateRewritePerspective(intervention.rewrite2, originalMessage);

  return {
    valid: rewrite1Result.valid && rewrite2Result.valid,
    rewrite1: rewrite1Result,
    rewrite2: rewrite2Result,
    anyFailed: !rewrite1Result.valid || !rewrite2Result.valid,
    bothFailed: !rewrite1Result.valid && !rewrite2Result.valid,
  };
}

module.exports = {
  validateRewritePerspective,
  validateIntervention,
  RECEIVER_INDICATORS,
  SENDER_INDICATORS,
  VERSION,
};
