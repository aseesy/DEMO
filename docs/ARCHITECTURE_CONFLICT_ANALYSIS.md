# Architecture Conflict Analysis: Competing State Management

**Date**: 2025-01-01  
**Issue**: Two competing state management architectures causing messages to disappear  
**Status**: 🔴 **CRITICAL ARCHITECTURE PROBLEM**

---

## The Problem

There are **TWO DIFFERENT ARCHITECTURES** managing the same state, and they're fighting each other:

### Architecture 1: Service-Based (ChatContext uses this)

- **MessageService** (singleton) holds message state
- **useMessages()** hook subscribes to MessageService
- State lives outside React lifecycle
- Services subscribe to SocketService events directly

### Architecture 2: React State-Based (useChatSocket uses this)

- **useSocketMessages()** hook uses React `useState` locally
- State lives inside React component lifecycle
- Has guards like `safeSetMessages` to prevent clearing (BAND-AID!)

---

## Evidence of Conflict

### ChatContext.jsx (Service-Based)

```javascript
// Uses MessageService (singleton)
const messaging = useMessages(); // ← Subscribes to messageService
```

### useChatSocket.js (React State-Based)

```javascript
// Uses local React state
const {
  messages,
  setMessages,
  // ...
} = useSocketMessages(); // ← Local useState!
```

### The Band-Aid in useSocketMessages.js

```javascript
// CRITICAL: Never allow messages to be cleared to empty array unless explicitly intended
const safeSetMessages = React.useCallback(updater => {
  setMessages(prev => {
    const next = typeof updater === 'function' ? updater(prev) : updater;

    // ⚠️ BAND-AID: Preventing symptom, not fixing root cause
    if (Array.isArray(next) && next.length === 0 && prev.length > 0) {
      console.error('[useMessages] ⚠️ WARNING: Attempting to clear messages...');
      return prev; // Don't clear!
    }
    return next;
  });
}, []);
```

This guard exists because messages were disappearing - but it's fighting the symptom, not the root cause!

---

## Root Cause

**Which architecture is actually being used?**

If `ChatContext` is the current architecture (service-based), then:

- `useChatSocket` should NOT exist or should be deprecated
- Message state should ONLY come from `MessageService`
- React hooks should ONLY subscribe to services, not manage state themselves

If `useChatSocket` is being used, then:

- Services shouldn't be managing state
- Everything should be React state

**But having BOTH means:**

- Messages can come from two sources
- State can get out of sync
- Messages can disappear when one source clears while the other doesn't
- You're fighting your own state management!

---

## Questions to Answer

1. **Is `useChatSocket` actually being used anywhere?**
   - If not, it should be deleted
   - If yes, why does ChatContext use services?

2. **Which architecture is the intended one?**
   - Service-based (singleton services + subscription hooks)
   - React state-based (local useState hooks)

3. **Why does `useSocketMessages` have a guard preventing message clearing?**
   - This suggests messages were disappearing
   - But the guard is a symptom fix, not a root cause fix
   - The root cause is likely the architecture conflict

---

## Solution Options

### Option A: Use Service-Based Architecture (Recommended if ChatContext is current)

1. ✅ Delete `useChatSocket` entirely (if not used)
2. ✅ Delete `useSocketMessages` (React state version)
3. ✅ All state comes from services
4. ✅ React hooks only subscribe to services
5. ✅ Remove guards/band-aids

### Option B: Use React State-Based Architecture (If useChatSocket is current)

1. ✅ Delete services (MessageService, ChatRoomService, etc.)
2. ✅ All state in React hooks
3. ✅ Services only for socket communication, not state

### Option C: Hybrid (NOT RECOMMENDED)

- Services for infrastructure (socket, API)
- React state for UI state
- Clear boundaries between the two
- Still fighting the state management issue

---

## Next Steps

1. **Investigate**: Which architecture is actually being used?
2. **Identify**: Where are messages disappearing from?
3. **Decide**: Pick ONE architecture
4. **Remove**: Delete the competing architecture
5. **Fix**: Remove all band-aids and guards
6. **Verify**: Messages no longer disappear

---

## The Real Issue

The user is right: **We're fighting our own state management.**

Instead of:

- ❌ Adding guards to prevent clearing (symptom)
- ❌ Adding sync effects between systems (symptom)
- ❌ Band-aids everywhere

We should:

- ✅ Pick ONE architecture
- ✅ Remove the competing one
- ✅ Let the chosen architecture work naturally
- ✅ No fighting, no band-aids
