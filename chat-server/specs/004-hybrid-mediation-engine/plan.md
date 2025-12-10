# Implementation Plan: Hybrid AI Mediation Engine

**Feature ID**: 004
**Plan Version**: 1.0.0
**Created**: 2025-11-29
**Based on**: spec.md v1.0.0

---

## Executive Summary

This plan transforms the existing mediation system into a **Hybrid Architecture** where:
- **Code Layer** handles parsing, structure detection, and Axiom checking (deterministic, fast)
- **AI Layer** handles nuance, context, and conscience voice generation (judgment-based)

**Key Insight**: The existing `language-analyzer` module already provides ~60% of the Code Layer foundation. We're extending it, not replacing it.

---

## Technical Context (from Codebase Exploration)

### Current Architecture

| Component | Location | Status |
|-----------|----------|--------|
| Main Mediator | `/src/liaizen/core/mediator.js` | Unified AI analyzer (single call) |
| Language Analyzer | `/src/liaizen/analysis/language-analyzer/` | **Reusable** - has pattern detection |
| Rewrite Validator | `/src/liaizen/analysis/rewrite-validator/` | **Reusable** - perspective checking |
| Communication Profile | `/src/liaizen/context/communication-profile/` | **Reusable** - user context |
| OpenAI Client | `/src/liaizen/core/client.js` | Singleton with rate limiting |
| Constitution | `/ai-mediation-constitution.md` | Governance document |

### Existing Pattern Modules (Reusable)

```
/src/liaizen/analysis/language-analyzer/patterns/
├── globalSpecific.js   → Detects absolutes (always/never) ✅
├── evaluative.js       → Detects character/competence attacks ✅
├── hedging.js          → Detects softeners (just/only) ✅
├── specificity.js      → Detects vague vs specific ✅
├── focus.js            → Detects focus (logistics/character/child) ✅
├── childInvolvement.js → Detects child triangulation ✅
└── structure.js        → Detects sentence type/target ✅
```

**Gap Analysis**: These pattern modules are close to what the spec requires but:
1. Missing: **Axiom naming** (AXIOM_001, AXIOM_004, etc.)
2. Missing: **Communication Vector** (sender/receiver/target/instrument)
3. Missing: **Transmission decision** (can message pass as-is?)
4. Missing: **Structured ParsedMessage** output format

---

## Implementation Steps

### Phase 1: Code Layer Foundation (Week 1-2)

#### Step 1.1: Create ParsedMessage Type Definition

**Location**: `/src/liaizen/core/codeLayer/types.js`

```javascript
/**
 * ParsedMessage - Structured output from Code Layer
 * Passed to AI Layer for contextual processing
 */
const ParsedMessage = {
  raw: '',                    // Original message text

  linguistic: {
    tokens: [],               // Tagged words
    softeners: [],            // "just", "only", etc.
    intensifiers: [],         // "very", "always", "never"
    pattern_markers: [],      // Absolutes
    contrast_markers: [],     // "but", "however"
    negations: []             // "not", "never"
  },

  conceptual: {
    speaker: false,           // "I" present
    addressee: false,         // "you" present
    third_party: [],          // Others mentioned
    temporal: 'present',      // past/present/future
    epistemic: 'unknown',     // fact/interpretation
    domain: 'unclear'         // schedule/money/parenting/character
  },

  vector: {
    sender: '',               // User ID
    receiver: '',             // Coparent ID
    target: '',               // character/competence/autonomy/parenting
    instrument: null,         // child/money/schedule (if used)
    aim: ''                   // attack/control/inform/request
  },

  axioms_fired: [],           // Array of { id, name, confidence, fired, evidence }

  assessment: {
    conflict_potential: 'low', // low/moderate/high
    attack_surface: [],        // What's being attacked
    child_as_instrument: false,
    deniability: 'low',        // low/high
    transmit: true             // Can pass without AI?
  },

  meta: {
    version: '1.0.0',
    latency_ms: 0
  }
};
```

#### Step 1.2: Create Tokenizer Module

