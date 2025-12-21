# Feature Specification: Hybrid AI Mediation Engine

**Feature ID**: 004
**Version**: 1.0.0
**Status**: Draft
**Created**: 2025-11-29
**Author**: LiaiZen Product Team

---

## 1. Overview and Objectives

### 1.1 Problem Statement

**Current State (Gap Analysis)**:

- **What exists now**: Simple pattern matching → Generic detection ("name-calling detected") → Canned tip → Pre-written suggestion
- **What was designed (on paper)**: Message → Parse → Vector → Axioms → Derive → Assess → Transform → Conscience voice
- **The Gap**: The sophisticated architecture described in documentation (Primitives, Axioms, Communication Vectors, Intent vs. Impact analysis) is NOT implemented in the actual code

**Current Implementation Issues**:

1. **Shallow Pattern Matching**: Regex-based detection with no understanding of context or structure
2. **Generic Interventions**: One-size-fits-all responses that lack specificity and nuance
3. **No Structural Understanding**: Cannot distinguish between "You're a great friend" (positive) vs "You're so irresponsible" (attack)
4. **Missing Axiom System**: The sophisticated Axiom-based logic (AXIOM 001: Displaced Accusation, AXIOM 004: Weaponized Agreement, etc.) is documented but not implemented
5. **No Intent vs. Impact Analysis**: Cannot calculate the "Delta" between what sender intends and how it will land
6. **Inefficient AI Usage**: Multiple API calls for simple pattern detection that code should handle

### 1.2 Solution: Hybrid Architecture

**Core Principle**: Code handles structure, AI handles nuance.

**CODE LAYER** (deterministic, fast, zero-cost):

- Parse linguistic surface (tokens, markers, structure)
- Map to conceptual primitives (Subject/Object/Relation, Direction/Grip)
- Identify communication vector (Sender/Receiver/Target/Instrument)
- Check Axioms (which rules fire based on patterns)
- Flag harm potential (attack surface, conflict potential)
- Extract structural features (absolutes, softeners, contrast markers)

**AI LAYER** (nuanced, contextual, requires judgment):

- Receive structured object from code layer
- Apply user context (profiles, history, relationship dynamics)
- Derive the legitimate need behind the message
- Speak in "conscience voice" (observer, not judge)
- Generate coaching that is specific, structural, and actionable

**Result**: Fast, accurate, cost-efficient mediation with deep structural understanding AND human nuance.

### 1.3 Business Objectives

1. **Accuracy**: Reduce false positives by 80% through structural analysis
2. **Specificity**: Interventions reference exact structural patterns (Axioms, Primitives)
3. **Cost Efficiency**: Reduce AI API calls by 60% (code pre-filters obvious cases)
4. **Speed**: Sub-100ms code layer analysis, total latency <500ms
5. **Transparency**: Users understand WHY intervention happened (Axiom cited)
6. **Scalability**: Code layer can handle 10,000 messages/sec, AI layer only for complex cases

### 1.4 Success Metrics

- **Precision**: >95% of interventions are justified (true positives)
- **Recall**: >90% of harmful patterns caught (minimize false negatives)
- **Latency**: 95th percentile <500ms total time
- **Cost**: <$0.01 per 100 messages analyzed
- **User Satisfaction**: >80% of users find interventions helpful
- **Axiom Coverage**: 100% of documented Axioms implemented in code

---

## 2. User Stories with Acceptance Criteria

### 2.1 As a User Sending a Message

**User Story 1: Structural Pattern Detection**

```
As a co-parent writing a message,
When I write "You NEVER help with homework",
Then the system should:
  - CODE: Detect absolute pattern ("never"), identify Target (competence)
  - CODE: Fire AXIOM (global negative)
  - AI: Explain "Absolutes trigger defensiveness" (not "you're frustrated")
  - AI: Suggest structural fix "Replace 'never' with specific instance"
```

**Acceptance Criteria**:

- [ ] Code layer identifies "never" as absolute within <10ms
- [ ] Axiom check completes within <20ms
- [ ] AI receives structured object with `linguistic.intensifiers: ["never"]`
- [ ] AI coaching references the structural pattern
- [ ] Total latency <500ms

---

**User Story 2: Axiom-Based Intervention (Displaced Accusation)**

```
As a co-parent,
When I write "She's been upset since you changed the schedule",
Then the system should:
  - CODE: Detect child reference + link to receiver action
  - CODE: Fire AXIOM 001 (Displaced Accusation)
  - CODE: Flag `child_as_instrument: true`
  - AI: Name the axiom "AXIOM 001 fires: Using child's state to imply blame"
  - AI: Provide rewrite that expresses concern directly
```

**Acceptance Criteria**:

- [ ] Code detects pattern: `[Child emotion] + [Receiver action]`
- [ ] Axiom 001 appears in `axioms_fired` array
- [ ] Assessment includes `child_as_instrument: true`
- [ ] AI response cites "AXIOM 001" in coaching message
- [ ] Rewrite removes child as intermediary

---

