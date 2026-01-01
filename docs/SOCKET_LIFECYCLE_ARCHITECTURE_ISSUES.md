# Socket Lifecycle Architecture Issues

## Status: ⚠️ **CRITICAL CODE SMELL - NEEDS REFACTORING**

## Executive Summary

The current WebSocket connection management in `useSocketConnection.js` and `useChatSocket.js` uses `useEffect` to manually synchronize an imperative WebSocket connection with React's declarative rendering cycle. This is a fundamental architectural anti-pattern that creates race conditions and makes the code fragile.

**The code is fighting React instead of using it.**

---

## Issues Identified

### 1. **Timeout-Based Cleanup Hack (CRITICAL)**

**Location**: `useSocketConnection.js:189-206`

```javascript
return () => {
  console.log('[useSocketConnection] 🧹 Cleanup scheduled (delayed for StrictMode)');
  isUnmountingRef.current = true;

  // Delay cleanup to allow StrictMode remount to cancel it
  cleanupTimeoutRef.current = setTimeout(() => {
    if (isUnmountingRef.current) {
      console.log(
        '[useSocketConnection] 🧹 Cleanup executing - removing listeners and disconnecting'
      );
      // ... cleanup code ...
    }
  }, 100); // Short delay - enough for StrictMode but not noticeable to users
};
```

**Problems**:

- Uses a 100ms timeout to work around React StrictMode's double-mount behavior
- Creates a race condition window: if component re-renders during the 100ms delay, cleanup state can be inconsistent
- When network conditions change or component re-renders unexpectedly, this timeout can cause the socket to disconnect prematurely or fail to reconnect
- This is a band-aid solution that doesn't address the root cause

**Why It Fails**:

- If `isAuthenticated` changes during the 100ms window, the effect re-runs, but the cleanup timeout still fires later, disconnecting the socket incorrectly
- If the component unmounts for real (not StrictMode), the delay means cleanup happens asynchronously, which can cause memory leaks or incorrect state

---

### 2. **Ref-Based State Machine (CRITICAL)**

**Location**: `useSocketConnection.js:51-99`

```javascript
const socketInitializedRef = useRef(false);
const cleanupTimeoutRef = useRef(null);
const isUnmountingRef = useRef(false);

useEffect(() => {
  // Cancel any pending cleanup from StrictMode's first unmount
  if (cleanupTimeoutRef.current) {
    clearTimeout(cleanupTimeoutRef.current);
    cleanupTimeoutRef.current = null;
  }
  isUnmountingRef.current = false;

  // Complex conditional logic checking refs
  if (socketRef.current) {
    // ... check socket state ...
  }

  // Prevent duplicate socket creation
  if (socketInitializedRef.current) {
    return;
  }
  socketInitializedRef.current = true;
  // ... create socket ...
}, [isAuthenticated, setupHandlers, onConnect, onDisconnect, onError]);
```

**Problems**:

- Uses refs (`socketInitializedRef`, `isUnmountingRef`) to manually track initialization state
- These refs don't trigger re-renders, so state is not reactive
- When props change or components re-render, these refs may not reflect the correct state
- The effect has complex conditional logic that tries to prevent duplicate connections, but this logic is fragile

**Why It Fails**:

- When `isAuthenticated` changes from `false` to `true`, the effect runs, but `socketInitializedRef.current` might still be `true` from a previous mount, preventing socket creation
- When dependencies change (like `setupHandlers`), the effect re-runs, but refs persist, causing inconsistent behavior
- The logic assumes a specific execution order that can break under React's concurrent rendering

---

### 3. **Non-Reactive Socket State Checks**

**Location**: `useChatSocket.js:155-174`

```javascript
React.useEffect(() => {
  // ...
  if (
    currentView === 'chat' &&
    isAuthenticated &&
    username &&
    socketRef.current?.connected && // ❌ Not reactive!
    !isJoined
  ) {
    socketRef.current.emit('join', { email: username });
  }
}, [currentView, isAuthenticated, username, isJoined]);
```