**Location**: `/src/liaizen/core/codeLayer/tokenizer.js`

**Purpose**: Break message into tagged tokens with linguistic metadata

**Implementation Notes**:
- Extend existing `structure.js` logic
- Add POS tagging (pronoun, verb, noun, adverb)
- Mark special tokens (addressee, speaker, emotional)
- Target: <10ms for 100-word message

```javascript
// Example output
tokenize("You NEVER help with homework")
// Returns:
[
  { word: "You", pos: "pronoun", addressee: true, index: 0 },
  { word: "NEVER", pos: "adverb", intensifier: true, absolute: true, index: 1 },
  { word: "help", pos: "verb", action: true, index: 2 },
  { word: "with", pos: "preposition", index: 3 },
  { word: "homework", pos: "noun", domain: "child_education", index: 4 }
]
```

#### Step 1.3: Extend Marker Detector

**Location**: `/src/liaizen/core/codeLayer/markerDetector.js`

**Purpose**: Extract linguistic markers (consolidate existing pattern modules)

**Implementation**:
- Consolidate `hedging.js` softeners → `softeners[]`
- Consolidate `globalSpecific.js` absolutes → `intensifiers[]`, `pattern_markers[]`
- Add `contrast_markers[]` (but, however, although)
- Add `negations[]` (not, never, no)

```javascript
// Reuse existing patterns
const hedging = require('../analysis/language-analyzer/patterns/hedging');
const globalSpecific = require('../analysis/language-analyzer/patterns/globalSpecific');

function detect(text, tokens) {
  const hedgeResult = hedging.detect(text);
  const globalResult = globalSpecific.detect(text);

  return {
    softeners: hedgeResult.hedges_used || [],
    intensifiers: globalResult.absolutes_used.filter(a => ['always', 'never', 'every'].includes(a.toLowerCase())),
    pattern_markers: globalResult.absolutes_used,
    contrast_markers: extractContrastMarkers(text),
    negations: extractNegations(text)
  };
}
```

#### Step 1.4: Create Primitive Mapper

**Location**: `/src/liaizen/core/codeLayer/primitiveMapper.js`

**Purpose**: Map tokens to conceptual primitives

**Implementation**:
- Detect speaker presence ("I", "my", "me")
- Detect addressee presence ("you", "your")
- Identify third parties (she/he/they + names)
- Determine temporal focus (past/present/future)
- Classify epistemic stance (fact vs interpretation)
- Identify domain (schedule, money, parenting, character)

```javascript
function map(tokens, markers) {
  return {
    speaker: tokens.some(t => ['i', 'my', 'me', "i'm", "i've"].includes(t.word.toLowerCase())),
    addressee: tokens.some(t => ['you', 'your', "you're", "you've"].includes(t.word.toLowerCase())),
    third_party: extractThirdParty(tokens),
    temporal: determineTemporal(tokens),
    epistemic: determineEpistemic(tokens, markers),
    domain: determineDomain(tokens)
  };
}
```

---

### Phase 2: Axiom System (Week 3-4)

#### Step 2.1: Create Axiom Registry

**Location**: `/src/liaizen/core/codeLayer/axioms/index.js`

```javascript
const AXIOM_REGISTRY = {
  // Indirect Communication (Attacks Disguised as Peace)
  'AXIOM_001': require('./indirect/displacedAccusation'),
  'AXIOM_002': require('./indirect/falseOffering'),
  'AXIOM_003': require('./indirect/innocentInquiry'),
  'AXIOM_004': require('./indirect/weaponizedAgreement'),
  'AXIOM_005': require('./indirect/virtuousSelfReference'),
  'AXIOM_007': require('./indirect/preemptiveDenial'),
  'AXIOM_008': require('./indirect/reluctantCompliance'),
  'AXIOM_010': require('./indirect/childAsMessenger'),
  'AXIOM_012': require('./indirect/concernedQuestion'),
  'AXIOM_016': require('./indirect/hypotheticalAccusation'),

  // Contextual (Situational)
  'AXIOM_C001': require('./contextual/proximityClaim'),
  'AXIOM_C002': require('./contextual/newPartnerThreat'),
  'AXIOM_C005': require('./contextual/freshSeparation'),
  'AXIOM_C007': require('./contextual/incomeLeverage'),

  // Clean (Positive Patterns)
  'AXIOM_D001': require('./clean/cleanRequest'),
  'AXIOM_D002': require('./clean/cleanInformation')
};
```

