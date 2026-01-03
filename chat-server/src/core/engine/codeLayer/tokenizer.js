/**
 * Tokenizer Module
 *
 * Breaks messages into tagged tokens with linguistic metadata.
 * Optimized for co-parenting communication patterns.
 *
 * Word lists are loaded from wordLists.json for easy maintenance.
 *
 * @module codeLayer/tokenizer
 * @version 1.1.0
 */

'use strict';

// Load word lists from JSON config (editable without code changes)
const wordLists = require('./wordLists.json');

// Convert arrays to Sets for O(1) lookup (compiled once at module load)
const ADDRESSEE_WORDS = new Set(wordLists.addresseeWords);
const SPEAKER_WORDS = new Set(wordLists.speakerWords);
const INTENSIFIERS = new Set(wordLists.intensifiers);
const ABSOLUTES = new Set(wordLists.absolutes);
const SOFTENERS = new Set(wordLists.softeners);
const THIRD_PARTY_PRONOUNS = new Set(wordLists.thirdPartyPronouns);
const CHILD_TERMS = new Set(wordLists.childTerms);
const ACTION_VERBS = new Set(wordLists.actionVerbs);

// Domain keywords - convert each domain's array to a Set
const DOMAIN_KEYWORDS = Object.fromEntries(
  Object.entries(wordLists.domainKeywords).map(([domain, words]) => [domain, new Set(words)])
);

// POS patterns - convert each category's array to a Set
const POS_PATTERNS = Object.fromEntries(
  Object.entries(wordLists.posPatterns).map(([pos, words]) => [pos, new Set(words)])
);

// ============================================================================
// TOKENIZER FUNCTIONS
// ============================================================================

/**
 * Clean and normalize text for tokenization
 * @param {string} text - Raw text input
 * @returns {string} - Normalized text
 */
function normalizeText(text) {
  if (!text || typeof text !== 'string') return '';

  return text
    .toLowerCase()
    .replace(/['']/g, "'") // Normalize apostrophes
    .replace(/[""]/g, '"') // Normalize quotes
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Split text into words while preserving contractions
 * @param {string} text - Normalized text
 * @returns {string[]} - Array of words
 */
function splitIntoWords(text) {
  if (!text) return [];

  // Split on whitespace and punctuation, keeping contractions
  return text
    .replace(/([.!?,;:])/g, ' $1 ') // Add space around punctuation
    .split(/\s+/)
    .filter(word => word.length > 0);
}

/**
 * Determine the part of speech for a word
 * @param {string} word - Lowercase word
 * @returns {string} - Part of speech tag
 */
function getPartOfSpeech(word) {
  // Check specific categories first
  if (ADDRESSEE_WORDS.has(word) || SPEAKER_WORDS.has(word) || THIRD_PARTY_PRONOUNS.has(word)) {
    return 'pronoun';
  }
  if (POS_PATTERNS.article.has(word)) return 'article';
  if (POS_PATTERNS.preposition.has(word)) return 'preposition';
  if (POS_PATTERNS.conjunction.has(word)) return 'conjunction';
  if (POS_PATTERNS.auxiliary.has(word)) return 'auxiliary';
  if (ACTION_VERBS.has(word)) return 'verb';

  // Check for verb endings
  if (word.endsWith('ing') || word.endsWith('ed') || word.endsWith('es')) {
    return 'verb';
  }

  // Check for adjective endings
  if (word.endsWith('ly') && !ACTION_VERBS.has(word)) {
    return 'adverb';
  }

  // Check intensifiers/softeners (often adverbs)
  if (INTENSIFIERS.has(word) || SOFTENERS.has(word)) {
    return 'adverb';
  }

  // Default to noun (most common for unrecognized words)
  return 'noun';
}

/**
 * Detect domain for a word
 * @param {string} word - Lowercase word
 * @returns {string|null} - Domain or null
 */
function detectDomain(word) {
  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    if (keywords.has(word)) {
      return domain;
    }
  }
  return null;
}

