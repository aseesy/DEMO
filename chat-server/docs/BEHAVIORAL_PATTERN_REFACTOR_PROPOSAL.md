# Behavioral Pattern → User Intent Refactor Proposal

## Problem Statement

Current system identifies **what** is wrong ("this is insulting") but doesn't connect it to **why it matters** ("you want to change meeting time, but this won't achieve that").

**Example:**

- Message: "Your mom is more sane then you at this point"
- Current Response: "This is insulting. Name-calling shuts down communication."
- Desired Response: "This is insulting [behavioral pattern: making assumptions about character]. Looking at recent messages, you want to change the meeting time. This message won't convey that need - it attacks their character instead of addressing the scheduling issue."

## Current System Gaps

1. **Behavioral Pattern Identification**: Code Layer identifies structural patterns (axioms) but not behavioral patterns (making assumptions, avoiding responsibility, etc.)
2. **Intent Extraction**: Some intent extraction exists (`extractMessageGoal`, `humanUnderstanding`) but it's not systematically connected to behavioral patterns
3. **Connection Logic**: No explicit "Pattern X won't achieve Goal Y" logic
4. **Context-Aware Coaching**: Rewrites don't always address the actual underlying need

## Proposed Solution

### Three-Layer Analysis

```
1. BEHAVIORAL PATTERN LAYER
   ↓
2. USER INTENT LAYER
   ↓
3. CONNECTION LAYER (Pattern → Intent → Solution)
```

### Layer 1: Behavioral Pattern Identification

**Purpose**: Identify WHAT behavioral pattern is happening (beyond just structural axioms)

**Patterns to Detect:**

- **Making Assumptions** (vs asking questions)
  - "You're always late" → assumes pattern without checking
  - "You don't care" → assumes intent without asking
- **Avoiding Responsibility** (vs taking ownership)
  - "It's YOUR fault" → shifts blame
  - "You made me do this" → avoids accountability
- **Character Attacks** (vs behavior focus)
  - "You're pathetic" → attacks person, not behavior
  - "You're such a [insult]" → labels character
- **Triangulation** (vs direct communication)
  - "Tell your dad..." → uses child as messenger
  - "Everyone thinks..." → uses third parties
- **Escalation** (vs de-escalation)
  - Threats, ultimatums, absolutes
  - "Never", "always", "you always/never"
- **Emotional Dumping** (vs structured expression)
  - Raw emotion without structure
  - Multiple issues at once without focus

**Implementation:**

- New module: `behavioralPatternAnalyzer.js`
- Extends Code Layer axioms with behavioral interpretation
- Maps axioms to behavioral patterns
- Example: `AXIOM_D101` (Direct Insult) → `CHARACTER_ATTACK` behavioral pattern

### Layer 2: User Intent Extraction

**Purpose**: Identify WHAT the user actually wants/needs from context

**Intent Categories:**

- **Scheduling Need**: Change time, coordinate pickup, swap days
- **Information Need**: Get clarification, understand situation
- **Boundary Need**: Set limits, assert rights
- **Collaboration Need**: Work together, solve problem
- **Acknowledgment Need**: Be heard, validated
- **Action Need**: Get something done, make decision

**Implementation:**

- Enhance `extractMessageGoal` in `coparentContext.js`
- Use conversation history to infer intent
- Look for patterns: "recent messages suggest user wants X"
- Example: Recent messages about "meeting time" + current insult → intent is likely "change meeting time"

**Context Sources:**

- Recent conversation history (last 5-10 messages)
- Message topic detection (scheduling, financial, parenting)
- Explicit requests in conversation
- Implicit patterns (repeated mentions of same issue)

### Layer 3: Pattern → Intent Connection

**Purpose**: Explain WHY the behavioral pattern won't achieve the user's intent

**Connection Logic:**

```
IF behavioral_pattern = CHARACTER_ATTACK
AND user_intent = SCHEDULING_NEED
THEN explanation = "Attacking their character won't help you change the meeting time - it shifts focus from the scheduling issue to defending themselves."
```

**Connection Templates:**