#### Step 2.2: Implement Key Axioms

**Example: AXIOM_001 - Displaced Accusation**

**Location**: `/src/liaizen/core/codeLayer/axioms/indirect/displacedAccusation.js`

```javascript
/**
 * AXIOM 001: Displaced Accusation
 *
 * Pattern: Reports [negative state] of [Child] + Linked to [Receiver Domain] + [Softener]
 * Example: "She's been upset since you changed the schedule"
 *
 * Detection Logic:
 * 1. Child reference present (she/he + child name, or "the kids")
 * 2. Negative emotional state (upset, crying, worried, struggling)
 * 3. Linked to receiver action ("since you", "after you", "because you")
 * 4. Optional: Softener present ("just", "I've noticed")
 */

const NEGATIVE_STATES = ['upset', 'crying', 'worried', 'sad', 'anxious', 'struggling', 'unhappy', 'stressed'];
const RECEIVER_LINKS = ['since you', 'after you', 'because you', 'when you', 'ever since'];
const CHILD_PRONOUNS = ['she', 'he', 'they', 'the kids', 'the children'];

function check(parsed, context = {}) {
  const text = parsed.raw.toLowerCase();
  const { conceptual, linguistic } = parsed;

  // 1. Check for child reference
  const hasChildReference =
    conceptual.third_party.some(p => p.relationship === 'child') ||
    CHILD_PRONOUNS.some(p => text.includes(p));

  if (!hasChildReference) {
    return { fired: false };
  }

  // 2. Check for negative state
  const hasNegativeState = NEGATIVE_STATES.some(state => text.includes(state));

  if (!hasNegativeState) {
    return { fired: false };
  }

  // 3. Check for receiver link
  const hasReceiverLink = RECEIVER_LINKS.some(link => text.includes(link));

  if (!hasReceiverLink) {
    return { fired: false };
  }

  // 4. Calculate confidence
  const hasSoftener = linguistic.softeners.length > 0;
  const confidence = hasSoftener ? 90 : 75;

  return {
    id: 'AXIOM_001',
    name: 'Displaced Accusation',
    category: 'indirect_communication',
    confidence,
    fired: true,
    evidence: {
      child_mentioned: true,
      negative_state: NEGATIVE_STATES.find(s => text.includes(s)),
      receiver_link: RECEIVER_LINKS.find(l => text.includes(l)),
      softener_used: hasSoftener
    }
  };
}

module.exports = { check };
```

**Example: AXIOM_004 - Weaponized Agreement**

**Location**: `/src/liaizen/core/codeLayer/axioms/indirect/weaponizedAgreement.js`