/**
 * Tokenize a message into tagged tokens
 *
 * @param {string} text - Message text to tokenize
 * @returns {Object} - Tokenization result
 * @returns {Token[]} result.tokens - Array of tokens
 * @returns {number} result.latencyMs - Processing time
 *
 * @example
 * tokenize("You NEVER help with homework")
 * // Returns:
 * // {
 * //   tokens: [
 * //     { word: "you", pos: "pronoun", addressee: true, index: 0 },
 * //     { word: "never", pos: "adverb", intensifier: true, absolute: true, index: 1 },
 * //     { word: "help", pos: "verb", action: true, index: 2 },
 * //     { word: "with", pos: "preposition", index: 3 },
 * //     { word: "homework", pos: "noun", domain: "child_education", index: 4 }
 * //   ],
 * //   latencyMs: 2
 * // }
 */
function tokenize(text) {
  const startTime = Date.now();

  // Handle empty/invalid input
  if (!text || typeof text !== 'string') {
    return {
      tokens: [],
      latencyMs: Date.now() - startTime,
    };
  }

  const normalized = normalizeText(text);
  const words = splitIntoWords(normalized);
  const tokens = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const wordLower = word.toLowerCase();

    // Skip punctuation-only tokens
    if (/^[.!?,;:]+$/.test(word)) continue;

    const token = {
      word: wordLower,
      pos: getPartOfSpeech(wordLower),
      index: tokens.length,
    };

    // Add special tags
    if (ADDRESSEE_WORDS.has(wordLower)) {
      token.addressee = true;
    }

    if (SPEAKER_WORDS.has(wordLower)) {
      token.speaker = true;
    }

    if (THIRD_PARTY_PRONOUNS.has(wordLower)) {
      token.third_party = true;
    }

    if (INTENSIFIERS.has(wordLower)) {
      token.intensifier = true;
    }

    if (ABSOLUTES.has(wordLower)) {
      token.absolute = true;
    }

    if (SOFTENERS.has(wordLower)) {
      token.softener = true;
    }

    if (ACTION_VERBS.has(wordLower)) {
      token.action = true;
    }

    if (CHILD_TERMS.has(wordLower)) {
      token.child_term = true;
    }

    const domain = detectDomain(wordLower);
    if (domain) {
      token.domain = domain;
    }

    tokens.push(token);
  }

  return {
    tokens,
    latencyMs: Date.now() - startTime,
  };
}

/**
 * Check if text contains addressee reference
 * @param {Token[]} tokens - Tokenized message
 * @returns {boolean}
 */
function hasAddresseeReference(tokens) {
  return tokens.some(t => t.addressee);
}

/**
 * Check if text contains speaker reference
 * @param {Token[]} tokens - Tokenized message
 * @returns {boolean}
 */
function hasSpeakerReference(tokens) {
  return tokens.some(t => t.speaker);
}

/**
 * Check if text contains third party reference
 * @param {Token[]} tokens - Tokenized message
 * @returns {boolean}
 */
function hasThirdPartyReference(tokens) {
  return tokens.some(t => t.third_party || t.child_term);
}

/**
 * Get all intensifiers from tokens
 * @param {Token[]} tokens - Tokenized message
 * @returns {string[]}
 */
function getIntensifiers(tokens) {
  return tokens.filter(t => t.intensifier).map(t => t.word);
}

/**
 * Get all softeners from tokens
 * @param {Token[]} tokens - Tokenized message
 * @returns {string[]}
 */
function getSofteners(tokens) {
  return tokens.filter(t => t.softener).map(t => t.word);
}

/**
 * Get all absolutes from tokens
 * @param {Token[]} tokens - Tokenized message
 * @returns {string[]}
 */
function getAbsolutes(tokens) {
  return tokens.filter(t => t.absolute).map(t => t.word);
}

// Note: getPrimaryDomain removed - unused (domain already in conceptual primitives)

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Main function
  tokenize,

  // Utility functions
  normalizeText,
  splitIntoWords,
  getPartOfSpeech,
  detectDomain,

  // Token analysis helpers
  hasAddresseeReference,
  hasSpeakerReference,
  hasThirdPartyReference,
  getIntensifiers,
  getSofteners,
  getAbsolutes,
  // Note: getPrimaryDomain removed - unused

  // Word lists (exported for testing/extension)
  ADDRESSEE_WORDS,
  SPEAKER_WORDS,
  INTENSIFIERS,
  ABSOLUTES,
  SOFTENERS,
  THIRD_PARTY_PRONOUNS,
  CHILD_TERMS,
  DOMAIN_KEYWORDS,
  ACTION_VERBS,
};