**User Story 3: Clean Message Pass-Through**

```
As a co-parent,
When I write "Can you pick her up at 3pm?",
Then the system should:
  - CODE: Detect clean request pattern
  - CODE: Fire AXIOM D001 (Clean Request)
  - CODE: Set `assessment.transmit: true`
  - RESULT: Message passes without AI call (zero cost)
```

**Acceptance Criteria**:

- [ ] Code detects: specific + actionable + no softener
- [ ] `axioms_fired` includes AXIOM D001
- [ ] `assessment.transmit: true`
- [ ] No AI API call made
- [ ] Message delivered instantly (<50ms)

---

**User Story 4: Positive Context Pre-Filter**

```
As a co-parent,
When I write "You're a great parent",
Then the system should:
  - CODE: Detect "you're/you are" + positive context words
  - CODE: Set `assessment.conflict_potential: 'low'`
  - CODE: Set `assessment.transmit: true`
  - RESULT: Pre-approved without AI call
```

**Acceptance Criteria**:

- [ ] Positive pattern detected in <5ms
- [ ] No Axioms fire (clean message)
- [ ] Message passes without AI analysis
- [ ] Zero API cost

---

### 2.2 As a System Administrator

**User Story 5: Axiom Configuration**

```
As a system administrator,
When I need to add a new Axiom,
Then I should be able to:
  - Define the axiom pattern in code
  - Add tests for true/false positives
  - Deploy without AI prompt changes
```

**Acceptance Criteria**:

- [ ] Axioms defined in `/axioms/` directory
- [ ] Each axiom has test suite
- [ ] Adding axiom doesn't require AI re-tuning

---

**User Story 6: Performance Monitoring**

```
As a system administrator,
When messages are analyzed,
Then I should see metrics for:
  - Code layer latency (per component)
  - Axioms fired distribution
  - AI call rate (should be <40% of messages)
  - False positive/negative rates
```

**Acceptance Criteria**:

- [ ] Metrics exported to monitoring system
- [ ] Dashboard shows axiom fire rates
- [ ] Alerts if AI call rate >60%

---

## 3. Functional Requirements

### 3.1 Code Layer Components

#### 3.1.1 Tokenizer

**Purpose**: Break message into tagged linguistic units

**Input**: Raw message text
**Output**: Array of tokens with metadata

**Example**:

```javascript
Input: 'You NEVER help with homework';
Output: [
  { word: 'You', pos: 'pronoun', addressee: true },
  { word: 'NEVER', pos: 'adverb', type: 'intensifier', absolute: true },
  { word: 'help', pos: 'verb', action: true },
  { word: 'with', pos: 'preposition' },
  { word: 'homework', pos: 'noun', domain: 'child_education' },
];
```

**Requirements**:

- [ ] Parse pronouns (I, you, she/he)
- [ ] Identify intensifiers (always, never, very)
- [ ] Tag softeners (just, only, simply)
- [ ] Mark contrast (but, however)
- [ ] Detect negations (not, never, no)
- [ ] Latency: <10ms for 100-word message

---

#### 3.1.2 Marker Detector

**Purpose**: Find linguistic markers (softeners, intensifiers, pattern markers)

**Detects**:

- **Softeners**: "just", "only", "simply", "kind of"
- **Intensifiers**: "very", "always", "never", "every time"
- **Pattern Markers**: "always", "never", "every time" (for absolutes)
- **Contrast Markers**: "but", "however", "although"
- **Negations**: "not", "never", "no"

**Example**:

```javascript
Input: "I'm just worried, but you never listen"
Output: {
  softeners: ["just"],
  intensifiers: ["never"],
  pattern_markers: ["never"],
  contrast_markers: ["but"],
  negations: []
}
```

**Requirements**:

- [ ] Regex-based detection for speed
- [ ] Case-insensitive matching
- [ ] Position tracking (where in sentence)
- [ ] Latency: <5ms

---

#### 3.1.3 Primitive Mapper

**Purpose**: Map tokens to conceptual primitives

**Primitives**:

1. **Metaphysical**:
   - SUBJECT: The "I" (speaker)
   - OBJECT: The "It" or "Them"
   - RELATION: Connection between Subject and Object

2. **Relational Axes**:
   - DIRECTION: Toward (+1) or Away (-1)
   - GRIP: Holding (1) or Releasing (0)
   - STATES:
     - Fear = Away + Future + Unknown
     - Control = Toward + Other + Holding
     - Love = Toward + Other + Releasing

**Example**:

```javascript
Input: "You need to change your behavior"
Output: {
  speaker: true,        // "I" implied (speaker exists)
  addressee: true,      // "you" present
  third_party: [],      // no others mentioned
  temporal: "present",  // "need" is now
  epistemic: "interpretation", // "need to" is judgment
  domain: "other_character" // targeting "your behavior"
}
```

**Requirements**:

- [ ] Detect pronouns (I/you/she/he)
- [ ] Identify temporal markers (past/present/future)
- [ ] Classify epistemic stance (fact/interpretation)
- [ ] Determine domain (schedule, money, parenting, character)
- [ ] Latency: <15ms