```javascript
/**
 * AXIOM 004: Weaponized Agreement
 *
 * Pattern: Agreement + Contrast Marker + Negation/Attack
 * Example: "I agree we should be consistent, but you never follow through"
 */

const AGREEMENT_PHRASES = ['i agree', 'you\'re right', 'that\'s true', 'fair point', 'absolutely'];
const CONTRAST_MARKERS = ['but', 'however', 'although', 'though', 'yet'];

function check(parsed, context = {}) {
  const text = parsed.raw.toLowerCase();
  const { linguistic } = parsed;

  // 1. Check for agreement
  const hasAgreement = AGREEMENT_PHRASES.some(phrase => text.includes(phrase));

  if (!hasAgreement) {
    return { fired: false };
  }

  // 2. Check for contrast marker
  const hasContrast = linguistic.contrast_markers.length > 0 ||
    CONTRAST_MARKERS.some(marker => text.includes(marker));

  if (!hasContrast) {
    return { fired: false };
  }

  // 3. Check for negative follow-up
  const contrastIndex = findContrastIndex(text);
  const afterContrast = text.slice(contrastIndex);
  const hasNegativeFollow =
    linguistic.intensifiers.some(i => afterContrast.includes(i.toLowerCase())) ||
    /you (never|don't|won't|can't|always)/.test(afterContrast);

  if (!hasNegativeFollow) {
    return { fired: false };
  }

  return {
    id: 'AXIOM_004',
    name: 'Weaponized Agreement',
    category: 'indirect_communication',
    confidence: 90,
    fired: true,
    evidence: {
      agreement: AGREEMENT_PHRASES.find(p => text.includes(p)),
      contrast_marker: CONTRAST_MARKERS.find(m => text.includes(m)),
      negative_followup: true
    }
  };
}

function findContrastIndex(text) {
  for (const marker of CONTRAST_MARKERS) {
    const idx = text.indexOf(marker);
    if (idx !== -1) return idx;
  }
  return 0;
}

module.exports = { check };
```

**Example: AXIOM_D001 - Clean Request**

**Location**: `/src/liaizen/core/codeLayer/axioms/clean/cleanRequest.js`

```javascript
/**
 * AXIOM D001: Clean Request
 *
 * Pattern: Specific + Actionable + No excessive softeners
 * Example: "Can you pick her up at 3pm?"
 */

const REQUEST_PATTERNS = [
  /can you .+\?$/i,
  /could you .+\?$/i,
  /will you .+\?$/i,
  /would you .+\?$/i,
  /please .+/i
];

function check(parsed, context = {}) {
  const text = parsed.raw.trim();
  const { linguistic, conceptual } = parsed;

  // 1. Check for request pattern
  const isRequest = REQUEST_PATTERNS.some(pattern => pattern.test(text));

  if (!isRequest) {
    return { fired: false };
  }

  // 2. Check for specificity (time, place, action)
  const hasSpecificTime = /\d{1,2}(:\d{2})?\s*(am|pm|o'clock)?/i.test(text);
  const hasSpecificAction = /pick up|drop off|call|send|take|bring|get|give/i.test(text);

  const isSpecific = hasSpecificTime || hasSpecificAction;

  // 3. Check for excessive softeners (< 2 is ok)
  const excessiveSofteners = linguistic.softeners.length > 1;

  // 4. Check no negative patterns
  const hasNegatives = linguistic.intensifiers.length > 0 ||
    conceptual.epistemic === 'interpretation';

  if (isSpecific && !excessiveSofteners && !hasNegatives) {
    return {
      id: 'AXIOM_D001',
      name: 'Clean Request',
      category: 'clean',
      confidence: 95,
      fired: true,
      evidence: {
        is_request: true,
        is_specific: isSpecific,
        no_excessive_softeners: !excessiveSofteners,
        no_negatives: !hasNegatives
      }
    };
  }

  return { fired: false };
}

module.exports = { check };
```

#### Step 2.3: Axiom Checker Orchestrator

**Location**: `/src/liaizen/core/codeLayer/axiomChecker.js`

```javascript
const AXIOM_REGISTRY = require('./axioms');

async function checkAll(parsed, context = {}) {
  const startTime = Date.now();
  const results = [];

  // Run all axioms in parallel
  const axiomPromises = Object.entries(AXIOM_REGISTRY).map(async ([id, axiom]) => {
    try {
      const result = axiom.check(parsed, context);
      if (result.fired) {
        return result;
      }
    } catch (error) {
      console.error(`Error checking ${id}:`, error.message);
    }
    return null;
  });

  const axiomResults = await Promise.all(axiomPromises);

  // Filter fired axioms and sort by confidence
  const firedAxioms = axiomResults
    .filter(r => r !== null)
    .sort((a, b) => b.confidence - a.confidence);

  const latency = Date.now() - startTime;

  return {
    axioms_fired: firedAxioms,
    meta: {
      total_checked: Object.keys(AXIOM_REGISTRY).length,
      total_fired: firedAxioms.length,
      latency_ms: latency
    }
  };
}

module.exports = { checkAll };
```

