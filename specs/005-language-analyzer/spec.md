# Feature Specification: Language Analyzer Library

## Overview

**Feature ID**: 005
**Feature Name**: Language Analyzer Library
**Business Objective**: Create a dedicated library module that analyzes message language patterns, producing structured analysis as input to the coaching system.

**Problem Statement**:
Currently, `aiMediator.js` conflates analysis with coaching in a single AI call. This means:
1. We can't see what the AI "observed" before it coached
2. Analysis logic is buried in a large prompt
3. Hard to test analysis separate from coaching
4. No reusable analysis for other features (reporting, learning, trends)

**Solution**:
Create a **Language Analyzer Library** (`chat-server/libs/language-analyzer/`) that:
1. Analyzes message language patterns (local + optional AI enhancement)
2. Produces structured, factual analysis (no coaching, no emotions)
3. Feeds structured data to the coaching layer
4. Follows the AI Mediation Constitution (language-focused, no diagnoses)

---

## Architecture

```
Message Input
     │
     ▼
┌─────────────────────────────────────┐
│     Language Analyzer Library       │
│  (chat-server/libs/language-analyzer)│
│                                     │
│  ┌─────────────────────────────┐    │
│  │   Local Pattern Detector    │    │  ← Regex/rules (fast, free)
│  │   - Global statements       │    │
│  │   - Evaluative language     │    │
│  │   - Hedging/apologizing     │    │
│  │   - Specificity level       │    │
│  │   - Focus type              │    │
│  └─────────────────────────────┘    │
│               │                     │
│               ▼                     │
│  ┌─────────────────────────────┐    │
│  │   Structured Analysis       │    │  ← JSON output
│  │   {                         │    │
│  │     patterns: {...},        │    │
│  │     structure: {...},       │    │
│  │     summary: [...]          │    │
│  │   }                         │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│        AI Mediator (Coaching)       │
│  - Receives structured analysis     │
│  - Applies 1-2-3 framework          │
│  - Generates intervention           │
└─────────────────────────────────────┘
```

---

## Analysis Dimensions

The analyzer examines these aspects of each message:

### 1. Global vs. Specific

| Pattern | Description | Examples |
|---------|-------------|----------|
| `global_positive` | Universal positive claim | "You're a great parent" |
| `global_negative` | Universal negative claim | "You always mess things up" |
| `specific_behavior` | Cites concrete action | "When you picked her up late on Tuesday" |
| `specific_impact` | Describes concrete effect | "She missed her soccer practice" |

**Markers**: always, never, every time, constantly, basically, completely, totally

### 2. Evaluative vs. Descriptive

| Pattern | Description | Examples |
|---------|-------------|----------|
| `evaluative_character` | Judges person's character | "You're a bad parent" |
| `evaluative_competence` | Judges ability | "You're failing her" |
| `descriptive_action` | Describes behavior | "The homework wasn't done" |
| `descriptive_observation` | States observation | "She seemed upset" |

**Markers**: good/bad, right/wrong, failing, incompetent, terrible, great, perfect

### 3. Hedging and Apologizing

| Pattern | Description | Examples |
|---------|-------------|----------|
| `over_explaining` | Excessive justification | "I know this is hard and I'm sorry but..." |
| `apologetic_framing` | Unnecessary apology | "Sorry to bring this up again but..." |
| `hedging_softeners` | Weakening language | "I just think maybe possibly..." |
| `direct_statement` | Clear, unhedged | "I need to discuss the schedule" |

**Markers**: just, maybe, possibly, I think, sorry, I know this is, if it's okay

### 4. Vague vs. Specific

| Pattern | Description | Examples |
|---------|-------------|----------|
| `vague_complaint` | Unspecific grievance | "The way you're handling things" |
| `vague_request` | Unclear ask | "I need you to do better" |
| `specific_complaint` | Concrete grievance | "She didn't have her inhaler" |
| `specific_request` | Clear ask | "Can you pack her inhaler on Wednesdays?" |

**Markers**: things, stuff, everything, something, this, that, issues, problems

### 5. Focus Type

| Pattern | Description | Examples |
|---------|-------------|----------|
| `logistics_focused` | Schedule, tasks, items | "Can we swap Tuesday pickup?" |
| `character_focused` | Person's traits | "You're so irresponsible" |
| `child_focused` | Child's needs/wellbeing | "Emma needs consistency" |
| `relationship_focused` | Co-parent dynamic | "We need to communicate better" |
| `past_focused` | Historical grievance | "You did the same thing last year" |
| `future_focused` | Forward-looking | "Going forward, can we..." |

### 6. Child Involvement

