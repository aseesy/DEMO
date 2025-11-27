# Implementation Plan: Mediator Speaker Perspective Clarity

**Feature ID**: 006-mediator-speaker-perspective
**Specification**: `specs/006-mediator-speaker-perspective/spec.md`
**Created**: 2025-11-26
**Status**: Ready for Implementation

---

## Technical Context (from Codebase Analysis)

### Architecture
- **Backend**: Node.js + Express.js server (`chat-server/`)
- **AI Integration**: OpenAI API via `openaiClient.js`
- **AI Mediation**: `aiMediator.js` - single consolidated module handling all mediation
- **Libraries**: Modular `libs/` directory with pattern-based organization

### Existing Patterns (from Codebase)
- **Library Structure**: Each lib has `index.js` + dedicated modules + `__tests__/` folder
- **Pattern Detection**: `libs/language-analyzer/` demonstrates pattern-based detection with multiple sub-modules
- **Context Building**: `libs/communication-profile/mediationContext.js` shows role-aware context formatting
- **Testing**: Jest tests in `__tests__/` subdirectories following `*.test.js` naming

### Relevant Files
| File | Purpose |
|------|---------|
| `chat-server/aiMediator.js` | Main AI mediation logic, prompt construction |
| `chat-server/ai-mediation-constitution.md` | Constitutional rules for AI behavior |
| `chat-server/libs/communication-profile/mediationContext.js` | Role-aware context builder |
| `chat-server/libs/language-analyzer/index.js` | Pattern analysis reference implementation |

---

## Implementation Phases

### Phase 1: Prompt Enhancement

**Goal**: Make the AI unambiguously understand speaker/receiver roles and rewrite requirements.

#### Step 1.1: Add Role Clarity Section to AI Prompt

**File**: `chat-server/aiMediator.js`
**Location**: Lines 402-528 (prompt construction)

**Changes**:
1. Add new section after `=== YOUR IDENTITY ===` block (~line 427)
2. Insert explicit role disambiguation

```javascript
// INSERT AFTER line 427 (after "Address ONLY the sender using 'you/your'")

=== CRITICAL: REWRITE PERSPECTIVE ===

YOU ARE COACHING THE SENDER - the person who is about to SEND this message.

SENDER = ${senderDisplayName} (wrote this message, waiting to send it)
RECEIVER = ${receiverDisplayName} (will receive this message)

YOUR REWRITES ARE:
✅ Alternative messages ${senderDisplayName} could send INSTEAD of their original
✅ Different ways to express what ${senderDisplayName} wants to communicate
✅ Written from ${senderDisplayName}'s first-person perspective

YOUR REWRITES ARE NOT:
❌ Responses ${receiverDisplayName} would send after receiving the original
❌ How ${receiverDisplayName} might reply to the message
❌ Third-party observations about the conversation
❌ Reactions TO the original message

PERSPECTIVE CHECK: Before finalizing rewrites, ask yourself:
"Is this what ${senderDisplayName} could send to express their concern? Or is this
what ${receiverDisplayName} might say in response to receiving the original?"
```

#### Step 1.2: Add Example Library to Prompt

**File**: `chat-server/aiMediator.js`
**Location**: Insert before `=== RESPOND WITH JSON ===` section (~line 475)

```javascript
// INSERT before line 475

=== REWRITE EXAMPLES (perspective guidance) ===

EXAMPLE 1: Insult → Sender alternatives
Original: "you suck"
Sender's underlying intent: Frustration/disappointment with co-parent

❌ WRONG - These are RECEIVER responses:
- "That's hurtful. Can we talk about what's bothering you?"
- "I don't appreciate being spoken to that way."

✅ CORRECT - These are SENDER alternatives:
- "I'm feeling really frustrated right now and need us to communicate differently."
- "Something isn't working for me and I'd like to talk about it."

EXAMPLE 2: Blame → Sender alternatives
Original: "It's YOUR fault she's failing"
Sender's underlying intent: Concerned about child's performance

❌ WRONG - RECEIVER responses:
- "That's unfair. I'm trying my best."
- "Can you explain specifically what I did wrong?"

✅ CORRECT - SENDER alternatives:
- "I'm worried about her grades and want to discuss how we can both support her."
- "I've noticed she's struggling in school. Can we figure out a plan together?"

=== END EXAMPLES ===
```

#### Step 1.3: Update System Message

**File**: `chat-server/aiMediator.js`
**Location**: Line 536-537 (system message in API call)

