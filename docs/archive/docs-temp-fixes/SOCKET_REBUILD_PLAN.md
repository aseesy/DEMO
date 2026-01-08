# Socket Connection System - Rebuild Plan

**Date**: 2025-01-02  
**Rationale**: Current socket connection system has accumulated complexity and race conditions. Rebuild from scratch with clean architecture.

---

## Current Problematic Components

### 1. SocketService.js
**Issues**:
- Complex connection lifecycle management
- Multiple state sources (connectionState, socket.connected, subscribers)
- Reconnection logic mixed with connection logic
- Event routing complexity

### 2. useSocketConnection hook
**Issues**:
- React lifecycle integration complexity
- Side effect management (hasConnectedRef, wasAuthenticatedRef)
- Multiple useEffects with complex dependencies

### 3. ChatContext.jsx
**Issues**:
- Socket state synchronization logic
- Auto-join logic complexity
- Multiple subscriptions and state updates

### 4. Connection State Management
**Issues**:
- Multiple sources of truth
- Race conditions between connection state and React state
- Complex state synchronization

---

## Proposed Clean Architecture

### Principle: Single Responsibility, Clear Boundaries

```
┌─────────────────────────────────────────────────────────┐
│ SocketService (Infrastructure Layer)                    │
│ - Raw Socket.io connection management                   │
│ - Observable state changes (EventEmitter)               │
│ - Simple API: connect(token), disconnect(), emit()      │
│ - NO React, NO business logic                           │
└─────────────────────────────────────────────────────────┘
                          ▲
                          │
┌─────────────────────────────────────────────────────────┐
│ useSocket hook (React Integration Layer)                │
│ - Simple wrapper around SocketService                   │
│ - Subscribes to connection state                        │
│ - Exposes: { isConnected, connect, disconnect, emit }   │
│ - NO business logic                                     │
└─────────────────────────────────────────────────────────┘
                          ▲
                          │
┌─────────────────────────────────────────────────────────┐
│ ChatProvider (Business Logic Layer)                     │
│ - Uses useSocket for connection                         │
│ - Handles room joining, message sync                    │
│ - NO direct socket management                           │
└─────────────────────────────────────────────────────────┘
```

---

## New SocketService v2 Design

### Minimal API:

```javascript
class SocketService {
  // State
  get isConnected() { return this.socket?.connected ?? false; }
  
  // Connection
  connect(token: string): void
  disconnect(): void
  
  // Events
  emit(event: string, data: any): void
  subscribe(event: string, callback: Function): () => void
  
  // State observation
  subscribeToState(callback: (state: 'disconnected' | 'connecting' | 'connected') => void): () => void
}
```

### Key Simplifications:

1. **No complex state management** - Just socket.connected
2. **No reconnection logic** - Let Socket.io handle it
3. **Simple event subscription** - Map-based, easy to clean up
4. **Observable state** - EventEmitter for state changes

---

## New useSocket Hook Design

### Simple Wrapper:

```javascript
function useSocket({ token, enabled = true }) {
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    if (!enabled || !token) return;
    
    const unsubscribe = socketService.subscribeToState(setIsConnected);
    socketService.connect(token);
    
    return () => {
      unsubscribe();
      socketService.disconnect();
    };
  }, [token, enabled]);
  
  return {
    isConnected,
    emit: socketService.emit.bind(socketService),
  };
}
```

### Key Simplifications:

1. **Single useEffect** - All connection logic in one place
2. **Simple dependencies** - Just token and enabled
3. **Clean cleanup** - Unsubscribe and disconnect on unmount
4. **No refs** - Just state

---

## Implementation Steps

### Phase 1: Create New Components (Parallel Implementation)
1. Create `SocketService.v2.js` (new simplified service)
2. Create `useSocket.js` (new simplified hook)
3. Keep old code in place (don't break existing system)

### Phase 2: Integration Test
1. Create test page/component using new system
2. Verify connection works
3. Verify events work
4. Verify cleanup works

### Phase 3: Migration
1. Update ChatProvider to use new useSocket hook
2. Test core flows
3. Verify no regressions

### Phase 4: Cleanup
1. Remove old SocketService code
2. Remove old useSocketConnection hook
3. Update imports
4. Remove unused code

---

## Success Criteria

1. ✅ Connection works reliably
2. ✅ No connection loops
3. ✅ Clean state management (single source of truth)
4. ✅ Simple, understandable code
5. ✅ Easy to debug
6. ✅ Proper cleanup on unmount

---

## Files to Create/Modify

### New Files:
- `chat-client-vite/src/services/socket/SocketService.v2.js`
- `chat-client-vite/src/hooks/socket/useSocket.js`
- `chat-client-vite/src/features/chat/context/ChatProvider.v2.jsx` (test implementation)

### Files to Modify (after testing):
- `chat-client-vite/src/features/chat/context/ChatContext.jsx`
- `chat-client-vite/src/services/socket/index.js`

### Files to Remove (after migration):
- `chat-client-vite/src/hooks/socket/useSocketSubscription.js` (or update to use new service)
- Old SocketService code (keep v2, remove old)

---

## Testing Strategy

1. **Unit Tests**: Test SocketService v2 in isolation
2. **Hook Tests**: Test useSocket hook
3. **Integration Tests**: Test full connection flow
4. **Manual Testing**: Use SocketDiagnostic page
5. **Browser Testing**: Test in real app

---

**Next Step**: Start with Phase 1 - Create SocketService.v2.js with minimal, clean implementation.
