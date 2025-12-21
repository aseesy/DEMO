# Tasks: Hybrid AI Mediation Engine

**Feature ID**: 004
**Version**: 1.0.0
**Created**: 2025-11-29
**Based on**: plan.md v1.0.0, spec.md v1.0.0

---

## Task Summary

This task breakdown implements the 5-phase plan to build the Hybrid AI Mediation Engine, transforming the current AI-only mediation system into a two-layer architecture (Code Layer + AI Layer).

**Total Tasks**: 48
**Estimated Duration**: 8 weeks
**Critical Path**: Tasks 001-016 (foundation + axiom system)

---

## Task Summary Table

| ID                                              | Title                                                | Type           | Priority | Complexity | Dependencies  | Est. Hours |
| ----------------------------------------------- | ---------------------------------------------------- | -------------- | -------- | ---------- | ------------- | ---------- |
| **Phase 1: Code Layer Foundation (Week 1-2)**   |
| 001                                             | Create ParsedMessage type definition                 | infrastructure | critical | small      | -             | 1          |
| 002                                             | Create Tokenizer module                              | feature        | critical | medium     | 001           | 4          |
| 003                                             | Create Marker Detector module                        | feature        | critical | medium     | 002           | 3          |
| 004                                             | Create Primitive Mapper module                       | feature        | critical | medium     | 002, 003      | 4          |
| 005                                             | Create Vector Identifier module                      | feature        | critical | medium     | 002, 003, 004 | 4          |
| 006                                             | Create Assessment Generator module                   | feature        | critical | medium     | 005           | 3          |
| 007                                             | Create Code Layer entry point (index.js)             | infrastructure | critical | medium     | 002-006       | 3          |
| 008                                             | Unit tests for Tokenizer                             | test           | high     | small      | 002           | 2          |
| 009                                             | Unit tests for Marker Detector                       | test           | high     | small      | 003           | 2          |
| 010                                             | Unit tests for Primitive Mapper                      | test           | high     | small      | 004           | 2          |
| 011                                             | Unit tests for Vector Identifier                     | test           | high     | small      | 005           | 2          |
| 012                                             | Performance benchmarks for Code Layer                | test           | high     | small      | 007           | 2          |
| **Phase 2: Axiom System (Week 3-4)**            |
| 013                                             | Create Axiom Registry infrastructure                 | infrastructure | critical | small      | 001           | 2          |
| 014                                             | Implement AXIOM_001 (Displaced Accusation)           | feature        | critical | medium     | 013           | 3          |
| 015                                             | Implement AXIOM_002 (False Offering)                 | feature        | high     | medium     | 013           | 3          |
| 016                                             | Implement AXIOM_003 (Innocent Inquiry)               | feature        | high     | medium     | 013           | 3          |
| 017                                             | Implement AXIOM_004 (Weaponized Agreement)           | feature        | critical | medium     | 013           | 3          |
| 018                                             | Implement AXIOM_005 (Virtuous Self-Reference)        | feature        | high     | medium     | 013           | 3          |
| 019                                             | Implement AXIOM_007 (Pre-emptive Denial)             | feature        | high     | medium     | 013           | 3          |
| 020                                             | Implement AXIOM_008 (Reluctant Compliance)           | feature        | high     | medium     | 013           | 3          |
| 021                                             | Implement AXIOM_010 (Child as Messenger)             | feature        | critical | medium     | 013           | 3          |
| 022                                             | Implement AXIOM_012 (Concerned Question)             | feature        | high     | medium     | 013           | 3          |
| 023                                             | Implement AXIOM_016 (Hypothetical Accusation)        | feature        | high     | medium     | 013           | 3          |
| 024                                             | Implement AXIOM_C001 (Proximity Claim)               | feature        | medium   | medium     | 013           | 3          |
| 025                                             | Implement AXIOM_C002 (New Partner Threat)            | feature        | medium   | medium     | 013           | 3          |
| 026                                             | Implement AXIOM_C005 (Fresh Separation)              | feature        | medium   | medium     | 013           | 3          |
| 027                                             | Implement AXIOM_C007 (Income Leverage)               | feature        | medium   | medium     | 013           | 3          |
| 028                                             | Implement AXIOM_D001 (Clean Request)                 | feature        | critical | medium     | 013           | 3          |
| 029                                             | Implement AXIOM_D002 (Clean Information)             | feature        | critical | medium     | 013           | 3          |
| 030                                             | Create Axiom Checker orchestrator                    | infrastructure | critical | medium     | 014-029       | 3          |
| 031                                             | Unit tests for each Axiom                            | test           | critical | large      | 014-029       | 8          |
| 032                                             | Integration tests for Axiom Checker                  | test           | high     | medium     | 030           | 3          |
| **Phase 3: AI Integration (Week 5-6)**          |
| 033                                             | Update AI system prompt with ParsedMessage structure | feature        | critical | medium     | 007, 030      | 3          |
| 034                                             | Build mediationContext formatter                     | feature        | critical | small      | 033           | 2          |
| 035                                             | Integrate Code Layer into mediator.js                | infrastructure | critical | large      | 007, 030, 033 | 6          |
| 036                                             | Create AI Response Validator                         | feature        | critical | medium     | 033           | 3          |
| 037                                             | Implement quick-pass optimization                    | feature        | high     | small      | 035           | 2          |
| 038                                             | Update constitution.md with Code Layer rules         | documentation  | high     | small      | 013-029       | 2          |
| 039                                             | Integration tests for hybrid flow                    | test           | critical | large      | 035           | 6          |
| 040                                             | Test Axiom references in AI responses                | test           | high     | medium     | 036           | 3          |
| **Phase 4: Deployment & Monitoring (Week 7-8)** |
| 041                                             | Add metrics logging to Code Layer                    | infrastructure | high     | small      | 007           | 2          |
| 042                                             | Create metrics dashboard queries                     | infrastructure | medium   | small      | 041           | 2          |
| 043                                             | Implement A/B test framework                         | infrastructure | high     | medium     | 035           | 4          |
| 044                                             | Create fallback handling for Code Layer failures     | infrastructure | critical | medium     | 035           | 3          |
| 045                                             | Performance profiling and optimization               | refactor       | high     | medium     | 035, 041      | 4          |
| 046                                             | Load testing (1000 messages/sec target)              | test           | high     | medium     | 045           | 3          |
| 047                                             | Documentation for adding new Axioms                  | documentation  | medium   | small      | 030           | 2          |
| 048                                             | End-to-end validation with production data           | test           | critical | large      | 043           | 6          |