**Current**:
```javascript
role: 'system',
content: 'You are LiaiZen - a communication COACH (not therapist) for co-parents. CONSTITUTION RULES: 1) Talk about LANGUAGE/PHRASING, never emotions...'
```

**Updated**:
```javascript
role: 'system',
content: 'You are LiaiZen - a communication COACH for co-parents. CONSTITUTION RULES: 1) Talk about LANGUAGE/PHRASING, never emotions ("this phrasing implies blame" not "you\'re angry"). 2) NO psychological labels (narcissist, manipulative, insecure - PROHIBITED). 3) Child-centric when child mentioned. 4) Use 1-2-3 framework: ADDRESS (what phrasing does) + ONE TIP (max 10 words) + TWO REWRITES (different approaches). CRITICAL: Rewrites are ALTERNATIVE messages the SENDER could send INSTEAD - NOT responses the receiver would send back. Only use "you/your" - NEVER "we/us/our/both". Respond ONLY with valid JSON.'
```

---

### Phase 2: Validation Layer

**Goal**: Detect and handle receiver-perspective rewrites before returning to client.

#### Step 2.1: Create Rewrite Validator Module

**File**: `chat-server/libs/rewrite-validator/index.js` (NEW)

```javascript
/**
 * Rewrite Validator Library
 *
 * Validates AI-generated rewrites to ensure they maintain sender perspective.
 * Detects and flags rewrites that appear to be receiver responses.
 *
 * Feature: 006-mediator-speaker-perspective
 */

const VERSION = '1.0.0';

/**
 * Patterns that indicate a rewrite is from receiver's perspective
 * (i.e., a response TO the message rather than an alternative FOR the sender)
 */
const RECEIVER_INDICATORS = [
  // Empathy/understanding openers (receiver responding to attack)
  /^I understand you('re| are)/i,
  /^I (can )?see (that )?you('re| are)/i,
  /^I hear (that )?you/i,

  // Hurt/reaction statements (receiver reacting to message)
  /that (hurt|upset|bothered|offended|made) me/i,
  /I('m| am) hurt by/i,
  /that was (hurtful|painful|offensive)/i,

  // Referencing what was said (processing received message)
  /when you said (that|this)/i,
  /what you (just )?said/i,
  /hearing (that|this|you say)/i,

  // Reactive phrases
  /^in response to/i,
  /^that('s| is) (not )?(fair|nice|okay|acceptable)/i,
  /^that('s| is) (really )?(hurtful|mean|unkind)/i,

  // Defensive patterns (defending against attack)
  /I('m| am) (not|trying|doing)/i, // Only when preceded by accusation
  /^I (don't|do not) (deserve|appreciate)/i,
  /^I (didn't|did not) (mean|intend|do)/i,

  // "Sorry you feel" pattern (dismissive receiver response)
  /^I('m| am) sorry you feel/i,

  // Request for explanation (receiver asking for clarification)
  /^(can|could) you explain (what|why)/i,
  /^what (exactly |specifically )?(do you mean|did I do)/i,
];

/**
 * Patterns that strongly indicate sender perspective (positive signals)
 */
const SENDER_INDICATORS = [
  /^I('m| am) feeling/i,
  /^I feel/i,
  /^I need/i,
  /^I('ve| have) noticed/i,
  /^I('m| am) (concerned|worried|frustrated)/i,
  /^I would like/i,
  /^I('d| would) prefer/i,
  /^can we (discuss|talk|figure)/i,
  /^something (isn't|is not) working/i,
  /^this (situation|isn't|is not)/i,
];

/**
 * Validate a single rewrite for sender perspective
 *
 * @param {string} rewrite - The rewrite text to validate
 * @param {string} originalMessage - The original message (for context)
 * @returns {Object} { valid: boolean, reason?: string, confidence: number }
 */
function validateRewritePerspective(rewrite, originalMessage = '') {
  if (!rewrite || typeof rewrite !== 'string') {
    return { valid: false, reason: 'empty_or_invalid', confidence: 0 };
  }

  const trimmedRewrite = rewrite.trim();

  // Check for receiver indicators
  for (const pattern of RECEIVER_INDICATORS) {
    if (pattern.test(trimmedRewrite)) {
      return {
        valid: false,
        reason: 'receiver_perspective_detected',
        pattern: pattern.toString(),
        confidence: 85,
      };
    }
  }

  // Check for sender indicators (positive signal)
  let senderSignalStrength = 0;
  for (const pattern of SENDER_INDICATORS) {
    if (pattern.test(trimmedRewrite)) {
      senderSignalStrength += 20;
    }
  }

  // Additional heuristics
  const startsWithI = /^I('m| am|'ve| have|'d| would| feel| need)/i.test(trimmedRewrite);
  const hasCanWe = /can we/i.test(trimmedRewrite);
  const hasSenderNeed = /I need|I('d| would) like/i.test(trimmedRewrite);

  if (startsWithI) senderSignalStrength += 10;
  if (hasCanWe) senderSignalStrength += 10;
  if (hasSenderNeed) senderSignalStrength += 15;

  // Calculate confidence
  const confidence = Math.min(95, 60 + senderSignalStrength);

  return {
    valid: true,
    confidence,
    senderSignals: senderSignalStrength > 0,
  };
}

/**
 * Validate both rewrites from an intervention
 *
 * @param {Object} intervention - { rewrite1, rewrite2 }
 * @param {string} originalMessage - The original message
 * @returns {Object} { valid: boolean, rewrite1Result, rewrite2Result }
 */
function validateIntervention(intervention, originalMessage = '') {
  const rewrite1Result = validateRewritePerspective(intervention.rewrite1, originalMessage);
  const rewrite2Result = validateRewritePerspective(intervention.rewrite2, originalMessage);

  return {
    valid: rewrite1Result.valid && rewrite2Result.valid,
    rewrite1: rewrite1Result,
    rewrite2: rewrite2Result,
    anyFailed: !rewrite1Result.valid || !rewrite2Result.valid,
    bothFailed: !rewrite1Result.valid && !rewrite2Result.valid,
  };
}

module.exports = {
  validateRewritePerspective,
  validateIntervention,
  RECEIVER_INDICATORS,
  SENDER_INDICATORS,
  VERSION,
};
```

