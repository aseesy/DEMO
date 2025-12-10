/**
 * Code Layer Type Definitions
 *
 * This module defines the ParsedMessage structure that flows from the Code Layer
 * to the AI Layer in the Hybrid Mediation Engine.
 *
 * @module codeLayer/types
 * @version 1.0.0
 */

'use strict';

/**
 * @typedef {Object} Token
 * @property {string} word - The original word
 * @property {string} pos - Part of speech (pronoun, verb, noun, adverb, adjective, preposition, conjunction)
 * @property {number} index - Position in the sentence
 * @property {boolean} [addressee] - True if this is "you/your/you're"
 * @property {boolean} [speaker] - True if this is "I/my/me"
 * @property {boolean} [intensifier] - True if this is an intensifier (always, never, every, etc.)
 * @property {boolean} [softener] - True if this is a softener (just, maybe, might, etc.)
 * @property {boolean} [absolute] - True if this is an absolute term (all, none, always, never)
 * @property {boolean} [action] - True if this is an action verb
 * @property {string} [domain] - Domain category if detected (child_education, schedule, money, etc.)
 */

/**
 * @typedef {Object} LinguisticMarkers
 * @property {Token[]} tokens - Tokenized representation of the message
 * @property {string[]} softeners - Detected softener words (just, maybe, might, perhaps)
 * @property {string[]} intensifiers - Detected intensifier words (always, never, every, completely)
 * @property {string[]} patternMarkers - Detected pattern markers (global statements, evaluative language)
 * @property {string[]} contrastMarkers - Detected contrast words (but, however, although, yet)
 * @property {string[]} negations - Detected negation words (not, never, no, don't)
 */

/**
 * @typedef {Object} ConceptualPrimitives
 * @property {boolean} speaker - Whether speaker (I/me/my) is present
 * @property {boolean} addressee - Whether addressee (you/your) is present
 * @property {string[]} thirdParty - Third parties mentioned (child names, "she", "he", "they")
 * @property {'past'|'present'|'future'} temporal - Temporal focus of the message
 * @property {'fact'|'interpretation'|'unknown'} epistemic - Epistemic stance (stated as fact or interpretation)
 * @property {'schedule'|'money'|'parenting'|'character'|'logistics'|'general'} domain - Primary domain of the message
 */

/**
 * @typedef {Object} CommunicationVector
 * @property {string} sender - Sender identifier
 * @property {string} receiver - Receiver identifier
 * @property {'character'|'competence'|'autonomy'|'parenting'|'unclear'} target - What is being targeted
 * @property {'child'|'money'|'schedule'|'thirdParty'|null} instrument - Instrument used to deliver the message
 * @property {'attack'|'control'|'inform'|'request'|'defend'} aim - Inferred aim of the message
 */

/**
 * @typedef {Object} AxiomEvidence
 * @property {string} [childMentioned] - Child name/pronoun if detected
 * @property {string} [negativeState] - Negative emotional state detected
 * @property {string} [receiverLink] - Link to receiver detected
 * @property {string} [softener] - Softener used for deniability
 * @property {string} [triggerPhrase] - The phrase that triggered the axiom
 * @property {Object} [additional] - Any additional evidence specific to the axiom
 */

/**
 * @typedef {Object} AxiomResult
 * @property {boolean} fired - Whether the axiom was triggered
 * @property {string} id - Axiom identifier (e.g., 'AXIOM_001')
 * @property {string} name - Human-readable name (e.g., 'Displaced Accusation')
 * @property {'indirect_communication'|'contextual'|'clean'} category - Axiom category
 * @property {number} confidence - Confidence score (0-100)
 * @property {AxiomEvidence} evidence - Evidence that triggered the axiom
 * @property {string} intentImpactDelta - Explanation of Intent vs Impact gap
 */

/**
 * @typedef {Object} Assessment
 * @property {'low'|'moderate'|'high'} conflictPotential - Potential for escalation
 * @property {string[]} attackSurface - Areas being targeted (character, competence, autonomy, parenting)
 * @property {boolean} childAsInstrument - Whether child is being used as instrument
 * @property {'low'|'high'} deniability - Level of plausible deniability
 * @property {boolean} transmit - Whether message can pass without AI intervention
 */