---

## Detailed Task Breakdowns

### Phase 1: Code Layer Foundation (Week 1-2)

#### Task 001: Create ParsedMessage type definition

**Type**: infrastructure
**Priority**: critical
**Complexity**: small (1h)
**Dependencies**: None

**Description**:
Create the TypeScript/JSDoc type definition for the ParsedMessage structure that will be passed from the Code Layer to the AI Layer.

**File**: `/Users/athenasees/Desktop/chat/chat-server/src/liaizen/core/codeLayer/types.js`

**Acceptance Criteria**:

- [ ] File created with complete ParsedMessage structure
- [ ] Includes all fields: raw, linguistic, conceptual, vector, axioms_fired, assessment, meta
- [ ] JSDoc comments for each field
- [ ] Example ParsedMessage object included in comments
- [ ] Matches structure defined in plan.md Step 1.1

**Technical Notes**:

- Use JSDoc for type definitions (Node.js project)
- Include version field in meta
- Document expected value ranges (e.g., confidence: 0-100)

---

#### Task 002: Create Tokenizer module

**Type**: feature
**Priority**: critical
**Complexity**: medium (4h)
**Dependencies**: 001

**Description**:
Build the Tokenizer module that breaks messages into tagged tokens with linguistic metadata (pronouns, verbs, intensifiers, etc.).

**File**: `/Users/athenasees/Desktop/chat/chat-server/src/liaizen/core/codeLayer/tokenizer.js`

**Acceptance Criteria**:

- [ ] Function `tokenize(text)` returns array of Token objects
- [ ] Each token tagged with: word, pos (part of speech), index
- [ ] Special tags: addressee (you), speaker (I), intensifier, softener, absolute
- [ ] Handles contractions (you're, I'm, etc.)
- [ ] Processes text in <10ms for 100-word message
- [ ] Empty/null input handling

**Technical Notes**:

- Reuse patterns from existing `structure.js` where possible
- Simple regex-based POS tagging (no NLP library needed for MVP)
- Focus on accuracy for co-parenting vocabulary
- Example output:
  ```javascript
  tokenize('You NEVER help with homework')[
    // Returns:
    ({ word: 'You', pos: 'pronoun', addressee: true, index: 0 },
    { word: 'NEVER', pos: 'adverb', intensifier: true, absolute: true, index: 1 },
    { word: 'help', pos: 'verb', action: true, index: 2 },
    { word: 'with', pos: 'preposition', index: 3 },
    { word: 'homework', pos: 'noun', domain: 'child_education', index: 4 })
  ];
  ```

**Risk Factors**:

- Performance bottleneck if tokenization is too complex
- Mitigation: Keep regex-based, benchmark early

---

#### Task 003: Create Marker Detector module

**Type**: feature
**Priority**: critical
**Complexity**: medium (3h)
**Dependencies**: 002

**Description**:
Consolidate existing pattern modules (hedging.js, globalSpecific.js) into a unified Marker Detector that extracts linguistic markers.

**File**: `/Users/athenasees/Desktop/chat/chat-server/src/liaizen/core/codeLayer/markerDetector.js`

**Acceptance Criteria**:

- [ ] Function `detect(text, tokens)` returns marker object
- [ ] Returns: softeners[], intensifiers[], pattern_markers[], contrast_markers[], negations[]
- [ ] Reuses existing patterns from language-analyzer
- [ ] Processes in <5ms
- [ ] Unit tests for all marker types

**Technical Notes**:

- Import and consolidate:
  - `hedging.js` → softeners[]
  - `globalSpecific.js` → intensifiers[], pattern_markers[]
  - Add contrast_markers[] (but, however, although)
  - Add negations[] (not, never, no)
- Example:
  ```javascript
  detect("I'm just worried, but you never listen")
  // Returns:
  {
    softeners: ["just"],
    intensifiers: ["never"],
    pattern_markers: ["never"],
    contrast_markers: ["but"],
    negations: []
  }
  ```

---

#### Task 004: Create Primitive Mapper module

**Type**: feature
**Priority**: critical
**Complexity**: medium (4h)
**Dependencies**: 002, 003

**Description**:
Map tokens and markers to conceptual primitives (speaker presence, addressee, temporal focus, epistemic stance, domain).

**File**: `/Users/athenasees/Desktop/chat/chat-server/src/liaizen/core/codeLayer/primitiveMapper.js`

**Acceptance Criteria**:

- [ ] Function `map(tokens, markers, context)` returns conceptual object
- [ ] Detects: speaker (bool), addressee (bool), third_party[], temporal, epistemic, domain
- [ ] Temporal: past/present/future
- [ ] Epistemic: fact/interpretation/unknown
- [ ] Domain: schedule/money/parenting/character/logistics
- [ ] Processes in <15ms

**Technical Notes**:

