# Root Cause Investigation: Disappearing Messages

**Date**: 2025-01-01  
**Status**: 🔍 **INVESTIGATING**

---

## Current Architecture (Service-Based)

**MessageService** (singleton):

- Subscribes to `message_history` event
- `handleMessageHistory(data)` REPLACES `this.messages` with `data.messages`
- If `data.messages = []`, messages get cleared!

---

## Potential Root Causes

### Hypothesis 1: Empty message_history Event

**Problem**: Server might emit `message_history` with empty array `[]`

**Evidence needed**:

- When does server emit `message_history`?
- Can it emit with empty array?
- Does it fire on reconnect/rejoin?

**Code to check**:

```javascript
handleMessageHistory(data) {
  if (data.messages) {
    this.messages = data.messages;  // ← REPLACES, doesn't merge!
    // If data.messages = [], messages disappear!
  }
}
```

**Fix** (if this is the issue):

- Don't replace if incoming array is empty and we have existing messages
- OR: Only replace on initial load, merge on subsequent loads

---

### Hypothesis 2: Multiple message_history Events

**Problem**: Multiple `message_history` events could fire, last one with empty array clears everything

**Evidence needed**:

- Are there race conditions?
- Does rejoin cause multiple events?
- Does reconnect cause duplicate events?

---

### Hypothesis 3: Service Subscription Issues

**Problem**: Subscriptions might not be cleaned up properly, causing duplicate handlers

**Evidence needed**:

- Are subscriptions cleaned up?
- Could old handlers still be firing?

---

## Next Steps

1. [ ] Check server code: When does it emit `message_history`?
2. [ ] Check server code: Can it emit with empty array?
3. [ ] Check if there are multiple subscriptions to message_history
4. [ ] Check if handleMessageHistory is being called with empty arrays
5. [ ] Add logging to MessageService.handleMessageHistory to track calls
6. [ ] Understand the expected behavior: Should message_history REPLACE or MERGE?

---

## The Real Question

**What is the intended behavior?**

- Should `message_history` REPLACE all messages? (current behavior)
- Should `message_history` only set messages if array is not empty?
- Should `message_history` only fire once on initial join?
- Should messages persist across reconnects/rejoins?

Until we understand the intended behavior, we can't fix the root cause properly.