| Behavioral Pattern      | User Intent               | Connection Explanation                                                                               |
| ----------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------- |
| Making Assumptions      | Information Need          | "Assuming their intent without asking won't get you the clarification you need."                     |
| Avoiding Responsibility | Collaboration Need        | "Shifting blame won't help you work together to solve this."                                         |
| Character Attack        | Scheduling Need           | "Attacking their character won't help you change the meeting time - it shifts focus from the issue." |
| Triangulation           | Direct Communication Need | "Using a messenger won't help you communicate directly about this."                                  |
| Escalation              | Problem-Solving Need      | "Threats and ultimatums won't help you solve this - they create defensiveness."                      |

**Implementation:**

- New module: `patternIntentConnector.js`
- Takes: behavioral pattern + user intent + context
- Returns: Connection explanation + why it won't work

### Enhanced ADDRESS Format

**Current Format:**

```
"[Observation about phrasing] + [consequence for sender's goals]"
```

**Proposed Format:**

```
"[Behavioral pattern identified] + [User intent from context] + [Why pattern won't achieve intent]"
```

**Example:**

- Message: "Your mom is more sane then you at this point"
- Context: Recent messages about meeting time changes
- Response: "This attacks their character [behavioral pattern]. Looking at recent messages, you want to change the meeting time [user intent]. Character attacks shift focus from the scheduling issue to defending themselves, so your actual need won't get addressed [connection]."

### Enhanced Rewrites

**Current**: Rewrites that improve phrasing but may not address actual need

**Proposed**: Rewrites that:

1. Address the **actual underlying need** (from intent extraction)
2. Use **constructive behavioral pattern** (vs the problematic one)
3. Are **context-specific** (reference actual situation from conversation)

**Example:**

- Original: "Your mom is more sane then you at this point"
- Intent: Change meeting time
- Rewrite 1: "I need to change our meeting time. Can we find a time that works for both of us?"
- Rewrite 2: "The current meeting time doesn't work for me. What times would work better for you?"

## Implementation Plan

### Phase 1: Behavioral Pattern Analyzer

1. Create `behavioralPatternAnalyzer.js`
2. Map existing axioms to behavioral patterns
3. Add pattern detection beyond axioms
4. Test with example messages

### Phase 2: Enhanced Intent Extraction

1. Enhance `extractMessageGoal` with conversation history analysis
2. Add intent inference from context
3. Create intent categories and detection logic
4. Test intent extraction accuracy

### Phase 3: Pattern → Intent Connector

1. Create `patternIntentConnector.js`
2. Build connection templates
3. Generate "why this won't work" explanations
4. Test connection logic

### Phase 4: Integration

1. Integrate into prompt builder
2. Update ADDRESS format in constitution
3. Enhance rewrite generation to address actual intent
4. Update validation and testing

## Example Flow

**Input:**

- Message: "Your mom is more sane then you at this point"
- Context: Recent messages about "meeting at 3pm doesn't work"

**Analysis:**

1. **Behavioral Pattern**: CHARACTER_ATTACK (from AXIOM_D101)
2. **User Intent**: SCHEDULING_NEED (from conversation history)
3. **Connection**: "Character attacks won't help you change the meeting time"

**Output:**

- **ADDRESS**: "This attacks their character. Looking at recent messages, you want to change the meeting time. Character attacks shift focus from the scheduling issue to defending themselves, so your actual need won't get addressed."
- **Refocus Questions**:
  - "What do you really need here - a different meeting time or something else?"
  - "Could you ask directly about the schedule instead of commenting on their character?"
  - "Would attacking their character help you get the meeting time changed?"
- **Rewrite 1**: "I need to change our meeting time. Can we find a time that works for both of us?"
- **Rewrite 2**: "The current meeting time doesn't work for me. What times would work better for you?"

## Benefits

1. **More Relevant Coaching**: Addresses actual needs, not just surface issues
2. **Better User Understanding**: Users see why their approach won't work for THEIR goal
3. **Context-Aware**: Uses conversation history to understand real situation
4. **Actionable**: Rewrites address the actual need, not just improve phrasing
5. **Educational**: Teaches connection between behavior patterns and outcomes

## Open Questions

1. Should behavioral patterns be detected by Code Layer or AI Layer?
2. How much conversation history should we analyze for intent?
3. Should we store learned intent patterns per user?
4. How do we handle cases where intent is unclear?
5. Should this be a separate service or integrated into existing mediator?
