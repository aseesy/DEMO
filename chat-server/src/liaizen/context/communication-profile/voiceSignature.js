/**
 * Voice Signature Extraction
 *
 * Analyzes user messages to extract unique communication voice characteristics.
 * Preserves user's authentic voice in AI-generated rewrites.
 *
 * Voice Signature includes:
 * - Sentence structure patterns
 * - Formality level
 * - Punctuation style
 * - Common starters and closings
 * - Unique phrases
 *
 * Feature: Contextual Awareness Improvements - Phase 1
 */

/**
 * Extract voice signature from a message
 * @param {string} messageText - The message text to analyze
 * @returns {Object} - Voice signature characteristics
 */
function extractVoiceFromMessage(messageText) {
  if (!messageText || typeof messageText !== 'string') {
    return null;
  }

  const text = messageText.trim();
  if (text.length === 0) return null;

  // Sentence structure analysis
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgSentenceLength = sentences.length > 0
    ? sentences.reduce((sum, s) => sum + s.trim().split(/\s+/).length, 0) / sentences.length
    : 0;

  const sentenceStructure = avgSentenceLength < 8
    ? 'short_direct'
    : avgSentenceLength < 15
    ? 'moderate'
    : 'detailed_explanatory';

  // Question frequency
  const questionCount = (text.match(/\?/g) || []).length;
  const questionRatio = questionCount / Math.max(sentences.length, 1);
  const isQuestionHeavy = questionRatio > 0.3;

  // Formality analysis
  const formalMarkers = /\b(please|would|could|appreciate|regarding|pertaining|accordingly)\b/gi;
  const casualMarkers = /\b(hey|yeah|nah|gonna|wanna|ok|okay|sure|thanks|thx)\b/gi;
  const formalMatches = (text.match(formalMarkers) || []).length;
  const casualMatches = (text.match(casualMarkers) || []).length;

  let formalityLevel = 'mixed';
  if (formalMatches > casualMatches * 1.5) {
    formalityLevel = 'formal';
  } else if (casualMatches > formalMatches * 1.5) {
    formalityLevel = 'casual';
  }

  // Punctuation style
  const exclamationCount = (text.match(/!/g) || []).length;
  const ellipsisCount = (text.match(/\.{3,}/g) || []).length;
  const punctuationRatio = (exclamationCount + ellipsisCount) / Math.max(sentences.length, 1);

  let punctuationStyle = 'standard';
  if (punctuationRatio > 0.3) {
    punctuationStyle = 'expressive';
  } else if (exclamationCount === 0 && ellipsisCount === 0) {
    punctuationStyle = 'minimal';
  }

  // Extract common starters (first 2-3 words of message)
  const firstWords = text.split(/\s+/).slice(0, 3).join(' ').toLowerCase();
  const starter = firstWords.length > 0 ? firstWords : null;

  // Extract common closings (last 2-3 words of message)
  const lastWords = text.split(/\s+/).slice(-3).join(' ').toLowerCase();
  const closing = lastWords.length > 0 ? lastWords : null;

  // Extract unique phrases (2-3 word phrases that appear frequently)
  const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const phrases = [];
  for (let i = 0; i < words.length - 1; i++) {
    const phrase = `${words[i]} ${words[i + 1]}`;
    phrases.push(phrase);
  }

  return {
    sentence_structure: sentenceStructure,
    is_question_heavy: isQuestionHeavy,
    formality_level: formalityLevel,
    punctuation_style: punctuationStyle,
    avg_sentence_length: Math.round(avgSentenceLength * 10) / 10,
    starter: starter,
    closing: closing,
    message_length: text.length,
    extracted_at: new Date().toISOString(),
  };
}

/**
 * Analyze multiple messages to build a voice signature
 * @param {Array<string>} messages - Array of message texts
 * @returns {Object} - Aggregated voice signature
 */
