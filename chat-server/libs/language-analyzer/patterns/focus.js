/**
 * Focus Type Pattern Detection
 *
 * Detects what the message is focused on:
 * logistics, character, child, relationship, past, future
 *
 * CONSTITUTION COMPLIANCE:
 * - Describes language patterns, not emotions
 * - No psychological labels
 */

// Logistics-focused markers
const LOGISTICS_MARKERS = [
  'pickup', 'pick up', 'drop off', 'dropoff',
  'schedule', 'time', 'date', 'day',
  'swap', 'switch', 'change', 'reschedule',
  'meeting', 'appointment', 'practice', 'game',
  'school', 'work', 'doctor', 'dentist'
];

// Character-focused markers (about the person)
const CHARACTER_MARKERS = [
  'you\'re', 'you are', 'you\'ve always been',
  'that\'s so you', 'typical', 'of course you',
  'you would', 'you couldn\'t', 'you can\'t',
  'your problem', 'your issue', 'your fault'
];

// Child-focused markers
const CHILD_FOCUSED_MARKERS = [
  'for her', 'for him', 'for the kids', 'for them',
  'she needs', 'he needs', 'they need',
  'her wellbeing', 'his wellbeing', 'their wellbeing',
  'best for', 'what\'s best', 'in their interest'
];

// Relationship-focused markers
const RELATIONSHIP_MARKERS = [
  'we need to', 'between us', 'our communication',
  'how we', 'the way we', 'together',
  'co-parent', 'as parents', 'as a team'
];

// Past-focused markers
const PAST_MARKERS = [
  'last time', 'last week', 'last month', 'last year',
  'remember when', 'you did', 'you said',
  'back when', 'before', 'used to',
  'always have', 'never have', 'have always'
];

// Future-focused markers
const FUTURE_MARKERS = [
  'going forward', 'from now on', 'in the future',
  'next time', 'next week', 'next month',
  'can we', 'could we', 'will you',
  'moving forward', 'let\'s', 'we should'
];

/**
 * Detect focus type patterns in text
 * @param {string} text - Message text to analyze
 * @returns {Object} Pattern detection results
 */
function detect(text) {
  const lowerText = text.toLowerCase();

  // Count markers for each focus type
  const logisticsCount = LOGISTICS_MARKERS.filter(m => lowerText.includes(m)).length;
  const characterCount = CHARACTER_MARKERS.filter(m => lowerText.includes(m)).length;
  const childCount = CHILD_FOCUSED_MARKERS.filter(m => lowerText.includes(m)).length;
  const relationshipCount = RELATIONSHIP_MARKERS.filter(m => lowerText.includes(m)).length;
  const pastCount = PAST_MARKERS.filter(m => lowerText.includes(m)).length;
  const futureCount = FUTURE_MARKERS.filter(m => lowerText.includes(m)).length;

  // Determine primary focus
  const counts = {
    logistics: logisticsCount,
    character: characterCount,
    child: childCount,
    relationship: relationshipCount,
    past: pastCount,
    future: futureCount
  };

  // Find dominant focus (could be multiple)
  const maxCount = Math.max(...Object.values(counts));

  return {
    logistics_focused: logisticsCount > 0 && logisticsCount >= maxCount,
    character_focused: characterCount > 0 && characterCount >= maxCount,
    child_focused: childCount > 0,
    relationship_focused: relationshipCount > 0,
    past_focused: pastCount > 0,
    future_focused: futureCount > 0,
    focus_counts: counts,
    primary_focus: Object.keys(counts).find(k => counts[k] === maxCount && maxCount > 0) || 'unclear'
  };
}

/**
 * Get summary observations for focus patterns
 * @param {Object} patterns - Pattern detection results
 * @returns {string[]} Array of factual observations
 */
function summarize(patterns) {
  const observations = [];

  if (patterns.logistics_focused) {
    observations.push('Focused on logistics/scheduling');
  }
  if (patterns.character_focused) {
    observations.push('Focused on other parent\'s character');
  }
  if (patterns.child_focused) {
    observations.push('References child\'s needs/wellbeing');
  }
  if (patterns.relationship_focused) {
    observations.push('Focused on co-parenting relationship');
  }
  if (patterns.past_focused && !patterns.future_focused) {
    observations.push('Focused on past grievances');
  }
  if (patterns.future_focused) {
    observations.push('Forward-looking/solution-oriented');
  }
  if (patterns.primary_focus === 'unclear') {
    observations.push('Focus is unclear');
  }

  return observations;
}

module.exports = {
  detect,
  summarize,
  LOGISTICS_MARKERS,
  CHARACTER_MARKERS,
  CHILD_FOCUSED_MARKERS,
  RELATIONSHIP_MARKERS,
  PAST_MARKERS,
  FUTURE_MARKERS
};