- Use token tags to detect speaker/addressee presence
- Temporal detection from verb tenses
- Epistemic: "I think" = interpretation, "She missed" = fact
- Domain keywords:
  - schedule: pickup, dropoff, custody, time
  - money: payment, child support, expenses
  - parenting: homework, discipline, rules
  - character: you are, you're, always, never

**Example**:

```javascript
map(tokens, markers, {})
// For: "You need to change your behavior"
// Returns:
{
  speaker: true,        // "I" implied (speaker exists)
  addressee: true,      // "you" present
  third_party: [],
  temporal: "present",
  epistemic: "interpretation", // "need to" is judgment
  domain: "character"   // "your behavior"
}
```

---

#### Task 005: Create Vector Identifier module

**Type**: feature
**Priority**: critical
**Complexity**: medium (4h)
**Dependencies**: 002, 003, 004

**Description**:
Identify the communication vector: sender → receiver → target via instrument.

**File**: `/Users/athenasees/Desktop/chat/chat-server/src/liaizen/core/codeLayer/vectorIdentifier.js`

**Acceptance Criteria**:

- [ ] Function `identify(tokens, conceptual, context)` returns vector object
- [ ] Returns: sender, receiver, target, instrument, aim
- [ ] Target: character/competence/autonomy/parenting/unclear
- [ ] Instrument: child/money/schedule/third_party/null
- [ ] Aim: attack/control/inform/request/defend
- [ ] Processes in <20ms

**Technical Notes**:

- Use context for sender/receiver IDs
- Target detection patterns:
  - character: "you are", "you're", "kind of person"
  - competence: "you forgot", "you can't", "you failed"
  - autonomy: "you should", "you need to", "you must"
  - parenting: "as a parent", "your parenting"
- Instrument detection:
  - child: "she said", "he told me", "the kids want"
  - money: "child support", "payment", "afford"
  - schedule: "your time", "pickup", "custody"

**Example**:

```javascript
identify(tokens, conceptual, { senderId: "alice", receiverId: "bob" })
// For: "She said you forgot to sign the permission slip"
// Returns:
{
  sender: "alice",
  receiver: "bob",
  target: "competence",     // "you forgot"
  instrument: "child",      // "she said"
  aim: "attack"
}
```

---

#### Task 006: Create Assessment Generator module

**Type**: feature
**Priority**: critical
**Complexity**: medium (3h)
**Dependencies**: 005

**Description**:
Generate final assessment including conflict potential, attack surface, child involvement, and transmission decision.

**File**: `/Users/athenasees/Desktop/chat/chat-server/src/liaizen/core/codeLayer/assessmentGen.js`

**Acceptance Criteria**:

- [ ] Function `generate({axioms_fired, vector, markers, conceptual})` returns assessment
- [ ] Returns: conflict_potential, attack_surface[], child_as_instrument, deniability, transmit
- [ ] conflict_potential: low/moderate/high based on axioms
- [ ] attack_surface: array of character/competence/autonomy/parenting
- [ ] deniability: low/high based on softeners
- [ ] transmit: true if safe to pass without AI
- [ ] Processes in <10ms

**Technical Notes**:

- High-risk axioms: AXIOM_001, AXIOM_010, AXIOM_016
- Indirect axioms → moderate conflict
- Clean axioms only → transmit: true
- Softeners present → high deniability

**Example**:

```javascript
generate({
  axioms_fired: [{ id: 'AXIOM_001', category: 'indirect_communication' }],
  vector: { target: 'competence', instrument: 'child' },
  markers: { softeners: ['just'] },
  conceptual: {}
})
// Returns:
{
  conflict_potential: 'high',
  attack_surface: ['competence'],
  child_as_instrument: true,
  deniability: 'high',
  transmit: false
}
```

---

#### Task 007: Create Code Layer entry point (index.js)

**Type**: infrastructure
**Priority**: critical
**Complexity**: medium (3h)
**Dependencies**: 002-006

**Description**:
Create main entry point that orchestrates all Code Layer modules into a single `parse()` function.

**File**: `/Users/athenasees/Desktop/chat/chat-server/src/liaizen/core/codeLayer/index.js`

**Acceptance Criteria**:

- [ ] Function `parse(messageText, context)` returns complete ParsedMessage
- [ ] Orchestrates: tokenizer → markerDetector → primitiveMapper → vectorIdentifier → axiomChecker → assessmentGen
- [ ] Includes latency_ms in meta
- [ ] Total processing time <100ms for typical message
- [ ] Exports VERSION constant
- [ ] Handles errors gracefully (returns partial ParsedMessage with error flag)

**Technical Notes**:

- Sequential execution (no async needed for Phase 1)
- Track performance of each step
- Log slow operations (>50ms)
- Example usage:
  ```javascript
  const codeLayer = require('./codeLayer');
  const parsed = await codeLayer.parse('You never help with homework', {
    senderId: 'alice',
    receiverId: 'bob',
    childNames: ['Emma'],
  });
  // Returns complete ParsedMessage object
  ```

---

#### Tasks 008-012: Testing & Performance

**Task 008**: Unit tests for Tokenizer (2h)

- Test pronouns, intensifiers, softeners, absolutes
- Edge cases: empty string, contractions, special characters
- Performance: 100 test messages in <1 second

**Task 009**: Unit tests for Marker Detector (2h)

- Test all marker types (softeners, intensifiers, contrast, negations)
- Test consolidation from existing patterns
- Verify <5ms performance

**Task 010**: Unit tests for Primitive Mapper (2h)

- Test speaker/addressee detection
- Test temporal/epistemic/domain classification
- Test with varied message types

**Task 011**: Unit tests for Vector Identifier (2h)

