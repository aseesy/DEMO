/**
 * Axiom Registry
 *
 * Central registry for all Axioms in the Hybrid Mediation Engine.
 * Organizes axioms by category and provides the checkAll() orchestrator.
 *
 * Categories:
 * - indirect_communication: Patterns that disguise hostile intent
 * - contextual: Context-dependent patterns (new partner, income, etc.)
 * - clean: Patterns that indicate safe, constructive communication
 *
 * @module codeLayer/axioms
 * @version 1.0.0
 */

'use strict';

const { AXIOM_CATEGORIES } = require('../types');

// ============================================================================
// AXIOM IMPORTS
// ============================================================================

// Indirect Communication Axioms (hostile patterns with deniability)
const displacedAccusation = require('./indirect/displacedAccusation');
const weaponizedAgreement = require('./indirect/weaponizedAgreement');
const childAsMessenger = require('./indirect/childAsMessenger');

// Direct Hostility Axioms (overt attacks, insults, threats)
const directInsult = require('./direct/directInsult');
const threatUltimatum = require('./direct/threatUltimatum');

// Clean Axioms (constructive patterns)
const cleanRequest = require('./clean/cleanRequest');
const cleanInformation = require('./clean/cleanInformation');

// ============================================================================
// AXIOM REGISTRY
// ============================================================================

/**
 * Registry of all implemented axioms
 * Maps axiom IDs to their modules
 */
const AXIOM_REGISTRY = {
  // Indirect Communication Axioms
  AXIOM_001: displacedAccusation,
  AXIOM_004: weaponizedAgreement,
  AXIOM_010: childAsMessenger,

  // Direct Hostility Axioms
  AXIOM_D101: directInsult,
  AXIOM_D102: threatUltimatum,

  // Clean Axioms
  AXIOM_D001: cleanRequest,
  AXIOM_D002: cleanInformation,
};

/**
 * Get all axiom IDs by category
 * @param {string} category - Axiom category
 * @returns {string[]} - Array of axiom IDs
 */
function getAxiomsByCategory(category) {
  return Object.entries(AXIOM_REGISTRY)
    .filter(([id, axiom]) => axiom.category === category)
    .map(([id]) => id);
}

/**
 * Get axiom metadata
 * @param {string} id - Axiom ID
 * @returns {Object|null} - Axiom metadata or null
 */
function getAxiomMetadata(id) {
  const axiom = AXIOM_REGISTRY[id];
  if (!axiom) return null;

  return {
    id: axiom.id,
    name: axiom.name,
    category: axiom.category,
    description: axiom.description || '',
    pattern: axiom.pattern || '',
  };
}

/**
 * List all registered axioms
 * @returns {Object[]} - Array of axiom metadata
 */
function listAllAxioms() {
  return Object.keys(AXIOM_REGISTRY).map(id => getAxiomMetadata(id));
}

// ============================================================================
// AXIOM CHECKER
// ============================================================================

/**
 * Check all axioms against a parsed message
 *
 * @param {Object} parsed - Partial ParsedMessage (from Code Layer steps 1-5)
 * @param {Object} context - Parsing context
 * @returns {Promise<Object>} - Axiom check results
 *
 * @example
 * const result = await checkAll(parsed, context);
 * // Returns:
 * // {
 * //   axiomsFired: [
 * //     { fired: true, id: 'AXIOM_001', name: 'Displaced Accusation', ... }
 * //   ],
 * //   meta: {
 * //     totalChecked: 5,
 * //     totalFired: 1,
 * //     latencyMs: 12
 * //   }
 * // }
 */
async function checkAll(parsed, context = {}) {
  const startTime = Date.now();
  const axiomIds = Object.keys(AXIOM_REGISTRY);

  // Run all axiom checks in parallel
  const checkPromises = axiomIds.map(async id => {
    const axiom = AXIOM_REGISTRY[id];
    try {
      const result = await axiom.check(parsed, context);
      if (result && result.fired) {
        return result;
      }
    } catch (error) {
      console.error(`[AxiomChecker] Error checking ${id}:`, error.message);
    }
    return null;
  });

  const results = await Promise.all(checkPromises);

  // Filter out non-firing axioms and sort by confidence
  const axiomsFired = results.filter(r => r !== null).sort((a, b) => b.confidence - a.confidence);

  return {
    axiomsFired: axiomsFired,
    meta: {
      totalChecked: axiomIds.length,
      totalFired: axiomsFired.length,
      latencyMs: Date.now() - startTime,
    },
  };
}

// Note: checkOne and checkCategory removed - unused

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Registry
  AXIOM_REGISTRY,

  // Lookup functions
  getAxiomsByCategory,
  getAxiomMetadata,
  listAllAxioms,

  // Checker functions
  checkAll,
  // Note: checkOne and checkCategory removed - unused

  // Re-export categories
  AXIOM_CATEGORIES,
};
