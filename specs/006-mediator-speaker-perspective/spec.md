# Feature Specification: Mediator Speaker Perspective Clarity

**Feature ID**: 006-mediator-speaker-perspective
**Status**: Draft
**Created**: 2025-11-26
**Author**: Specification Agent

---

## Overview

### Problem Statement

LiaiZen's AI mediator currently has ambiguity in its speaker/receiver role understanding. When a sender writes a hostile message like "you suck", the AI may generate rewrites that sound like responses from the *receiver* rather than alternative phrasings for the *sender*.

**Current Problematic Behavior Example:**

```
Sender (Parent A) writes: "you suck"

AI might generate:
- rewrite1: "I understand you're frustrated, but let's talk about this calmly."
- rewrite2: "That comment hurt. Can we discuss what's bothering you?"
```

These rewrites sound like what Parent B (the receiver) would say *after receiving* "you suck" - not what Parent A (the sender) should send *instead* of "you suck".

**Correct Expected Behavior:**

```
Sender (Parent A) writes: "you suck"

AI should generate:
- rewrite1: "I'm feeling really frustrated right now and need us to communicate differently."
- rewrite2: "The way things are going isn't working for me. Can we talk about what's happening?"
```

These are alternative messages Parent A could send *instead* that express their underlying frustration without attacking.

### Business Objective

Ensure the AI mediator always coaches from the correct perspective: helping the *sender* express their underlying need/concern more effectively, never generating "response" messages that only make sense from the receiver's perspective.

### Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Rewrite perspective accuracy | 100% | QA review of intervention samples |
| User acceptance rate of rewrites | >60% | Analytics tracking |
| False "receiver perspective" rewrites | 0% | Automated validation |
| Reduction in rewrite rejections | -30% | Before/after comparison |

---

## User Stories

### US-001: Sender Receives Correct Rewrite Perspective

**As a** co-parent sending a message that triggers AI intervention
**I want** the suggested rewrites to be alternative ways *I* could express my concern
**So that** I can choose a better phrasing that still represents what *I* want to say

**Acceptance Criteria:**
- [ ] Rewrites are phrased from first-person perspective of the sender
- [ ] Rewrites express the sender's underlying intent/concern
- [ ] Rewrites never sound like responses to the original message
- [ ] Rewrites use "I feel...", "I need...", "I've noticed..." structures
- [ ] Rewrites do NOT use "I understand you're...", "That hurt...", etc.

### US-002: AI Mediator Understands Role Context

**As a** system administrator
**I want** the AI mediator to clearly understand who is the sender vs receiver
**So that** all coaching is correctly directed at the person composing the message

**Acceptance Criteria:**
- [ ] Prompt explicitly labels sender as "person writing this message"
- [ ] Prompt explicitly labels receiver as "person who will receive this message"
- [ ] System message reinforces that rewrites replace the sender's message
- [ ] Examples in prompt show correct sender-perspective rewrites
- [ ] Validation rejects rewrites that appear to be receiver responses

---

## Functional Requirements

### FR-001: Enhanced Prompt Role Clarity

The AI prompt MUST include explicit disambiguation of roles:

```
=== CRITICAL ROLE UNDERSTANDING ===

YOU ARE COACHING THE SENDER - the person who wrote this message.

- SENDER = The person who typed this message and is about to send it
- RECEIVER = The other co-parent who will receive this message

YOUR REWRITES ARE:
✅ Alternative messages the SENDER could send INSTEAD
✅ Different ways to express what the SENDER wants to communicate
✅ Written from the SENDER's first-person perspective

YOUR REWRITES ARE NOT:
❌ Responses the receiver would send back
❌ How the receiver might reply after reading the original
❌ Third-party observations about the conversation
```

**Business Rules:**
1. Every intervention MUST generate rewrites from sender perspective
2. Rewrites MUST preserve the sender's underlying intent
3. Rewrites MUST NOT be phrased as reactions to the original message

### FR-002: Rewrite Validation Layer

The system MUST validate generated rewrites before returning them.

**Receiver-Perspective Indicators to Detect:**
- Starts with "I understand you're..."
- Contains "That [hurt/upset/bothered] me..."
- Phrases like "When you said that..."
- Reactive language: "In response to...", "Hearing that..."
- Second-person accusatory opener in rewrite (responding back)

**Validation Logic:**
```javascript
function validateRewritePerspective(rewrite, originalMessage) {
  const receiverIndicators = [
    /^I understand you('re| are)/i,
    /that (hurt|upset|bothered|made) me/i,
    /when you said (that|this)/i,
    /^in response to/i,
    /hearing (that|this)/i,
    /^I('m| am) sorry you feel/i,
    /^that('s| is) (not|a) (nice|fair|okay)/i
  ];

  for (const pattern of receiverIndicators) {
    if (pattern.test(rewrite)) {
      return { valid: false, reason: 'Appears to be receiver response' };
    }
  }

  return { valid: true };
}
```