/**
 * @typedef {Object} ParsedMessageMeta
 * @property {string} version - Code Layer version
 * @property {number} latencyMs - Total parsing time in milliseconds
 * @property {Object} componentLatency - Breakdown of latency by component
 * @property {number} componentLatency.tokenizerMs - Tokenizer latency
 * @property {number} componentLatency.markerDetectorMs - Marker detector latency
 * @property {number} componentLatency.primitiveMapperMs - Primitive mapper latency
 * @property {number} componentLatency.vectorIdentifierMs - Vector identifier latency
 * @property {number} componentLatency.axiomCheckerMs - Axiom checker latency
 * @property {number} componentLatency.assessmentGenMs - Assessment generator latency
 * @property {boolean} [error] - True if an error occurred during parsing
 * @property {string} [errorMessage] - Error message if error is true
 */

/**
 * @typedef {Object} ParsedMessage
 * @property {string} raw - Original message text
 * @property {LinguisticMarkers} linguistic - Tokenized linguistic analysis
 * @property {ConceptualPrimitives} conceptual - Conceptual primitives extracted
 * @property {CommunicationVector} vector - Communication vector (sender → receiver → target)
 * @property {AxiomResult[]} axiomsFired - Axioms that matched this message
 * @property {Assessment} assessment - Final assessment and transmission decision
 * @property {ParsedMessageMeta} meta - Metadata about the parsing process
 */

/**
 * @typedef {Object} ParsingContext
 * @property {string} senderId - Sender's user ID
 * @property {string} receiverId - Receiver's user ID
 * @property {string[]} [childNames] - Names of children in this co-parenting relationship
 * @property {boolean} [hasNewPartner] - Receiver has a new partner (for contextual axioms)
 * @property {'high'|'medium'|'low'|'unknown'} [incomeDisparity] - Income disparity level
 * @property {string} [separationDate] - Date of separation (ISO string)
 * @property {'closer'|'farther'|'equal'|'unknown'} [distanceToSchool] - Sender's proximity to school
 */

// ============================================================================
// EXAMPLE PARSED MESSAGE
// ============================================================================

/**
 * Example ParsedMessage for: "She's been upset since you changed the schedule"
 *
 * @example
 * const exampleParsedMessage = {
 *   raw: "She's been upset since you changed the schedule",
 *   linguistic: {
 *     tokens: [
 *       { word: "She's", pos: "pronoun", index: 0, speaker: false, addressee: false },
 *       { word: "been", pos: "verb", index: 1, action: false },
 *       { word: "upset", pos: "adjective", index: 2 },
 *       { word: "since", pos: "conjunction", index: 3 },
 *       { word: "you", pos: "pronoun", index: 4, addressee: true },
 *       { word: "changed", pos: "verb", index: 5, action: true },
 *       { word: "the", pos: "article", index: 6 },
 *       { word: "schedule", pos: "noun", index: 7, domain: "schedule" }
 *     ],
 *     softeners: [],
 *     intensifiers: [],
 *     patternMarkers: [],
 *     contrastMarkers: [],
 *     negations: []
 *   },
 *   conceptual: {
 *     speaker: false,
 *     addressee: true,
 *     thirdParty: ["she"],
 *     temporal: "past",
 *     epistemic: "interpretation",
 *     domain: "schedule"
 *   },
 *   vector: {
 *     sender: "alice",
 *     receiver: "bob",
 *     target: "competence",
 *     instrument: "child",
 *     aim: "attack"
 *   },
 *   axiomsFired: [
 *     {
 *       fired: true,
 *       id: "AXIOM_001",
 *       name: "Displaced Accusation",
 *       category: "indirect_communication",
 *       confidence: 90,
 *       evidence: {
 *         childMentioned: "she",
 *         negativeState: "upset",
 *         receiverLink: "since you",
 *         triggerPhrase: "She's been upset since you changed"
 *       },
 *       intentImpactDelta: "Framed as concern for child, but receiver will hear as blame for child's emotional state"
 *     }
 *   ],
 *   assessment: {
 *     conflictPotential: "high",
 *     attackSurface: ["competence"],
 *     childAsInstrument: true,
 *     deniability: "high",
 *     transmit: false
 *   },
 *   meta: {
 *     version: "1.0.0",
 *     latencyMs: 45,
 *     componentLatency: {
 *       tokenizerMs: 8,
 *       markerDetectorMs: 5,
 *       primitiveMapperMs: 10,
 *       vectorIdentifierMs: 12,
 *       axiomCheckerMs: 7,
 *       assessmentGenMs: 3
 *     }
 *   }
 * };
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Code Layer version
 * @constant {string}
 */
const VERSION = '1.0.0';

/**
 * Axiom categories
 * @constant {Object}
 */
const AXIOM_CATEGORIES = {
  INDIRECT_COMMUNICATION: 'indirect_communication',
  CONTEXTUAL: 'contextual',
  CLEAN: 'clean'
};