---

### Phase 3: Vector & Assessment (Week 5)

#### Step 3.1: Vector Identifier

**Location**: `/src/liaizen/core/codeLayer/vectorIdentifier.js`

```javascript
/**
 * Identifies the Communication Vector
 * Sender → Receiver → Target via Instrument
 */

const TARGET_PATTERNS = {
  character: ['you are', "you're", 'always', 'never', 'kind of person'],
  competence: ['you forgot', 'you failed', 'you can\'t', 'you don\'t know'],
  autonomy: ['you should', 'you need to', 'you have to', 'you must'],
  parenting: ['as a parent', 'your parenting', 'the way you raise']
};

const INSTRUMENT_PATTERNS = {
  child: ['she said', 'he told me', 'the kids want', 'they prefer'],
  money: ['child support', 'payment', 'expenses', 'afford'],
  schedule: ['schedule', 'custody', 'your time', 'my time', 'pickup', 'dropoff'],
  third_party: ['your mother', 'your friend', 'your lawyer', 'people say']
};

const AIM_PATTERNS = {
  attack: ['you never', 'you always', 'your fault', 'because of you'],
  control: ['you need to', 'you should', 'you have to', 'i expect'],
  inform: ['just wanted to let you know', 'fyi', 'heads up'],
  request: ['can you', 'could you', 'would you', 'please']
};

function identify(tokens, conceptual, context) {
  const text = context.raw?.toLowerCase() || '';

  return {
    sender: context.senderId || 'unknown',
    receiver: context.receiverId || 'unknown',
    target: identifyTarget(text),
    instrument: identifyInstrument(text, conceptual),
    aim: identifyAim(text)
  };
}

function identifyTarget(text) {
  for (const [target, patterns] of Object.entries(TARGET_PATTERNS)) {
    if (patterns.some(p => text.includes(p))) {
      return target;
    }
  }
  return 'unclear';
}

function identifyInstrument(text, conceptual) {
  // Check if child is used as instrument
  if (conceptual.third_party.some(p => p.relationship === 'child')) {
    if (INSTRUMENT_PATTERNS.child.some(p => text.includes(p))) {
      return 'child';
    }
  }

  for (const [instrument, patterns] of Object.entries(INSTRUMENT_PATTERNS)) {
    if (patterns.some(p => text.includes(p))) {
      return instrument;
    }
  }
  return null;
}

function identifyAim(text) {
  for (const [aim, patterns] of Object.entries(AIM_PATTERNS)) {
    if (patterns.some(p => text.includes(p))) {
      return aim;
    }
  }
  return 'unclear';
}

module.exports = { identify };
```

#### Step 3.2: Assessment Generator

**Location**: `/src/liaizen/core/codeLayer/assessmentGen.js`

```javascript
/**
 * Generates final assessment and transmission decision
 */

function generate({ axioms_fired, vector, markers, conceptual }) {
  // Conflict potential based on axioms
  let conflict_potential = 'low';

  const indirectAxioms = axioms_fired.filter(a =>
    a.category === 'indirect_communication'
  );

  if (indirectAxioms.length > 0) {
    conflict_potential = 'moderate';
  }

  // High-risk axioms
  const HIGH_RISK = ['AXIOM_001', 'AXIOM_010', 'AXIOM_016'];
  if (axioms_fired.some(a => HIGH_RISK.includes(a.id))) {
    conflict_potential = 'high';
  }

  // Attack surface
  const attack_surface = [];
  if (vector.target === 'character') attack_surface.push('character');
  if (vector.target === 'competence') attack_surface.push('competence');
  if (markers.pattern_markers.includes('never') || markers.pattern_markers.includes('always')) {
    attack_surface.push('autonomy');
  }
  if (vector.target === 'parenting') attack_surface.push('parenting');

  // Child as instrument
  const child_as_instrument = vector.instrument === 'child';

  // Deniability (high if softeners present)
  const deniability = markers.softeners.length > 0 ? 'high' : 'low';

  // Transmission decision
  const cleanAxioms = axioms_fired.filter(a => a.category === 'clean');
  const hasOnlyCleanAxioms =
    axioms_fired.length === cleanAxioms.length &&
    cleanAxioms.length > 0;

  const transmit =
    conflict_potential === 'low' &&
    !child_as_instrument &&
    (hasOnlyCleanAxioms || axioms_fired.length === 0);

  return {
    conflict_potential,
    attack_surface,
    child_as_instrument,
    deniability,
    transmit
  };
}

module.exports = { generate };
```