### FR-003: Enhanced Example Library in Prompt

The prompt MUST include clear examples distinguishing correct from incorrect rewrites:

```
=== REWRITE EXAMPLES ===

EXAMPLE 1: Insult
Original from sender: "you suck"
Sender's intent: Expressing frustration/disappointment

❌ WRONG (receiver perspective):
- "That's hurtful. Can we talk about what's bothering you?"
- "I don't appreciate being spoken to that way."

✅ CORRECT (sender perspective):
- "I'm feeling really frustrated right now and need us to communicate differently."
- "Something isn't working for me and I'd like to talk about it."

EXAMPLE 2: Blame
Original from sender: "You never help with anything"
Sender's intent: Feeling overwhelmed, wanting more support

❌ WRONG (receiver perspective):
- "I help when I can. Can we discuss this more fairly?"
- "That's not accurate. Let me show you what I've done."

✅ CORRECT (sender perspective):
- "I'm feeling overwhelmed handling things alone. I need us to share responsibilities more."
- "I've noticed I'm taking on most of the tasks. Can we look at a more balanced approach?"

EXAMPLE 3: Accusation
Original from sender: "You're such a bad parent"
Sender's intent: Concern about co-parent's parenting decisions

❌ WRONG (receiver perspective):
- "That's unfair. I'm doing my best."
- "I don't deserve that. What specifically are you concerned about?"

✅ CORRECT (sender perspective):
- "I have concerns about some parenting decisions and want to discuss them."
- "I'm worried about [specific issue]. Can we talk about how we're handling this?"
```

### FR-004: Fallback Behavior for Invalid Rewrites

If a generated rewrite fails perspective validation:

1. **First attempt**: Log warning, return only the valid rewrite(s)
2. **Both fail**: Return generic fallback rewrites with logged error
3. **Fallback rewrites** are pre-approved sender-perspective alternatives:

```javascript
const fallbackRewrites = {
  frustration: [
    "I'm feeling frustrated and need us to communicate more respectfully.",
    "Something isn't working for me. Can we discuss what's happening?"
  ],
  concern: [
    "I have a concern I'd like to discuss with you.",
    "I've noticed something that's been bothering me. Can we talk about it?"
  ],
  conflict: [
    "I'm having a hard time with how things are going. Can we find a better approach?",
    "This situation isn't working for me. I'd like to find a solution together."
  ]
};
```

---

## Technical Constraints

### Architecture Integration

**Affected Files:**
- `chat-server/aiMediator.js` - Main prompt modification
- `chat-server/ai-mediation-constitution.md` - Add role clarity section
- `chat-server/libs/communication-profile/mediationContext.js` - Enhance role context formatting
- New: `chat-server/libs/rewrite-validator.js` - Validation module

**Dependencies:**
- Existing role context from Feature 002 (sender-profile-mediation)
- Communication profile library
- OpenAI client

### API Changes

No new API endpoints required. Enhancement to existing `analyzeMessage()` function:

```javascript
// Add validation step before returning intervention
async function analyzeMessage(...) {
  // ... existing code ...

  if (action === 'INTERVENE') {
    // NEW: Validate rewrite perspective
    const rewrite1Valid = validateRewritePerspective(intervention.rewrite1, message.text);
    const rewrite2Valid = validateRewritePerspective(intervention.rewrite2, message.text);

    if (!rewrite1Valid.valid || !rewrite2Valid.valid) {
      console.warn('⚠️ Rewrite perspective validation failed:', {
        rewrite1: rewrite1Valid,
        rewrite2: rewrite2Valid
      });

      // Apply fallback or regenerate
      intervention = applyRewriteFallback(intervention, message.text);
    }

    return { ...result, intervention };
  }
}
```

### Performance Considerations

- Validation adds <1ms overhead (regex-based)
- No additional API calls for validation
- Fallback rewrites are pre-cached
- Regeneration (if implemented) would add ~500ms

---

## Non-Functional Requirements

### NFR-001: Accuracy

- Rewrite perspective accuracy MUST be 100%
- Zero tolerance for receiver-perspective rewrites reaching users

### NFR-002: Latency

- Validation step MUST complete in <5ms
- Total intervention response time unchanged (<2s)

### NFR-003: Auditability

- All perspective validation failures MUST be logged
- Failed rewrites MUST be stored for analysis
- Weekly QA review of validation failures

---

## Test Scenarios

### TS-001: Basic Insult - Correct Perspective

**Given**: Sender message "you suck"
**When**: AI generates intervention
**Then**: Both rewrites are from sender perspective
**And**: Neither rewrite sounds like a response to "you suck"

### TS-002: Validation Catches Receiver Response

**Given**: AI generates rewrite "I understand you're frustrated"
**When**: Validation runs
**Then**: Rewrite is flagged as receiver-perspective
**And**: System applies fallback or requests regeneration

