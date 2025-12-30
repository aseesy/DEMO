# Task List: Mediator Speaker Perspective Clarity

**Feature ID**: 006-mediator-speaker-perspective
**Specification**: `spec.md`
**Implementation Plan**: `plan.md`
**Created**: 2025-11-26

---

## Task Overview

| Task   | Type           | Priority | Complexity | Dependencies |
| ------ | -------------- | -------- | ---------- | ------------ |
| Task 1 | infrastructure | critical | small      | none         |
| Task 2 | infrastructure | critical | small      | Task 1       |
| Task 3 | infrastructure | critical | small      | Task 1       |
| Task 4 | feature        | high     | medium     | none         |
| Task 5 | feature        | high     | small      | Task 4       |
| Task 6 | feature        | high     | small      | Task 4       |
| Task 7 | integration    | high     | medium     | Tasks 1-3    |
| Task 8 | documentation  | medium   | small      | none         |
| Task 9 | testing        | high     | medium     | Tasks 1-7    |

---

## Task 1: Create Rewrite Validator Module

**Type**: infrastructure
**Priority**: critical
**Complexity**: small
**Estimated Time**: 30 minutes
**Dependencies**: none

### Description

Create the main rewrite validator module that detects receiver-perspective patterns in AI-generated rewrites.

### File Operations

| File                                          | Action |
| --------------------------------------------- | ------ |
| `chat-server/libs/rewrite-validator/index.js` | CREATE |

### Implementation Details

Create `chat-server/libs/rewrite-validator/index.js` with:

- `RECEIVER_INDICATORS` array of regex patterns for receiver perspective detection
- `SENDER_INDICATORS` array of regex patterns for sender perspective validation
- `validateRewritePerspective(rewrite, originalMessage)` function
- `validateIntervention(intervention, originalMessage)` function
- Export `VERSION = '1.0.0'`

### Acceptance Criteria

- [ ] File created at `chat-server/libs/rewrite-validator/index.js`
- [ ] Contains at least 10 receiver indicator patterns
- [ ] Contains at least 8 sender indicator patterns
- [ ] `validateRewritePerspective` returns `{valid, reason?, confidence}`
- [ ] `validateIntervention` validates both rewrites and returns combined result
- [ ] Module exports all public functions

---

## Task 2: Create Fallback Rewrites Module

**Type**: infrastructure
**Priority**: critical
**Complexity**: small
**Estimated Time**: 20 minutes
**Dependencies**: Task 1

### Description

Create the fallback rewrites module with pre-approved sender-perspective alternatives for different message categories.

### File Operations

| File                                              | Action |
| ------------------------------------------------- | ------ |
| `chat-server/libs/rewrite-validator/fallbacks.js` | CREATE |

### Implementation Details

Create `chat-server/libs/rewrite-validator/fallbacks.js` with:

- `FALLBACK_REWRITES` object with categories: attack, blame, demand, threat, triangulation, generic
- Each category has: `rewrite1`, `rewrite2`, `tip`
- `detectCategory(originalMessage, languageAnalysis)` function
- `getFallbackRewrites(originalMessage, languageAnalysis)` function

### Acceptance Criteria

- [ ] File created at `chat-server/libs/rewrite-validator/fallbacks.js`
- [ ] Contains 6 fallback categories (attack, blame, demand, threat, triangulation, generic)
- [ ] Each category has two rewrites and a tip
- [ ] `detectCategory` correctly identifies message types
- [ ] `getFallbackRewrites` returns appropriate fallbacks with `isFallback: true`

---

## Task 3: Create Unit Tests for Validator

**Type**: infrastructure
**Priority**: critical
**Complexity**: small
**Estimated Time**: 30 minutes
**Dependencies**: Task 1, Task 2

### Description

Create comprehensive unit tests for the rewrite validator and fallback modules.

### File Operations

| File                                                             | Action |
| ---------------------------------------------------------------- | ------ |
| `chat-server/libs/rewrite-validator/__tests__/validator.test.js` | CREATE |

### Implementation Details

Create test file with:

- Tests for `validateRewritePerspective`:
  - 10+ receiver-perspective rewrites that should FAIL
  - 10+ sender-perspective rewrites that should PASS
  - Edge cases (empty, null, ambiguous)
- Tests for `validateIntervention`:
  - Both valid, one invalid, both invalid scenarios
- Tests for `detectCategory`:
  - Attack, blame, triangulation, threat, demand, generic
- Tests for `getFallbackRewrites`:
  - Returns correct category and content

### Acceptance Criteria

- [ ] File created at `chat-server/libs/rewrite-validator/__tests__/validator.test.js`
- [ ] All receiver-perspective test cases fail validation
- [ ] All sender-perspective test cases pass validation
- [ ] Edge cases handled correctly
- [ ] Fallback detection tests pass
- [ ] Tests can be run with `npm test`

