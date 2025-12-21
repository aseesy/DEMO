# LiaiZen AI Mediation System - Complete Reference Document

**Version**: 1.0
**Created**: 2025-11-27
**Purpose**: Single source of truth for all mediation-related code and concepts

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Core Philosophy: ZEN](#core-philosophy-zen)
3. [File Structure](#file-structure)
4. [The Constitution](#the-constitution)
5. [Decision Criteria](#decision-criteria)
6. [Message Flow](#message-flow)
7. [Pre-Filters](#pre-filters)
8. [Language Analysis Patterns](#language-analysis-patterns)
9. [The 1-2-3 Coaching Framework](#the-1-2-3-coaching-framework)
10. [Communication Profiles](#communication-profiles)
11. [Rewrite Validation](#rewrite-validation)
12. [Configuration & Constants](#configuration--constants)

---

## Executive Summary

LiaiZen is a **ZEN communication coach** for co-parents. The name means "Liaison + Zen" - facilitating peaceful communication with **minimal intervention**.

**Core Principle**: DEFAULT TO SILENCE. Only intervene for clear, direct hostility toward the co-parent.

**What We Mediate**:

- Direct insults toward co-parent: "you're an idiot"
- Blame attacks: "It's YOUR fault"
- Threats or ultimatums
- Using child as weapon

**What We DON'T Mediate**:

- Messages about third parties: "My friend hates pizza"
- Positive/friendly messages: "I love how you talk to me"
- Questions and logistics: "Can you pick up at 3?"
- Imperfect phrasing that isn't hostile

---

## Core Philosophy: ZEN

```
Ask yourself: "Is this message ATTACKING the co-parent directly?"
- If NO → STAY_SILENT
- If YES → Consider intervention
```

**The ZEN coach**:

- Calm, minimal, only intervenes when truly needed
- Expert in communication psychology
- Neutral third party
- NEVER uses "we/us/our" - addresses sender with "you/your"

---

## File Structure

### Core Backend Files

| File                                       | Purpose                     | Lines  |
| ------------------------------------------ | --------------------------- | ------ |
| `chat-server/src/liaizen/core/mediator.js` | Main mediation orchestrator | ~1,280 |
| `chat-server/ai-mediation-constitution.md` | Governance rules            | ~340   |
| `chat-server/aiMediator.js`                | Legacy wrapper/integration  | ~100   |

### Language Analysis

| File                                                                  | Purpose                   |
| --------------------------------------------------------------------- | ------------------------- |
| `src/liaizen/analysis/language-analyzer/index.js`                     | Main analyzer             |
| `src/liaizen/analysis/language-analyzer/patterns/structure.js`        | Sentence type detection   |
| `src/liaizen/analysis/language-analyzer/patterns/globalSpecific.js`   | Absolutes vs specifics    |
| `src/liaizen/analysis/language-analyzer/patterns/evaluative.js`       | Character judgments       |
| `src/liaizen/analysis/language-analyzer/patterns/childInvolvement.js` | Child reference patterns  |
| `src/liaizen/analysis/language-analyzer/patterns/hedging.js`          | Over-explaining detection |
| `src/liaizen/analysis/language-analyzer/patterns/specificity.js`      | Vague vs specific         |
| `src/liaizen/analysis/language-analyzer/patterns/focus.js`            | Message focus type        |

### Communication Profiles

| File                                                            | Purpose                  |
| --------------------------------------------------------------- | ------------------------ |
| `src/liaizen/context/communication-profile/index.js`            | Unified exports          |
| `src/liaizen/context/communication-profile/profileLoader.js`    | Load user profiles       |
| `src/liaizen/context/communication-profile/profilePersister.js` | Save user profiles       |
| `src/liaizen/context/communication-profile/mediationContext.js` | Build role-aware context |
| `src/liaizen/context/communication-profile/temporalDecay.js`    | Weight by recency        |

### Rewrite Validation

| File                                                  | Purpose               |
| ----------------------------------------------------- | --------------------- |
| `src/liaizen/analysis/rewrite-validator/index.js`     | Perspective validator |
| `src/liaizen/analysis/rewrite-validator/fallbacks.js` | Pre-approved rewrites |

### Frontend

| File                                          | Purpose                           |
| --------------------------------------------- | --------------------------------- |
| `chat-client-vite/src/utils/mediatorLogic.js` | Frontend heuristics               |
| `chat-client-vite/src/ChatRoom.jsx`           | Intervention UI (lines 2050-2240) |

---

## The Constitution

**Location**: `chat-server/ai-mediation-constitution.md`

### 4 Immutable Principles

#### Principle I: Language, Not Emotions

Talk about PHRASING, never emotional states.

| Correct                              | Prohibited          |
| ------------------------------------ | ------------------- |
| "This phrasing implies blame"        | "You're angry"      |
| "This word choice sounds accusatory" | "You're frustrated" |

#### Principle II: No Diagnostics

NEVER apply psychological labels.

**Prohibited**: narcissist, manipulative, toxic, gaslighting, controlling, insecure, passive-aggressive

**Allowed**: "This approach may backfire", "This phrasing might not achieve your goal"

#### Principle III: Child-Centric When Applicable

When a child is mentioned, frame feedback around child wellbeing.

**Test**: "Would I be okay if my child read this?"

#### Principle IV: Sender Perspective Primacy

Rewrites are what the SENDER could say INSTEAD - NOT responses the receiver would send back.

---

## Decision Criteria

### STAY_SILENT (80-90% of messages)

Allow through without comment:

- Genuine concerns: "I'm worried about..."
- Questions: "Can we discuss..."
- Information sharing: "The teacher mentioned..."
- Boundaries: "I need...", "I would prefer..."
- Logistics: "Can you pick up at 3?"
- Respectful communication, even if imperfect
- **Messages not directed at co-parent**

### INTERVENE (5-15% of messages)

Block and provide coaching:

- Direct blame/attacks: "It's YOUR fault", "YOU always..."
- Name-calling or insults
- Threats or ultimatums
- Contemptuous language: "stupid", "pathetic", "worthless"
- Triangulation: Using child against other parent

### COMMENT (1-5% of messages)

Rare, helpful observation only. Rate-limited to 1 per minute per room.

---

## Message Flow

```
User sends message
         ↓
[1] PRE-FILTERS (no API call)
    ├─ Greetings: "hi", "hello", "hey" → ALLOW
    ├─ Polite: "thanks", "ok", "yes" → ALLOW
    ├─ Third-party: "My friend..." (no "you") → ALLOW
    └─ Positive: "you're my friend", "I love how you..." → ALLOW
         ↓
[2] LANGUAGE ANALYSIS (local, ~10ms)
    └─ 7 pattern detectors → structured analysis
         ↓
[3] COMMUNICATION PROFILES (database)
    ├─ Sender: Full profile (coaching target)
    └─ Receiver: Triggers only (context)
         ↓
[4] SINGLE AI CALL (OpenAI)
    ├─ Model: gpt-3.5-turbo
    ├─ Input: Analysis + profiles + conversation
    └─ Output: { action, escalation, emotion, intervention }
         ↓
[5] POST-PROCESSING
    ├─ If STAY_SILENT → Allow message
    ├─ If COMMENT → Add observation (rate-limited)
    └─ If INTERVENE → Validate rewrites → Show UI
```

---

## Pre-Filters

**Location**: `mediator.js` lines 216-263

### 1. Greetings & Polite Responses

```javascript
const allowedGreetings = ['hi', 'hello', 'hey', 'hi there', 'hello there', 'hey there'];
const allowedPolite = [
  'thanks',
  'thank you',
  'ok',
  'okay',
  'sure',
  'yes',
  'no',
  'got it',
  'sounds good',
];
```

### 2. Third-Party Statements

```javascript
const mentionsYou = /\b(you|your|you'?re|you'?ve|you'?d|you'?ll)\b/i.test(text);
const mentionsThirdParty = /\b(my\s+)?(friend|teacher|boss|neighbor|...)\b/i.test(text);

if (!mentionsYou && mentionsThirdParty) return null; // Allow
```

### 3. Positive Sentiment

```javascript
const positivePatterns = [
  /\b(you'?re|you are)\s+(my\s+)?(friend|best|great|awesome|amazing|wonderful|the best|so kind|so helpful)\b/i,
  /\b(love|appreciate|thankful|grateful)\s+(you|that|this)\b/i,
  /\b(thank|thanks)\s+(you|so much|for)\b/i,
  /\b(good job|well done|nice work|great work|great job)\b/i,
  /\bI\s+(love|appreciate|value|admire|respect)\s+(you|this|that|our)\b/i,
  /\b(you'?re|you are)\s+(doing\s+)?(great|well|good|amazing|awesome)\b/i,
  /\b(miss|missed)\s+you\b/i,
  /\b(proud of|happy for)\s+you\b/i,
  /\byou('?re| are)\s+a\s+(great|good|wonderful|amazing)\s+(parent|dad|mom|father|mother|person)\b/i,
  /\b(I\s+)?love\s+(how|when|that)\s+you\b/i,
  /\b(I\s+)?love\s+(it|this)\s+when\s+you\b/i,
  /\byou\s+(make|made)\s+me\s+(happy|smile|laugh|feel\s+(good|better|loved|special))\b/i,
  /\b(you'?re|you are)\s+(so\s+)?(sweet|kind|thoughtful|caring|supportive|helpful)\b/i,
];
```

---

## Language Analysis Patterns

### Pattern 1: Structure

**Detects**: Sentence type (accusation, question, request, statement, demand, threat)

### Pattern 2: Global vs Specific

**Detects**: Absolutes ("always", "never") vs concrete references

| Type              | Example                    |
| ----------------- | -------------------------- |
| Global negative   | "You ALWAYS forget"        |
| Specific behavior | "You forgot last Thursday" |

### Pattern 3: Evaluative vs Descriptive

**Detects**: Character judgments vs neutral descriptions

| Type                 | Example                     |
| -------------------- | --------------------------- |
| Character evaluation | "You're a terrible parent"  |
| Descriptive action   | "You forgot to pick her up" |

### Pattern 4: Child Involvement

**Detects**: How children are referenced

| Pattern               | Example                 |
| --------------------- | ----------------------- |
| child_as_messenger    | "Tell your dad..."      |
| child_as_weapon       | "You're failing HER"    |
| child_triangulation   | "She said you never..." |
| child_wellbeing_cited | "For her sake..."       |

### Pattern 5: Hedging

**Detects**: Over-explaining, apologetic framing, or direct statements

### Pattern 6: Specificity

**Detects**: Vague vs specific requests/complaints

### Pattern 7: Focus

**Detects**: Message focus (logistics, character, child, relationship, past, future)

---

## The 1-2-3 Coaching Framework

Every intervention MUST include all three elements:

### 1. ADDRESS (personalMessage)

Describe what the message is DOING mechanically.

**Format**: "[Observation about phrasing] + [consequence for sender's goals]"

**Examples**:

- "Name-calling shuts down any chance of being heard, so your concerns won't get addressed."
- "Absolute statements like 'never' trigger defensiveness, which means the help you need won't happen."

**Avoid**: "Direct insult damages cooperation" (too vague)

### 2. ONE TIP (tip1)

Single, precise adjustment. Max 10 words.

| Pattern           | Tip                                            |
| ----------------- | ---------------------------------------------- |
| Insults           | "Name the feeling, not the person."            |
| Blame             | "Describe the impact, not their intent."       |
| Demands           | "Make a request, not a command."               |
| Absolutes         | "Replace 'always' with 'recently' or 'often'." |
| Character attacks | "Address the behavior, not their character."   |
| Threats           | "State your need, not the consequence."        |
| Triangulation     | "Speak directly, not through your child."      |

### 3. TWO REWRITES (rewrite1, rewrite2)

Complete message alternatives from SENDER perspective.

| Rewrite 1                     | Rewrite 2                   |
| ----------------------------- | --------------------------- |
| I-statement                   | Observation + request       |
| "I feel... when... I need..." | "I've noticed... Can we..." |

**Example**:

```
Original: "you suck"

REWRITE 1: "I'm feeling really frustrated right now and need us to
communicate more respectfully."

REWRITE 2: "Something isn't working for me and I'd like to talk about it."
```

---

## Communication Profiles

### Data Model

```javascript
{
  user_id: string,
  communication_patterns: {
    tone_tendencies: string[],
    common_phrases: string[],
    avg_message_length: number
  },
  triggers: {
    topics: string[],
    phrases: string[],
    intensity: number
  },
  successful_rewrites: [...],
  intervention_history: {
    total_interventions: number,
    accepted_count: number,
    acceptance_rate: number
  }
}
```

### Temporal Decay

Weights patterns by recency:

| Age        | Weight        |
| ---------- | ------------- |
| 0-30 days  | 1.0 (full)    |
| 31-60 days | 0.7 (reduced) |
| 61-90 days | 0.3 (minimal) |
| >90 days   | 0.0 (expired) |

---

## Rewrite Validation

### Receiver Indicators (INVALID)

```javascript
- "I understand you're..." (empathy response)
- "That hurt me..." (reaction)
- "When you said that..." (reflection)
- "I don't appreciate..." (boundary-setting)
- "Can you explain what you meant?" (clarification)
```

### Sender Indicators (VALID)

```javascript
-"I'm feeling..." -
  'I feel...' -
  'I need...' -
  "I've noticed..." -
  "I'm concerned..." -
  'Can we discuss...' -
  "Something isn't working...";
```

### Fallback Categories

When validation fails, use pre-approved rewrites:

| Category      | Tip                                       |
| ------------- | ----------------------------------------- |
| attack        | "Name the feeling, not the person."       |
| blame         | "Describe the impact, not their intent."  |
| demand        | "Make a request, not a command."          |
| threat        | "State your need, not the consequence."   |
| triangulation | "Speak directly, not through your child." |

---

## Configuration & Constants

### AI Settings

```javascript
model: 'gpt-3.5-turbo';
temperature: 0.85; // Higher for varied responses
max_tokens: 1500;
```

### Rate Limits

```javascript
comment_cooldown: 60000; // 1 comment per minute per room
```

### Temporal Decay

```javascript
decay_thresholds: {
  full: 30,      // days
  reduced: 60,   // days
  minimal: 90,   // days
  expired: 90+   // days
}
```

### History Limits

```javascript
recent_interventions: 20;
successful_rewrites: 50;
recent_messages: 15; // for context
```

---

## Error Handling

### Philosophy

**"Err on the side of allowing communication rather than blocking valid messages."**

### Fallbacks

| Error                       | Fallback              |
| --------------------------- | --------------------- |
| OpenAI unavailable          | Allow message         |
| JSON parse error            | Allow message         |
| Missing intervention fields | Allow message         |
| Rewrite validation fails    | Use fallback rewrites |
| Profile load error          | Use default profile   |

---

## Key Insights

### The ZEN Approach

1. **Default to silence** - Only intervene for clear hostility
2. **Ask the right question** - "Is this ATTACKING the co-parent?"
3. **Pre-filter aggressively** - Most messages shouldn't reach AI
4. **Prompt order matters** - Put decision criteria FIRST

### What Makes LiaiZen Different

1. **Not a therapist** - Communication coach only
2. **Language, not emotions** - We observe words, not minds
3. **Sender perspective** - Rewrites are alternatives, not responses
4. **Child-centric** - Ultimate goal is child wellbeing
5. **Minimal intervention** - Zen, peaceful, calm

---

## Quick Reference

### When to ALLOW (no intervention)

- "My friend hates pizza" (third party)
- "I love how you talk to me" (positive)
- "Can you pick up at 3?" (logistics)
- "The teacher called about homework" (information)
- "I'm worried about her grades" (concern)

### When to INTERVENE

- "You're such an idiot" (insult)
- "It's YOUR fault she's failing" (blame attack)
- "You always forget everything" (accusatory absolute)
- "Tell your mom she needs to pay" (triangulation)
- "If you don't pay, I'll take you to court" (threat)

---

_This document is the single source of truth for LiaiZen AI Mediation._