#### Step 2.2: Create Fallback Rewrites Module

**File**: `chat-server/libs/rewrite-validator/fallbacks.js` (NEW)

```javascript
/**
 * Fallback Rewrites
 *
 * Pre-approved sender-perspective rewrites for when AI-generated
 * rewrites fail validation.
 *
 * Feature: 006-mediator-speaker-perspective
 */

/**
 * Categorized fallback rewrites by detected message intent
 */
const FALLBACK_REWRITES = {
  // For insults, attacks, name-calling
  attack: {
    rewrite1: "I'm feeling really frustrated right now and need us to communicate more respectfully.",
    rewrite2: "Something isn't working for me. Can we discuss what's happening?",
    tip: "Name the feeling, not the person.",
  },

  // For blame statements
  blame: {
    rewrite1: "I'm feeling overwhelmed and need us to work together on this.",
    rewrite2: "I've noticed an issue I'd like us to address together. Can we talk about it?",
    tip: "Describe the impact, not their intent.",
  },

  // For demands/commands
  demand: {
    rewrite1: "I need help with something. Would you be able to assist?",
    rewrite2: "This is important to me. Can we find a solution that works for both of us?",
    tip: "Make a request, not a command.",
  },

  // For threats/ultimatums
  threat: {
    rewrite1: "I'm feeling like we're not making progress. I need us to find a way forward.",
    rewrite2: "This issue is important to me. Can we work on resolving it?",
    tip: "State your need, not the consequence.",
  },

  // For triangulation (using child)
  triangulation: {
    rewrite1: "I need to discuss something with you directly about the kids.",
    rewrite2: "Can we talk about this between us? I don't want to put the kids in the middle.",
    tip: "Speak directly, not through your child.",
  },

  // Generic fallback
  generic: {
    rewrite1: "I have a concern I'd like to discuss with you.",
    rewrite2: "Something has been bothering me. Can we talk about it?",
    tip: "Express your need clearly and directly.",
  },
};

/**
 * Detect message intent category for fallback selection
 *
 * @param {string} originalMessage - The original problematic message
 * @param {Object} languageAnalysis - Optional analysis from language-analyzer
 * @returns {string} Category key for FALLBACK_REWRITES
 */
function detectCategory(originalMessage, languageAnalysis = null) {
  const text = originalMessage.toLowerCase();

  // Check language analysis flags first (most accurate)
  if (languageAnalysis?.patterns) {
    if (languageAnalysis.patterns.child_triangulation || languageAnalysis.patterns.child_as_messenger) {
      return 'triangulation';
    }
    if (languageAnalysis.patterns.evaluative_character) {
      return 'attack';
    }
  }

  // Pattern-based detection
  if (/\b(idiot|stupid|suck|pathetic|worthless|bitch|asshole)\b/i.test(text)) {
    return 'attack';
  }
  if (/\b(your fault|you('re| are) (the|to) blame|because of you)\b/i.test(text)) {
    return 'blame';
  }
  if (/\b(you (must|have to|need to|better)|or else|i('ll| will) (call|tell|go to))\b/i.test(text)) {
    return 'threat';
  }
  if (/\b(tell (your|the) (dad|mom|father|mother)|tell (him|her) (that|to))\b/i.test(text)) {
    return 'triangulation';
  }
  if (/\b(you (should|must|have to|need to))\b/i.test(text)) {
    return 'demand';
  }

  return 'generic';
}

/**
 * Get fallback rewrites for a failed intervention
 *
 * @param {string} originalMessage - The original message
 * @param {Object} languageAnalysis - Optional analysis from language-analyzer
 * @returns {Object} { rewrite1, rewrite2, tip, category }
 */
function getFallbackRewrites(originalMessage, languageAnalysis = null) {
  const category = detectCategory(originalMessage, languageAnalysis);
  const fallback = FALLBACK_REWRITES[category] || FALLBACK_REWRITES.generic;

  return {
    ...fallback,
    category,
    isFallback: true,
  };
}

module.exports = {
  FALLBACK_REWRITES,
  detectCategory,
  getFallbackRewrites,
};
```

