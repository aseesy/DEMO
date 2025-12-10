/**
 * Assessment Generator Module
 *
 * Generates the final assessment including:
 * - Conflict potential (low/moderate/high)
 * - Attack surface (character, competence, autonomy, parenting)
 * - Child as instrument detection
 * - Deniability level
 * - Transmission decision (whether message can pass without AI)
 *
 * @module codeLayer/assessmentGen
 * @version 1.0.0
 */

'use strict';

const { CONFLICT_LEVELS, TARGETS, AIMS, AXIOM_CATEGORIES } = require('./types');

// ============================================================================
// RISK CONFIGURATION
// ============================================================================

/**
 * High-risk axiom IDs that automatically trigger high conflict potential
 */
const HIGH_RISK_AXIOMS = new Set([
  'AXIOM_001', // Displaced Accusation
  'AXIOM_010', // Child as Messenger
  'AXIOM_016', // Hypothetical Accusation
  'AXIOM_004', // Weaponized Agreement
]);

/**
 * Moderate-risk axiom IDs
 */
const MODERATE_RISK_AXIOMS = new Set([
  'AXIOM_002', // False Offering
  'AXIOM_003', // Innocent Inquiry
  'AXIOM_005', // Virtuous Self-Reference
  'AXIOM_007', // Pre-emptive Denial
  'AXIOM_008', // Reluctant Compliance
  'AXIOM_012', // Concerned Question
]);

/**
 * Clean axiom IDs that indicate safe messages
 */
const CLEAN_AXIOMS = new Set([
  'AXIOM_D001', // Clean Request
  'AXIOM_D002', // Clean Information
]);

/**
 * High-risk targets (attacking these is more harmful)
 */
const HIGH_RISK_TARGETS = new Set([
  TARGETS.CHARACTER,
  TARGETS.PARENTING,
]);

/**
 * Attack surfaces map target types
 */
const ATTACK_SURFACE_TARGETS = new Set([
  TARGETS.CHARACTER,
  TARGETS.COMPETENCE,
  TARGETS.AUTONOMY,
  TARGETS.PARENTING,
]);

// ============================================================================
// ASSESSMENT FUNCTIONS
// ============================================================================

/**
 * Determine conflict potential based on axioms, vector, and markers
 * @param {Object} params - Assessment parameters
 * @param {AxiomResult[]} params.axiomsFired - Axioms that matched
 * @param {Object} params.vector - Communication vector
 * @param {Object} params.markers - Marker detection result
 * @returns {'low'|'moderate'|'high'} - Conflict potential level
 */
function determineConflictPotential({ axiomsFired = [], vector = {}, markers = {} }) {
  // Check for high-risk axioms
  const hasHighRiskAxiom = axiomsFired.some(a => HIGH_RISK_AXIOMS.has(a.id));
  if (hasHighRiskAxiom) {
    return CONFLICT_LEVELS.HIGH;
  }

  // Check for attack aim with high-risk target
  if (vector.aim === AIMS.ATTACK && HIGH_RISK_TARGETS.has(vector.target)) {
    return CONFLICT_LEVELS.HIGH;
  }

  // Check for child as instrument with negative intent
  if (vector.instrument === 'child' && (vector.aim === AIMS.ATTACK || vector.aim === AIMS.CONTROL)) {
    return CONFLICT_LEVELS.HIGH;
  }

  // Check for moderate-risk axioms
  const hasModerateRiskAxiom = axiomsFired.some(a => MODERATE_RISK_AXIOMS.has(a.id));
  if (hasModerateRiskAxiom) {
    return CONFLICT_LEVELS.MODERATE;
  }

  // Check marker patterns that suggest moderate conflict
  if (markers.patternMarkers && markers.patternMarkers.length > 0) {
    const hasBlameOrGlobal = markers.patternMarkers.some(m =>
      m.type === 'blame' || m.type === 'global_statement' || m.type === 'character_attack'
    );
    if (hasBlameOrGlobal) {
      return CONFLICT_LEVELS.MODERATE;
    }
  }

  // Check for multiple intensifiers (sign of heated language)
  if (markers.intensifiers && markers.intensifiers.length >= 2) {
    return CONFLICT_LEVELS.MODERATE;
  }

  // Check for attack aim (even without high-risk target)
  if (vector.aim === AIMS.ATTACK) {
    return CONFLICT_LEVELS.MODERATE;
  }

  // Default to low conflict
  return CONFLICT_LEVELS.LOW;
}

/**
 * Determine attack surfaces from vector
 * @param {Object} vector - Communication vector
 * @returns {string[]} - Array of attack surfaces
 */
function determineAttackSurface(vector = {}) {
  const surfaces = [];

  // Only include if there's an actual target
  if (ATTACK_SURFACE_TARGETS.has(vector.target)) {
    surfaces.push(vector.target);
  }

  return surfaces;
}

/**
 * Determine if child is being used as instrument
 * @param {Object} vector - Communication vector
 * @param {Object} conceptual - Conceptual primitives
 * @param {AxiomResult[]} axiomsFired - Axioms that matched
 * @returns {boolean} - True if child is being used as instrument
 */