- Test target detection (character, competence, autonomy, parenting)
- Test instrument detection (child, money, schedule)
- Test aim inference (attack, control, inform, request)

**Task 012**: Performance benchmarks for Code Layer (2h)

- Create benchmark suite with 100+ real messages
- Measure p50, p95, p99 latencies
- Verify total latency <100ms for 95% of messages
- Identify bottlenecks for optimization

---

### Phase 2: Axiom System (Week 3-4)

#### Task 013: Create Axiom Registry infrastructure

**Type**: infrastructure
**Priority**: critical
**Complexity**: small (2h)
**Dependencies**: 001

**Description**:
Create the Axiom Registry that loads and organizes all axiom modules.

**File**: `/Users/athenasees/Desktop/chat/chat-server/src/liaizen/core/codeLayer/axioms/index.js`

**Acceptance Criteria**:

- [ ] AXIOM_REGISTRY object maps IDs to axiom modules
- [ ] Organized by category: indirect/, contextual/, clean/
- [ ] Exports registry for use in axiomChecker
- [ ] Each axiom exports: id, name, category, check() function
- [ ] Documentation on adding new axioms

**Technical Notes**:

- Structure:
  ```javascript
  const AXIOM_REGISTRY = {
    AXIOM_001: require('./indirect/displacedAccusation'),
    AXIOM_002: require('./indirect/falseOffering'),
    // ... etc
  };
  ```

---

#### Task 014: Implement AXIOM_001 (Displaced Accusation)

**Type**: feature
**Priority**: critical
**Complexity**: medium (3h)
**Dependencies**: 013

**Description**:
Implement the Displaced Accusation axiom: uses child's negative state to imply blame toward receiver.

**File**: `/Users/athenasees/Desktop/chat/chat-server/src/liaizen/core/codeLayer/axioms/indirect/displacedAccusation.js`

**Pattern**: Reports [negative state] of [Child] + Linked to [Receiver Domain] + [Softener]

**Example**: "She's been upset since you changed the schedule"

**Acceptance Criteria**:

- [ ] Function `check(parsed, context)` returns AxiomResult
- [ ] Detects: child reference + negative emotional state + receiver link
- [ ] Confidence: 90 if softener present, 75 otherwise
- [ ] Returns evidence object with child_mentioned, negative_state, receiver_link
- [ ] Returns `{ fired: false }` if pattern not detected
- [ ] Unit tests with 5+ positive and 5+ negative examples

**Technical Notes**:

- Negative states: upset, crying, worried, sad, anxious, struggling, unhappy, stressed
- Receiver links: "since you", "after you", "because you", "when you", "ever since"
- Child pronouns: she, he, they, the kids, the children
- Use conceptual.third_party to detect child references

**Test Cases**:

```javascript
// POSITIVE (should fire)
"She's been crying since you picked her up"
"He's worried because you changed the schedule"
"They're struggling after you moved"

// NEGATIVE (should NOT fire)
"She had a great time at your house"
"He's excited about the schedule"
"I'm worried about the schedule" (no child)
```

---

#### Task 015-023: Implement Indirect Communication Axioms (3h each)

**Task 015**: AXIOM_002 (False Offering)

- Pattern: Offer + Conditionality + Burdens Receiver
- Example: "I can do it, but it means changing everything"
- File: `axioms/indirect/falseOffering.js`

**Task 016**: AXIOM_003 (Innocent Inquiry)

- Pattern: Question about [Receiver Action] + [Softener]
- Example: "Just wondering why you didn't tell me?"
- File: `axioms/indirect/innocentInquiry.js`

**Task 017**: AXIOM_004 (Weaponized Agreement)

- Pattern: Agreement + "But" + [Negative State]
- Example: "I agree we should be consistent, but you never follow through"
- File: `axioms/indirect/weaponizedAgreement.js`

**Task 018**: AXIOM_005 (Virtuous Self-Reference)

- Pattern: Praise Self ("I'm reasonable") + Conflict Context
- Example: "I'm always willing to compromise, unlike some people"
- File: `axioms/indirect/virtuousSelfReference.js`

**Task 019**: AXIOM_007 (Pre-emptive Denial)

- Pattern: Denial of trait ("I'm not trying to...") + Contrast
- Example: "I'm not trying to control you, but you need to..."
- File: `axioms/indirect/preemptiveDenial.js`

**Task 020**: AXIOM_008 (Reluctant Compliance)

- Pattern: Agreement + Hesitation ("I guess") + Sigh
- Example: "I guess I'll do it, if that's what you want"
- File: `axioms/indirect/reluctantCompliance.js`

**Task 021**: AXIOM_010 (Child as Messenger)

- Pattern: Sender quotes Child's negative view of Receiver
- Example: "She said you forgot to pick her up again"
- File: `axioms/indirect/childAsMessenger.js`

**Task 022**: AXIOM_012 (Concerned Question)

- Pattern: Question about Child State + Follows Receiver Time
- Example: "How did she seem after your weekend?"
- File: `axioms/indirect/concernedQuestion.js`

**Task 023**: AXIOM_016 (Hypothetical Accusation)

- Pattern: "Imagine if..." + Mirrors Receiver behavior
- Example: "Imagine if I forgot her every week like you do"
- File: `axioms/indirect/hypotheticalAccusation.js`

---

#### Task 024-027: Implement Contextual Axioms (3h each)

**Task 024**: AXIOM_C001 (Proximity Claim)

- Pattern: Sender closer to school + Claims logistics
- Requires context flag: distance_to_school
- File: `axioms/contextual/proximityClaim.js`

**Task 025**: AXIOM_C002 (New Partner Threat)

