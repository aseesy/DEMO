# Feature Specification: Mediation UX Improvement

**Feature ID**: 006-mediation-ux-improvement
**Created**: 2025-11-27
**Status**: Draft

## Overview

**Feature Name**: Mediation UX Improvement
**Business Objective**: Improve the mediation user experience by keeping the original message visible and reducing false positives on friendly messages.

**Problem Statement**:
1. **Original message disappears**: When AI mediation intervenes, the user's original message disappears immediately, making it unclear what they wrote and why it was mediated
2. **False positive mediation**: Friendly, non-confrontational messages like "you're my friend" are being flagged for mediation when they shouldn't be

**Success Metrics**:
- Original message remains visible until user sends a new message
- False positive rate on friendly messages reduced by 90%
- User can see what they wrote and understand why mediation was triggered

## Current State Analysis

### Current Architecture

**Message Flow** (ChatRoom.jsx):
1. User types message in input
2. Message is sent for AI analysis (`analyzeMessage`)
3. If mediation is needed, intervention appears
4. **ISSUE**: Original message immediately removed, user can't see it
5. User selects rewrite option
6. Intervention disappears, rewrite goes to input

**Mediation Pre-filter** (mediator.js lines 202-210):
```javascript
// Current allowed list is too restrictive
const allowedGreetings = ['hi', 'hello', 'hey', 'hi there', 'hello there', 'hey there'];
const allowedPolite = ['thanks', 'thank you', 'ok', 'okay', 'sure', 'yes', 'no', 'got it', 'sounds good'];
```

**Language Analyzer** (language-analyzer/index.js):
- Detects conflict patterns: global_negative, evaluative_character, child_as_weapon, etc.
- Does NOT have a "friendly/positive" pattern detector
- Messages like "you're my friend" may trigger `evaluative_character` false positive

### Issues Identified

| Issue | Root Cause | Impact |
|-------|------------|--------|
| Original message disappears | `removeMessages` called immediately on intervention | User confused about what they wrote |
| "you're my friend" mediated | "you're" triggers `hasAccusatory` pattern `/\b(you always|you never|you're|you are)\b/` | False positive, user frustrated |
| No positive sentiment detection | Pre-filter only checks exact matches | Many friendly messages get analyzed |

## User Stories

### US-001: See Original Message During Mediation
**As a** user whose message triggered mediation
**I want to** see my original message while viewing the intervention
**So that** I understand what I wrote and why it needs improvement

**Acceptance Criteria**:
- [ ] Original message is visible above the intervention
- [ ] Original message is styled differently (muted/dimmed) to indicate it won't be sent as-is
- [ ] Original message disappears only when a new message is sent
- [ ] If user cancels/dismisses intervention, original message returns to input

### US-002: No Mediation on Friendly Messages
**As a** user sending a friendly message
**I want to** have my message sent without mediation
**So that** positive communication isn't blocked

**Acceptance Criteria**:
- [ ] Messages with positive sentiment bypass mediation
- [ ] "you're my friend", "you're the best", "you're doing great" are allowed
- [ ] Compliments and appreciation messages are not flagged
- [ ] Only messages with actual conflict patterns are mediated

### US-003: Clear Intervention Context
**As a** user viewing an AI intervention
**I want to** understand why my message was flagged
**So that** I can learn and improve my communication

**Acceptance Criteria**:
- [ ] Intervention shows brief reason (e.g., "This phrasing may come across as accusatory")
- [ ] User can see their original text for reference
- [ ] Two rewrite options are provided per constitution

## Functional Requirements

### FR-001: Keep Original Message Visible

**Description**: Original message should remain visible during intervention and only be removed when user sends a new message.

**Current Behavior**:
```javascript
// ChatRoom.jsx - removeMessages is called immediately
const handleRewriteSelected = () => {
  removeMessages((m) => m.id === msg.id ||
    (m.type === 'ai_intervention' && m.timestamp === msg.timestamp));
  // Original is stored but UI doesn't show it
  if (msg.originalMessage) {
    setPendingOriginalMessageToRemove({...});
  }
};
```

**New Behavior**:
1. When intervention appears, show original message in a "pending" state
2. Style original message with muted colors and "Awaiting your edit..." label
3. Only remove original when user actually sends (or dismisses)

**UI Design**:
```
┌─────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────┐ │
│ │ 🔴 Your message (not sent):                 │ │
│ │ "youre my freiend"                          │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ 🤖 LiaiZen noticed this might not land as      │
│    intended. Here are clearer options:          │
│                                                 │
│ ┌───────────────────────────────────────────┐  │
│ │ Option 1: "You're a great friend."        │  │
│ └───────────────────────────────────────────┘  │
│ ┌───────────────────────────────────────────┐  │
│ │ Option 2: "I value our friendship."       │  │
│ └───────────────────────────────────────────┘  │
│                                                 │
│ [Send Original Anyway] [Dismiss]                │
└─────────────────────────────────────────────────┘
```

