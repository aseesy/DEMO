/**
 * AXIOM_D101: Direct Insult / Name-Calling
 *
 * Pattern: Direct character attack or name-calling toward receiver
 *
 * This is NOT indirect communication - it's overt hostility that should
 * NEVER be transmitted. These messages attack the person, not the issue.
 *
 * Examples:
 * - "You're pathetic"
 * - "You're such a sad soul"
 * - "Get off your power trip"
 * - "You're an idiot"
 * - "You're crazy"
 *
 * @module axioms/direct/directInsult
 * @version 1.0.0
 */

'use strict';

const { AXIOM_CATEGORIES, createFiringAxiomResult, createNonFiringAxiomResult } = require('../../types');

// ============================================================================
// AXIOM METADATA
// ============================================================================

const id = 'AXIOM_D101';
const name = 'Direct Insult';
const category = 'direct_hostility';
const description = 'Direct name-calling or character attack toward receiver';
const pattern = '[You] + [are/\'re] + [Insult] OR [Insult Phrase]';

// ============================================================================
// DETECTION PATTERNS
// ============================================================================

/**
 * "You're/You are + insult" patterns
 */
const YOU_ARE_INSULT_PATTERNS = [
  /\b(you'?re|you are)\s+(a\s+)?(pathetic|sad|crazy|insane|stupid|dumb|idiot|moron|loser|selfish|terrible|awful|horrible|disgusting|worthless|useless|incompetent|irresponsible|lazy|manipulative|toxic|narcissist|psycho|nutjob|nutcase|jerk|ass|asshole|bitch|bastard)\b/gi,
  /\b(you'?re|you are)\s+(such\s+)?(a\s+)?(sad\s+soul|piece\s+of\s+work|piece\s+of\s+shit|waste\s+of\s+space|lost\s+cause|bad\s+parent|terrible\s+parent|awful\s+person|horrible\s+person)\b/gi,
  /\b(you'?re|you are)\s+(so\s+)?(pathetic|sad|crazy|stupid|dumb|selfish|terrible|awful|horrible|disgusting|worthless|useless|incompetent|irresponsible|lazy)\b/gi,
];

/**
 * Direct insult phrases (standalone)
 */
const INSULT_PHRASES = [
  /\bsad\s+soul\b/gi,
  /\bpower\s+trip\b/gi,
  /\bget\s+off\s+your\s+(high\s+horse|power\s+trip|throne)\b/gi,
  /\bwho\s+do\s+you\s+think\s+you\s+are\b/gi,
  /\byou\s+suck\b/gi,
  /\bscrew\s+you\b/gi,
  /\bf+\s*u\b/gi,
  /\bgo\s+to\s+hell\b/gi,
  /\bshut\s+(the\s+f+\s+)?up\b/gi,
  /\bgrow\s+up\b/gi,
  /\bget\s+over\s+(yourself|it)\b/gi,
  /\byou\s+make\s+me\s+sick\b/gi,
  /\bi\s+can'?t\s+stand\s+you\b/gi,
  /\bi\s+hate\s+you\b/gi,
];

/**
 * "Your + negative trait" patterns
 */
const YOUR_TRAIT_PATTERNS = [
  /\byour\s+(pathetic|stupid|dumb|crazy|insane|selfish|terrible|awful|horrible|worthless|useless)\b/gi,
];

/**
 * Possessive insults (your + noun as insult)
 */
const POSSESSIVE_INSULTS = [
  /\byour\s+(fault|problem|issue|mess)\b/gi,
];

// ============================================================================
// DETECTION FUNCTIONS
// ============================================================================

/**
 * Find "you're + insult" patterns
 */
function findYouAreInsults(text) {
  const insults = [];
  const textLower = text.toLowerCase();

  for (const pattern of YOU_ARE_INSULT_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(textLower)) !== null) {
      insults.push(match[0].trim());
    }
  }

  return insults;
}

/**
 * Find standalone insult phrases
 */
function findInsultPhrases(text) {
  const phrases = [];
  const textLower = text.toLowerCase();

  for (const pattern of INSULT_PHRASES) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(textLower)) !== null) {
      phrases.push(match[0].trim());
    }
  }

  return phrases;
}

/**
 * Find "your + trait" insults
 */
function findYourTraitInsults(text) {
  const insults = [];
  const textLower = text.toLowerCase();

  for (const pattern of YOUR_TRAIT_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(textLower)) !== null) {
      insults.push(match[0].trim());
    }
  }

  return insults;
}

/**
 * Calculate confidence score
 */
function calculateConfidence(evidence) {
  let confidence = 0;

  // "You're + insult" is strongest signal
  if (evidence.you_are_insults.length > 0) confidence += 50;

  // Standalone insult phrases
  if (evidence.insult_phrases.length > 0) confidence += 40;

  // "Your + trait" patterns
  if (evidence.your_trait_insults.length > 0) confidence += 30;

  // Multiple insults = higher confidence
  const totalInsults = evidence.you_are_insults.length +
    evidence.insult_phrases.length +
    evidence.your_trait_insults.length;

  if (totalInsults > 1) confidence += 15;
  if (totalInsults > 2) confidence += 10;

  return Math.min(100, confidence);
}

// ============================================================================
// MAIN CHECK FUNCTION
// ============================================================================

/**
 * Check if AXIOM_D101 fires for this message
 */
function check(parsed, context = {}) {
  const text = parsed.raw || '';

  // Gather evidence
  const evidence = {
    you_are_insults: findYouAreInsults(text),
    insult_phrases: findInsultPhrases(text),
    your_trait_insults: findYourTraitInsults(text),
  };

  // Must have at least one insult type
  const hasInsult = evidence.you_are_insults.length > 0 ||
    evidence.insult_phrases.length > 0 ||
    evidence.your_trait_insults.length > 0;

  if (!hasInsult) {
    return createNonFiringAxiomResult(id, name, category);
  }

  // Calculate confidence
  const confidence = calculateConfidence(evidence);

  // Must have minimum confidence
  if (confidence < 40) {
    return createNonFiringAxiomResult(id, name, category);
  }

  // Build trigger phrase
  const allInsults = [
    ...evidence.you_are_insults,
    ...evidence.insult_phrases,
    ...evidence.your_trait_insults,
  ];
  const triggerPhrase = allInsults.slice(0, 2).join(', ');

  return createFiringAxiomResult(
    id,
    name,
    category,
    confidence,
    {
      insults_found: allInsults,
      trigger_phrase: triggerPhrase,
      all_evidence: evidence,
    },
    `Direct insult/name-calling ("${triggerPhrase}") attacks the person instead of addressing the issue. This shuts down dialogue before any concern can be heard.`
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  id,
  name,
  category,
  description,
  pattern,
  check,
  findYouAreInsults,
  findInsultPhrases,
  findYourTraitInsults,
  calculateConfidence,
};
