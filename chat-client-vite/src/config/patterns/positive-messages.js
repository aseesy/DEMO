/**
 * Positive Message Patterns
 *
 * Positive sentiment patterns (never mediate friendly messages).
 * Used for quick local checks before full AI analysis.
 *
 * Note: These patterns match the backend patterns for consistency.
 */

export const POSITIVE_PATTERNS = [
  /\b(you'?re|you are)\s+(my\s+)?(friend|best|great|awesome|amazing|wonderful|the best|so kind|so helpful|so great|incredible|fantastic)\b/i,
  /\b(love|appreciate|thankful|grateful)\s+(you|that|this)\b/i,
  /\b(thank|thanks)\s+(you|so much|for)\b/i,
  /\b(good job|well done|nice work|great work|great job)\b/i,
  /\bI\s+(love|appreciate|value|admire|respect)\s+(you|this|that|our)\b/i,
  /\b(you'?re|you are)\s+(doing\s+)?(great|well|good|amazing|awesome)\b/i,
  /\b(miss|missed)\s+you\b/i,
  /\b(proud of|happy for)\s+you\b/i,
  /\byou('?re| are)\s+a\s+(great|good|wonderful|amazing)\s+(parent|dad|mom|father|mother|person)\b/i,
  /\b(I\s+)?love\s+(how|when|that)\s+you\b/i,
  /\b(I\s+)?love\s+(it|this)\s+when\s+you\b/i,
  /\byou\s+(make|made)\s+me\s+(happy|smile|laugh|feel\s+(good|better|loved|special))\b/i,
  /\b(you'?re|you are)\s+(so\s+)?(sweet|kind|thoughtful|caring|supportive|helpful)\b/i,
];
