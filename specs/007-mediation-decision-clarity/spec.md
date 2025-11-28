# Feature Specification: Mediation Decision Clarity

**Feature ID**: 007-mediation-decision-clarity
**Created**: 2025-11-27
**Status**: Analysis

## Overview

**Feature Name**: Mediation Decision Clarity - Does LiaiZen Really Understand What to Mediate?

**Business Objective**: Ensure LiaiZen's AI mediation system accurately identifies messages that NEED intervention vs. messages that should pass through freely.

**Problem Statement**:
LiaiZen is currently over-mediating neutral messages while the constitution and prompts are well-designed. The issue is a gap between the excellent constitution/prompt design and the AI model's actual decision-making.

---

## Current State Analysis

### What LiaiZen SHOULD Mediate (Per Constitution)

The AI Mediation Constitution (`ai-mediation-constitution.md`) is well-defined:

**INTERVENE (5-15% of messages):**
- Direct blame/attacks: "It's YOUR fault", "YOU always..."
- Name-calling or insults
- Threats or ultimatums
- Contemptuous language: "stupid", "pathetic", "worthless"
- Triangulation: Using child against other parent
- Commands disguised as requests

**STAY SILENT (80-90% of messages):**
- Expressing genuine concerns: "I'm worried about..."
- Asking questions: "Can we discuss..."
- Sharing information: "The teacher mentioned..."
- Stating boundaries: "I need...", "I would prefer..."
- Coordinating logistics: "Can you pick up at 3?"
- Any respectful communication, even if imperfect

### What LiaiZen Is ACTUALLY Mediating (Observed Issues)

| Message | Expected | Actual | Issue |
|---------|----------|--------|-------|
| "you're my friend" | STAY_SILENT | INTERVENE | False positive - positive sentiment |
| "I love how you talk to me" | STAY_SILENT | INTERVENE | False positive - compliment |
| "My friend hates pizza" | STAY_SILENT | INTERVENE | False positive - third party statement |
| "you suck" | INTERVENE | INTERVENE | Correct |

### Root Cause Analysis

The problem exists at **THREE layers**:

#### Layer 1: Pre-Filter (Regex-based)
**File**: `chat-server/src/liaizen/core/mediator.js` (lines 216-263)

**Current Pre-Filters:**
1. ✅ Greetings: "hi", "hello", "hey"
2. ✅ Polite: "thanks", "ok", "yes", "no"
3. ✅ (NEW) Third-party statements: Talks about friend/teacher but not "you"
4. ✅ (NEW) Positive sentiment: "you're my friend", "I love how you..."

**Gap**: Pre-filters are growing but reactive. We add patterns AFTER seeing failures.

#### Layer 2: AI Prompt (System Prompt)
**File**: `chat-server/src/liaizen/core/mediator.js` (lines 465-707)

The prompt is comprehensive and well-designed:
- Clear STAY_SILENT vs INTERVENE criteria
- Expert coach identity
- Specific examples
- Decision criteria percentages (80-90% STAY_SILENT)

**Gap**: The prompt says 80-90% should STAY_SILENT, but the AI model ignores this.

#### Layer 3: AI Model Behavior (GPT-3.5-turbo)
The AI model (GPT-3.5-turbo) is making decisions that contradict the prompt:
- Flagging neutral statements as "vague complaints"
- Over-interpreting harmless messages
- Not respecting the 80-90% STAY_SILENT guideline

**Gap**: The model is biased toward intervention over silence.

---

## The Core Question: Does LiaiZen Understand?

### Answer: Yes AND No

**YES - LiaiZen's DESIGN understands:**
- The constitution is excellent and thorough
- The prompt is well-constructed with clear criteria
- The pre-filters catch known good patterns

**NO - LiaiZen's EXECUTION doesn't follow the design:**
- The AI model over-intervenes despite clear instructions
- The model interprets neutral statements as problematic
- The 80-90% STAY_SILENT guideline is not respected

---

## Proposed Solutions

### Solution 1: Enhanced Pre-Filter System (Quick Wins)

Add more pre-filters to catch messages BEFORE they reach the AI:

```javascript
// General "good message" indicators that should NEVER be mediated
const safePatterns = [
  // Questions (unless hostile)
  /^(can|could|would|will|do|does|did|is|are|was|were|what|when|where|how|why)\s/i,

  // Logistics
  /\b(pick up|drop off|pickup|dropoff|schedule|time|date|appointment)\b/i,

  // Information sharing
  /\b(teacher|school|doctor|dentist|appointment|practice|game|event)\s+(said|mentioned|told|called|emailed)\b/i,

  // Child-focused neutral
  /\b(homework|bedtime|dinner|breakfast|lunch|bath|teeth|clothes)\b/i,

  // Third-party topics (not about co-parent)
  /\b(my|a)\s+(friend|coworker|boss|neighbor|client)\b/i,
];
```