---

#### 3.1.4 Vector Identifier

**Purpose**: Determine communication vector (who → who → what)

**Structure**:

```typescript
interface CommunicationVector {
  sender: string; // user ID
  receiver: string; // coparent ID
  target: string; // what's being aimed at (character/competence/autonomy)
  instrument: string | null; // what's used to deliver (child, schedule, money, etc.)
  aim: string; // intended effect (control, inform, attack, request)
}
```

**Example**:

```javascript
Input: "She said you forgot to sign the permission slip"
Output: {
  sender: "alice",
  receiver: "bob",
  target: "competence",     // "you forgot" targets competence
  instrument: "child",      // "she said" uses child as messenger
  aim: "attack"             // intent is to criticize
}
```

**Requirements**:

- [ ] Extract sender/receiver from context
- [ ] Identify target: character, competence, autonomy, parenting
- [ ] Detect instrument: child, money, schedule, other parent, third party
- [ ] Infer aim: attack, control, inform, request, defend
- [ ] Latency: <20ms

---

#### 3.1.5 Axiom Checker

**Purpose**: Check which Axioms fire based on patterns

**Axiom Structure**:

```typescript
interface Axiom {
  id: string; // "AXIOM_001"
  name: string; // "Displaced Accusation"
  category: string; // "indirect_communication"
  pattern: Function; // Detection logic
  confidence: number; // 0-100
}
```

**Axiom Categories**:

**A. Indirect Communication** (Attacks Disguised as Peace)

- AXIOM 001: Displaced Accusation
- AXIOM 002: False Offering
- AXIOM 003: Innocent Inquiry
- AXIOM 004: Weaponized Agreement
- AXIOM 005: Virtuous Self-Reference
- AXIOM 007: Pre-emptive Denial
- AXIOM 008: Reluctant Compliance
- AXIOM 010: Child as Messenger
- AXIOM 012: Concerned Question
- AXIOM 016: Hypothetical Accusation

**B. Context Triggered** (Situational Logic)

- AXIOM C001: Proximity Claim
- AXIOM C002: New Partner Threat
- AXIOM C005: Fresh Separation
- AXIOM C007: Income Leverage

**C. Direct Communication** (Clean)

- AXIOM D001: Clean Request
- AXIOM D002: Clean Information

**Example Implementation**:

```javascript
// AXIOM 001: Displaced Accusation
// Pattern: Reports [negative state] of [Child] + Linked to [Receiver Domain] + [Softener]
function checkAxiom001(parsed) {
  const hasChildReference = parsed.conceptual.third_party.some(p => p.relationship === 'child');
  const hasNegativeState = parsed.linguistic.tokens.some(
    t => t.emotion === 'negative' && t.subject === 'child'
  );
  const linkedToReceiver =
    parsed.vector.target === 'receiver' ||
    parsed.linguistic.tokens.some(t => t.addressee && t.follows === 'child_state');
  const hasSoftener = parsed.linguistic.softeners.length > 0;

  if (hasChildReference && hasNegativeState && linkedToReceiver) {
    return {
      id: 'AXIOM_001',
      name: 'Displaced Accusation',
      confidence: hasSoftener ? 90 : 75,
      fired: true,
      evidence: {
        child_mentioned: true,
        negative_state: true,
        linked_to_receiver: true,
        softener_used: hasSoftener,
      },
    };
  }

  return { fired: false };
}
```

**Requirements**:

- [ ] Implement all 15 Axioms from constitution
- [ ] Each Axiom returns confidence score
- [ ] Evidence tracking (what triggered the Axiom)
- [ ] Parallel checking (all Axioms checked simultaneously)
- [ ] Latency: <30ms for all Axioms

---

#### 3.1.6 Assessment Generator

**Purpose**: Evaluate harm potential and transmission decision

**Output Structure**:

```typescript
interface Assessment {
  conflict_potential: 'low' | 'moderate' | 'high';
  attack_surface: string[]; // character, competence, autonomy, parenting
  child_as_instrument: boolean;
  deniability: 'low' | 'high';
  transmit: boolean; // can this go through as-is?
}
```

**Logic**:

```javascript
function generateAssessment(parsed) {
  const axiomsFired = parsed.axioms_fired.filter(a => a.fired);

  // Determine conflict potential
  let conflict_potential = 'low';
  if (axiomsFired.some(a => a.category === 'indirect_communication')) {
    conflict_potential = 'moderate';
  }
  if (axiomsFired.some(a => ['AXIOM_001', 'AXIOM_010', 'AXIOM_016'].includes(a.id))) {
    conflict_potential = 'high'; // Child involvement or direct attack
  }

  // Identify attack surface
  const attack_surface = [];
  if (parsed.vector.target === 'character') attack_surface.push('character');
  if (parsed.vector.target === 'competence') attack_surface.push('competence');
  if (
    parsed.linguistic.pattern_markers.includes('never') ||
    parsed.linguistic.pattern_markers.includes('always')
  ) {
    attack_surface.push('autonomy'); // Absolutes remove agency
  }

  // Check child as instrument
  const child_as_instrument = parsed.vector.instrument === 'child';

  // Assess deniability (high if softeners present)
  const deniability = parsed.linguistic.softeners.length > 0 ? 'high' : 'low';

  // Transmission decision
  const transmit =
    conflict_potential === 'low' &&
    axiomsFired.filter(a => a.category !== 'clean').length === 0 &&
    !child_as_instrument;

  return {
    conflict_potential,
    attack_surface,
    child_as_instrument,
    deniability,
    transmit,
  };
}
```