**Problems**:

- Checks `socketRef.current?.connected` which is **not reactive**
- This effect won't re-run when the socket connects/disconnects
- Relies on other effects or external events to trigger this check

**Why It Fails**:

- If the socket connects after this effect runs, the join event won't be emitted until something else triggers a re-render
- If the socket disconnects and reconnects, this effect won't re-run, so re-join won't happen automatically

---

### 4. **Callback Dependencies Causing Unnecessary Re-runs**

**Location**: `useSocketConnection.js:207`

```javascript
}, [isAuthenticated, setupHandlers, onConnect, onDisconnect, onError]);
```

**Problems**:

- `setupHandlers` is a callback that likely changes on every render (if not properly memoized)
- This causes the entire effect to re-run, potentially creating new socket connections unnecessarily
- The effect tries to prevent duplicate connections with refs, but the dependency on callbacks defeats this protection

**Why It Fails**:

- If `setupHandlers` changes (even if functionally equivalent), the effect re-runs
- The effect's guard clauses try to prevent duplicate connections, but they're fighting against React's dependency system

---

## Root Cause Analysis

The fundamental issue is **trying to manage imperative socket lifecycle with declarative React effects**.

**What the code is trying to do**:

1. Create socket when authenticated
2. Keep socket alive across re-renders
3. Clean up socket on unmount (but handle StrictMode)
4. Prevent duplicate connections

**Why useEffect is the wrong tool**:

- `useEffect` is for **side effects** that should run when dependencies change
- Socket connections are **long-lived resources** that should persist across renders
- The cleanup function should run immediately on unmount, not after a delay
- React StrictMode's double-mount is a **feature**, not a bug - the code should handle it correctly, not work around it

---

## Proper React Patterns for WebSocket Connections

### Option 1: **useReducer for Connection State Machine** (Recommended)

Use `useReducer` to manage connection state declaratively:

```javascript
const connectionStateReducer = (state, action) => {
  switch (action.type) {
    case 'CONNECTING':
      return { status: 'connecting', socket: null, error: null };
    case 'CONNECTED':
      return { status: 'connected', socket: action.socket, error: null };
    case 'DISCONNECTED':
      return { status: 'disconnected', socket: null, error: null };
    case 'ERROR':
      return { status: 'error', socket: null, error: action.error };
    default:
      return state;
  }
};

function useSocketConnection() {
  const [state, dispatch] = useReducer(connectionStateReducer, {
    status: 'disconnected',
    socket: null,
    error: null,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      if (state.status !== 'disconnected') {
        state.socket?.disconnect();
        dispatch({ type: 'DISCONNECTED' });
      }
      return;
    }

    if (state.status === 'connected' || state.status === 'connecting') {
      return; // Already connected/connecting
    }

    dispatch({ type: 'CONNECTING' });
    const socket = io(url, options);

    socket.on('connect', () => {
      dispatch({ type: 'CONNECTED', socket });
    });

    socket.on('disconnect', () => {
      dispatch({ type: 'DISCONNECTED' });
    });

    return () => {
      socket.disconnect();
      dispatch({ type: 'DISCONNECTED' });
    };
  }, [isAuthenticated, state.status]);

  return state;
}
```

**Benefits**:

- State is reactive and declarative
- No refs needed for state tracking
- Cleanup happens immediately (no timeouts)
- Works correctly with StrictMode (cleanup runs, then effect re-runs)
- State transitions are explicit and testable

---

### Option 2: **Custom Hook with Proper Lifecycle Management**

Create a hook that manages socket as a singleton or context-level resource:

```javascript
function useSocketConnection() {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    // Create socket once, reuse across renders
    if (!socketRef.current) {
      const socket = io(url, options);
      socketRef.current = socket;

      socket.on('connect', () => setIsConnected(true));
      socket.on('disconnect', () => setIsConnected(false));
    }

    // Cleanup only on unmount (not on dependency changes)
    return () => {
      // Only cleanup if component is actually unmounting
      // StrictMode will cause this to run, then re-run effect
      // Socket will be recreated if needed
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
    };
  }, [isAuthenticated]); // Only depend on auth, not callbacks

  return { socket: socketRef.current, isConnected };
}
```

**Benefits**:

- Simpler than current implementation
- No timeout hacks
- Works with StrictMode (cleanup runs, socket recreated if needed)
- Socket persists across re-renders but cleans up on unmount

---

### Option 3: **State Machine Library (XState, Zustand, etc.)**

Use a dedicated state machine library for complex connection logic:

```javascript
import { useMachine } from '@xstate/react';
import { createMachine } from 'xstate';

const socketMachine = createMachine({
  id: 'socket',
  initial: 'disconnected',
  context: { socket: null },
  states: {
    disconnected: {
      on: { CONNECT: 'connecting' },
    },
    connecting: {
      invoke: {
        src: 'createSocket',
        onDone: { target: 'connected', actions: 'assignSocket' },
        onError: { target: 'error' },
      },
    },
    connected: {
      on: { DISCONNECT: 'disconnected' },
    },
    error: {
      on: { RETRY: 'connecting' },
    },
  },
});

function useSocketConnection() {
  const [state, send] = useMachine(socketMachine);
  // ...
}
```

**Benefits**:

- Explicit state machine with clear transitions
- Handles complex scenarios (retry logic, error states, etc.)
- Testable and debuggable
- No ref hacks or timeouts needed

---

## Recommendation

**Immediate Action**: Refactor `useSocketConnection` to use **Option 1 (useReducer)** or **Option 2 (Simplified Hook)**.

**Long-term**: Consider **Option 3 (XState)** if connection logic becomes more complex (retry strategies, exponential backoff, etc.).

---

## Migration Plan

1. **Phase 1**: Extract connection state into `useReducer`
   - Remove `socketInitializedRef`, `isUnmountingRef`, `cleanupTimeoutRef`
   - Remove timeout-based cleanup
   - Make state reactive

2. **Phase 2**: Simplify effect dependencies
   - Remove callbacks from dependency array
   - Use refs for callbacks if they need to be stable
   - Only depend on `isAuthenticated`

3. **Phase 3**: Fix auto-join logic
   - Make `isConnected` reactive (from reducer state)
   - Remove non-reactive `socketRef.current?.connected` checks

4. **Phase 4**: Add tests
   - Test StrictMode behavior (double-mount)
   - Test network disconnection/reconnection
   - Test rapid auth state changes

---

## Impact Assessment

**Current Issues**:

- ❌ Race conditions causing socket disconnections
- ❌ Failed reconnections on network changes
- ❌ Memory leaks from improper cleanup
- ❌ Unpredictable behavior under React concurrent rendering

**After Refactoring**:

- ✅ Predictable, testable connection lifecycle
- ✅ Proper cleanup (no memory leaks)
- ✅ Works correctly with StrictMode
- ✅ Reactive state (UI updates when socket connects/disconnects)
- ✅ No race conditions

---

## Related Files

- `chat-client-vite/src/features/chat/model/useSocketConnection.js` (primary issue)
- `chat-client-vite/src/features/chat/model/useChatSocket.js` (uses non-reactive socket checks)
- `chat-client-vite/src/features/chat/handlers/connectionHandlers.js` (may need updates)

---

## References

- [React useEffect Best Practices](https://react.dev/reference/react/useEffect)
- [React StrictMode and Effects](https://react.dev/reference/react/StrictMode#fixing-bugs-found-by-double-rendering-in-development)
- [XState Documentation](https://xstate.js.org/docs/)
- [WebSocket + React Patterns](https://kentcdodds.com/blog/fix-the-slow-render-before-you-fix-the-re-render)