| Pattern | Description | Examples |
|---------|-------------|----------|
| `child_mentioned` | Child referenced | "Vira said she was tired" |
| `child_as_messenger` | Child carrying adult messages | "Tell your dad he needs to..." |
| `child_as_weapon` | Child used to attack | "You're failing Vira" |
| `child_wellbeing_cited` | Child's needs as reason | "For Emma's sake, can we..." |
| `child_triangulation` | Playing child against parent | "She said she likes it better at my house" |

### 7. Sentence Structure

| Pattern | Description | Examples |
|---------|-------------|----------|
| `accusation` | Direct blame | "You did this" |
| `question` | Inquiry | "Can we discuss...?" |
| `request` | Ask for action | "I need you to..." |
| `statement` | Neutral observation | "The pickup is at 3" |
| `demand` | Forceful requirement | "You need to..." |
| `threat` | Consequence warning | "If you don't..., I will..." |

---

## Output Schema

```typescript
interface LanguageAnalysis {
  // Pattern flags (boolean)
  patterns: {
    // Global vs Specific
    global_positive: boolean;
    global_negative: boolean;
    specific_behavior: boolean;
    specific_impact: boolean;

    // Evaluative vs Descriptive
    evaluative_character: boolean;
    evaluative_competence: boolean;
    descriptive_action: boolean;
    descriptive_observation: boolean;

    // Hedging
    over_explaining: boolean;
    apologetic_framing: boolean;
    hedging_softeners: boolean;
    direct_statement: boolean;

    // Vague vs Specific
    vague_complaint: boolean;
    vague_request: boolean;
    specific_complaint: boolean;
    specific_request: boolean;

    // Focus
    logistics_focused: boolean;
    character_focused: boolean;
    child_focused: boolean;
    relationship_focused: boolean;
    past_focused: boolean;
    future_focused: boolean;

    // Child involvement
    child_mentioned: boolean;
    child_as_messenger: boolean;
    child_as_weapon: boolean;
    child_wellbeing_cited: boolean;
    child_triangulation: boolean;

    // Has concrete request
    has_concrete_request: boolean;
    has_proposed_change: boolean;
  };

  // Structural analysis
  structure: {
    sentence_type: 'accusation' | 'question' | 'request' | 'statement' | 'demand' | 'threat';
    target: 'other_parent' | 'self' | 'child' | 'third_party' | 'situation';
    tense: 'past' | 'present' | 'future' | 'mixed';
    absolutes_used: string[];  // ["always", "never", "basically"]
    hedges_used: string[];     // ["just", "maybe", "sorry"]
  };

  // Human-readable summary (for debugging/logging)
  summary: string[];  // Array of factual observations

  // Confidence and metadata
  meta: {
    analyzer_version: string;
    analysis_method: 'local' | 'ai_enhanced';
    confidence: number;  // 0-100
    processing_time_ms: number;
  };
}
```

---

## Example Analyses

### Example 1: "You're basically failing Vira with the way you're handling things."

```json
{
  "patterns": {
    "global_negative": true,
    "specific_behavior": false,
    "evaluative_competence": true,
    "descriptive_action": false,
    "vague_complaint": true,
    "specific_complaint": false,
    "character_focused": true,
    "child_mentioned": true,
    "child_as_weapon": true,
    "has_concrete_request": false,
    "has_proposed_change": false
  },
  "structure": {
    "sentence_type": "accusation",
    "target": "other_parent",
    "tense": "present",
    "absolutes_used": ["basically"],
    "hedges_used": []
  },
  "summary": [
    "Uses global evaluation of other parent's competence",
    "Links evaluation directly to child's wellbeing without specific behaviors",
    "No concrete request or proposed change",
    "Vague reference to 'the way you're handling things'"
  ],
  "meta": {
    "analyzer_version": "1.0.0",
    "analysis_method": "local",
    "confidence": 85,
    "processing_time_ms": 2
  }
}
```

### Example 2: "Can we swap the Tuesday pickup? I have a work meeting until 4."

```json
{
  "patterns": {
    "global_negative": false,
    "specific_behavior": true,
    "evaluative_character": false,
    "descriptive_action": true,
    "vague_complaint": false,
    "specific_request": true,
    "logistics_focused": true,
    "character_focused": false,
    "child_mentioned": false,
    "has_concrete_request": true,
    "has_proposed_change": true
  },
  "structure": {
    "sentence_type": "request",
    "target": "situation",
    "tense": "future",
    "absolutes_used": [],
    "hedges_used": []
  },
  "summary": [
    "Logistics-focused request with specific day",
    "Provides concrete reason for request",
    "No evaluative language",
    "Clear, actionable ask"
  ],
  "meta": {
    "analyzer_version": "1.0.0",
    "analysis_method": "local",
    "confidence": 95,
    "processing_time_ms": 1
  }
}
```

### Example 3: "I'm sorry to bring this up again, but I just think maybe the homework situation isn't really working..."