#### Step 3.3: Code Layer Entry Point

**Location**: `/src/liaizen/core/codeLayer/index.js`

```javascript
/**
 * Code Layer - Main Entry Point
 *
 * Parses message into structured ParsedMessage for AI Layer
 */

const tokenizer = require('./tokenizer');
const markerDetector = require('./markerDetector');
const primitiveMapper = require('./primitiveMapper');
const vectorIdentifier = require('./vectorIdentifier');
const axiomChecker = require('./axiomChecker');
const assessmentGen = require('./assessmentGen');

const VERSION = '1.0.0';

async function parse(messageText, context = {}) {
  const startTime = Date.now();

  // 1. Tokenize
  const tokens = tokenizer.tokenize(messageText);

  // 2. Detect markers
  const markers = markerDetector.detect(messageText, tokens);

  // 3. Map to conceptual primitives
  const conceptual = primitiveMapper.map(tokens, markers, context);

  // 4. Build partial parsed for axiom checking
  const partialParsed = {
    raw: messageText,
    linguistic: {
      tokens,
      ...markers
    },
    conceptual
  };

  // 5. Identify communication vector
  const vector = vectorIdentifier.identify(tokens, conceptual, {
    ...context,
    raw: messageText
  });

  // 6. Check all axioms
  const axiomResult = await axiomChecker.checkAll(partialParsed, context);

  // 7. Generate assessment
  const assessment = assessmentGen.generate({
    axioms_fired: axiomResult.axioms_fired,
    vector,
    markers,
    conceptual
  });

  const latency = Date.now() - startTime;

  return {
    raw: messageText,
    linguistic: {
      tokens,
      softeners: markers.softeners,
      intensifiers: markers.intensifiers,
      pattern_markers: markers.pattern_markers,
      contrast_markers: markers.contrast_markers,
      negations: markers.negations
    },
    conceptual,
    vector,
    axioms_fired: axiomResult.axioms_fired,
    assessment,
    meta: {
      version: VERSION,
      latency_ms: latency,
      axioms_checked: axiomResult.meta.total_checked,
      axioms_fired: axiomResult.meta.total_fired
    }
  };
}

module.exports = { parse, VERSION };
```

---

### Phase 4: AI Integration (Week 6-7)

#### Step 4.1: Update AI System Prompt

**Location**: Update `/src/liaizen/core/mediator.js`

```javascript
function buildSystemPrompt(parsedMessage, profiles, context) {
  return `
# SYSTEM ROLE
You are LiaiZen's Observer - you receive STRUCTURED ANALYSIS from the code layer
and provide nuanced coaching based on what the structure reveals.

# PARSED MESSAGE STRUCTURE
${JSON.stringify(parsedMessage, null, 2)}

# USER CONTEXT
${JSON.stringify(profiles, null, 2)}

# YOUR ROLE
1. Read the structural analysis (axioms_fired, vector, assessment)
2. Apply user context (profiles, history)
3. Derive the legitimate need behind the message
4. Speak in "observer voice" - name structures, not emotions
5. Reference specific Axioms that fired
6. Provide coaching that addresses the structural pattern

# OBSERVER VOICE REQUIREMENTS
- State what the structure IS DOING: "AXIOM 004 fires: The 'but' negates the agreement"
- Name the Delta (Intent vs Impact): "You intend to agree, but this will land as dismissal"
- NO emotional diagnosis: NEVER "You're angry" or "You seem frustrated"
- Use structural language: Primitives, Axioms, Communication Vector