**Requirements**:

- [ ] Risk scoring based on Axioms fired
- [ ] Attack surface identification
- [ ] Child involvement flagging
- [ ] Deniability calculation
- [ ] Transmit decision (boolean)
- [ ] Latency: <10ms

---

### 3.2 ParsedMessage Interface

The complete structure passed from Code Layer to AI Layer:

```typescript
interface ParsedMessage {
  // Original
  raw: string;

  // Linguistic (from Tokenizer + Marker Detector)
  linguistic: {
    tokens: Token[]; // each word tagged
    softeners: string[]; // "just", "only", etc.
    intensifiers: string[]; // "very", "always", "never"
    pattern_markers: string[]; // "always", "never", "every time"
    contrast_markers: string[]; // "but", "however"
    negations: string[]; // "not", "never"
  };

  // Conceptual (from Primitive Mapper)
  conceptual: {
    speaker: boolean; // "I" present
    addressee: boolean; // "you" present
    third_party: ThirdParty[]; // who else is referenced
    temporal: 'past' | 'present' | 'future';
    epistemic: 'fact' | 'interpretation' | 'unknown';
    domain: string; // whose space/responsibility
  };

  // Communication Vector (from Vector Identifier)
  vector: {
    sender: string; // user id
    receiver: string; // coparent id
    target: string; // character, competence, autonomy, parenting
    instrument: string | null; // child, money, schedule, etc.
    aim: string; // attack, control, inform, request
  };

  // Axioms (from Axiom Checker)
  axioms_fired: AxiomResult[];

  // Assessment (from Assessment Generator)
  assessment: {
    conflict_potential: 'low' | 'moderate' | 'high';
    attack_surface: string[]; // character, competence, autonomy, parenting
    child_as_instrument: boolean;
    deniability: 'low' | 'high';
    transmit: boolean; // can this go through as-is?
  };
}

interface Token {
  word: string;
  pos: string; // part of speech
  addressee?: boolean; // is "you"
  speaker?: boolean; // is "I"
  emotion?: string; // positive, negative, neutral
  absolute?: boolean; // is absolute (always/never)
  softener?: boolean; // is softener (just/only)
}

interface ThirdParty {
  reference: string; // "she", "the teacher", "Emma"
  relationship?: string; // "child", "professional", "family"
  role?: string; // what role they play in the message
}

interface AxiomResult {
  id: string; // "AXIOM_001"
  name: string; // "Displaced Accusation"
  confidence: number; // 0-100
  fired: boolean;
  evidence?: object; // what triggered it
}
```

---

### 3.3 AI Layer Requirements

#### 3.3.1 AI System Prompt Structure

**Template**:

```
# SYSTEM ROLE
You are LiaiZen's Observer - you receive STRUCTURED ANALYSIS from the code layer
and provide nuanced coaching based on what the structure reveals.

# INPUT STRUCTURE
You will receive a ParsedMessage object containing:
- Linguistic analysis (tokens, markers)
- Conceptual primitives (Subject/Object/Relation)
- Communication vector (Sender/Receiver/Target/Instrument)
- Axioms that fired (with confidence scores)
- Assessment (conflict potential, attack surface)

# YOUR ROLE
1. Read the structural analysis
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

# EXAMPLE
Input ParsedMessage:
{
  raw: "She's been upset since you changed the schedule",
  axioms_fired: [
    { id: "AXIOM_001", name: "Displaced Accusation", confidence: 90, fired: true }
  ],
  assessment: {
    conflict_potential: "high",
    child_as_instrument: true
  },
  vector: {
    target: "competence",
    instrument: "child"
  }
}

Output:
{
  "action": "INTERVENE",
  "intervention": {
    "personalMessage": "AXIOM 001 fires: Using child's state to imply blame. This structure will land as attack via child, putting her in the middle.",
    "tip1": "Express concern directly, not through child's state.",
    "rewrite1": "I'm concerned about the schedule change. Can we discuss how to make transitions smoother?",
    "rewrite2": "The schedule change has been challenging. I'd like to find a solution that works better."
  }
}
```

#### 3.3.2 Context Integration

**User Profile Context**:

```javascript
// Passed to AI along with ParsedMessage
{
  sender_profile: {
    communication_style: "direct",
    stress_triggers: ["schedule_changes", "money"],
    preferred_mediation: "concrete_suggestions",
    intervention_history: {
      total: 12,
      accepted_rewrites: 8,
      common_patterns: ["absolute_statements", "blame_language"]
    }
  },
  receiver_profile: {
    communication_style: "conflict_avoidant",
    known_sensitivities: ["parenting_criticism"],
    relationship_context: "new_partner_present"
  },
  relationship_insights: {
    separation_age_months: 18,
    primary_tension_points: ["schedule_flexibility", "new_relationships"],
    positive_patterns: ["shares_school_info", "coordinates_medical"]
  }
}
```

#### 3.3.3 AI Output Validation

**Required Fields**:

```typescript
interface AIResponse {
  action: 'STAY_SILENT' | 'INTERVENE' | 'COMMENT';

  escalation?: {
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    confidence: number; // 0-100
    reasons: string[]; // specific phrasing issues
  };

  intervention?: {
    personalMessage: string; // REQUIRED if action=INTERVENE
    tip1: string; // REQUIRED if action=INTERVENE
    rewrite1: string; // REQUIRED if action=INTERVENE
    rewrite2: string; // REQUIRED if action=INTERVENE
    comment?: string; // REQUIRED if action=COMMENT
  };
}
```

**Validation Rules**:

- [ ] `personalMessage` must reference at least one Axiom
- [ ] `personalMessage` must explain Intent vs Impact Delta
- [ ] `personalMessage` must NOT diagnose emotions
- [ ] `tip1` must be ≤10 words
- [ ] `tip1` must be actionable technique
- [ ] `rewrite1` and `rewrite2` must be complete messages
- [ ] Rewrites must preserve sender's underlying goal
- [ ] Rewrites must remove Axiom trigger

---

## 4. Integration Points with Existing Code

### 4.1 mediator.js Integration

**Current Function**:

```javascript
async function analyzeMessage(message, recentMessages, ...) {
  // Current: Direct AI call with prompt
  // New: Code layer analysis FIRST
}
```

**New Flow**:

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

  // 3. BUILD AI CONTEXT
  const aiContext = buildAIContext(parsed, roleContext, recentMessages, profiles);

  // 4. AI CALL (only for complex cases)
  const aiResponse = await callAI(aiContext);

  // 5. VALIDATE RESPONSE
  const validated = validateAIResponse(aiResponse, parsed);

  return validated;
}
```

### 4.2 New Module: codeLayer

**Location**: `/chat-server/src/liaizen/core/codeLayer/`

**Structure**:

```
codeLayer/
├── index.js              # Main entry point
├── tokenizer.js          # Tokenization
├── markerDetector.js     # Softeners, intensifiers
├── primitiveMapper.js    # Conceptual primitives
├── vectorIdentifier.js   # Communication vector
├── axiomChecker.js       # Axiom logic
├── assessmentGen.js      # Risk assessment
└── axioms/
    ├── indirect/         # AXIOM 001-016
    ├── contextual/       # AXIOM C001-C007
    └── clean/            # AXIOM D001-D002
```

**Main Entry Point**:

```javascript
// codeLayer/index.js
const tokenizer = require('./tokenizer');
const markerDetector = require('./markerDetector');
const primitiveMapper = require('./primitiveMapper');
const vectorIdentifier = require('./vectorIdentifier');
const axiomChecker = require('./axiomChecker');
const assessmentGen = require('./assessmentGen');

async function parse(messageText, context) {
  const startTime = Date.now();

  // 1. Tokenize
  const tokens = tokenizer.tokenize(messageText);

  // 2. Detect markers
  const markers = markerDetector.detect(messageText, tokens);

  // 3. Map primitives
  const conceptual = primitiveMapper.map(tokens, markers);

  // 4. Identify vector
  const vector = vectorIdentifier.identify(tokens, conceptual, context);

  // 5. Check axioms
  const axioms_fired = await axiomChecker.checkAll({
    raw: messageText,
    tokens,
    markers,
    conceptual,
    vector,
    context,
  });

  // 6. Generate assessment
  const assessment = assessmentGen.generate({
    axioms_fired,
    vector,
    markers,
    conceptual,
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
      negations: markers.negations,
    },
    conceptual,
    vector,
    axioms_fired,
    assessment,
    meta: {
      version: '1.0.0',
      latency_ms: latency,
    },
  };
}

module.exports = { parse };
```

### 4.3 constitution.md Updates

**Add Section**:

```markdown
## Part VII: Code Layer Integration

### Axiom Implementation Requirements

All Axioms MUST be implemented in code before being referenced by AI.

**Axiom Structure**:

- ID: Unique identifier (e.g., AXIOM_001)
- Name: Human-readable name
- Category: indirect_communication, contextual, clean
- Pattern: Detection logic (function)
- Confidence: 0-100 score
- Evidence: What triggered it

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

## 5. Non-Functional Requirements

### 5.1 Performance