```json
{
  "patterns": {
    "global_negative": false,
    "specific_behavior": false,
    "over_explaining": true,
    "apologetic_framing": true,
    "hedging_softeners": true,
    "direct_statement": false,
    "vague_complaint": true,
    "specific_complaint": false,
    "has_concrete_request": false
  },
  "structure": {
    "sentence_type": "statement",
    "target": "situation",
    "tense": "present",
    "absolutes_used": [],
    "hedges_used": ["sorry", "just", "think", "maybe", "really"]
  },
  "summary": [
    "Excessive hedging weakens the message",
    "Apologetic framing for raising concern",
    "Vague reference to 'homework situation'",
    "No specific ask or proposed solution"
  ],
  "meta": {
    "analyzer_version": "1.0.0",
    "analysis_method": "local",
    "confidence": 90,
    "processing_time_ms": 1
  }
}
```

---

## Library Structure

```
chat-server/libs/language-analyzer/
├── index.js                 # Main export, analyzeMessage()
├── patterns/
│   ├── globalSpecific.js    # Global vs specific detection
│   ├── evaluative.js        # Evaluative vs descriptive
│   ├── hedging.js           # Hedging and apologizing
│   ├── specificity.js       # Vague vs specific
│   ├── focus.js             # Focus type detection
│   ├── childInvolvement.js  # Child-related patterns
│   └── structure.js         # Sentence structure analysis
├── summarizer.js            # Generate human-readable summary
├── schema.js                # TypeScript-style schema definitions
└── __tests__/
    ├── globalSpecific.test.js
    ├── evaluative.test.js
    ├── hedging.test.js
    ├── integration.test.js
    └── fixtures/
        └── testMessages.json
```

---

## Integration with aiMediator.js

### Before (current):

```javascript
// Single AI call does everything
const result = await openaiClient.createChatCompletion({
  messages: [{ role: 'user', content: bigPromptWithAnalysisAndCoaching }]
});
```

### After (with analyzer):

```javascript
const languageAnalyzer = require('./libs/language-analyzer');

// Step 1: Analyze language patterns (local, fast)
const analysis = languageAnalyzer.analyze(message.text);

// Step 2: Include analysis in coaching prompt
const prompt = `
=== LANGUAGE ANALYSIS (factual observations) ===
${JSON.stringify(analysis.summary, null, 2)}

Patterns detected:
- Global evaluation: ${analysis.patterns.global_negative}
- Character-focused: ${analysis.patterns.character_focused}
- Has concrete request: ${analysis.patterns.has_concrete_request}

=== YOUR TASK ===
Based on this analysis, apply the 1-2-3 coaching framework...
`;

const result = await openaiClient.createChatCompletion({
  messages: [{ role: 'user', content: prompt }]
});
```

---

## Benefits

1. **Separation of Concerns**: Analysis is factual; coaching is advisory
2. **Testability**: Can test pattern detection with unit tests
3. **Debuggability**: Can log what analyzer saw before coaching
4. **Consistency**: Same analysis feeds all downstream features
5. **Constitution Compliance**: Analyzer stays factual (no emotions/labels)
6. **Performance**: Local analysis is free and fast (<5ms)
7. **Extensibility**: Add new patterns without changing coaching logic

---

## Success Metrics

1. **Accuracy**: Pattern detection matches human evaluation >90%
2. **Performance**: Analysis completes in <10ms
3. **Coverage**: Handles all common co-parenting message types
4. **Integration**: Successfully feeds coaching prompts

---

## Non-Functional Requirements

### NFR-001: Performance
- Local analysis must complete in <10ms
- No external API calls for basic analysis

### NFR-002: Accuracy
- Pattern detection should match human evaluation in >90% of cases
- Summary should be factual and verifiable

### NFR-003: Constitution Compliance
- Analysis must never include emotional diagnoses
- Analysis must never include psychological labels
- Analysis describes language mechanics only

---

## Implementation Phases

### Phase 1: Core Pattern Detection
- Implement global/specific detection
- Implement evaluative/descriptive detection
- Implement hedging detection
- Create integration test suite

### Phase 2: Advanced Analysis
- Implement specificity detection
- Implement focus type detection
- Implement child involvement detection
- Implement sentence structure analysis

### Phase 3: Integration
- Update aiMediator.js to use analyzer
- Include analysis in coaching prompts
- Add logging for analysis results

### Phase 4: Validation
- A/B test coaching quality with/without analyzer
- Gather feedback on analysis accuracy
- Tune pattern detection rules

---

## Related Documents

- `chat-server/ai-mediation-constitution.md` - Constitution rules
- `chat-server/aiMediator.js` - Coaching implementation
- `specs/004-ai-mediation-constitution/` - Constitution specification