#### Step 2.3: Create Test File

**File**: `chat-server/libs/rewrite-validator/__tests__/validator.test.js` (NEW)

```javascript
/**
 * Unit Tests: Rewrite Validator
 *
 * Tests for sender/receiver perspective validation.
 *
 * Feature: 006-mediator-speaker-perspective
 */

const validator = require('../index');
const fallbacks = require('../fallbacks');

describe('Rewrite Validator', () => {
  describe('validateRewritePerspective', () => {
    // Receiver perspective patterns (should FAIL)
    describe('should reject receiver-perspective rewrites', () => {
      const receiverRewrites = [
        "I understand you're frustrated, but let's talk calmly.",
        "That hurt me. Can we discuss what's bothering you?",
        "When you said that, I felt attacked.",
        "That's not fair. I'm doing my best.",
        "I don't appreciate being spoken to that way.",
        "I'm sorry you feel that way.",
        "Can you explain what I did wrong?",
        "What exactly do you mean by that?",
        "I didn't mean to upset you.",
        "Hearing that was really painful.",
      ];

      receiverRewrites.forEach(rewrite => {
        it(`should reject: "${rewrite.substring(0, 40)}..."`, () => {
          const result = validator.validateRewritePerspective(rewrite, 'you suck');
          expect(result.valid).toBe(false);
          expect(result.reason).toBe('receiver_perspective_detected');
        });
      });
    });

    // Sender perspective patterns (should PASS)
    describe('should accept sender-perspective rewrites', () => {
      const senderRewrites = [
        "I'm feeling really frustrated right now.",
        "I feel overwhelmed and need help.",
        "I need us to communicate more respectfully.",
        "I've noticed things aren't going well. Can we discuss?",
        "I'm concerned about how things are going.",
        "I would like us to find a better approach.",
        "Can we discuss what's happening?",
        "Something isn't working for me.",
        "This situation is difficult for me.",
        "I'd prefer if we could talk about this calmly.",
      ];

      senderRewrites.forEach(rewrite => {
        it(`should accept: "${rewrite.substring(0, 40)}..."`, () => {
          const result = validator.validateRewritePerspective(rewrite, 'you suck');
          expect(result.valid).toBe(true);
        });
      });
    });

    // Edge cases
    describe('edge cases', () => {
      it('should reject empty string', () => {
        const result = validator.validateRewritePerspective('');
        expect(result.valid).toBe(false);
        expect(result.reason).toBe('empty_or_invalid');
      });

      it('should reject null', () => {
        const result = validator.validateRewritePerspective(null);
        expect(result.valid).toBe(false);
      });

      it('should handle ambiguous rewrites cautiously', () => {
        const result = validator.validateRewritePerspective(
          "Let's talk about this later.",
          'you suck'
        );
        // Ambiguous but not clearly receiver perspective
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('validateIntervention', () => {
    it('should validate both rewrites', () => {
      const intervention = {
        rewrite1: "I'm feeling frustrated and need to talk.",
        rewrite2: "Can we discuss what's happening?",
      };

      const result = validator.validateIntervention(intervention, 'you suck');
      expect(result.valid).toBe(true);
      expect(result.anyFailed).toBe(false);
    });

    it('should detect when one rewrite fails', () => {
      const intervention = {
        rewrite1: "I'm feeling frustrated.",
        rewrite2: "That hurt me. Why would you say that?", // Receiver perspective
      };

      const result = validator.validateIntervention(intervention, 'you suck');
      expect(result.valid).toBe(false);
      expect(result.anyFailed).toBe(true);
      expect(result.bothFailed).toBe(false);
      expect(result.rewrite1.valid).toBe(true);
      expect(result.rewrite2.valid).toBe(false);
    });

    it('should detect when both rewrites fail', () => {
      const intervention = {
        rewrite1: "I understand you're upset.",
        rewrite2: "That hurt me. Can we talk?",
      };

      const result = validator.validateIntervention(intervention, 'you suck');
      expect(result.valid).toBe(false);
      expect(result.bothFailed).toBe(true);
    });
  });
});

describe('Fallback Rewrites', () => {
  describe('detectCategory', () => {
    it('should detect attack/insult', () => {
      expect(fallbacks.detectCategory('you suck')).toBe('attack');
      expect(fallbacks.detectCategory("you're an idiot")).toBe('attack');
    });

    it('should detect blame', () => {
      expect(fallbacks.detectCategory("It's your fault")).toBe('blame');
      expect(fallbacks.detectCategory("because of you")).toBe('blame');
    });

    it('should detect triangulation', () => {
      expect(fallbacks.detectCategory("tell your dad he needs to pay")).toBe('triangulation');
      expect(fallbacks.detectCategory("tell him to call me")).toBe('triangulation');
    });

    it('should detect threats', () => {
      expect(fallbacks.detectCategory("I'll call my lawyer")).toBe('threat');
      expect(fallbacks.detectCategory("you better do this or else")).toBe('threat');
    });

    it('should default to generic', () => {
      expect(fallbacks.detectCategory("whatever")).toBe('generic');
    });
  });

  describe('getFallbackRewrites', () => {
    it('should return appropriate fallbacks for attack', () => {
      const result = fallbacks.getFallbackRewrites('you suck');
      expect(result.category).toBe('attack');
      expect(result.rewrite1).toContain('frustrated');
      expect(result.isFallback).toBe(true);
    });

    it('should return triangulation fallbacks', () => {
      const result = fallbacks.getFallbackRewrites('tell your dad to pay up');
      expect(result.category).toBe('triangulation');
      expect(result.rewrite1).toContain('directly');
    });
  });
});
```