- Pattern: Receiver has New Partner + Sender references Child Confusion
- Requires context flag: new_partner_present
- File: `axioms/contextual/newPartnerThreat.js`

**Task 026**: AXIOM_C005 (Fresh Separation)

- Pattern: Separation < 12 months → High Volatility/Grief
- Requires context: separation_date
- File: `axioms/contextual/freshSeparation.js`

**Task 027**: AXIOM_C007 (Income Leverage)

- Pattern: Income Disparity High + Earner offers financial fix
- Requires context: income_disparity_high
- File: `axioms/contextual/incomeLeverage.js`

---

#### Task 028-029: Implement Clean Axioms (3h each)

**Task 028**: AXIOM_D001 (Clean Request)

- Pattern: Specific + Actionable + No excessive softeners
- Example: "Can you pick her up at 3pm?"
- File: `axioms/clean/cleanRequest.js`
- **Note**: Clean axioms should have confidence 95+

**Task 029**: AXIOM_D002 (Clean Information)

- Pattern: Verifiable Fact + Relevant + No Pattern Markers
- Example: "Practice is at 5pm on Tuesday"
- File: `axioms/clean/cleanInformation.js`

---

#### Task 030: Create Axiom Checker orchestrator

**Type**: infrastructure
**Priority**: critical
**Complexity**: medium (3h)
**Dependencies**: 014-029

**Description**:
Create the orchestrator that runs all axioms and collects results.

**File**: `/Users/athenasees/Desktop/chat/chat-server/src/liaizen/core/codeLayer/axiomChecker.js`

**Acceptance Criteria**:

- [ ] Function `checkAll(parsed, context)` returns { axioms_fired[], meta }
- [ ] Runs all axioms in parallel (Promise.all)
- [ ] Filters out non-firing axioms
- [ ] Sorts results by confidence (highest first)
- [ ] Returns metadata: total_checked, total_fired, latency_ms
- [ ] Handles axiom check errors gracefully
- [ ] Completes in <30ms for all axioms

**Technical Notes**:

```javascript
async function checkAll(parsed, context) {
  const axiomPromises = Object.entries(AXIOM_REGISTRY).map(async ([id, axiom]) => {
    try {
      const result = axiom.check(parsed, context);
      if (result.fired) return result;
    } catch (error) {
      console.error(`Error checking ${id}:`, error.message);
    }
    return null;
  });

  const axiomResults = await Promise.all(axiomPromises);
  const firedAxioms = axiomResults
    .filter(r => r !== null)
    .sort((a, b) => b.confidence - a.confidence);

  return {
    axioms_fired: firedAxioms,
    meta: {
      total_checked: Object.keys(AXIOM_REGISTRY).length,
      total_fired: firedAxioms.length,
      latency_ms: Date.now() - startTime,
    },
  };
}
```

---

#### Task 031-032: Axiom Testing

**Task 031**: Unit tests for each Axiom (8h)

- Create test suite for EACH axiom (15 axioms total)
- Each axiom needs:
  - 5+ positive test cases (should fire)
  - 5+ negative test cases (should NOT fire)
  - Edge cases (empty, null, ambiguous)
  - Confidence score validation
- File: `axioms/__tests__/axioms.test.js`

**Task 032**: Integration tests for Axiom Checker (3h)

- Test multiple axioms firing simultaneously
- Test axiom priority/sorting by confidence
- Test error handling when axiom check fails
- Test performance with all axioms
- File: `axioms/__tests__/axiomChecker.test.js`

---

### Phase 3: AI Integration (Week 5-6)

#### Task 033: Update AI system prompt with ParsedMessage structure

**Type**: feature
**Priority**: critical
**Complexity**: medium (3h)
**Dependencies**: 007, 030

**Description**:
Update the AI system prompt in mediator.js to receive and use ParsedMessage structure from the Code Layer.

**File**: `/Users/athenasees/Desktop/chat/chat-server/src/liaizen/core/mediator.js`

**Acceptance Criteria**:

- [ ] New function `buildSystemPrompt(parsedMessage, profiles, context)`
- [ ] Prompt includes ParsedMessage JSON structure
- [ ] Instructs AI to reference Axioms that fired
- [ ] Instructs AI to use "observer voice" with structural language
- [ ] Includes examples of Axiom-aware responses
- [ ] References constitution rules for Code Layer integration
- [ ] AI must explain Intent vs Impact Delta

**Technical Notes**:

- Prompt sections:
  1. System role (Observer, not judge)
  2. ParsedMessage structure explanation
  3. User context (profiles, history)
  4. Observer Voice requirements
  5. Coaching framework (1-2-3 with Axiom references)
  6. Decision logic based on assessment.transmit
- Example prompt snippet:

  ```
  # PARSED MESSAGE STRUCTURE
  ${JSON.stringify(parsedMessage, null, 2)}

  # YOUR ROLE
  1. Read the structural analysis (axioms_fired, vector, assessment)
  2. Apply user context (profiles, history)
  3. Derive the legitimate need behind the message
  4. Speak in "observer voice" - name structures, not emotions
  5. Reference specific Axioms that fired
  6. Provide coaching that addresses the structural pattern
  ```

---

#### Task 034: Build mediationContext formatter

**Type**: feature
**Priority**: critical
**Complexity**: small (2h)
**Dependencies**: 033

**Description**:
Create helper function to format mediation context for AI consumption.

**File**: `/Users/athenasees/Desktop/chat/chat-server/src/liaizen/core/mediationContext.js`

**Acceptance Criteria**:

- [ ] Function `formatMediationContext(parsed, profiles, roleContext)` returns formatted string
- [ ] Includes ParsedMessage summary
- [ ] Includes sender/receiver profile highlights
- [ ] Includes relationship insights
- [ ] Clear, concise formatting for AI readability
- [ ] Handles missing data gracefully