---

## Task 4: Add Role Clarity Section to AI Prompt

**Type**: feature
**Priority**: high
**Complexity**: medium
**Estimated Time**: 20 minutes
**Dependencies**: none

### Description

Enhance the AI prompt in `aiMediator.js` to explicitly clarify sender/receiver roles and rewrite expectations.

### File Operations

| File                        | Action |
| --------------------------- | ------ |
| `chat-server/aiMediator.js` | MODIFY |

### Implementation Details

Insert after line 427 (after `=== YOUR IDENTITY ===` section):

```
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

### Acceptance Criteria

- [ ] Role clarity section added to prompt
- [ ] Uses dynamic `senderDisplayName` and `receiverDisplayName` variables
- [ ] Clearly distinguishes sender vs receiver responsibilities
- [ ] Includes perspective check instruction
- [ ] Prompt still generates valid JSON responses

---

## Task 5: Add Example Library to AI Prompt

**Type**: feature
**Priority**: high
**Complexity**: small
**Estimated Time**: 15 minutes
**Dependencies**: Task 4

### Description

Add concrete examples showing correct vs incorrect rewrites to the AI prompt.

### File Operations

| File                        | Action |
| --------------------------- | ------ |
| `chat-server/aiMediator.js` | MODIFY |

### Implementation Details

Insert before `=== RESPOND WITH JSON ===` section (~line 475):

```
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

### Acceptance Criteria

- [ ] Example section added to prompt
- [ ] Shows at least 2 message types (insult, blame)
- [ ] Each example shows wrong (receiver) and correct (sender) rewrites
- [ ] Examples are clear and actionable
- [ ] Prompt length remains reasonable for API limits

---

## Task 6: Update System Message

**Type**: feature
**Priority**: high
**Complexity**: small
**Estimated Time**: 10 minutes
**Dependencies**: Task 4

### Description

Update the system message in the OpenAI API call to reinforce sender perspective.

### File Operations

| File                        | Action |
| --------------------------- | ------ |
| `chat-server/aiMediator.js` | MODIFY |

### Implementation Details

Update line 536-537 system message content to include:

```javascript
content: 'You are LiaiZen - a communication COACH for co-parents. CONSTITUTION RULES: 1) Talk about LANGUAGE/PHRASING, never emotions ("this phrasing implies blame" not "you\'re angry"). 2) NO psychological labels (narcissist, manipulative, insecure - PROHIBITED). 3) Child-centric when child mentioned. 4) Use 1-2-3 framework: ADDRESS (what phrasing does) + ONE TIP (max 10 words) + TWO REWRITES (different approaches). CRITICAL: Rewrites are ALTERNATIVE messages the SENDER could send INSTEAD - NOT responses the receiver would send back. Only use "you/your" - NEVER "we/us/our/both". Respond ONLY with valid JSON.';
```

### Acceptance Criteria

- [ ] System message updated with sender perspective rule
- [ ] "CRITICAL" keyword emphasizes rewrite direction
- [ ] All existing constitution rules preserved
- [ ] Message is concise enough for system prompt efficiency

---

## Task 7: Integrate Validation into AI Mediator

**Type**: integration
**Priority**: high
**Complexity**: medium
**Estimated Time**: 30 minutes
**Dependencies**: Tasks 1, 2, 3

### Description

Integrate the rewrite validator into the AI mediation flow, applying fallbacks when validation fails.

### File Operations

| File                        | Action |
| --------------------------- | ------ |
| `chat-server/aiMediator.js` | MODIFY |

### Implementation Details

1. **Add require statement** after line 28:

```javascript
let rewriteValidator;
try {
  rewriteValidator = require('./libs/rewrite-validator');
  console.log('✅ AI Mediator: Rewrite validator library loaded');
} catch (err) {
  console.warn('⚠️ AI Mediator: Rewrite validator library not available');
  rewriteValidator = null;
}
```

2. **Add validation logic** after line 655 (inside `if (action === 'INTERVENE')` block, after field validation):

```javascript
// Validate rewrite perspective (Feature 006)
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

    console.log('📊 Perspective validation applied fallbacks:', {
      category: fallbacks.category,
      originalRewrite1Failed: !validationResult.rewrite1.valid,
      originalRewrite2Failed: !validationResult.rewrite2.valid,
    });
  }
}
```

### Acceptance Criteria

- [ ] Validator library loaded with graceful fallback if not available
- [ ] Validation runs on every INTERVENE action
- [ ] Failed rewrites replaced with appropriate fallbacks
- [ ] Detailed logging for monitoring and debugging
- [ ] No user-facing errors if validator fails to load
- [ ] Existing mediation flow unchanged when validation passes

---

## Task 8: Update AI Mediation Constitution

**Type**: documentation
**Priority**: medium
**Complexity**: small
**Estimated Time**: 15 minutes
**Dependencies**: none