---

### Phase 3: Integration

**Goal**: Integrate validation into the existing AI mediation flow.

#### Step 3.1: Add Validation to aiMediator.js

**File**: `chat-server/aiMediator.js`

**Location**: After line 28 (requires section)

```javascript
// Add new require
let rewriteValidator;
try {
  rewriteValidator = require('./libs/rewrite-validator');
  console.log('✅ AI Mediator: Rewrite validator library loaded');
} catch (err) {
  console.warn('⚠️ AI Mediator: Rewrite validator library not available');
  rewriteValidator = null;
}
```

**Location**: After line 641 (validation before returning intervention) - inside the `if (action === 'INTERVENE')` block

```javascript
// Add after line 655 (after the existing field validation)

// NEW: Validate rewrite perspective (Feature 006)
if (rewriteValidator) {
  const validationResult = rewriteValidator.validateIntervention(
    { rewrite1: intervention.rewrite1, rewrite2: intervention.rewrite2 },
    message.text
  );

  if (!validationResult.valid) {
    console.warn('⚠️ AI Mediator: Rewrite perspective validation failed:', {
      rewrite1: validationResult.rewrite1,
      rewrite2: validationResult.rewrite2,
      originalMessage: message.text.substring(0, 50),
    });

    // Apply fallbacks for failed rewrites
    const fallbackModule = require('./libs/rewrite-validator/fallbacks');
    const fallbacks = fallbackModule.getFallbackRewrites(message.text, languageAnalysis);

    if (!validationResult.rewrite1.valid) {
      console.log('📝 Applying fallback for rewrite1');
      intervention.rewrite1 = fallbacks.rewrite1;
    }
    if (!validationResult.rewrite2.valid) {
      console.log('📝 Applying fallback for rewrite2');
      intervention.rewrite2 = fallbacks.rewrite2;
    }

    // Log for analysis
    console.log('📊 Perspective validation applied fallbacks:', {
      category: fallbacks.category,
      originalRewrite1Failed: !validationResult.rewrite1.valid,
      originalRewrite2Failed: !validationResult.rewrite2.valid,
    });
  }
}
```

