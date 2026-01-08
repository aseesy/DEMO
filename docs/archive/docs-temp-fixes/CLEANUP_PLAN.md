# Cleanup Plan: Remove Unused useChatSocket Architecture

**Date**: 2025-01-01  
**Status**: 📋 **PLAN**

---

## Goal

Remove unused `useChatSocket` React state-based architecture, keeping only the service-based architecture that's actually being used.

---

## Files to Delete

### Core Unused Files

1. `chat-client-vite/src/features/chat/model/useChatSocket.js` - Main unused hook
2. `chat-client-vite/src/features/chat/model/useSocketMessages.js` - React state version (with band-aids)
3. `chat-client-vite/src/features/chat/model/useSocketThreads.js` - React state version
4. `chat-client-vite/src/features/chat/model/useConnectionEvents.js` - React state version
5. `chat-client-vite/src/features/chat/model/useRoomSubscription.js` - React state version
6. `chat-client-vite/src/features/chat/model/useMessageSubscription.js` - React state version
7. `chat-client-vite/src/features/chat/model/useMessagePagination.js` - If only used by useChatSocket
8. `chat-client-vite/src/features/chat/model/useTypingIndicators.js` - If only used by useChatSocket
9. `chat-client-vite/src/features/chat/model/useDraftCoaching.js` - If only used by useChatSocket
10. `chat-client-vite/src/features/chat/model/useUnreadCount.js` - If only used by useChatSocket

### Test Files

- `chat-client-vite/src/features/chat/model/useChatSocket.network.test.js` - Test for unused code

### Documentation

- Remove references to useChatSocket from docs

---

## Files to Update

### 1. `chat-client-vite/src/features/chat/index.js`

**Remove**:

```javascript
export { useChatSocket } from './model/useChatSocket.js';
```

### 2. `chat-client-vite/src/features/dashboard/useDashboard.js`

**Update comment** (line 88):

```javascript
// OLD: ChatContext provides threads from useChatSocket which manages the socket connection
// NEW: ChatContext provides threads from service-based architecture
```

### 3. Verify no other imports

---

## Root Cause: Message History Issue

**Problem Found**: `MessageService.handleMessageHistory` REPLACES messages:

```javascript
handleMessageHistory(data) {
  if (data.messages) {
    this.messages = data.messages;  // ← REPLACES, not merges
    // If data.messages = [], messages disappear!
  }
}
```

**Behavior**: Server emits `message_history` on every join. If it fires with empty array (new room, error, race condition), messages disappear.

**Fix Strategy**:

- `message_history` is meant for INITIAL load
- Should only replace if we don't have messages yet
- OR: Should only replace on explicit reload, not on every join
- Need to understand intended behavior first

---

## Steps

1. [ ] Verify useChatSocket is truly unused (grep for actual usage)
2. [ ] Delete unused files
3. [ ] Update exports in index.js
4. [ ] Update comments
5. [ ] Fix MessageService.handleMessageHistory to prevent unwanted clearing
6. [ ] Remove all band-aids and guards
7. [ ] Test that messages work correctly

---

## Investigation Needed

Before deleting, verify:

- [ ] useChatSocket is not imported anywhere (except test)
- [ ] All hooks listed are only used by useChatSocket
- [ ] Service-based architecture works correctly
- [ ] Understand message_history intended behavior
