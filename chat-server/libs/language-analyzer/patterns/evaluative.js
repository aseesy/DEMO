/**
 * Evaluative vs Descriptive Pattern Detection
 *
 * Detects whether language evaluates/judges the person
 * vs describes actions/observations.
 *
 * CONSTITUTION COMPLIANCE:
 * - Describes language patterns, not emotions
 * - No psychological labels
 */

// Character evaluation markers (judging the person)
const CHARACTER_EVALUATORS = [
  'bad parent', 'terrible parent', 'awful parent', 'worst parent',
  'great parent', 'good parent', 'perfect parent', 'best parent',
  'irresponsible', 'responsible', 'reliable', 'unreliable',
  'selfish', 'selfless', 'lazy', 'careless', 'thoughtless',
  'incompetent', 'useless', 'worthless', 'pathetic'
];

// Competence evaluation markers (judging ability)
const COMPETENCE_EVALUATORS = [
  'failing', 'fail at', 'can\'t handle', 'incapable',
  'don\'t know how', 'have no idea', 'clueless',
  'doing great', 'doing well', 'handling it',
  'messing up', 'screwing up', 'ruining'
];

// Descriptive action verbs (neutral observations)
const DESCRIPTIVE_MARKERS = [
  'picked up', 'dropped off', 'forgot', 'remembered',
  'said', 'mentioned', 'told me', 'asked',
  'was late', 'was early', 'arrived', 'left',
  'packed', 'didn\'t pack', 'brought', 'didn\'t bring'
];

/**
 * Detect evaluative vs descriptive patterns in text
 * @param {string} text - Message text to analyze
 * @returns {Object} Pattern detection results
 */
function detect(text) {
  const lowerText = text.toLowerCase();

  // Check for character evaluations
  const hasCharacterEval = CHARACTER_EVALUATORS.some(marker =>
    lowerText.includes(marker)
  );

  // Check for competence evaluations
  const hasCompetenceEval = COMPETENCE_EVALUATORS.some(marker =>
    lowerText.includes(marker)
  );

  // Specific patterns for character attacks
  const hasYouAreJudgment = /\byou('re|'re| are)\s+(so\s+)?(a\s+)?\w*(bad|terrible|awful|selfish|lazy|irresponsible|incompetent|pathetic|useless)\b/i.test(text);

  // Check for descriptive action language
  const hasDescriptiveAction = DESCRIPTIVE_MARKERS.some(marker =>
    lowerText.includes(marker)
  );

  // Check for observational language
  const hasDescriptiveObservation =
    /\b(she|he|they)\s+(seemed?|appeared?|looked?|was|were)\s+\w+/i.test(text) ||
    /\bi\s+(noticed|saw|observed|heard)\b/i.test(text);

  // Detect "you're a [label]" pattern
  const hasLabelingPattern = /\byou('re|'re| are)\s+(a\s+)?\w+\s+(parent|person|dad|mom|father|mother)\b/i.test(text);

  return {
    evaluative_character: hasCharacterEval || hasYouAreJudgment || hasLabelingPattern,
    evaluative_competence: hasCompetenceEval,
    descriptive_action: hasDescriptiveAction,
    descriptive_observation: hasDescriptiveObservation
  };
}

/**
 * Get summary observations for evaluative/descriptive patterns
 * @param {Object} patterns - Pattern detection results
 * @returns {string[]} Array of factual observations
 */
function summarize(patterns) {
  const observations = [];

  if (patterns.evaluative_character) {
    observations.push('Contains character evaluation/judgment');
  }
  if (patterns.evaluative_competence) {
    observations.push('Evaluates competence or ability');
  }
  if (patterns.descriptive_action) {
    observations.push('Describes specific actions');
  }
  if (patterns.descriptive_observation) {
    observations.push('Uses observational language');
  }
  if (!patterns.descriptive_action && !patterns.descriptive_observation &&
      (patterns.evaluative_character || patterns.evaluative_competence)) {
    observations.push('Evaluation without supporting description');
  }

  return observations;
}

module.exports = {
  detect,
  summarize,
  CHARACTER_EVALUATORS,
  COMPETENCE_EVALUATORS,
  DESCRIPTIVE_MARKERS
};
