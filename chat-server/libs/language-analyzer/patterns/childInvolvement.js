/**
 * Child Involvement Pattern Detection
 *
 * Detects how children are referenced in the message:
 * mentioned, as messenger, as weapon, wellbeing cited, triangulation
 *
 * CONSTITUTION COMPLIANCE:
 * - Describes language patterns, not emotions
 * - No psychological labels
 * - Child-centric when applicable (Principle III)
 */

// Child reference markers (names would be dynamic)
const CHILD_PRONOUNS = ['she', 'he', 'they', 'her', 'him', 'them'];
const CHILD_NOUNS = ['daughter', 'son', 'kids', 'children', 'child', 'baby'];

// Child as messenger patterns
const MESSENGER_PATTERNS = [
  /\btell\s+(your|her|his)\s+(dad|mom|father|mother)\b/i,
  /\bask\s+(your|her|his)\s+(dad|mom|father|mother)\b/i,
  /\blet\s+(your|her|his)\s+(dad|mom|father|mother)\s+know\b/i,
  /\bremind\s+(your|her|his)\s+(dad|mom|father|mother)\b/i,
  /\bgive\s+this\s+to\s+(your|her|his)\s+(dad|mom|father|mother)\b/i,
];

// Child as weapon patterns (using child to attack)
const WEAPON_PATTERNS = [
  /\byou('re|'re| are)\s+(basically\s+)?(failing|hurting|damaging|ruining)\s+\w*\s*(her|him|them|the kids)\b/i,
  /\b(failing|hurting|damaging|ruining)\s+\w+\s+with\b/i, // "failing Vira with..."
  /\b(she|he|they)\s+(deserve|need)\s+better\s+than\s+you\b/i,
  /\byou('re|'re| are)\s+\w+\s+to\s+(her|him|them)\b/i,
  /\bbecause of you,?\s+(she|he|they)\b/i,
  /\b(she|he|they)\s+(hate|resent|don't like)\s+(going to|being at)\s+your\b/i,
];

// Child wellbeing cited patterns (legitimate concern)
const WELLBEING_PATTERNS = [
  /\bfor\s+(her|his|their)\s+(sake|wellbeing|benefit|good)\b/i,
  /\bwhat's\s+best\s+for\s+(her|him|them|the kids)\b/i,
  /\bin\s+(her|his|their)\s+best\s+interest\b/i,
  /\b(she|he|they)\s+(need|deserve)\s+\w+\b/i,
  /\bconcerned\s+about\s+(her|him|them)\b/i,
  /\bworried\s+about\s+(her|him|them)\b/i,
];

// Triangulation patterns (playing child against parent)
const TRIANGULATION_PATTERNS = [
  /\b(she|he|they)\s+said\s+(you|your)\b/i,
  /\b(she|he|they)\s+told\s+me\s+(you|that you|about)\b/i,
  /\b(she|he|they)\s+(like|prefer|enjoy)\s+(it|being)\s+(better\s+)?(at|with)\s+(my|me)\b/i,
  /\b(she|he|they)\s+don't\s+want\s+to\s+(go|be)\s+(to|at|with)\s+your\b/i,
  /\beven\s+(she|he|they)\s+(know|think|said)\b/i,
  /\b(she|he|they)\s+(asked|begged)\s+not\s+to\s+go\b/i,
];

// Quote patterns (child's words being cited)
const QUOTE_PATTERNS = [
  /\b(she|he|they)\s+said\s+"[^"]+"/i,
  /\b(she|he|they)\s+asked\s+"[^"]+"/i,
  /"[^"]+"[,\s]+(she|he|they)\s+said/i,
];

/**
 * Detect child involvement patterns in text
 * @param {string} text - Message text to analyze
 * @param {string[]} childNames - Optional array of child names to detect
 * @returns {Object} Pattern detection results
 */
function detect(text, childNames = []) {
  const lowerText = text.toLowerCase();

  // Check if child is mentioned at all
  const hasChildPronoun = CHILD_PRONOUNS.some(p => new RegExp(`\\b${p}\\b`, 'i').test(text));
  const hasChildNoun = CHILD_NOUNS.some(n => lowerText.includes(n));
  const hasChildName = childNames.some(name => lowerText.includes(name.toLowerCase()));
  const childMentioned = hasChildPronoun || hasChildNoun || hasChildName;

  // Check for messenger pattern
  const hasMessengerPattern = MESSENGER_PATTERNS.some(p => p.test(text));

  // Check for weapon pattern
  const hasWeaponPattern = WEAPON_PATTERNS.some(p => p.test(text));

  // Check for wellbeing pattern
  const hasWellbeingPattern = WELLBEING_PATTERNS.some(p => p.test(text));

  // Check for triangulation pattern
  const hasTriangulationPattern = TRIANGULATION_PATTERNS.some(p => p.test(text));

  // Check for direct quotes from child
  const hasChildQuote = QUOTE_PATTERNS.some(p => p.test(text));

  // Determine if child is being used problematically
  const problematicChildUse = hasMessengerPattern || hasWeaponPattern || hasTriangulationPattern;

  return {
    child_mentioned: childMentioned,
    child_as_messenger: hasMessengerPattern,
    child_as_weapon: hasWeaponPattern,
    child_wellbeing_cited: hasWellbeingPattern,
    child_triangulation: hasTriangulationPattern,
    child_quote_used: hasChildQuote,
    problematic_child_reference: problematicChildUse,
  };
}

/**
 * Get summary observations for child involvement patterns
 * @param {Object} patterns - Pattern detection results
 * @returns {string[]} Array of factual observations
 */
function summarize(patterns) {
  const observations = [];

  if (!patterns.child_mentioned) {
    // No child involvement, nothing to report
    return observations;
  }

  observations.push('Child referenced in message');

  if (patterns.child_as_messenger) {
    observations.push('Uses child as messenger to other parent');
  }

  if (patterns.child_as_weapon) {
    observations.push('Links evaluation to child to strengthen attack');
  }

  if (patterns.child_triangulation) {
    observations.push("Triangulation: cites child's preferences/statements against other parent");
  }

  if (patterns.child_quote_used) {
    observations.push('Quotes child directly');
  }

  if (patterns.child_wellbeing_cited && !patterns.problematic_child_reference) {
    observations.push("References child's wellbeing appropriately");
  }

  if (patterns.problematic_child_reference) {
    observations.push('Child reference may put child in difficult position');
  }

  return observations;
}

module.exports = {
  detect,
  summarize,
  MESSENGER_PATTERNS,
  WEAPON_PATTERNS,
  WELLBEING_PATTERNS,
  TRIANGULATION_PATTERNS,
};