---

#### Task 035: Integrate Code Layer into mediator.js

**Type**: infrastructure
**Priority**: critical
**Complexity**: large (6h)
**Dependencies**: 007, 030, 033

**Description**:
Wire the Code Layer into the existing mediator.js to create the hybrid flow.

**File**: `/Users/athenasees/Desktop/chat/chat-server/src/liaizen/core/mediator.js`

**Acceptance Criteria**:

- [ ] Import codeLayer module
- [ ] Call `codeLayer.parse()` before AI analysis
- [ ] Quick pass: if `assessment.transmit === true && conflict_potential === 'low'`, skip AI
- [ ] Log Axioms that fired for debugging
- [ ] Pass ParsedMessage to buildSystemPrompt()
- [ ] Maintain backward compatibility (fallback to legacy if Code Layer fails)
- [ ] Total latency <500ms (p95)

**Technical Notes**:

```javascript
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

**Risk Factors**:

- Code Layer failure breaks mediation
- Mitigation: Comprehensive error handling with fallback to legacy system

---

#### Task 036: Create AI Response Validator

**Type**: feature
**Priority**: critical
**Complexity**: medium (3h)
**Dependencies**: 033

**Description**:
Validate that AI responses comply with constitution and reference Axioms correctly.

**File**: `/Users/athenasees/Desktop/chat/chat-server/src/liaizen/core/codeLayer/responseValidator.js`

**Acceptance Criteria**:

- [ ] Function `validate(aiResponse, parsed)` returns { valid, errors[], response }
- [ ] Checks personalMessage references at least one Axiom (if axioms fired)
- [ ] Checks personalMessage does NOT contain emotional diagnosis
- [ ] Checks tip1 length ≤12 words
- [ ] Checks rewrite1 and rewrite2 exist (if action=INTERVENE)
- [ ] Returns array of errors if validation fails
- [ ] Logs validation failures for monitoring

**Technical Notes**:

- Forbidden emotional terms: "you're angry", "you seem frustrated", "you feel", "you're upset"
- Required Axiom reference: personalMessage must include Axiom ID or name if axioms_fired.length > 0
- Example:
  ```javascript
  validate(aiResponse, parsed)
  // Returns:
  {
    valid: false,
    errors: [
      'personalMessage should reference fired Axiom',
      'personalMessage contains emotional diagnosis: "you\'re angry"'
    ],
    response: aiResponse
  }
  ```

---

#### Task 037: Implement quick-pass optimization

**Type**: feature
**Priority**: high
**Complexity**: small (2h)
**Dependencies**: 035

**Description**:
Optimize the quick-pass logic to minimize AI calls for clean messages.

**File**: `/Users/athenasees/Desktop/chat/chat-server/src/liaizen/core/mediator.js` (update)

**Acceptance Criteria**:

- [ ] Clean messages (AXIOM_D001, AXIOM_D002 only) pass without AI call
- [ ] Positive messages pre-approved (existing positive sentiment filter remains)
- [ ] Metrics logged: quick_pass_rate, ai_call_rate
- [ ] Target: AI call rate <40% of total messages
- [ ] No false negatives (don't miss hostile messages)

**Technical Notes**:

```javascript
if (parsed.assessment.transmit) {
  // Only clean axioms fired (or no axioms)
  const cleanOnly = parsed.axioms_fired.every(a => a.category === 'clean');
  if (cleanOnly || parsed.axioms_fired.length === 0) {
    console.log('✅ Quick pass: Clean message');
    return null;
  }
}
```

---

#### Task 038: Update constitution.md with Code Layer rules

**Type**: documentation
**Priority**: high
**Complexity**: small (2h)
**Dependencies**: 013-029

**Description**:
Add Part VII to constitution.md documenting Code Layer integration requirements.

**File**: `/Users/athenasees/Desktop/chat/chat-server/ai-mediation-constitution.md`

**Acceptance Criteria**:

- [ ] New Part VII section added
- [ ] Documents Axiom implementation requirements
- [ ] Documents AI's responsibility to reference Axioms
- [ ] Provides examples of Axiom citations
- [ ] Explains Intent vs Impact Delta requirement
- [ ] Includes table of all 15 implemented Axioms

**Example Section**:

```markdown
## Part VII: Code Layer Integration

### Axiom Implementation Requirements

All Axioms MUST be implemented in code before being referenced by AI.

**AI References**:
When AI cites an Axiom, it MUST:

1. Use the exact Axiom ID (e.g., "AXIOM 001")
2. Include the Axiom name (e.g., "Displaced Accusation")
3. Explain the structural pattern detected
4. State the Intent vs Impact Delta