### FR-002: Positive Sentiment Detection

**Description**: Add positive sentiment detection to bypass mediation for friendly messages.

**New Pre-filter Rules** (mediator.js):
```javascript
// Positive patterns that should NOT be mediated
const positivePatterns = [
  /\b(you'?re|you are)\s+(my\s+)?(friend|best|great|awesome|amazing|wonderful|the best|so kind|so helpful)\b/i,
  /\b(love|appreciate|thankful|grateful)\s+(you|that)\b/i,
  /\b(thank|thanks)\s+(you|so much)\b/i,
  /\b(good job|well done|nice work|great work)\b/i,
  /\bI\s+(love|appreciate|value)\s+(you|this|that|our)\b/i,
];

// Check BEFORE conflict pattern detection
for (const pattern of positivePatterns) {
  if (pattern.test(text)) {
    console.log('✅ AI Mediator: Pre-approved message (positive sentiment)');
    return null;
  }
}
```

**Conflict Pattern Refinement**:
```javascript
// Current (problematic):
hasAccusatory: /\b(you always|you never|you're|you are)\b/.test(text)

// Fixed (exclude positive contexts):
hasAccusatory: /\b(you always|you never)\b/.test(text) ||
  (/\b(you'?re|you are)\b/.test(text) &&
   /\b(wrong|bad|never|always|stupid|crazy|irresponsible)\b/i.test(text))
```

### FR-003: Dismiss/Send Original Options

**Description**: User should be able to dismiss the intervention or send their original message.

**Options**:
1. **Select Rewrite**: Use AI-suggested rewrite (current behavior)
2. **Send Original Anyway**: Send the original message without changes (with warning)
3. **Dismiss**: Return original text to input for manual editing

**Implementation**:
```jsx
// Add buttons to intervention card
<button onClick={() => {
  // Send original message
  if (msg.originalMessage) {
    sendMessage(msg.originalMessage.text);
  }
  removeMessages((m) => m.type === 'ai_intervention');
}}>
  Send Original Anyway
</button>

<button onClick={() => {
  // Return to editing
  setInputMessage(msg.originalMessage?.text || '');
  removeMessages((m) => m.type === 'ai_intervention');
}}>
  Edit Myself
</button>
```

## Non-Functional Requirements

### NFR-001: Performance
- Positive sentiment check adds < 5ms to message analysis
- No additional API calls for positive message detection

### NFR-002: Usability
- Original message clearly distinguished from intervention
- Dismiss/edit options are easy to find
- Mobile-friendly touch targets (44px minimum)

### NFR-003: Accessibility
- Screen reader announces "Your original message: [text]"
- Focus management when intervention appears
- Color contrast meets WCAG AA for muted original message

## Technical Constraints

### Architecture
- Frontend: React 18 + Vite
- Backend: Node.js + Express
- AI: OpenAI API via `src/liaizen/core/mediator.js`

### Files to Modify

**Backend**:
- `chat-server/src/liaizen/core/mediator.js` - Add positive sentiment pre-filter, fix accusatory pattern

**Frontend**:
- `chat-client-vite/src/ChatRoom.jsx` - Keep original visible, add dismiss/send original buttons

### Design System
- Primary: #275559
- Muted text: text-gray-400
- Warning badge: bg-orange-100 text-orange-800
- Buttons: rounded-lg, min-h-[44px]

## Implementation Notes

### Phase 1: Fix False Positives (Quick Win)
1. Add positive sentiment patterns to `mediator.js`
2. Refine `hasAccusatory` pattern to exclude positive contexts
3. Test with "you're my friend", "you're the best", etc.

### Phase 2: Keep Original Message Visible
1. Modify intervention message structure to include original
2. Update ChatRoom.jsx to render original in intervention card
3. Only remove original when new message is sent

### Phase 3: Add User Options
1. Add "Send Original Anyway" button
2. Add "Edit Myself" button
3. Track analytics for intervention outcomes

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Over-permissive positive filter | Conflict messages slip through | Test with edge cases, monitor |
| UI too cluttered with original | Confusing experience | Keep original compact, collapsible |
| Users always click "Send Original" | Defeats mediation purpose | Track metrics, consider removing if abused |

## Acceptance Criteria Summary

- [ ] "you're my friend" and similar positive messages are NOT mediated
- [ ] Original message is visible in intervention card
- [ ] User can see what they wrote during mediation
- [ ] "Send Original Anyway" option available
- [ ] "Edit Myself" option available
- [ ] Original disappears only when new message is sent
- [ ] Intervention shows brief reason for flagging
