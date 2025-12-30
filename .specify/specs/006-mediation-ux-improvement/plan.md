# Implementation Plan: Mediation UX Improvement

**Feature ID**: 006-mediation-ux-improvement
**Spec**: `specs/006-mediation-ux-improvement/spec.md`
**Created**: 2025-11-27

## Executive Summary

This plan addresses two critical mediation UX issues:

1. **Original message disappears** during mediation, confusing users
2. **False positives** on friendly messages like "you're my friend"

The implementation consists of three phases:

1. **Phase 1: Fix False Positives** - Add positive sentiment detection (Quick Win)
2. **Phase 2: Keep Original Visible** - Show original message in intervention card
3. **Phase 3: Add User Options** - "Send Original Anyway" and "Edit Myself" buttons

---

## Technical Context

### Architecture

- **Frontend**: React 18 + Vite (`chat-client-vite/`)
- **Backend**: Node.js + Express (`chat-server/`)
- **AI Mediation**: OpenAI API via `chat-server/src/liaizen/core/mediator.js`

### File Structure

```
chat-server/
├── src/liaizen/core/
│   └── mediator.js          # Main AI mediation logic
│
chat-client-vite/
├── src/
│   └── ChatRoom.jsx         # Main chat component with intervention UI
```

### Design System

- **Primary**: #275559 (teal-dark)
- **Primary Light**: #4DA8B0 (teal-medium)
- **Muted text**: text-gray-400
- **Warning badge**: bg-orange-100 text-orange-800
- **Buttons**: rounded-lg, min-h-[44px]
- **Cards**: bg-white border border-gray-200

---

## Phase 1: Fix False Positives (Quick Win)

### 1.1 Add Positive Sentiment Pre-filter

**File**: `chat-server/src/liaizen/core/mediator.js`

**Location**: Lines 202-210 (after existing pre-filter checks)

**Current Code** (lines 202-210):

```javascript
// Pre-filter: Allow common greetings and polite messages without AI analysis
const text = message.text.toLowerCase().trim();
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

if (allowedGreetings.includes(text) || allowedPolite.includes(text)) {
  console.log('✅ AI Mediator: Pre-approved message (greeting/polite) - allowing without analysis');
  return null;
}
```

**New Code** (add after existing pre-filter):

```javascript
// Pre-filter: Allow common greetings and polite messages without AI analysis
const text = message.text.toLowerCase().trim();
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

if (allowedGreetings.includes(text) || allowedPolite.includes(text)) {
  console.log('✅ AI Mediator: Pre-approved message (greeting/polite) - allowing without analysis');
  return null;
}

// NEW: Positive sentiment patterns that should NEVER be mediated
const positivePatterns = [
  /\b(you'?re|you are)\s+(my\s+)?(friend|best|great|awesome|amazing|wonderful|the best|so kind|so helpful|so great|incredible|fantastic)\b/i,
  /\b(love|appreciate|thankful|grateful)\s+(you|that|this)\b/i,
  /\b(thank|thanks)\s+(you|so much|for)\b/i,
  /\b(good job|well done|nice work|great work|great job)\b/i,
  /\bI\s+(love|appreciate|value|admire|respect)\s+(you|this|that|our)\b/i,
  /\b(you'?re|you are)\s+(doing\s+)?(great|well|good|amazing|awesome)\b/i,
  /\b(miss|missed)\s+you\b/i,
  /\b(proud of|happy for)\s+you\b/i,
  /\byou('?re| are)\s+a\s+(great|good|wonderful|amazing)\s+(parent|dad|mom|father|mother)\b/i,
];

for (const pattern of positivePatterns) {
  if (pattern.test(message.text)) {
    console.log(
      '✅ AI Mediator: Pre-approved message (positive sentiment) - allowing without analysis'
    );
    return null;
  }
}
```

### 1.2 Refine Accusatory Pattern Detection

**File**: `chat-server/src/liaizen/core/mediator.js`

**Location**: Lines 134-145 (`detectConflictPatterns` function)

**Current Code**:

```javascript
function detectConflictPatterns(messageText) {
  const text = messageText.toLowerCase();

  const patterns = {
    hasAccusatory: /\b(you always|you never|you're|you are)\b/.test(text),
    hasTriangulation: /\b(she told me|he said|the kids|child.*said)\b/.test(text),
    hasComparison: /\b(fine with me|never does that|at my house|at your house)\b/.test(text),
    hasBlaming: /\b(your fault|because of you|you made|you caused)\b/.test(text),
  };

  return patterns;
}
```

**New Code**:

```javascript
function detectConflictPatterns(messageText) {
  const text = messageText.toLowerCase();

  // Positive context words that indicate friendly intent
  const positiveContextWords =
    /\b(friend|best|great|awesome|amazing|wonderful|helpful|kind|love|appreciate|proud|happy|good|fantastic|incredible)\b/i;

  // Check if "you're/you are" is in a positive context
  const hasYouAre = /\b(you'?re|you are)\b/i.test(text);
  const isPositiveContext = positiveContextWords.test(text);

  const patterns = {
    // Only flag "you're/you are" as accusatory if NOT in positive context
    hasAccusatory:
      /\b(you always|you never)\b/.test(text) ||
      (hasYouAre &&
        !isPositiveContext &&
        /\b(wrong|bad|stupid|crazy|irresponsible|useless|terrible|awful|horrible|pathetic|lazy|selfish)\b/i.test(
          text
        )),
    hasTriangulation: /\b(she told me|he said|the kids|child.*said)\b/.test(text),
    hasComparison: /\b(fine with me|never does that|at my house|at your house)\b/.test(text),
    hasBlaming: /\b(your fault|because of you|you made|you caused)\b/.test(text),
  };

  return patterns;
}
```

### 1.3 Test Cases for Phase 1

Messages that should **NOT** be mediated (should return `null`):

- "you're my friend"
- "you're the best"
- "you're doing great"
- "you're a great parent"
- "I love you"
- "I appreciate you"
- "thank you so much"
- "you're so helpful"
- "you're amazing"
- "proud of you"

Messages that **SHOULD** be mediated:

- "you're always late"
- "you never listen"
- "you're so irresponsible"
- "you're wrong about everything"

---

## Phase 2: Keep Original Message Visible

### 2.1 Update Intervention Message Structure

**File**: `chat-server/src/liaizen/core/mediator.js`

**Location**: Lines 866-876 (intervention return object)

**Current Code**:

```javascript
return {
  type: 'ai_intervention',
  action: 'INTERVENE',
  personalMessage: intervention.personalMessage,
  tip1: cleanTip1,
  rewrite1: intervention.rewrite1,
  rewrite2: intervention.rewrite2,
  originalMessage: message,
  escalation: result.escalation,
  emotion: result.emotion,
};
```

**Enhancement**: The `originalMessage` is already included. No backend changes needed - the frontend just needs to display it.

### 2.2 Display Original Message in Intervention Card

**File**: `chat-client-vite/src/ChatRoom.jsx`

**Location**: Lines 2094-2170 (intervention card rendering)

**Current Code** (simplified):

```jsx
<div className="rounded-lg px-4 py-3 bg-teal-lightest/30 border border-teal-light/50">
  {msg.personalMessage && (
    <p className="text-base text-gray-900 leading-snug mb-3 font-normal">
      {msg.personalMessage...}
    </p>
  )}
  {/* tip1, rewrites, etc. */}
</div>
```

**New Code** (add original message display at top):

```jsx
<div className="rounded-lg px-4 py-3 bg-teal-lightest/30 border border-teal-light/50">
  {/* NEW: Show original message that triggered mediation */}
  {msg.originalMessage?.text && (
    <div className="mb-3 p-3 bg-orange-50/60 border border-orange-200/40 rounded-lg">
      <div className="flex items-start gap-2">
        <div className="w-4 h-4 rounded-full bg-orange-400 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-white text-xs font-bold">!</span>
        </div>
        <div>
          <p className="text-xs font-semibold text-orange-700 mb-1">Your message (not sent):</p>
          <p className="text-sm text-orange-900 leading-snug font-normal italic">
            "{msg.originalMessage.text}"
          </p>
        </div>
      </div>
    </div>
  )}

  {msg.personalMessage && (
    <p className="text-base text-gray-900 leading-snug mb-3 font-normal">
      {msg.personalMessage...}
    </p>
  )}
  {/* existing tip1, rewrites, etc. */}
</div>
```

### 2.3 Only Remove Original When New Message Sent

**File**: `chat-client-vite/src/ChatRoom.jsx`

**Current Behavior**: `handleRewriteSelected()` removes the intervention immediately when user selects a rewrite.

**New Behavior**: Keep original visible until a new message is actually sent.

The current code already stores `pendingOriginalMessageToRemove` - we need to ensure it's only used when sending:

**Location**: Find where `pendingOriginalMessageToRemove` is used in the send message handler.

---

## Phase 3: Add User Options

### 3.1 Add "Send Original Anyway" and "Edit Myself" Buttons

**File**: `chat-client-vite/src/ChatRoom.jsx`

**Location**: After the rewrite buttons section (lines 2167-2168)

**Add new buttons**:

```jsx
{(msg.rewrite1 || msg.rewrite2) && (
  <div className="space-y-2.5 pt-3 border-t border-gray-200/40">
    {/* Existing rewrite buttons */}
    {msg.rewrite1 && (/* ... existing button ... */)}
    {msg.rewrite2 && (/* ... existing button ... */)}

    {/* NEW: Alternative action buttons */}
    <div className="flex gap-2 pt-2 border-t border-gray-200/20 mt-3">
      <button
        type="button"
        onClick={() => {
          // Track that user overrode intervention
          const originalText = msg.originalMessage?.text || '';
          trackInterventionOverride('send_original', originalText.length);

          // Send the original message directly
          if (msg.originalMessage?.text) {
            // Call the send function with the original message
            handleSendMessage(msg.originalMessage.text, true); // true = bypass mediation
          }

          // Remove the intervention card
          removeMessages((m) => m.id === msg.id ||
            (m.type === 'ai_intervention' && m.timestamp === msg.timestamp));
        }}
        className="flex-1 px-3 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors min-h-[44px]"
      >
        Send Original Anyway
      </button>

      <button
        type="button"
        onClick={() => {
          // Track that user chose to edit themselves
          trackInterventionOverride('edit_myself', msg.originalMessage?.text?.length || 0);

          // Put original text back in input for manual editing
          setInputMessage(msg.originalMessage?.text || '');

          // Remove the intervention card
          removeMessages((m) => m.id === msg.id ||
            (m.type === 'ai_intervention' && m.timestamp === msg.timestamp));
        }}
        className="flex-1 px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors min-h-[44px]"
      >
        Edit Myself
      </button>
    </div>
  </div>
)}
```

### 3.2 Add Bypass Mediation Flag for "Send Original Anyway"

**File**: `chat-client-vite/src/ChatRoom.jsx`

Need to ensure that when user clicks "Send Original Anyway", the message is sent without going through AI analysis again.

**Modify handleSendMessage to accept bypass flag**:

```javascript
const handleSendMessage = async (messageText = inputMessage, bypassMediation = false) => {
  // ... existing validation ...

  if (bypassMediation) {
    // Send directly without AI analysis
    socket.emit('sendMessage', {
      roomId: currentRoom,
      text: messageText,
      username,
      bypassMediation: true, // Backend needs to respect this flag
    });
    return;
  }

  // ... existing AI analysis flow ...
};
```

**Backend** (`chat-server/server.js`): In the message handler, check for `bypassMediation` flag and skip AI analysis if true.

---

## Implementation Order

### Step 1: Phase 1 - Fix False Positives (Estimated: 30 minutes)

1. Add positive sentiment patterns to `mediator.js`
2. Refine `detectConflictPatterns` function
3. Test with "you're my friend" and similar messages

### Step 2: Phase 2 - Keep Original Visible (Estimated: 1 hour)

1. Update intervention card UI in `ChatRoom.jsx`
2. Add original message display section
3. Test that original stays visible

### Step 3: Phase 3 - Add User Options (Estimated: 1 hour)

1. Add "Send Original Anyway" button
2. Add "Edit Myself" button
3. Implement bypass mediation logic
4. Add analytics tracking

### Step 4: Testing & Polish (Estimated: 30 minutes)

1. Test all positive sentiment patterns
2. Test intervention flow end-to-end
3. Test "Send Original Anyway" flow
4. Test "Edit Myself" flow
5. Mobile testing (44px touch targets)

---

## Files to Modify

| File                                       | Action | Description                                                  |
| ------------------------------------------ | ------ | ------------------------------------------------------------ |
| `chat-server/src/liaizen/core/mediator.js` | Modify | Add positive sentiment pre-filter, refine accusatory pattern |
| `chat-client-vite/src/ChatRoom.jsx`        | Modify | Show original message, add action buttons                    |
| `chat-server/server.js`                    | Modify | Support bypassMediation flag (optional)                      |

---

## Validation Checklist

- [ ] Follows LiaiZen architecture (React + Vite frontend, Node.js backend)
- [ ] Uses design tokens (teal-dark #275559, min-h-[44px] buttons)
- [ ] Mobile-first design (44px touch targets)
- [ ] Follows AI mediation constitution
- [ ] No breaking changes to existing intervention flow
- [ ] Analytics tracking for user choices

---

## Acceptance Criteria

- [ ] "you're my friend" and similar positive messages are NOT mediated
- [ ] Original message is visible in intervention card
- [ ] User can see what they wrote during mediation
- [ ] "Send Original Anyway" option available
- [ ] "Edit Myself" option available
- [ ] Original disappears only when new message is sent
- [ ] Intervention shows brief reason for flagging (via personalMessage)

---

## Risks & Mitigations

| Risk                               | Impact                         | Mitigation                                   |
| ---------------------------------- | ------------------------------ | -------------------------------------------- |
| Over-permissive positive filter    | Conflict messages slip through | Test with edge cases, monitor analytics      |
| UI too cluttered with original     | Confusing experience           | Keep original compact with subtle styling    |
| Users always click "Send Original" | Defeats mediation purpose      | Track metrics, consider UI changes if abused |
| Bypass flag exploited              | Users bypass all mediation     | Log bypasses, rate limit if needed           |