/**
 * Conflict potential levels
 * @constant {Object}
 */
const CONFLICT_LEVELS = {
  LOW: 'low',
  MODERATE: 'moderate',
  HIGH: 'high'
};

/**
 * Communication targets
 * @constant {Object}
 */
const TARGETS = {
  CHARACTER: 'character',
  COMPETENCE: 'competence',
  AUTONOMY: 'autonomy',
  PARENTING: 'parenting',
  UNCLEAR: 'unclear'
};

/**
 * Communication instruments
 * @constant {Object}
 */
const INSTRUMENTS = {
  CHILD: 'child',
  MONEY: 'money',
  SCHEDULE: 'schedule',
  THIRD_PARTY: 'third_party'
};

/**
 * Communication aims
 * @constant {Object}
 */
const AIMS = {
  ATTACK: 'attack',
  CONTROL: 'control',
  INFORM: 'inform',
  REQUEST: 'request',
  DEFEND: 'defend'
};

/**
 * Message domains
 * @constant {Object}
 */
const DOMAINS = {
  SCHEDULE: 'schedule',
  MONEY: 'money',
  PARENTING: 'parenting',
  CHARACTER: 'character',
  LOGISTICS: 'logistics',
  GENERAL: 'general'
};

/**
 * Temporal categories
 * @constant {Object}
 */
const TEMPORAL = {
  PAST: 'past',
  PRESENT: 'present',
  FUTURE: 'future'
};

/**
 * Epistemic stances
 * @constant {Object}
 */
const EPISTEMIC = {
  FACT: 'fact',
  INTERPRETATION: 'interpretation',
  UNKNOWN: 'unknown'
};

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create an empty ParsedMessage with default values
 * @param {string} raw - Original message text
 * @param {ParsingContext} context - Parsing context
 * @returns {ParsedMessage}
 */
function createEmptyParsedMessage(raw, context = {}) {
  return {
    raw,
    linguistic: {
      tokens: [],
      softeners: [],
      intensifiers: [],
      patternMarkers: [],
      contrastMarkers: [],
      negations: []
    },
    conceptual: {
      speaker: false,
      addressee: false,
      thirdParty: [],
      temporal: TEMPORAL.PRESENT,
      epistemic: EPISTEMIC.UNKNOWN,
      domain: DOMAINS.GENERAL
    },
    vector: {
      sender: context.senderId || 'unknown',
      receiver: context.receiverId || 'unknown',
      target: TARGETS.UNCLEAR,
      instrument: null,
      aim: AIMS.INFORM
    },
    axiomsFired: [],
    assessment: {
      conflictPotential: CONFLICT_LEVELS.LOW,
      attackSurface: [],
      childAsInstrument: false,
      deniability: 'low',
      transmit: true
    },
    meta: {
      version: VERSION,
      latencyMs: 0,
      componentLatency: {
        tokenizerMs: 0,
        markerDetectorMs: 0,
        primitiveMapperMs: 0,
        vectorIdentifierMs: 0,
        axiomCheckerMs: 0,
        assessmentGenMs: 0
      }
    }
  };
}

/**
 * Create an AxiomResult for a non-firing axiom
 * @param {string} id - Axiom ID
 * @param {string} name - Axiom name
 * @param {string} category - Axiom category
 * @returns {AxiomResult}
 */
function createNonFiringAxiomResult(id, name, category) {
  return {
    fired: false,
    id,
    name,
    category,
    confidence: 0,
    evidence: {},
    intentImpactDelta: ''
  };
}

/**
 * Create an AxiomResult for a firing axiom
 * @param {string} id - Axiom ID
 * @param {string} name - Axiom name
 * @param {string} category - Axiom category
 * @param {number} confidence - Confidence score (0-100)
 * @param {AxiomEvidence} evidence - Evidence for the axiom
 * @param {string} intent_impact_delta - Explanation of intent vs impact gap
 * @returns {AxiomResult}
 */
function createFiringAxiomResult(id, name, category, confidence, evidence, intentImpactDelta) {
  return {
    fired: true,
    id,
    name,
    category,
    confidence,
    evidence,
    intentImpactDelta
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Version
  VERSION,

  // Constants
  AXIOM_CATEGORIES,
  CONFLICT_LEVELS,
  TARGETS,
  INSTRUMENTS,
  AIMS,
  DOMAINS,
  TEMPORAL,
  EPISTEMIC,

  // Factory functions
  createEmptyParsedMessage,
  createNonFiringAxiomResult,
  createFiringAxiomResult
};
