/**
 * Tokenizer Module
 *
 * Breaks messages into tagged tokens with linguistic metadata.
 * Optimized for co-parenting communication patterns.
 *
 * @module codeLayer/tokenizer
 * @version 1.0.0
 */

'use strict';

// ============================================================================
// WORD LISTS (Compiled once at module load for performance)
// ============================================================================

/**
 * Pronouns that reference the addressee (co-parent receiving the message)
 */
const ADDRESSEE_WORDS = new Set([
  'you', "you're", 'your', 'yours', 'yourself', 'youre'
]);

/**
 * Pronouns that reference the speaker
 */
const SPEAKER_WORDS = new Set([
  'i', "i'm", 'im', 'me', 'my', 'mine', 'myself', "i've", 'ive', "i'd", 'id', "i'll", 'ill'
]);

/**
 * Intensifier words that amplify statements
 */
const INTENSIFIERS = new Set([
  'always', 'never', 'every', 'completely', 'totally', 'absolutely',
  'constantly', 'forever', 'entirely', 'extremely', 'very', 'really',
  'so', 'such', 'definitely', 'certainly', 'obviously', 'clearly'
]);

/**
 * Absolute terms (subset of intensifiers with binary meaning)
 */
const ABSOLUTES = new Set([
  'always', 'never', 'every', 'all', 'none', 'nothing', 'everything',
  'everyone', 'nobody', 'no one', 'nowhere', 'everywhere'
]);

/**
 * Softener words that hedge or minimize
 */
const SOFTENERS = new Set([
  'just', 'maybe', 'might', 'perhaps', 'possibly', 'probably', 'kind of',
  'sort of', 'somewhat', 'a bit', 'a little', 'slightly', 'basically',
  'actually', 'honestly', 'frankly', 'simply', 'only', 'merely'
]);

/**
 * Third-party pronouns (potential child references)
 */
const THIRD_PARTY_PRONOUNS = new Set([
  'she', "she's", 'shes', 'her', 'hers', 'herself',
  'he', "he's", 'hes', 'him', 'his', 'himself',
  'they', "they're", 'theyre', 'them', 'their', 'theirs', 'themselves'
]);

/**
 * Child-related terms
 */
const CHILD_TERMS = new Set([
  'kids', 'children', 'child', 'kid', 'daughter', 'son', 'baby',
  'the kids', 'the children', 'our kids', 'our children', 'our daughter',
  'our son', 'my daughter', 'my son', 'your daughter', 'your son'
]);

/**
 * Domain keywords for categorization
 */
const DOMAIN_KEYWORDS = {
  schedule: new Set([
    'pickup', 'drop-off', 'dropoff', 'custody', 'time', 'schedule', 'weekend',
    'holiday', 'vacation', 'visitation', 'overnight', 'weekday', 'evening',
    'morning', 'afternoon', 'today', 'tomorrow', 'yesterday', 'monday',
    'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
  ]),
  money: new Set([
    'payment', 'support', 'child support', 'money', 'expense', 'expenses',
    'cost', 'pay', 'paid', 'afford', 'financial', 'bill', 'bills', 'fee',
    'fees', 'tuition', 'insurance', 'medical', 'dental'
  ]),
  child_education: new Set([
    'homework', 'school', 'teacher', 'class', 'grade', 'grades', 'test',
    'project', 'assignment', 'report card', 'parent-teacher', 'conference',
    'education', 'learning', 'tutoring', 'tutor'
  ]),
  parenting: new Set([
    'discipline', 'rules', 'bedtime', 'routine', 'behavior', 'behaviour',
    'screen time', 'chores', 'responsibilities', 'parenting', 'raising',
    'teaching', 'boundaries', 'consequences'
  ]),
  character: new Set([
    'behavior', 'behaviour', 'attitude', 'personality', 'character', 'trait',
    'habit', 'habits', 'way', 'ways', 'kind of person', 'type of person'
  ])
};

/**
 * Action verbs relevant to co-parenting
 */
const ACTION_VERBS = new Set([
  'pick', 'drop', 'bring', 'take', 'get', 'give', 'send', 'receive',
  'tell', 'say', 'said', 'told', 'ask', 'asked', 'help', 'helped',
  'change', 'changed', 'cancel', 'cancelled', 'forgot', 'forget',
  'remember', 'remembered', 'miss', 'missed', 'call', 'called',
  'text', 'texted', 'respond', 'responded', 'reply', 'replied',
  'agree', 'agreed', 'disagree', 'disagreed', 'decide', 'decided'
]);

/**
 * Basic part-of-speech patterns (simplified for performance)
 */
const POS_PATTERNS = {
  // Determiners/Articles
  article: new Set(['a', 'an', 'the']),
  // Prepositions
  preposition: new Set([
    'in', 'on', 'at', 'to', 'for', 'with', 'by', 'from', 'about',
    'into', 'through', 'during', 'before', 'after', 'above', 'below',
    'between', 'under', 'over', 'since', 'until', 'of'
  ]),
  // Conjunctions
  conjunction: new Set([
    'and', 'but', 'or', 'nor', 'for', 'yet', 'so', 'because', 'although',
    'though', 'while', 'if', 'when', 'where', 'since', 'unless', 'however'
  ]),
  // Auxiliary verbs
  auxiliary: new Set([
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'am',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'must', 'shall', 'can', "can't",
    "won't", "wouldn't", "couldn't", "shouldn't", "don't", "doesn't", "didn't"
  ])
};

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
    .replace(/\s+/g, ' ')  // Normalize whitespace
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
      latencyMs: Date.now() - startTime
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
      index: tokens.length
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
    latencyMs: Date.now() - startTime
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
  ACTION_VERBS
};