| Component            | Target     | Max Acceptable |
| -------------------- | ---------- | -------------- |
| Tokenizer            | <10ms      | 20ms           |
| Marker Detector      | <5ms       | 10ms           |
| Primitive Mapper     | <15ms      | 30ms           |
| Vector Identifier    | <20ms      | 40ms           |
| Axiom Checker (all)  | <30ms      | 60ms           |
| Assessment Generator | <10ms      | 20ms           |
| **Total Code Layer** | **<100ms** | **150ms**      |
| AI Call              | <300ms     | 500ms          |
| **Total End-to-End** | **<400ms** | **650ms**      |

### 5.2 Scalability

- **Code Layer**: Handle 10,000 messages/second
- **AI Layer**: Handle 2,000 messages/second (with rate limiting)
- **Cache Hit Rate**: >60% of messages use cached patterns
- **AI Call Rate**: <40% of messages require AI analysis

### 5.3 Reliability

- **Uptime**: 99.9%
- **Error Handling**: Graceful degradation (if code layer fails, fallback to current system)
- **Fallback Strategy**: If AI unavailable, use code layer assessment only
- **Data Validation**: All inputs/outputs validated with TypeScript types

### 5.4 Cost Efficiency

**Current Cost** (per 1000 messages):

- AI calls: 1000 messages × $0.002 = $2.00
- Total: $2.00/1000 messages

**Target Cost** (per 1000 messages):

- AI calls: 400 messages × $0.002 = $0.80
- Code layer: 1000 messages × $0.00001 = $0.01
- Total: $0.81/1000 messages
- **Savings: 59.5%**

### 5.5 Maintainability

- **Code Coverage**: >90% for all code layer components
- **Documentation**: Every Axiom has explanation + examples
- **Type Safety**: Full TypeScript definitions
- **Modularity**: Each component can be tested independently

---

## 6. Success Metrics

### 6.1 Accuracy Metrics

| Metric                                           | Baseline | Target | Measurement                        |
| ------------------------------------------------ | -------- | ------ | ---------------------------------- |
| Precision (true positives / total interventions) | 75%      | 95%    | Manual review of 500 interventions |
| Recall (caught / total harmful)                  | 85%      | 90%    | Review of flagged messages         |
| False Positive Rate                              | 25%      | <5%    | User feedback "unhelpful"          |
| False Negative Rate                              | 15%      | <10%   | Post-send escalation tracking      |

### 6.2 Performance Metrics

| Metric                   | Target | Measurement       |
| ------------------------ | ------ | ----------------- |
| Code Layer Latency (p50) | <50ms  | Instrumentation   |
| Code Layer Latency (p95) | <100ms | Instrumentation   |
| End-to-End Latency (p50) | <300ms | End-to-end timing |
| End-to-End Latency (p95) | <500ms | End-to-end timing |

### 6.3 User Satisfaction Metrics

| Metric                   | Target                | Measurement              |
| ------------------------ | --------------------- | ------------------------ |
| Intervention Helpfulness | >80% "helpful"        | In-app rating            |
| Rewrite Acceptance Rate  | >60%                  | Track accepted rewrites  |
| Transparency Score       | >75% "understood why" | Post-intervention survey |

### 6.4 Business Metrics

| Metric                 | Target | Measurement          |
| ---------------------- | ------ | -------------------- |
| Cost per 1000 messages | <$1.00 | API usage tracking   |
| AI Call Rate           | <40%   | Monitoring dashboard |
| Axiom Coverage         | 100%   | Code audit           |

---

## 7. Test Scenarios

### 7.1 Axiom Test Cases

#### Test Case 1: AXIOM 001 (Displaced Accusation)

```javascript
// POSITIVE (should fire)
"She's been crying since you picked her up"
// Expected:
{
  axiom: "AXIOM_001",
  confidence: 85,
  evidence: {
    child_state: "crying",
    linked_to_receiver: "you picked her up",
    negative_state: true
  }
}

// NEGATIVE (should NOT fire)
"She had a great time at your house"
// Expected: AXIOM_001 does not fire (positive state)
```

#### Test Case 2: AXIOM 004 (Weaponized Agreement)

```javascript
// POSITIVE (should fire)
"I agree we should be consistent, but you never follow through"
// Expected:
{
  axiom: "AXIOM_004",
  confidence: 90,
  evidence: {
    agreement: "I agree",
    contrast_marker: "but",
    negation_follows: "you never follow through"
  }
}

// NEGATIVE (should NOT fire)
"I agree, let's do that"
// Expected: AXIOM_004 does not fire (clean agreement)
```

#### Test Case 3: AXIOM D001 (Clean Request)

```javascript
// POSITIVE (should fire)
"Can you pick her up at 3pm?"
// Expected:
{
  axiom: "AXIOM_D001",
  confidence: 95,
  evidence: {
    specific: true,
    actionable: true,
    no_softener: true
  }
}

// NEGATIVE (should NOT fire)
"I was just wondering if maybe you could try to pick her up sometime around 3?"
// Expected: AXIOM_D001 does not fire (excessive softeners, vague)
```

### 7.2 Integration Test Scenarios

#### Scenario 1: High-Conflict Message