---

### Phase 4: Constitution Update

**Goal**: Document the new principle in the AI mediation constitution.

#### Step 4.1: Update Constitution

**File**: `chat-server/ai-mediation-constitution.md`

**Location**: After Principle III (~line 78), add new principle:

```markdown
---

### Principle IV: Sender Perspective Primacy

**Mandate**: All rewrites MUST be written from the sender's perspective as alternative phrasings.

**Critical Understanding**:
- Rewrites are what the SENDER could send INSTEAD of their original message
- Rewrites are NOT responses the receiver would send back
- Rewrites express the sender's underlying intent in a better way
- The sender is being coached on HOW to express themselves, not on how to respond

**Prohibited Rewrite Patterns** (indicate receiver perspective):

| Pattern | Why Prohibited | Example |
|---------|----------------|---------|
| "I understand you're..." | Receiver empathy response | Responding to received attack |
| "That hurt me..." | Receiver reaction | Processing received insult |
| "When you said that..." | Receiver reflection | Discussing what was heard |
| "I don't appreciate..." | Receiver boundary-setting | Responding to mistreatment |
| "Can you explain what you meant?" | Receiver clarification | Asking about received message |

**Required Rewrite Patterns** (indicate sender perspective):

| Pattern | Why Required | Example |
|---------|--------------|---------|
| "I'm feeling..." | Sender emotional expression | Sender states their state |
| "I need..." | Sender need statement | Sender states their requirement |
| "I've noticed..." | Sender observation | Sender shares their concern |
| "Can we..." | Sender request/invitation | Sender proposes collaboration |
| "Something isn't working..." | Sender problem statement | Sender identifies issue |

**Perspective Test**: Before accepting any rewrite, apply this test:
> "Is this what the SENDER could say instead of their original message? Or is this what the RECEIVER would say after receiving that message?"

**Rationale**: Rewrites must be actionable alternatives for the person being coached. A rewrite that sounds like a response is useless to the sender who needs a better way to express their own concern.
```

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `chat-server/aiMediator.js` | MODIFY | Add role clarity section, examples, system message update, validation integration |
| `chat-server/ai-mediation-constitution.md` | MODIFY | Add Principle IV: Sender Perspective Primacy |
| `chat-server/libs/rewrite-validator/index.js` | CREATE | Main validation module |
| `chat-server/libs/rewrite-validator/fallbacks.js` | CREATE | Fallback rewrites module |
| `chat-server/libs/rewrite-validator/__tests__/validator.test.js` | CREATE | Unit tests |

---

## Validation Checklist

- [x] Follows existing codebase architecture patterns
- [x] Uses existing library structure (`libs/` with index.js + modules + tests)
- [x] Follows testing pattern (Jest in `__tests__/` subdirectory)
- [x] Integrates with existing AI mediation flow
- [x] Non-breaking change (validation is additive)
- [x] Fallback mechanism ensures no user-facing failures
- [x] Constitution updated with new principle
- [x] Comprehensive test coverage

---

## Testing Strategy

### Unit Tests
1. Receiver-perspective pattern detection
2. Sender-perspective pattern acceptance
3. Edge cases (empty, null, ambiguous)
4. Fallback category detection
5. Integration validation

### Integration Tests
1. Full intervention flow with validation
2. Fallback application when AI fails
3. Logging verification

### Manual QA
1. Test with known problematic messages:
   - "you suck"
   - "You never help with anything"
   - "Tell your dad he's a loser"
   - "It's YOUR fault"
2. Verify rewrites are sender-perspective
3. Verify fallbacks work when AI generates receiver-perspective rewrites

---

## Rollout Plan

1. **Development**: Implement all phases in dev environment
2. **Testing**: Run full test suite + manual QA
3. **Staging**: Deploy to staging, monitor logs for validation failures
4. **Production**: Deploy with fallback logging enabled
5. **Monitoring**: Review weekly logs for patterns needing adjustment

---

## Success Criteria

| Metric | Target | Measurement |
|--------|--------|-------------|
| Validation accuracy | >95% | Test suite pass rate |
| False positive rate | <5% | Valid sender rewrites incorrectly rejected |
| Fallback usage | <10% | Interventions requiring fallbacks |
| User rewrite acceptance | >60% | Analytics (post-implementation) |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-11-26 | Initial implementation plan |