function buildVoiceSignature(messages) {
  if (!messages || messages.length === 0) {
    return getDefaultVoiceSignature();
  }

  const signatures = messages
    .map(msg => extractVoiceFromMessage(typeof msg === 'string' ? msg : msg.text))
    .filter(sig => sig !== null);

  if (signatures.length === 0) {
    return getDefaultVoiceSignature();
  }

  // Aggregate sentence structure
  const structures = signatures.map(s => s.sentence_structure);
  const structureCounts = {};
  structures.forEach(s => {
    structureCounts[s] = (structureCounts[s] || 0) + 1;
  });
  const dominantStructure = Object.keys(structureCounts).reduce((a, b) =>
    structureCounts[a] > structureCounts[b] ? a : b
  );

  // Aggregate formality
  const formalityLevels = signatures.map(s => s.formality_level);
  const formalityCounts = {};
  formalityLevels.forEach(f => {
    formalityCounts[f] = (formalityCounts[f] || 0) + 1;
  });
  const dominantFormality = Object.keys(formalityCounts).reduce((a, b) =>
    formalityCounts[a] > formalityCounts[b] ? a : b
  );

  // Aggregate punctuation style
  const punctuationStyles = signatures.map(s => s.punctuation_style);
  const punctuationCounts = {};
  punctuationStyles.forEach(p => {
    punctuationCounts[p] = (punctuationCounts[p] || 0) + 1;
  });
  const dominantPunctuation = Object.keys(punctuationCounts).reduce((a, b) =>
    punctuationCounts[a] > punctuationCounts[b] ? a : b
  );

  // Collect common starters and closings
  const starters = signatures
    .map(s => s.starter)
    .filter(s => s && s.length > 0);
  const closings = signatures
    .map(s => s.closing)
    .filter(s => s && s.length > 0);

  // Count frequency
  const starterCounts = {};
  starters.forEach(s => {
    starterCounts[s] = (starterCounts[s] || 0) + 1;
  });
  const closingCounts = {};
  closings.forEach(c => {
    closingCounts[c] = (closingCounts[c] || 0) + 1;
  });

  // Get top 5 most common
  const commonStarters = Object.entries(starterCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([phrase]) => phrase);

  const commonClosings = Object.entries(closingCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([phrase]) => phrase);

  // Calculate averages
  const avgSentenceLength = signatures.reduce((sum, s) => sum + s.avg_sentence_length, 0) / signatures.length;
  const avgMessageLength = signatures.reduce((sum, s) => sum + s.message_length, 0) / signatures.length;
  const questionHeavyRatio = signatures.filter(s => s.is_question_heavy).length / signatures.length;

  return {
    sentence_structure: dominantStructure,
    is_question_heavy: questionHeavyRatio > 0.4,
    formality_level: dominantFormality,
    punctuation_style: dominantPunctuation,
    avg_sentence_length: Math.round(avgSentenceLength * 10) / 10,
    avg_message_length: Math.round(avgMessageLength),
    common_starters: commonStarters,
    common_closings: commonClosings,
    sample_count: signatures.length,
    last_updated: new Date().toISOString(),
  };
}

/**
 * Get default voice signature (neutral)
 * @returns {Object} - Default voice signature
 */
function getDefaultVoiceSignature() {
  return {
    sentence_structure: 'moderate',
    is_question_heavy: false,
    formality_level: 'mixed',
    punctuation_style: 'standard',
    avg_sentence_length: 10,
    avg_message_length: 50,
    common_starters: [],
    common_closings: [],
    sample_count: 0,
    last_updated: new Date().toISOString(),
  };
}

/**
 * Merge voice signature into existing communication patterns
 * @param {Object} existingPatterns - Existing communication_patterns from profile
 * @param {Object} voiceSignature - New voice signature to merge
 * @returns {Object} - Merged communication patterns
 */
function mergeVoiceSignature(existingPatterns, voiceSignature) {
  const patterns = existingPatterns || {};

  // Update voice signature (overwrite with latest analysis)
  patterns.voice_signature = voiceSignature;

  // Keep existing fields
  return {
    ...patterns,
    voice_signature: voiceSignature,
    // Preserve existing fields
    tone_tendencies: patterns.tone_tendencies || [],
    common_phrases: patterns.common_phrases || [],
    avg_message_length: voiceSignature.avg_message_length || patterns.avg_message_length || 0,
  };
}

/**
 * Format voice signature for AI prompt
 * @param {Object} voiceSignature - Voice signature object
 * @returns {string} - Formatted string for AI prompt
 */
function formatVoiceSignatureForAI(voiceSignature) {
  if (!voiceSignature || voiceSignature.sample_count === 0) {
    return '';
  }

  const parts = [];

  parts.push('VOICE SIGNATURE (preserve in rewrites):');
  parts.push(`- Sentence style: ${voiceSignature.sentence_structure} (avg ${voiceSignature.avg_sentence_length} words/sentence)`);
  parts.push(`- Formality: ${voiceSignature.formality_level}`);
  parts.push(`- Punctuation: ${voiceSignature.punctuation_style}`);

  if (voiceSignature.is_question_heavy) {
    parts.push('- Communication style: Often asks questions');
  }

  if (voiceSignature.common_starters?.length > 0) {
    parts.push(`- Common starters: ${voiceSignature.common_starters.slice(0, 3).join(', ')}`);
  }

  if (voiceSignature.common_closings?.length > 0) {
    parts.push(`- Common closings: ${voiceSignature.common_closings.slice(0, 3).join(', ')}`);
  }

  parts.push('IMPORTANT: Rewrites must match this voice - same formality, sentence structure, and style.');

  return parts.join('\n');
}

module.exports = {
  extractVoiceFromMessage,
  buildVoiceSignature,
  getDefaultVoiceSignature,
  mergeVoiceSignature,
  formatVoiceSignatureForAI,
};








