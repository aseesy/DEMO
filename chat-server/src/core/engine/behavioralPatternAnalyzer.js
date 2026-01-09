/**
 * Behavioral Pattern Analyzer
 *
 * Identifies behavioral patterns in messages beyond structural axioms.
 * Maps axioms to behavioral patterns and detects additional patterns.
 *
 * Behavioral patterns describe WHAT the sender is doing behaviorally:
 * - Making assumptions vs asking questions
 * - Avoiding responsibility vs taking ownership
 * - Character attacks vs behavior focus
 * - Triangulation vs direct communication
 * - Escalation vs de-escalation
 * - Emotional dumping vs structured expression
 *
 * @module liaizen/core/behavioralPatternAnalyzer
 * @version 1.0.0
 */

'use strict';

const { defaultLogger } = require('../../infrastructure/logging/logger');

const logger = defaultLogger.child({ module: 'behavioralPatternAnalyzer' });

// ============================================================================
// BEHAVIORAL PATTERN DEFINITIONS
// ============================================================================

/**
 * Behavioral pattern types
 */
const BEHAVIORAL_PATTERNS = {
  MAKING_ASSUMPTIONS: {
    id: 'MAKING_ASSUMPTIONS',
    name: 'Making Assumptions',
    description: 'Assumes intent, pattern, or state without asking or checking',
    alternative: 'Asking questions to understand',
  },
  AVOIDING_RESPONSIBILITY: {
    id: 'AVOIDING_RESPONSIBILITY',
    name: 'Avoiding Responsibility',
    description: 'Shifts blame or avoids accountability',
    alternative: "Taking ownership of one's part",
  },
  CHARACTER_ATTACK: {
    id: 'CHARACTER_ATTACK',
    name: 'Character Attack',
    description: "Attacks the person's character rather than addressing behavior",
    alternative: 'Focusing on specific behaviors',
  },
  TRIANGULATION: {
    id: 'TRIANGULATION',
    name: 'Triangulation',
    description: 'Uses third party (child, other person) as messenger or weapon',
    alternative: 'Direct communication',
  },
  ESCALATION: {
    id: 'ESCALATION',
    name: 'Escalation',
    description: 'Uses threats, ultimatums, or absolutes that increase conflict',
    alternative: 'De-escalation and problem-solving',
  },
  EMOTIONAL_DUMPING: {
    id: 'EMOTIONAL_DUMPING',
    name: 'Emotional Dumping',
    description: 'Expresses raw emotion without structure or focus',
    alternative: 'Structured expression of needs',
  },
};

// ============================================================================
// AXIOM TO BEHAVIORAL PATTERN MAPPING
// ============================================================================

/**
 * Maps axiom IDs to behavioral patterns
 * An axiom can map to multiple behavioral patterns
 */
const AXIOM_TO_PATTERN_MAP = {
  // Direct Hostility Axioms
  AXIOM_D101: [BEHAVIORAL_PATTERNS.CHARACTER_ATTACK], // Direct Insult
  AXIOM_D102: [BEHAVIORAL_PATTERNS.ESCALATION], // Threat/Ultimatum

  // Indirect Communication Axioms
  AXIOM_001: [BEHAVIORAL_PATTERNS.TRIANGULATION, BEHAVIORAL_PATTERNS.AVOIDING_RESPONSIBILITY], // Displaced Accusation (uses child)
  AXIOM_004: [BEHAVIORAL_PATTERNS.MAKING_ASSUMPTIONS], // Weaponized Agreement
  AXIOM_010: [BEHAVIORAL_PATTERNS.TRIANGULATION, BEHAVIORAL_PATTERNS.AVOIDING_RESPONSIBILITY], // Child as Messenger

  // Clean Axioms (no problematic behavioral patterns)
  AXIOM_D001: [], // Clean Request
  AXIOM_D002: [], // Clean Information
};

// ============================================================================
// ADDITIONAL PATTERN DETECTION (Beyond Axioms)
// ============================================================================

/**
 * Detect "making assumptions" patterns
 * Assumes intent, pattern, or state without asking
 */
