# Architecture Cleanup & Root Cause Fix

**Date**: 2025-01-01  
**Status**: 🔴 **IN PROGRESS**

---

## The Real Problem

You're absolutely right - we've been fighting our own state management with band-aids instead of fixing the root cause.

### Two Competing Architectures

1. **Service-Based** (ACTUALLY USED):
   - `ChatProvider` → `useMessages()` → `MessageService` (singleton)
   - State lives outside React lifecycle
   - Clean architecture

2. **React State-Based** (UNUSED/LEGACY):
   - `useChatSocket` → `useSocketMessages()` → React `useState`
   - Has band-aids like `safeSetMessages` guard
   - Never actually used in production

---

## Root Cause: Message History Replacement

**Found in MessageService.handleMessageHistory**:

```javascript
handleMessageHistory(data) {
  if (data.messages) {
    this.messages = data.messages;  // ← REPLACES, not merges!
    // If data.messages = [] (empty), all messages disappear!
  }
}
```

**Behavior**:

- Server emits `message_history` on EVERY join (line 33 of connectionHandler.js)
- If user rejoins (reconnect, refresh), `message_history` fires again
- If server sends empty array (new room, error, race condition), messages get replaced with empty array
- Messages disappear!

**The Band-Aid** (in unused code):

- `useSocketMessages.js` has `safeSetMessages` guard preventing clearing
- But this is in the UNUSED React state version!
- The REAL service-based architecture doesn't have this protection

---

## Solution: Two-Part Fix

### Part 1: Delete Unused Architecture

**Files to Delete**:

1. `useChatSocket.js` - Unused hook
2. `useSocketMessages.js` - Unused React state version (has band-aids)
3. `useSocketThreads.js` - Unused
4. `useConnectionEvents.js` - Unused
5. `useRoomSubscription.js` - Unused
6. `useMessageSubscription.js` - Unused
7. `useChatSocket.network.test.js` - Test for unused code

**Files to Update**:

- `index.js` - Remove export
- `useDashboard.js` - Update comment

---

### Part 2: Fix Root Cause in MessageService

**The Real Fix** (not a band-aid):

`message_history` should only REPLACE messages on INITIAL load. If we already have messages, we shouldn't replace them with an empty array.

**Options**:

**Option A**: Only replace if we don't have messages yet (initial load)

```javascript
handleMessageHistory(data) {
  if (data.messages) {
    // Only replace on initial load (no messages yet)
    // Otherwise, message_history is meant to REPLACE (fresh load on rejoin)
    // But don't replace with empty if we have messages!
    if (data.messages.length === 0 && this.messages.length > 0) {
      console.warn('[MessageService] Ignoring empty message_history - already have messages');
      return; // Don't replace existing messages with empty array
    }
    this.messages = data.messages;
    this.hasMore = data.hasMore ?? data.messages.length >= 50;
    this.notify();
  }
}
```

**Option B**: Track if we've loaded initial history

```javascript
constructor() {
  // ...
  this.hasLoadedInitialHistory = false;
}

handleMessageHistory(data) {
  if (data.messages) {
    // First load: always replace (initial load)
    // Subsequent: only replace if not empty (rejoin with messages)
    if (!this.hasLoadedInitialHistory || data.messages.length > 0) {
      this.messages = data.messages;
      this.hasMore = data.hasMore ?? data.messages.length >= 50;
      this.hasLoadedInitialHistory = true;
      this.notify();
    } else {
      console.warn('[MessageService] Ignoring empty message_history after initial load');
    }
  }
}
```

**Option C**: Server should not emit empty message_history

- Fix server to never emit empty array
- But defensive coding is better

**Recommendation**: Option A is simplest and most defensive.

---

## Action Plan

1. ✅ **Investigate** - Done: Found root cause
2. ⏳ **Delete unused code** - Remove useChatSocket and related files
3. ⏳ **Fix MessageService** - Add proper logic (not band-aid)
4. ⏳ **Remove band-aids** - Delete safeSetMessages and other guards
5. ⏳ **Test** - Verify messages don't disappear

---

## Why This Is The Right Fix

**Instead of**:

- ❌ Adding guards to prevent state changes
- ❌ Band-aids everywhere
- ❌ Fighting the architecture

**We're doing**:

- ✅ Removing competing architecture
- ✅ Fixing root cause properly
- ✅ Letting the architecture work naturally
- ✅ Single source of truth