### Description

Add Principle IV (Sender Perspective Primacy) to the AI mediation constitution.

### File Operations

| File                                       | Action |
| ------------------------------------------ | ------ |
| `chat-server/ai-mediation-constitution.md` | MODIFY |

### Implementation Details

Insert after Principle III (~line 78):

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

| Pattern                           | Why Prohibited            | Example                       |
| --------------------------------- | ------------------------- | ----------------------------- |
| "I understand you're..."          | Receiver empathy response | Responding to received attack |
| "That hurt me..."                 | Receiver reaction         | Processing received insult    |
| "When you said that..."           | Receiver reflection       | Discussing what was heard     |
| "I don't appreciate..."           | Receiver boundary-setting | Responding to mistreatment    |
| "Can you explain what you meant?" | Receiver clarification    | Asking about received message |

**Required Rewrite Patterns** (indicate sender perspective):

| Pattern                      | Why Required                | Example                         |
| ---------------------------- | --------------------------- | ------------------------------- |
| "I'm feeling..."             | Sender emotional expression | Sender states their state       |
| "I need..."                  | Sender need statement       | Sender states their requirement |
| "I've noticed..."            | Sender observation          | Sender shares their concern     |
| "Can we..."                  | Sender request/invitation   | Sender proposes collaboration   |
| "Something isn't working..." | Sender problem statement    | Sender identifies issue         |

**Perspective Test**: Before accepting any rewrite, apply this test:

> "Is this what the SENDER could say instead of their original message? Or is this what the RECEIVER would say after receiving that message?"

**Rationale**: Rewrites must be actionable alternatives for the person being coached. A rewrite that sounds like a response is useless to the sender who needs a better way to express their own concern.
```

Also update changelog and Part VI enforcement checklist.

### Acceptance Criteria

- [ ] Principle IV added after Principle III
- [ ] Includes prohibited patterns table
- [ ] Includes required patterns table
- [ ] Includes perspective test
- [ ] Changelog updated with version increment
- [ ] Enforcement checklist updated

---

## Task 9: Run Tests and Verify Integration

**Type**: testing
**Priority**: high
**Complexity**: medium
**Estimated Time**: 30 minutes
**Dependencies**: Tasks 1-7

### Description

Run all unit tests and perform manual verification of the integration.

### File Operations

| File | Action |
| ---- | ------ |
| N/A  | TEST   |

### Implementation Details

1. **Run unit tests**:

```bash
cd chat-server
npm test -- libs/rewrite-validator/__tests__/validator.test.js
```

2. **Verify server starts**:

```bash
npm run dev
# Check for "✅ AI Mediator: Rewrite validator library loaded"
```

3. **Manual test cases** (via chat interface):
   - Send "you suck" - verify rewrites are sender-perspective
   - Send "It's YOUR fault" - verify rewrites express sender concern
   - Send "Tell your dad he's a loser" - verify triangulation handling

4. **Check logs** for:
   - Validation pass/fail rates
   - Fallback usage (should be <10%)
   - Any errors or warnings

### Acceptance Criteria

- [ ] All unit tests pass
- [ ] Server starts without errors
- [ ] Validator library loads successfully
- [ ] Manual tests produce sender-perspective rewrites
- [ ] No receiver-perspective rewrites in output
- [ ] Fallbacks apply correctly when needed
- [ ] Logging provides useful debugging info

---

## Execution Order

```
Phase 1: Infrastructure (Tasks 1-3) - Can be parallelized
├── Task 1: Create Validator Module
├── Task 2: Create Fallbacks Module (after Task 1)
└── Task 3: Create Unit Tests (after Tasks 1-2)

Phase 2: Prompt Enhancement (Tasks 4-6) - Can be parallelized with Phase 1
├── Task 4: Add Role Clarity Section
├── Task 5: Add Example Library (after Task 4)
└── Task 6: Update System Message (after Task 4)

Phase 3: Integration (Task 7) - Depends on Phase 1
└── Task 7: Integrate Validation

Phase 4: Documentation (Task 8) - Can run anytime
└── Task 8: Update Constitution

Phase 5: Verification (Task 9) - Depends on all previous
└── Task 9: Run Tests and Verify
```

---

## Quick Start

To implement this feature, execute tasks in this order:

```bash
# 1. Create validator library (Tasks 1-3)
mkdir -p chat-server/libs/rewrite-validator/__tests__

# 2. Implement Tasks 1-3 (infrastructure)

# 3. Implement Tasks 4-6 (prompt changes)

# 4. Implement Task 7 (integration)

# 5. Implement Task 8 (constitution)

# 6. Run Task 9 (verification)
cd chat-server && npm test
```

---

## Changelog

| Version | Date       | Changes                |
| ------- | ---------- | ---------------------- |
| 1.0.0   | 2025-11-26 | Initial task breakdown |