```javascript
Input: "You NEVER think about anyone but yourself"

Expected Code Layer Output:
{
  linguistic: {
    intensifiers: ["NEVER"],
    pattern_markers: ["never"]
  },
  conceptual: {
    temporal: "present",
    epistemic: "interpretation"
  },
  vector: {
    target: "character",
    aim: "attack"
  },
  axioms_fired: [
    { id: "AXIOM_005", name: "Global Negative", confidence: 90 }
  ],
  assessment: {
    conflict_potential: "high",
    attack_surface: ["character", "autonomy"],
    transmit: false
  }
}

Expected AI Response:
{
  action: "INTERVENE",
  intervention: {
    personalMessage: "Absolutes like 'never' + character judgment trigger defensiveness, shutting down dialogue.",
    tip1: "Replace 'never' with specific recent instance.",
    rewrite1: "I'm frustrated about [specific situation]. I need to discuss this.",
    rewrite2: "I've noticed [specific behavior recently]. Can we talk about it?"
  }
}
```

#### Scenario 2: Clean Logistical Message

```javascript
Input: "Can you pick her up at 3pm tomorrow?"

Expected Code Layer Output:
{
  axioms_fired: [
    { id: "AXIOM_D001", name: "Clean Request", confidence: 95 }
  ],
  assessment: {
    conflict_potential: "low",
    transmit: true
  }
}

Expected Result: Message passes without AI call (instant delivery)
```

#### Scenario 3: Positive Message

```javascript
Input: "You're a great dad"

Expected Code Layer Output:
{
  linguistic: {
    tokens: [
      { word: "You're", addressee: true },
      { word: "great", emotion: "positive" },
      { word: "dad", domain: "parenting" }
    ]
  },
  assessment: {
    conflict_potential: "low",
    transmit: true
  }
}

Expected Result: Pre-approved, no AI call
```

### 7.3 Edge Cases

#### Edge Case 1: Context-Dependent Pattern

```javascript
Input: "You're my best friend"

Context: Message to co-parent (friendly)
Expected: PASS (positive context)

Context: Message followed by "...said no one ever"
Expected: INTERVENE (sarcasm detected)
```

#### Edge Case 2: Mixed Signals

```javascript
Input: "I appreciate you helping, but you always do it wrong"

Expected:
- AXIOM 004 fires (Weaponized Agreement)
- Conflict potential: moderate
- AI coaching: "The 'but' negates the appreciation. Consider separating gratitude from feedback."
```

#### Edge Case 3: Child-Protective Language

```javascript
Input: "Let me handle the money talk with your mom - you don't need to worry about that"

Context: Message FROM parent TO child (protective)
Expected: PASS (protecting child from adult conflict)

Context: Message from parent ABOUT other parent (triangulation)
Expected: Different handling based on recipient
```

---

## 8. Implementation Phases

### Phase 1: Code Layer Foundation (Week 1-2)

**Goal**: Build core parsing infrastructure

**Deliverables**:

- [ ] Tokenizer implementation
- [ ] Marker Detector implementation
- [ ] Primitive Mapper implementation
- [ ] Unit tests for all components
- [ ] Performance benchmarks

**Success Criteria**:

- All components <20ms latency
- > 95% accuracy on test corpus
- 100% test coverage

### Phase 2: Axiom System (Week 3-4)

**Goal**: Implement all documented Axioms

**Deliverables**:

- [ ] AXIOM 001-016 (Indirect Communication)
- [ ] AXIOM C001-C007 (Contextual)
- [ ] AXIOM D001-D002 (Clean)
- [ ] Axiom Checker orchestration
- [ ] Test suite for each Axiom

**Success Criteria**:

- All Axioms implemented
- <30ms total check time
- > 90% precision/recall per Axiom

### Phase 3: Vector & Assessment (Week 5)

**Goal**: Complete code layer analysis

**Deliverables**:

- [ ] Vector Identifier
- [ ] Assessment Generator
- [ ] ParsedMessage integration
- [ ] End-to-end code layer tests

**Success Criteria**:

- <100ms total code layer latency
- Correct transmission decisions >95%

### Phase 4: AI Integration (Week 6-7)

**Goal**: Connect code layer to AI

**Deliverables**:

- [ ] AI prompt template with ParsedMessage
- [ ] Context builder
- [ ] Response validator
- [ ] Fallback handling

**Success Criteria**:

- AI references Axioms correctly
- Response validation catches errors
- Graceful degradation works

### Phase 5: Deployment & Monitoring (Week 8)

**Goal**: Production rollout with observability

**Deliverables**:

- [ ] Metrics dashboard
- [ ] A/B test framework (hybrid vs. legacy)
- [ ] Performance monitoring
- [ ] Cost tracking

**Success Criteria**:

- <1% error rate
- Cost savings >50%
- User satisfaction >80%

---

## 9. Risks & Mitigation

### Risk 1: Code Layer Complexity

**Risk**: Axiom logic becomes too complex, hard to maintain

**Mitigation**:

- Modular design (one file per Axiom)
- Comprehensive tests
- Documentation requirements
- Code review process