### TS-003: Blame Statement - Correct Transformation

**Given**: Sender message "It's all your fault"
**When**: AI generates intervention
**Then**: Rewrites express sender's concern without blame
**And**: Rewrites do NOT sound like receiver defending themselves

### TS-004: Child Triangulation - Correct Perspective

**Given**: Sender message "Tell your dad he's a loser"
**When**: AI generates intervention
**Then**: Rewrites are for sender to communicate directly
**And**: Rewrites do NOT sound like child or other parent responding

### TS-005: Edge Case - Ambiguous Rewrite

**Given**: AI generates "I need us to communicate better"
**When**: Validation runs
**Then**: Rewrite passes (valid sender perspective)
**Because**: Could be said by sender as alternative phrasing

---

## Constitution Amendment

Add to `ai-mediation-constitution.md` Section II:

```markdown
### Principle IV: Sender Perspective Primacy

**Mandate**: All rewrites MUST be written from the sender's perspective as alternative phrasings.

**Critical Understanding**:
- Rewrites are what the SENDER could send INSTEAD of their original message
- Rewrites are NOT responses the receiver would send back
- Rewrites express the sender's underlying intent in a better way

**Prohibited Rewrite Patterns**:
| Pattern | Why Prohibited | Example |
|---------|----------------|---------|
| "I understand you're..." | Receiver response pattern | Sounds like reacting to the message |
| "That hurt me..." | Receiver reaction | Response to being insulted |
| "When you said that..." | Receiver reflection | Processing received message |
| "I don't appreciate..." | Receiver boundary | Responding to attack |

**Required Rewrite Patterns**:
| Pattern | Why Required | Example |
|---------|--------------|---------|
| "I'm feeling..." | Sender expression | Expressing sender's state |
| "I need..." | Sender need | Stating sender's requirement |
| "I've noticed..." | Sender observation | Sender sharing concern |
| "Can we..." | Sender request | Sender proposing solution |
```

---

## Implementation Notes

### Phase 1: Prompt Enhancement
1. Add explicit role disambiguation section to prompt
2. Add example library with correct/incorrect comparisons
3. Update system message to reinforce sender perspective

### Phase 2: Validation Layer
1. Create `rewrite-validator.js` module
2. Implement receiver-perspective detection
3. Add logging for validation failures

### Phase 3: Fallback System
1. Create pre-approved fallback rewrite library
2. Implement fallback selection based on message intent
3. Add metrics for fallback usage

### Phase 4: Monitoring & Iteration
1. Review validation failure logs weekly
2. Expand receiver-indicator patterns as needed
3. Tune prompt based on persistent issues

---

## Domain Validation

### Co-Parenting Alignment

| Requirement | Status | Notes |
|-------------|--------|-------|
| Child-centered outcomes | ✅ | Proper coaching helps parents communicate better for children |
| Conflict reduction | ✅ | Correct perspective ensures useful alternatives |
| Privacy & security | ✅ | No new data collection required |
| Accessibility | ✅ | No UI changes |
| Audit trail | ✅ | Validation failures logged |

### Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Over-aggressive validation | Medium | Medium | Start conservative, tune based on data |
| Fallback overuse | Low | Low | Monitor metrics, improve prompt |
| User confusion | Low | Low | Rewrites will be MORE useful |

---

## Appendix A: Detailed Examples

### A.1 Insult Category

**Original**: "You're an idiot"

**Sender Intent Analysis**: Expressing frustration with co-parent's actions/decisions

**Wrong (Receiver Perspective)**:
- "That's really hurtful. I'd appreciate if we could talk respectfully."
- "I don't deserve that. What's really bothering you?"

**Correct (Sender Perspective)**:
- "I'm frustrated with how things are going and need us to find a better approach."
- "I'm having trouble understanding your decision. Can you help me see your perspective?"

### A.2 Blame Category

**Original**: "You ruined the kids' weekend"

**Sender Intent Analysis**: Disappointed about how something affected the children

**Wrong (Receiver Perspective)**:
- "That's not fair. I was trying my best."
- "Can you explain what you mean? I thought it went okay."

**Correct (Sender Perspective)**:
- "I'm disappointed about how the weekend went. Can we talk about what happened?"
- "I think the kids were affected by [specific issue]. I'd like to discuss how we can handle it differently."

### A.3 Threat Category

**Original**: "I'm calling my lawyer"

**Sender Intent Analysis**: Feeling unheard, escalating for attention

**Wrong (Receiver Perspective)**:
- "That's unnecessary. Can't we talk about this?"
- "I'd prefer to resolve this between us."

**Correct (Sender Perspective)**:
- "I'm feeling like we're not making progress and I need us to find a way forward."
- "This issue is important to me and I need it addressed. Can we work on a solution?"

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-11-26 | Initial specification |