**Pros**: Fast, deterministic, no API call
**Cons**: Can't catch everything, needs ongoing maintenance

### Solution 2: Two-Stage AI Analysis

Add a "should I intervene?" check BEFORE full analysis:

```javascript
// First call: Quick binary decision
const quickCheck = await openai.chat({
  model: 'gpt-3.5-turbo',
  messages: [{
    role: 'system',
    content: `You are a message classifier. Does this message require mediation in a co-parenting conversation?

ONLY answer "INTERVENE" if the message contains:
- Direct insults or name-calling toward the co-parent
- Blame or attacks directed at the co-parent
- Threats or ultimatums
- Contemptuous language toward the co-parent
- Using child as weapon

Answer "PASS" for:
- Neutral statements
- Questions
- Logistics
- Information sharing
- Statements about third parties (friends, teachers, etc.)
- Positive or friendly messages
- Anything that doesn't attack the co-parent

Message: "${message.text}"

Answer only: INTERVENE or PASS`
  }]
});

if (quickCheck === 'PASS') return null;
// Only proceed to full analysis if INTERVENE
```

**Pros**: AI-powered decision but focused solely on the intervention question
**Cons**: Additional API call, latency

### Solution 3: Stronger Prompt Language

Add explicit "when NOT to intervene" section to prompt:

```
=== CRITICAL: WHEN TO STAY SILENT ===

You MUST stay silent for:
- Statements about third parties (friends, teachers, neighbors)
- Neutral information sharing
- Logistics coordination
- Questions (unless hostile)
- Positive/friendly messages
- Complaints about situations (not the co-parent)

ONLY intervene when the message DIRECTLY attacks, blames, insults, or threatens the CO-PARENT specifically.

A statement like "My friend hates pizza" is NEUTRAL - it's not about the co-parent.
A statement like "I love how you talk to me" is POSITIVE - it's a compliment.

DEFAULT TO STAY_SILENT. When in doubt, let it through.
```

**Pros**: No additional calls, uses existing system
**Cons**: GPT may still ignore instructions

### Solution 4: Model Upgrade

Consider using GPT-4 or GPT-4-turbo for mediation decisions:
- Better instruction following
- More nuanced understanding
- Less likely to over-intervene

**Pros**: Better accuracy
**Cons**: Higher cost, potentially slower

---

## Recommended Implementation

### Phase 1: Immediate Fixes (Already Done in Feature 006)
1. ✅ Added positive sentiment pre-filter
2. ✅ Added third-party statement pre-filter
3. ✅ Refined accusatory pattern detection

### Phase 2: Enhanced Pre-Filters
Add comprehensive "safe pattern" detection:
- Questions
- Logistics
- Information sharing
- Child-focused neutral topics

### Phase 3: Strengthen AI Prompt
Add explicit "when NOT to intervene" section with concrete examples.

### Phase 4: Monitor and Tune
- Log all intervention decisions
- Track false positive rate
- Continuously add patterns to pre-filter

---

## Success Metrics

| Metric | Current (Estimated) | Target |
|--------|---------------------|--------|
| False positive rate | ~30% | < 5% |
| Messages reaching AI | ~95% | < 20% |
| STAY_SILENT decisions | ~50% | > 85% |
| User frustration reports | High | Minimal |

---

## Technical Architecture

### Current Flow
```
Message → Pre-Filter (5%) → AI Analysis (95%) → Decision
                ↓                    ↓
            Pass Through      STAY_SILENT/INTERVENE
```

### Proposed Flow
```
Message → Pre-Filter (80%+) → AI Analysis (< 20%) → Decision
                ↓                      ↓
            Pass Through      STAY_SILENT/INTERVENE (biased toward STAY_SILENT)
```

---

## Key Insight

The goal is to **shift the burden of proof**:

**Current**: "Why SHOULDN'T this be mediated?"
**Target**: "Why SHOULD this be mediated?"

Only truly problematic messages should reach the AI. The pre-filter should catch most messages and let them through without analysis.

---

## Files Involved

| File | Purpose |
|------|---------|
| `chat-server/src/liaizen/core/mediator.js` | Main mediation logic, pre-filters |
| `chat-server/ai-mediation-constitution.md` | Principles and rules |
| `chat-server/src/liaizen/core/language-analyzer/` | Pattern detection |

---

## Acceptance Criteria

- [ ] "My friend hates pizza" passes without mediation
- [ ] "I love how you talk to me" passes without mediation
- [ ] "you're my friend" passes without mediation
- [ ] "What time is pickup?" passes without mediation
- [ ] "The teacher called about homework" passes without mediation
- [ ] "you suck" is correctly mediated
- [ ] "You always forget everything" is correctly mediated
- [ ] False positive rate < 5%
- [ ] 85%+ of messages use pre-filter bypass (no AI call)
