/**
 * Fallback Rewrites
 *
 * Pre-approved sender-perspective rewrites for when AI-generated
 * rewrites fail validation.
 *
 * Feature: 006-mediator-speaker-perspective
 *
 * These fallbacks are guaranteed to be from the sender's perspective
 * and can be used when the AI generates receiver-perspective rewrites.
 */

/**
 * Categorized fallback rewrites by detected message intent
 */
const FALLBACK_REWRITES = {
  // For insults, attacks, name-calling
  attack: {
    rewrite1:
      "I'm feeling really frustrated right now and need us to communicate more respectfully.",
    rewrite2: "Something isn't working for me. Can we discuss what's happening?",
    tip: 'Name the feeling, not the person.',
  },

  // For blame statements
  blame: {
    rewrite1: "I'm feeling overwhelmed and need us to work together on this.",
    rewrite2: "I've noticed an issue I'd like us to address together. Can we talk about it?",
    tip: 'Describe the impact, not their intent.',
  },

  // For demands/commands
  demand: {
    rewrite1: 'I need help with something. Would you be able to assist?',
    rewrite2: 'This is important to me. Can we find a solution that works for both of us?',
    tip: 'Make a request, not a command.',
  },

  // For threats/ultimatums
  threat: {
    rewrite1: "I'm feeling like we're not making progress. I need us to find a way forward.",
    rewrite2: 'This issue is important to me. Can we work on resolving it?',
    tip: 'State your need, not the consequence.',
  },

  // For triangulation (using child as messenger/weapon)
  triangulation: {
    rewrite1: 'I need to discuss something with you directly about the kids.',
    rewrite2: "Can we talk about this between us? I don't want to put the kids in the middle.",
    tip: 'Speak directly, not through your child.',
  },

  // Generic fallback for unclassified messages
  generic: {
    rewrite1: "I have a concern I'd like to discuss with you.",
    rewrite2: 'Something has been bothering me. Can we talk about it?',
    tip: 'Express your need clearly and directly.',
  },
};

/**
 * Detect message intent category for fallback selection
 *
 * @param {string} originalMessage - The original problematic message
 * @param {Object} languageAnalysis - Optional analysis from language-analyzer
 * @returns {string} Category key for FALLBACK_REWRITES
 */
function detectCategory(originalMessage, languageAnalysis = null) {
  if (!originalMessage || typeof originalMessage !== 'string') {
    return 'generic';
  }

  const text = originalMessage.toLowerCase();

  // Check language analysis flags first (most accurate)
  if (languageAnalysis?.patterns) {
    if (
      languageAnalysis.patterns.child_triangulation ||
      languageAnalysis.patterns.child_as_messenger
    ) {
      return 'triangulation';
    }
    if (languageAnalysis.patterns.evaluative_character) {
      return 'attack';
    }
    if (languageAnalysis.patterns.global_negative) {
      return 'blame';
    }
  }

  // Pattern-based detection (fallback when no language analysis)

  // Triangulation patterns (check first - specific)
  if (/\b(tell (your|the) (dad|mom|father|mother|him|her|kids|children))\b/i.test(text)) {
    return 'triangulation';
  }
  if (/\b(tell (him|her) (that|to))\b/i.test(text)) {
    return 'triangulation';
  }
  if (/\b(tell the kids)\b/i.test(text)) {
    return 'triangulation';
  }

  // Attack/insult patterns
  if (/\b(idiot|stupid|suck|pathetic|worthless|bitch|asshole|jerk|loser)\b/i.test(text)) {
    return 'attack';
  }
  if (
    /\byou('re| are) (a |an |the |so |such a )?(bad|terrible|awful|worst|horrible)\b/i.test(text)
  ) {
    return 'attack';
  }

  // Blame patterns
  if (/\b(your fault|you('re| are) (the|to) blame|because of you)\b/i.test(text)) {
    return 'blame';
  }
  if (/\byou (always|never)\b/i.test(text)) {
    return 'blame';
  }

  // Threat patterns
  if (/\b(or else|i('ll| will) (call|tell|go to|get))\b/i.test(text)) {
    return 'threat';
  }
  if (/\b(lawyer|court|custody|police)\b/i.test(text) && /\b(call|contact|tell|go)\b/i.test(text)) {
    return 'threat';
  }

  // Demand patterns
  if (/\byou (should|must|have to|need to|better)\b/i.test(text)) {
    return 'demand';
  }

  return 'generic';
}

/**
 * Get fallback rewrites for a failed intervention
 *
 * @param {string} originalMessage - The original message
 * @param {Object} languageAnalysis - Optional analysis from language-analyzer
 * @returns {Object} { rewrite1, rewrite2, tip, category, isFallback }
 */
function getFallbackRewrites(originalMessage, languageAnalysis = null) {
  const category = detectCategory(originalMessage, languageAnalysis);
  const fallback = FALLBACK_REWRITES[category] || FALLBACK_REWRITES.generic;

  return {
    ...fallback,
    category,
    isFallback: true,
  };
}

module.exports = {
  FALLBACK_REWRITES,
  detectCategory,
  getFallbackRewrites,
};
