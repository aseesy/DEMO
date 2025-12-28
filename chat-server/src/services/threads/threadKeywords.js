/**
 * Thread Keywords Module
 *
 * Provides utilities for extracting distinctive keywords from text.
 * Filters out stop words and common words that don't carry distinctive meaning.
 */

// =============================================================================
// STOP WORDS - Filter these out before keyword matching
// These are common words that don't carry distinctive meaning
// =============================================================================
const STOP_WORDS = new Set([
  // Articles
  'a',
  'an',
  'the',
  // Prepositions
  'at',
  'by',
  'for',
  'from',
  'in',
  'into',
  'of',
  'off',
  'on',
  'onto',
  'out',
  'over',
  'to',
  'up',
  'with',
  'without',
  // Conjunctions
  'and',
  'but',
  'or',
  'nor',
  'so',
  'yet',
  // Pronouns
  'i',
  'me',
  'my',
  'we',
  'us',
  'our',
  'you',
  'your',
  'he',
  'him',
  'his',
  'she',
  'her',
  'it',
  'its',
  'they',
  'them',
  'their',
  'this',
  'that',
  'these',
  'those',
  'who',
  'whom',
  'which',
  'what',
  // Common verbs (non-distinctive)
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'being',
  'am',
  'have',
  'has',
  'had',
  'having',
  'do',
  'does',
  'did',
  'doing',
  'will',
  'would',
  'could',
  'should',
  'may',
  'might',
  'must',
  'can',
  'get',
  'got',
  'getting',
  'go',
  'going',
  'went',
  'gone',
  'make',
  'made',
  'making',
  'take',
  'took',
  'taken',
  'taking',
  'come',
  'came',
  'coming',
  'give',
  'gave',
  'given',
  'giving',
  'say',
  'said',
  'saying',
  'see',
  'saw',
  'seen',
  'seeing',
  'know',
  'knew',
  'known',
  'knowing',
  'think',
  'thought',
  'thinking',
  'want',
  'wanted',
  'wanting',
  'need',
  'needed',
  'needing',
  'let',
  'put',
  'keep',
  'kept',
  'keeping',
  // Adverbs
  'also',
  'just',
  'only',
  'even',
  'still',
  'already',
  'always',
  'never',
  'now',
  'then',
  'here',
  'there',
  'when',
  'where',
  'why',
  'how',
  'very',
  'really',
  'quite',
  'too',
  'more',
  'most',
  'less',
  'least',
  // Other common words
  'about',
  'after',
  'again',
  'all',
  'any',
  'back',
  'because',
  'before',
  'between',
  'both',
  'each',
  'first',
  'last',
  'like',
  'new',
  'next',
  'not',
  'other',
  'own',
  'same',
  'some',
  'such',
  'than',
  'through',
  'under',
  'well',
  'while',
  // Co-parenting common but non-distinctive words
  'okay',
  'sure',
  'yes',
  'yeah',
  'no',
  'thanks',
  'thank',
  'please',
  'sorry',
  'fine',
  'good',
  'great',
  'right',
  'wrong',
]);

/**
 * Check if a word is a distinctive keyword (not a stop word)
 * @param {string} word - Word to check
 * @returns {boolean} - True if distinctive
 */
function isDistinctiveKeyword(word) {
  if (!word || word.length < 3) return false;
  const lower = word.toLowerCase();
  if (STOP_WORDS.has(lower)) return false;
  // Filter out numbers-only
  if (/^\d+$/.test(word)) return false;
  return true;
}

/**
 * Extract distinctive keywords from text
 * @param {string} text - Text to extract from
 * @param {number} minLength - Minimum word length (default 3)
 * @returns {string[]} - Array of distinctive keywords
 */
function extractDistinctiveKeywords(text, minLength = 3) {
  if (!text) return [];
  return text
    .toLowerCase()
    .split(/\s+/)
    .map(w => w.replace(/[^a-z0-9]/g, '')) // Remove punctuation
    .filter(w => w.length >= minLength && isDistinctiveKeyword(w));
}

module.exports = {
  STOP_WORDS,
  isDistinctiveKeyword,
  extractDistinctiveKeywords,
};