# COACHING FRAMEWORK (1-2-3)
1. ADDRESS (personalMessage):
   - Name the Axiom(s) that fired
   - Explain the structural pattern
   - State the Delta (Intent vs Impact)
   - Max 2 sentences

2. ONE TIP (tip1):
   - Actionable tool to help express their need
   - Max 10 words
   - Specific to THIS structure

3. TWO REWRITES (rewrite1, rewrite2):
   - Preserve sender's legitimate goal
   - Remove the Axiom trigger
   - Use different approaches

# DECISION LOGIC
Based on assessment.transmit and conflict_potential:
- transmit: true → "STAY_SILENT" (message passes)
- transmit: false, conflict_potential: "moderate" → Provide coaching
- transmit: false, conflict_potential: "high" → "INTERVENE" with rewrites
`;
}
```

#### Step 4.2: Integrate Code Layer into Mediator

**Location**: Update `/src/liaizen/core/mediator.js`

```javascript
const codeLayer = require('./codeLayer');

async function analyzeMessage(message, recentMessages, roleContext, ...) {
  // 1. CODE LAYER ANALYSIS
  const parsed = await codeLayer.parse(message.text, {
    senderId: roleContext.senderId,
    receiverId: roleContext.receiverId,
    childNames: extractChildNames(existingContacts)
  });

  // 2. QUICK DECISIONS (no AI needed)
  if (parsed.assessment.transmit && parsed.assessment.conflict_potential === 'low') {
    console.log('✅ Clean message - passing without AI analysis');
    return null; // Allow message
  }

  // 3. LOG AXIOMS FOR DEBUGGING
  if (parsed.axioms_fired.length > 0) {
    console.log('⚠️ Axioms fired:', parsed.axioms_fired.map(a => a.id).join(', '));
  }

  // 4. BUILD AI CONTEXT
  const systemPrompt = buildSystemPrompt(parsed, profiles, roleContext);

  // 5. AI CALL (only for complex cases)
  const aiResponse = await callAI(systemPrompt, message.text);

  // 6. VALIDATE RESPONSE
  const validated = validateAIResponse(aiResponse, parsed);

  return validated;
}
```

#### Step 4.3: Response Validator

**Location**: `/src/liaizen/core/codeLayer/responseValidator.js`

```javascript
/**
 * Validates AI response meets requirements
 */

function validate(aiResponse, parsed) {
  const errors = [];

  if (aiResponse.action === 'INTERVENE') {
    const intervention = aiResponse.intervention || {};

    // Check personalMessage references axiom
    if (intervention.personalMessage) {
      const referencesAxiom = parsed.axioms_fired.some(a =>
        intervention.personalMessage.includes(a.id) ||
        intervention.personalMessage.toLowerCase().includes(a.name.toLowerCase())
      );

      if (!referencesAxiom && parsed.axioms_fired.length > 0) {
        errors.push('personalMessage should reference fired Axiom');
      }

      // Check no emotional diagnosis
      const FORBIDDEN = ['you\'re angry', 'you seem frustrated', 'you feel', 'you\'re upset'];
      if (FORBIDDEN.some(f => intervention.personalMessage.toLowerCase().includes(f))) {
        errors.push('personalMessage contains emotional diagnosis');
      }
    }

    // Check tip length
    if (intervention.tip1) {
      const wordCount = intervention.tip1.split(/\s+/).length;
      if (wordCount > 12) {
        errors.push(`tip1 exceeds 10 words (${wordCount})`);
      }
    }

    // Check rewrites exist
    if (!intervention.rewrite1 || !intervention.rewrite2) {
      errors.push('Missing required rewrites');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    response: aiResponse
  };
}

module.exports = { validate };
```

---

### Phase 5: Deployment & Monitoring (Week 8)

#### Step 5.1: Add Metrics Logging

**Location**: Update `/src/liaizen/core/codeLayer/index.js`