**Example**:
"AXIOM 001 fires: Displaced Accusation. Using child's state to imply blame
will land as triangulation, putting the child between you."
```

---

#### Tasks 039-040: Testing

**Task 039**: Integration tests for hybrid flow (6h)

- Test complete flow: Code Layer → AI → Response
- Test quick-pass for clean messages
- Test AI receives ParsedMessage correctly
- Test fallback to legacy on Code Layer failure
- Test latency targets (<500ms p95)
- File: `core/__tests__/hybridFlow.test.js`

**Task 040**: Test Axiom references in AI responses (3h)

- Send 20+ test messages that should trigger axioms
- Verify AI responses cite correct Axiom IDs
- Verify personalMessage explains Intent vs Impact
- Track false positives/negatives
- File: `core/__tests__/axiomReferences.test.js`

---

### Phase 4: Deployment & Monitoring (Week 7-8)

#### Task 041: Add metrics logging to Code Layer

**Type**: infrastructure
**Priority**: high
**Complexity**: small (2h)
**Dependencies**: 007

**Description**:
Add comprehensive metrics logging to track Code Layer performance.

**File**: `/Users/athenasees/Desktop/chat/chat-server/src/liaizen/core/codeLayer/index.js` (update)

**Acceptance Criteria**:

- [ ] Log metrics object for each parse operation
- [ ] Metrics include: timestamp, message_length, code_layer_latency_ms, axioms_checked, axioms_fired (IDs), conflict_potential, transmit_decision, ai_call_required
- [ ] Metrics exported to monitoring system (console.log for now, later structured logging)
- [ ] Metrics include performance breakdown by component

**Example Metrics**:

```javascript
const metrics = {
  timestamp: new Date().toISOString(),
  message_length: messageText.length,
  code_layer_latency_ms: latency,
  axioms_checked: axiomResult.meta.total_checked,
  axioms_fired: axiomResult.axioms_fired.map(a => a.id),
  conflict_potential: assessment.conflict_potential,
  transmit_decision: assessment.transmit,
  ai_call_required: !assessment.transmit,
};

console.log('📊 [CodeLayer]', JSON.stringify(metrics));
```

---

#### Task 042: Create metrics dashboard queries

**Type**: infrastructure
**Priority**: medium
**Complexity**: small (2h)
**Dependencies**: 041

**Description**:
Create SQL/log queries to generate metrics dashboard views.

**File**: `/Users/athenasees/Desktop/chat/chat-server/scripts/metrics-queries.sql`

**Acceptance Criteria**:

- [ ] Query: Axiom fire rate distribution
- [ ] Query: AI call rate over time
- [ ] Query: Average Code Layer latency (p50, p95, p99)
- [ ] Query: Most common axioms fired
- [ ] Query: Messages by conflict_potential level
- [ ] Documentation on how to run queries

---

#### Task 043: Implement A/B test framework

**Type**: infrastructure
**Priority**: high
**Complexity**: medium (4h)
**Dependencies**: 035

**Description**:
Create A/B test framework to gradually roll out hybrid system.

**File**: `/Users/athenasees/Desktop/chat/chat-server/src/liaizen/core/abTest.js`

**Acceptance Criteria**:

- [ ] Function `shouldUseHybrid(userId)` returns boolean
- [ ] Consistent assignment (same user always gets same variant)
- [ ] Configurable rollout percentage (default 10%)
- [ ] Logging of variant assignment
- [ ] Integration with mediator.js to switch between hybrid/legacy

**Technical Notes**:

```javascript
const AB_TEST_RATIO = 0.1; // 10% get hybrid system

function shouldUseHybrid(userId) {
  // Hash user ID for consistent assignment
  const hash = hashCode(userId);
  return (hash % 100) < (AB_TEST_RATIO * 100);
}