### Risk 2: Performance Degradation

**Risk**: Code layer slower than expected

**Mitigation**:

- Performance benchmarks in CI/CD
- Profiling tools integrated
- Caching strategies
- Async processing where possible

### Risk 3: False Positives

**Risk**: Code layer flags clean messages

**Mitigation**:

- Conservative thresholds
- A/B testing with legacy system
- User feedback loop
- Manual review of edge cases

### Risk 4: AI Prompt Drift

**Risk**: AI stops referencing Axioms correctly

**Mitigation**:

- Automated validation
- Prompt versioning
- Regular audits
- Examples in prompt

### Risk 5: Context Gaps

**Risk**: Missing context leads to wrong decisions

**Mitigation**:

- Comprehensive context passing
- Fallback to AI for ambiguous cases
- User override options
- Continuous learning

---

## 10. Future Enhancements

### 10.1 Machine Learning Integration

- **Goal**: Train ML models on Axiom patterns
- **Benefit**: Even faster pattern detection
- **Timeline**: Q2 2026

### 10.2 User-Customizable Axioms

- **Goal**: Allow users to define custom patterns
- **Benefit**: Personalized mediation
- **Timeline**: Q3 2026

### 10.3 Multi-Language Support

- **Goal**: Axiom system works in Spanish, French, etc.
- **Benefit**: Expand user base
- **Timeline**: Q4 2026

### 10.4 Relationship State Machine

- **Goal**: Track relationship state over time
- **Benefit**: Adaptive thresholds based on relationship health
- **Timeline**: Q1 2027

---

## 11. Appendix

### 11.1 Axiom Reference Table

| Axiom ID   | Name                    | Category   | Pattern Summary                              |
| ---------- | ----------------------- | ---------- | -------------------------------------------- |
| AXIOM_001  | Displaced Accusation    | Indirect   | Child state + Receiver link + Softener       |
| AXIOM_002  | False Offering          | Indirect   | Offer + Conditionality + Burden              |
| AXIOM_003  | Innocent Inquiry        | Indirect   | Question + Receiver action + Softener        |
| AXIOM_004  | Weaponized Agreement    | Indirect   | Agreement + "But" + Negative                 |
| AXIOM_005  | Virtuous Self-Reference | Indirect   | Self-praise + Conflict context               |
| AXIOM_007  | Pre-emptive Denial      | Indirect   | Denial + Contrast                            |
| AXIOM_008  | Reluctant Compliance    | Indirect   | Agreement + Hesitation + Sigh                |
| AXIOM_010  | Child as Messenger      | Indirect   | Child quote + Negative about receiver        |
| AXIOM_012  | Concerned Question      | Indirect   | Child state question + Follows receiver time |
| AXIOM_016  | Hypothetical Accusation | Indirect   | "Imagine if..." + Mirrors receiver           |
| AXIOM_C001 | Proximity Claim         | Contextual | Sender closer + Logistics claim              |
| AXIOM_C002 | New Partner Threat      | Contextual | New partner + Child confusion                |
| AXIOM_C005 | Fresh Separation        | Contextual | Separation <12mo + High volatility           |
| AXIOM_C007 | Income Leverage         | Contextual | Income disparity + Financial offer           |
| AXIOM_D001 | Clean Request           | Clean      | Specific + Actionable + No softener          |
| AXIOM_D002 | Clean Information       | Clean      | Verifiable fact + Relevant + No markers      |

### 11.2 Glossary

- **Axiom**: A rule that fires when a specific communication pattern is detected
- **Code Layer**: Deterministic parsing and pattern detection (no AI)
- **AI Layer**: Contextual, nuanced coaching based on parsed structure
- **ParsedMessage**: Structured object passed from code to AI
- **Primitive**: Fundamental conceptual building block (Subject/Object/Relation)
- **Vector**: Communication trajectory (Sender → Receiver → Target via Instrument)
- **Delta**: Difference between Intent and Impact
- **Observer Voice**: Structural description style (vs. emotional diagnosis)
- **Transmit**: Boolean decision whether message can pass as-is

### 11.3 References

- LiaiZen AI Mediation Constitution: `/chat-server/ai-mediation-constitution.md`
- Current Mediator: `/chat-server/src/liaizen/core/mediator.js`
- Language Analyzer: `/chat-server/src/liaizen/analysis/language-analyzer/`
- Safety Controls: `/chat-server/src/liaizen/policies/safety.js`

---

**Document Status**: Draft for Review
**Next Steps**:

1. Technical review by engineering team
2. Product review for business alignment
3. Constitutional compliance check
4. Approval for Phase 1 implementation

**Questions for Discussion**:

1. Are all 15 Axioms from the constitution sufficiently defined?
2. Is the 100ms code layer latency target realistic?
3. Should we implement all Axioms in Phase 2 or prioritize subset?
4. What A/B test strategy for hybrid vs. legacy rollout?

---

_This specification complies with LiaiZen Constitutional Principles and Spec-Driven Development methodology._