function determineChildAsInstrument(vector = {}, conceptual = {}, axiomsFired = []) {
  // Direct check from vector
  if (vector.instrument === 'child') {
    return true;
  }

  // Check if child-related axioms fired
  const childAxioms = ['AXIOM_001', 'AXIOM_010', 'AXIOM_012'];
  if (axiomsFired.some(a => childAxioms.includes(a.id))) {
    return true;
  }

  // Check if there's negative intent + third party references
  if (
    (vector.aim === AIMS.ATTACK || vector.aim === AIMS.CONTROL) &&
    conceptual.thirdParty &&
    conceptual.thirdParty.length > 0
  ) {
    // Check if third party includes child terms
    const childTerms = ['she', 'he', 'they', 'kids', 'children', 'daughter', 'son'];
    const hasChildReference = conceptual.thirdParty.some(ref =>
      childTerms.some(term => ref.includes(term))
    );
    if (hasChildReference) {
      return true;
    }
  }

  return false;
}

/**
 * Determine deniability level based on softeners and framing
 * @param {Object} markers - Marker detection result
 * @param {AxiomResult[]} axiomsFired - Axioms that matched
 * @returns {'low'|'high'} - Deniability level
 */
function determineDeniability(markers = {}, axiomsFired = []) {
  // High deniability if softeners present
  if (markers.softeners && markers.softeners.length > 0) {
    return 'high';
  }

  // High deniability for indirect communication axioms
  const indirectAxioms = axiomsFired.filter(a => a.category === AXIOM_CATEGORIES.INDIRECT_COMMUNICATION);
  if (indirectAxioms.length > 0) {
    return 'high';
  }

  // High deniability if using questions (rhetorical or otherwise)
  if (markers.patternMarkers) {
    const hasQuestion = markers.patternMarkers.some(m => m.type === 'rhetorical_question');
    if (hasQuestion) {
      return 'high';
    }
  }

  return 'low';
}

/**
 * Determine if message can be transmitted without AI intervention
 * @param {Object} params - Assessment parameters
 * @param {AxiomResult[]} params.axiomsFired - Axioms that matched
 * @param {string} params.conflictPotential - Conflict potential level
 * @param {Object} params.markers - Marker detection result
 * @returns {boolean} - True if message can pass without AI
 */
function determineTransmit({ axiomsFired = [], conflictPotential, markers = {} }) {
  // If conflict potential is high, always needs AI review
  if (conflictPotential === CONFLICT_LEVELS.HIGH) {
    return false;
  }

  // If only clean axioms fired (or no axioms), can transmit
  const hasNonCleanAxiom = axiomsFired.some(a => !CLEAN_AXIOMS.has(a.id));
  if (!hasNonCleanAxiom && axiomsFired.length > 0) {
    // Only clean axioms fired
    return true;
  }

  // If no axioms fired and no concerning patterns, can transmit
  if (axiomsFired.length === 0) {
    // Check for concerning markers
    if (markers.patternMarkers && markers.patternMarkers.length > 0) {
      return false;
    }
    // Check for excessive intensifiers
    if (markers.intensifiers && markers.intensifiers.length >= 2) {
      return false;
    }
    return true;
  }

  // Default: needs AI review
  return false;
}

/**
 * Generate the final assessment
 *
 * @param {Object} params - Assessment parameters
 * @param {AxiomResult[]} params.axiomsFired - Axioms that matched
 * @param {Object} params.vector - Communication vector
 * @param {Object} params.markers - Marker detection result
 * @param {Object} params.conceptual - Conceptual primitives
 * @returns {Object} - Assessment generation result
 *
 * @example
 * generate({
 *   axiomsFired: [{ id: 'AXIOM_001', category: 'indirect_communication' }],
 *   vector: { target: 'competence', instrument: 'child', aim: 'attack' },
 *   markers: { softeners: ['just'] },
 *   conceptual: { thirdParty: ['she'] }
 * })
 * // Returns:
 * // {
 * //   assessment: {
 * //     conflictPotential: 'high',
 * //     attackSurface: ['competence'],
 * //     childAsInstrument: true,
 * //     deniability: 'high',
 * //     transmit: false
 * //   },
 * //   latencyMs: 2
 * // }
 */
function generate({ axiomsFired = [], vector = {}, markers = {}, conceptual = {} }) {
  const startTime = Date.now();

  // Determine each assessment component
  const conflictPotential = determineConflictPotential({ axiomsFired, vector, markers });
  const attackSurface = determineAttackSurface(vector);
  const childAsInstrument = determineChildAsInstrument(vector, conceptual, axiomsFired);
  const deniability = determineDeniability(markers, axiomsFired);
  const transmit = determineTransmit({ axiomsFired, conflictPotential, markers });

  const assessment = {
    conflictPotential,
    attackSurface,
    childAsInstrument,
    deniability,
    transmit
  };

  return {
    assessment,
    latencyMs: Date.now() - startTime
  };
}

// Note: getAssessmentSummary, needsIntervention, and getInterventionUrgency removed - unused

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Main function
  generate,

  // Component functions
  determineConflictPotential,
  determineAttackSurface,
  determineChildAsInstrument,
  determineDeniability,
  determineTransmit,

  // Note: getAssessmentSummary, needsIntervention, and getInterventionUrgency removed - unused

  // Configuration exports (for testing/extension)
  HIGH_RISK_AXIOMS,
  MODERATE_RISK_AXIOMS,
  CLEAN_AXIOMS,
  HIGH_RISK_TARGETS
};