// Usage in mediator.js
if (shouldUseHybrid(senderId)) {
  result = await hybridAnalyzeMessage(message, ...);
} else {
  result = await legacyAnalyzeMessage(message, ...);
}
```

---

#### Task 044: Create fallback handling for Code Layer failures

**Type**: infrastructure
**Priority**: critical
**Complexity**: medium (3h)
**Dependencies**: 035

**Description**:
Implement robust fallback to legacy system when Code Layer fails.

**File**: `/Users/athenasees/Desktop/chat/chat-server/src/liaizen/core/mediator.js` (update)

**Acceptance Criteria**:

- [ ] Try-catch around codeLayer.parse() call
- [ ] On error, log error and fall back to legacy AI analysis
- [ ] Track fallback rate in metrics
- [ ] Alert if fallback rate >5%
- [ ] No user-facing errors (graceful degradation)

**Technical Notes**:

```javascript
let parsed = null;
try {
  parsed = await codeLayer.parse(message.text, context);
} catch (error) {
  console.error('❌ Code Layer failed, using legacy:', error.message);
  metrics.codeLayerFailure = true;
  // Fall back to legacy AI analysis
  return await legacyAnalyzeMessage(message, ...);
}
```

---

#### Task 045: Performance profiling and optimization

**Type**: refactor
**Priority**: high
**Complexity**: medium (4h)
**Dependencies**: 035, 041

**Description**:
Profile the hybrid system and optimize bottlenecks.

**Acceptance Criteria**:

- [ ] Identify slowest components (use metrics from Task 041)
- [ ] Optimize any component >50ms
- [ ] Cache repeated computations (e.g., regex compilation)
- [ ] Reduce memory allocations
- [ ] Target: p95 latency <100ms for Code Layer
- [ ] Target: p95 latency <500ms total (Code + AI)

**Optimization Targets**:

- Tokenizer: Compile regexes once, reuse
- Axiom Checker: Parallel execution, early exit for clean messages
- Marker Detector: Optimize regex patterns

---

#### Task 046: Load testing (1000 messages/sec target)

**Type**: test
**Priority**: high
**Complexity**: medium (3h)
**Dependencies**: 045

**Description**:
Perform load testing to ensure system handles production scale.

**File**: `/Users/athenasees/Desktop/chat/chat-server/tests/load/codeLayerLoad.test.js`

**Acceptance Criteria**:

- [ ] Simulate 1000 messages/second for 60 seconds
- [ ] Measure: latency (p50, p95, p99), throughput, error rate
- [ ] Verify no memory leaks
- [ ] Verify latency remains <100ms at 1000 msg/sec
- [ ] Document performance characteristics

---

#### Task 047: Documentation for adding new Axioms

**Type**: documentation
**Priority**: medium
**Complexity**: small (2h)
**Dependencies**: 030

**Description**:
Create developer guide for adding new Axioms to the system.

**File**: `/Users/athenasees/Desktop/chat/chat-server/src/liaizen/core/codeLayer/axioms/README.md`

**Acceptance Criteria**:

- [ ] Step-by-step guide to creating a new Axiom
- [ ] Template code for new Axiom
- [ ] Testing requirements
- [ ] Registration process (add to index.js)
- [ ] Example: walk through creating a sample Axiom

**Sections**:

1. Axiom structure overview
2. Creating the axiom file
3. Implementing check() function
4. Writing tests
5. Adding to registry
6. Testing integration

---

#### Task 048: End-to-end validation with production data

**Type**: test
**Priority**: critical
**Complexity**: large (6h)
**Dependencies**: 043

**Description**:
Validate the hybrid system with anonymized production messages.

**Acceptance Criteria**:

- [ ] Collect 500+ anonymized production messages
- [ ] Run through hybrid system
- [ ] Compare with legacy system results
- [ ] Manual review of 100 interventions for quality
- [ ] Measure: precision, recall, user satisfaction proxy
- [ ] Target: >95% precision, >90% recall
- [ ] Document findings and recommended improvements

**Test Categories**:

- Clean messages (should pass without AI)
- Hostile messages (should intervene)
- Edge cases (ambiguous, context-dependent)
- Positive messages (should never intervene)

---

## Dependency Graph

### Critical Path (longest sequence)

```
001 → 002 → 003 → 004 → 005 → 006 → 007 → 013 → 014-029 (Axioms) → 030 → 033 → 035 → 043 → 048
```

**Estimated Critical Path Duration**: ~7 weeks

### Parallel Work Opportunities

**Week 1**:

- Main track: 001 → 002 → 003 → 004
- Parallel: 008-010 (tests for completed modules)

**Week 2**:

- Main track: 005 → 006 → 007
- Parallel: 011-012 (tests, benchmarks)

**Week 3-4**:

- Main track: 013 → 014-017 (critical axioms)
- Parallel: 018-029 (remaining axioms, can be done by multiple developers)

**Week 5**:

- Main track: 030 → 033 → 034
- Parallel: 031-032 (axiom tests), 038 (documentation)

**Week 6**:

- Main track: 035 → 036 → 037
- Parallel: 039-040 (integration tests)

**Week 7**:

- Main track: 041 → 043 → 044
- Parallel: 042, 045, 047 (metrics, docs, optimization)

**Week 8**:

- Main track: 046 → 048 (load testing, validation)
- Parallel: Final documentation, bug fixes

---

## Risk Assessment

### High-Risk Tasks

| Task | Risk                               | Impact                      | Mitigation                                       |
| ---- | ---------------------------------- | --------------------------- | ------------------------------------------------ |
| 035  | Code Layer integration failure     | Critical - breaks mediation | Comprehensive testing, fallback to legacy (044)  |
| 031  | Axiom tests reveal false positives | High - delays launch        | Iterate on axiom logic, conservative thresholds  |
| 046  | Performance below targets          | High - delays launch        | Early profiling (045), optimization sprints      |
| 048  | Production validation fails        | Critical - blocks rollout   | Thorough testing throughout, A/B framework (043) |

### Medium-Risk Tasks

| Task    | Risk                                  | Impact                      | Mitigation                                     |
| ------- | ------------------------------------- | --------------------------- | ---------------------------------------------- |
| 014-029 | Axiom implementation complexity       | Medium - delays phase 2     | Parallel work, clear patterns from first axiom |
| 033     | AI doesn't reference Axioms correctly | Medium - reduces value      | Clear prompt engineering, validation (036)     |
| 045     | Optimization insufficient             | Medium - performance issues | Start early, iterate continuously              |

---

## Success Criteria (Post-Implementation)

### Week 8 Validation Targets

| Metric                   | Target | Measurement Method      |
| ------------------------ | ------ | ----------------------- |
| Code Layer Latency (p95) | <100ms | Instrumentation (041)   |
| Total Latency (p95)      | <500ms | End-to-end timing       |
| AI Call Rate             | <40%   | Metrics dashboard (042) |
| Axiom Precision          | >95%   | Manual review (048)     |
| Axiom Recall             | >90%   | Manual review (048)     |
| Cost Reduction           | >50%   | API usage tracking      |
| False Positive Rate      | <5%    | User feedback           |

### Quality Gates

**Phase 1 Complete**:

- [ ] All tests passing (008-012)
- [ ] Performance benchmarks met (<100ms p95)

**Phase 2 Complete**:

- [ ] All 15 Axioms implemented (014-029)
- [ ] Test coverage >90% (031-032)
- [ ] Axiom Checker <30ms (032)

**Phase 3 Complete**:

- [ ] AI references Axioms correctly (040)
- [ ] Integration tests passing (039)
- [ ] Quick-pass optimization working (037)

**Phase 4 Complete**:

- [ ] A/B test framework operational (043)
- [ ] Load testing passed (046)
- [ ] Production validation >95% precision (048)

---

## Notes

- **Parallel Execution**: Tasks 014-029 (Axiom implementations) can be parallelized across multiple developers
- **Incremental Testing**: Run tests continuously (008-012, 031-032) as modules are completed
- **Early Performance Monitoring**: Start tracking metrics from Task 041 onward
- **A/B Test Rollout**: Use 043 to gradually increase hybrid system usage from 10% → 50% → 100%
- **Constitution Compliance**: All tasks must adhere to `/Users/athenasees/Desktop/chat/chat-server/ai-mediation-constitution.md`

---

_This task breakdown implements Feature Spec 004 using Spec-Driven Development methodology and adheres to LiaiZen Constitutional Principles._