function detectMakingAssumptions(parsed) {
  const text = parsed.raw.toLowerCase();
  const patterns = [];

  // Assumes intent without asking
  if (/\b(you\s+(always|never|don't|won't|can't))\b/i.test(text) && !/\?/.test(text)) {
    patterns.push({
      pattern: BEHAVIORAL_PATTERNS.MAKING_ASSUMPTIONS,
      confidence: 75,
      evidence: 'Assumes pattern (always/never) without asking',
      example: text.match(/\b(you\s+(always|never|don't|won't|can't)).{0,30}/i)?.[0],
    });
  }

  // Assumes emotional state
  if (
    /\b(you'?re|you\s+are)\s+(angry|upset|frustrated|mad|pissed|hurt|sad|disappointed)\b/i.test(
      text
    ) &&
    !/\?/.test(text)
  ) {
    patterns.push({
      pattern: BEHAVIORAL_PATTERNS.MAKING_ASSUMPTIONS,
      confidence: 80,
      evidence: 'Assumes emotional state without asking',
      example: text.match(
        /\b(you'?re|you\s+are)\s+(angry|upset|frustrated|mad|pissed|hurt|sad|disappointed).{0,30}/i
      )?.[0],
    });
  }

  // Assumes intent ("you're trying to...", "you want to...")
  if (
    /\b(you'?re\s+trying\s+to|you\s+want\s+to|you\s+intend\s+to|you\s+mean\s+to)\b/i.test(text) &&
    !/\?/.test(text)
  ) {
    patterns.push({
      pattern: BEHAVIORAL_PATTERNS.MAKING_ASSUMPTIONS,
      confidence: 70,
      evidence: 'Assumes intent without asking',
      example: text.match(
        /\b(you'?re\s+trying\s+to|you\s+want\s+to|you\s+intend\s+to|you\s+mean\s+to).{0,30}/i
      )?.[0],
    });
  }

  return patterns;
}

/**
 * Detect "avoiding responsibility" patterns
 * Shifts blame or avoids accountability
 */
function detectAvoidingResponsibility(parsed) {
  const text = parsed.raw.toLowerCase();
  const patterns = [];

  // "It's YOUR fault" / "You made me"
  if (/\b(it'?s|it\s+is)\s+(your|all\s+your)\s+fault\b/i.test(text)) {
    patterns.push({
      pattern: BEHAVIORAL_PATTERNS.AVOIDING_RESPONSIBILITY,
      confidence: 85,
      evidence: 'Shifts all blame to receiver',
      example: text.match(/\b(it'?s|it\s+is)\s+(your|all\s+your)\s+fault.{0,30}/i)?.[0],
    });
  }

  // "You made me do this"
  if (/\byou\s+made\s+me\b/i.test(text)) {
    patterns.push({
      pattern: BEHAVIORAL_PATTERNS.AVOIDING_RESPONSIBILITY,
      confidence: 80,
      evidence: 'Avoids accountability by blaming receiver',
      example: text.match(/\byou\s+made\s+me.{0,30}/i)?.[0],
    });
  }

  // "If you hadn't..."
  if (/\bif\s+you\s+hadn'?t\b/i.test(text) && !/\?/.test(text)) {
    patterns.push({
      pattern: BEHAVIORAL_PATTERNS.AVOIDING_RESPONSIBILITY,
      confidence: 70,
      evidence: 'Hypothetical blame-shifting',
      example: text.match(/\bif\s+you\s+hadn'?t.{0,30}/i)?.[0],
    });
  }

  return patterns;
}

/**
 * Detect "character attack" patterns
 * Attacks person's character rather than behavior
 */
function detectCharacterAttack(parsed) {
  const text = parsed.raw.toLowerCase();
  const patterns = [];

  // Already detected by AXIOM_D101, but check for additional patterns
  // Character labels without behavior focus
  if (
    /\b(you'?re|you\s+are)\s+(a\s+)?(pathetic|sad|crazy|insane|stupid|selfish|terrible|awful|horrible|worthless|useless|incompetent|irresponsible|lazy)\b/i.test(
      text
    )
  ) {
    patterns.push({
      pattern: BEHAVIORAL_PATTERNS.CHARACTER_ATTACK,
      confidence: 90,
      evidence: 'Direct character attack',
      example: text.match(
        /\b(you'?re|you\s+are)\s+(a\s+)?(pathetic|sad|crazy|insane|stupid|selfish|terrible|awful|horrible|worthless|useless|incompetent|irresponsible|lazy).{0,30}/i
      )?.[0],
    });
  }

  return patterns;
}

/**
 * Detect "triangulation" patterns
 * Uses third party as messenger or weapon
 */
function detectTriangulation(parsed) {
  const text = parsed.raw.toLowerCase();
  const patterns = [];

  // Already detected by AXIOM_001 and AXIOM_010, but check for additional patterns
  // "Everyone thinks..." / "People say..."
  if (/\b(everyone|people|they|others)\s+(think|say|believe|know)\b/i.test(text)) {
    patterns.push({
      pattern: BEHAVIORAL_PATTERNS.TRIANGULATION,
      confidence: 75,
      evidence: 'Uses third parties to deliver message',
      example: text.match(
        /\b(everyone|people|they|others)\s+(think|say|believe|know).{0,30}/i
      )?.[0],
    });
  }

  // "Tell your [parent]..."
  if (/\btell\s+(your|the)\s+(mom|dad|mother|father|parent)\b/i.test(text)) {
    patterns.push({
      pattern: BEHAVIORAL_PATTERNS.TRIANGULATION,
      confidence: 85,
      evidence: 'Uses child as messenger',
      example: text.match(/\btell\s+(your|the)\s+(mom|dad|mother|father|parent).{0,30}/i)?.[0],
    });
  }

  return patterns;
}

/**
 * Detect "escalation" patterns
 * Uses threats, ultimatums, or absolutes
 */
function detectEscalation(parsed) {
  const text = parsed.raw.toLowerCase();
  const patterns = [];

  // Already detected by AXIOM_D102, but check for additional patterns
  // Absolute statements (always, never) in accusatory context
  if (
    /\b(you\s+(always|never|every|all\s+the\s+time))\b/i.test(text) &&
    parsed.linguistic?.intensifiers?.length > 0
  ) {
    patterns.push({
      pattern: BEHAVIORAL_PATTERNS.ESCALATION,
      confidence: 70,
      evidence: 'Uses absolutes that escalate conflict',
      example: text.match(/\b(you\s+(always|never|every|all\s+the\s+time)).{0,30}/i)?.[0],
    });
  }

  return patterns;
}

/**
 * Detect "emotional dumping" patterns
 * Raw emotion without structure or focus
 */
function detectEmotionalDumping(parsed) {
  const text = parsed.raw.toLowerCase();
  const patterns = [];

  // Multiple emotional statements without structure
  const emotionalWords = [
    'angry',
    'furious',
    'mad',
    'pissed',
    'livid',
    'hurt',
    'disappointed',
    'betrayed',
    'sad',
    'upset',
    'frustrated',
    'devastated',
  ];
  const emotionalCount = emotionalWords.filter(word => text.includes(word)).length;

  // Multiple issues mentioned without focus
  const issueMarkers = [
    /\band\s+(then|also|plus|on\s+top\s+of\s+that)\b/gi,
    /\b(not\s+only|but\s+also)\b/gi,
  ];
  const issueCount = issueMarkers.reduce(
    (count, pattern) => count + (text.match(pattern)?.length || 0),
    0
  );

  if (emotionalCount >= 3 || (emotionalCount >= 2 && issueCount >= 2)) {
    patterns.push({
      pattern: BEHAVIORAL_PATTERNS.EMOTIONAL_DUMPING,
      confidence: 75,
      evidence: 'Multiple emotional statements without structure',
      example: text.substring(0, 100),
    });
  }

  return patterns;
}

// ============================================================================
// MAIN ANALYZER FUNCTION
// ============================================================================

/**
 * Analyze behavioral patterns in a parsed message
 *
 * @param {Object} parsed - ParsedMessage from Code Layer
 * @returns {Object} Behavioral pattern analysis
 * @returns {Object[]} patterns - Array of detected behavioral patterns
 * @returns {Object} primaryPattern - The most significant pattern (highest confidence)
 * @returns {Object} meta - Metadata about the analysis
 */
function analyzeBehavioralPatterns(parsed) {
  if (!parsed || !parsed.raw) {
    return {
      patterns: [],
      primaryPattern: null,
      meta: {
        error: 'Invalid parsed message',
      },
    };
  }

  const detectedPatterns = [];
  const startTime = Date.now();

  // 1. Map axioms to behavioral patterns
  if (parsed.axiomsFired && parsed.axiomsFired.length > 0) {
    for (const axiom of parsed.axiomsFired) {
      const patternIds = AXIOM_TO_PATTERN_MAP[axiom.id] || [];
      for (const pattern of patternIds) {
        // Avoid duplicates
        if (!detectedPatterns.find(p => p.pattern.id === pattern.id)) {
          detectedPatterns.push({
            pattern,
            confidence: axiom.confidence || 80, // Use axiom confidence
            evidence: `Detected via ${axiom.name} (${axiom.id})`,
            source: 'axiom',
            axiomId: axiom.id,
          });
        }
      }
    }
  }

  // 2. Detect additional patterns beyond axioms
  const additionalPatterns = [
    ...detectMakingAssumptions(parsed),
    ...detectAvoidingResponsibility(parsed),
    ...detectCharacterAttack(parsed),
    ...detectTriangulation(parsed),
    ...detectEscalation(parsed),
    ...detectEmotionalDumping(parsed),
  ];

  // Merge additional patterns (avoid duplicates)
  for (const additionalPattern of additionalPatterns) {
    const existing = detectedPatterns.find(p => p.pattern.id === additionalPattern.pattern.id);
    if (existing) {
      // Update confidence if higher
      if (additionalPattern.confidence > existing.confidence) {
        existing.confidence = additionalPattern.confidence;
        existing.evidence = additionalPattern.evidence;
        existing.example = additionalPattern.example;
      }
    } else {
      detectedPatterns.push({
        ...additionalPattern,
        source: 'pattern_detection',
      });
    }
  }

  // Sort by confidence (highest first)
  detectedPatterns.sort((a, b) => b.confidence - a.confidence);

  // Get primary pattern (highest confidence)
  const primaryPattern = detectedPatterns.length > 0 ? detectedPatterns[0] : null;

  const latencyMs = Date.now() - startTime;

  logger.debug('Behavioral pattern analysis complete', {
    patternsDetected: detectedPatterns.length,
    primaryPattern: primaryPattern?.pattern?.id,
    latencyMs,
  });

  return {
    patterns: detectedPatterns,
    primaryPattern,
    meta: {
      totalDetected: detectedPatterns.length,
      latencyMs,
      sources: {
        fromAxioms: detectedPatterns.filter(p => p.source === 'axiom').length,
        fromDetection: detectedPatterns.filter(p => p.source === 'pattern_detection').length,
      },
    },
  };
}

/**
 * Get behavioral pattern by ID
 *
 * @param {string} patternId - Pattern ID (e.g., 'MAKING_ASSUMPTIONS')
 * @returns {Object|null} Behavioral pattern definition or null
 */
function getBehavioralPattern(patternId) {
  return Object.values(BEHAVIORAL_PATTERNS).find(p => p.id === patternId) || null;
}

/**
 * List all available behavioral patterns
 *
 * @returns {Object[]} Array of all behavioral pattern definitions
 */
function listAllBehavioralPatterns() {
  return Object.values(BEHAVIORAL_PATTERNS);
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Main analyzer
  analyzeBehavioralPatterns,

  // Pattern definitions
  BEHAVIORAL_PATTERNS,
  getBehavioralPattern,
  listAllBehavioralPatterns,

  // Axiom mapping (for reference)
  AXIOM_TO_PATTERN_MAP,
};