```javascript
// Add to parse function
const metrics = {
  timestamp: new Date().toISOString(),
  message_length: messageText.length,
  code_layer_latency_ms: latency,
  axioms_checked: axiomResult.meta.total_checked,
  axioms_fired: axiomResult.axioms_fired.map(a => a.id),
  conflict_potential: assessment.conflict_potential,
  transmit_decision: assessment.transmit,
  ai_call_required: !assessment.transmit
};

// Log for monitoring
console.log('📊 [CodeLayer]', JSON.stringify(metrics));
```

#### Step 5.2: A/B Test Framework

```javascript
// In server.js or mediator.js
const AB_TEST_RATIO = 0.1; // 10% get hybrid system

function shouldUseHybrid(userId) {
  // Hash user ID for consistent assignment
  const hash = hashCode(userId);
  return (hash % 100) < (AB_TEST_RATIO * 100);
}

// Usage
if (shouldUseHybrid(senderId)) {
  result = await hybridAnalyzeMessage(message, ...);
} else {
  result = await legacyAnalyzeMessage(message, ...);
}
```

---

## File Changes Required

### New Files to Create

```
/src/liaizen/core/codeLayer/
├── index.js                          # Main entry point
├── types.js                          # ParsedMessage type definition
├── tokenizer.js                      # Tokenization
├── markerDetector.js                 # Marker detection
├── primitiveMapper.js                # Conceptual primitives
├── vectorIdentifier.js               # Communication vector
├── axiomChecker.js                   # Axiom orchestrator
├── assessmentGen.js                  # Assessment generator
├── responseValidator.js              # AI response validation
└── axioms/
    ├── index.js                      # Axiom registry
    ├── indirect/
    │   ├── displacedAccusation.js    # AXIOM_001
    │   ├── falseOffering.js          # AXIOM_002
    │   ├── innocentInquiry.js        # AXIOM_003
    │   ├── weaponizedAgreement.js    # AXIOM_004
    │   ├── virtuousSelfReference.js  # AXIOM_005
    │   ├── preemptiveDenial.js       # AXIOM_007
    │   ├── reluctantCompliance.js    # AXIOM_008
    │   ├── childAsMessenger.js       # AXIOM_010
    │   ├── concernedQuestion.js      # AXIOM_012
    │   └── hypotheticalAccusation.js # AXIOM_016
    ├── contextual/
    │   ├── proximityClaim.js         # AXIOM_C001
    │   ├── newPartnerThreat.js       # AXIOM_C002
    │   ├── freshSeparation.js        # AXIOM_C005
    │   └── incomeLeverage.js         # AXIOM_C007
    └── clean/
        ├── cleanRequest.js           # AXIOM_D001
        └── cleanInformation.js       # AXIOM_D002
```

### Files to Modify

```
/src/liaizen/core/mediator.js         # Integrate codeLayer
/src/liaizen/index.js                 # Export codeLayer
/ai-mediation-constitution.md         # Add Code Layer section
```

---

## Validation Checklist

- [ ] **Architecture Compliance**: Follows existing `/src/liaizen/` structure
- [ ] **Constitution Compliance**: AI references Axioms correctly
- [ ] **Performance**: Code layer <100ms, total <500ms
- [ ] **Test Coverage**: Each Axiom has unit tests
- [ ] **Backwards Compatible**: Legacy system remains functional
- [ ] **Monitoring**: Metrics logged for all analyses

---

## Success Metrics (Week 8)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Code Layer Latency (p95) | <100ms | Instrumentation |
| AI Call Rate | <40% | Monitoring |
| Axiom Precision | >95% | Manual review |
| User Satisfaction | >80% | In-app feedback |
| Cost Reduction | >50% | API usage |

---

## Next Steps

1. **Review** this plan with engineering team
2. **Create** `/src/liaizen/core/codeLayer/` directory structure
3. **Start Phase 1**: Build tokenizer, marker detector, primitive mapper
4. **Test incrementally**: Each component before moving to next

---

*This plan implements Feature Spec 004 using Spec-Driven Development methodology.*
