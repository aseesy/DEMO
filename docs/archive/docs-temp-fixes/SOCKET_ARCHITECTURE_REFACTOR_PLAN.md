# Socket Architecture Refactoring Plan

## Current State Analysis

### Problems Identified

1. **SocketAdapter is Bypassed**
   - `SocketAdapter.js` exists with clean abstraction
   - `SocketService.v2.js` imports `io` directly from `socket.io-client`
   - Adapter is "dead code" - not used anywhere

2. **Multiple Redundant Auth Checks (Server)**
   - Token normalization middleware in `sockets.js` (lines 31-49)
   - Checks query, \_query, request.\_query
   - `authMiddleware.js` checks 5 different token locations
   - Engine.io hooks in `server.js` (logging only, but still redundant)

3. **SocketService Does Too Much**
   - Connection management
   - State management (subscribers, stateSubscribers)
   - Event routing (onAny handler)
   - Emit queueing
   - Reconnection logic

4. **No Clear Separation of Concerns**
   - Adapter layer exists but unused
   - Service layer bypasses adapter
   - Direct socket.io-client usage throughout

## Proposed Clean Architecture

### Layer 1: Adapter (Infrastructure)

**File**: `SocketAdapter.js`
**Responsibility**:

- Single point of socket.io-client usage
- Creates socket connections
- Provides clean, framework-agnostic API
- Handles transport configuration
- Manages connection lifecycle (connect/disconnect)

**What it does**:

- `createSocketConnection(url, options)` - Factory function
- Returns `SocketConnection` wrapper
- Handles all socket.io-client specifics

**What it does NOT do**:

- Business logic
- State management
- Event routing
- Authentication (just passes auth data)

### Layer 2: Service (Application)

**File**: `SocketService.js`
**Responsibility**:

- Application-level socket management
- Singleton instance
- State management (connected/disconnected)
- Event subscription system
- Token management

**What it does**:

- Uses `SocketAdapter` to create connections
- Manages connection state
- Provides event subscription API
- Handles token changes

**What it does NOT do**:

- Direct socket.io-client usage
- Transport configuration (delegates to adapter)
- Business logic (messages, threads, etc.)

### Layer 3: Hooks (React Integration)

**File**: `useSocket.js`
**Responsibility**:

- React lifecycle integration
- Subscribes to SocketService state
- Provides React-friendly API

**What it does**:

- Calls `socketService.connect(token)` when token changes
- Subscribes to connection state
- Cleans up on unmount

**What it does NOT do**:

- Direct socket access
- Business logic

## Server-Side Cleanup

### Single Auth Check

**File**: `authMiddleware.js`
**Responsibility**:

- ONE place for authentication
- Checks ONLY `socket.handshake.auth.token`
- Fails fast if no token

**Remove**:

- Token normalization middleware from `sockets.js`
- Multiple fallback checks in `authMiddleware.js`
- Engine.io auth hooks (if any)

### Clean Middleware Chain

```
1. Token normalization (REMOVE - client should use auth object)
2. authMiddleware (ONLY checks auth.token)
3. Connection handler
```

## Implementation Steps

### Phase 1: Refactor SocketAdapter

1. Ensure `createSocketConnection` handles all socket.io-client specifics
2. Make it the ONLY place that imports `io` from `socket.io-client`
3. Standardize on `auth: { token }` only

### Phase 2: Refactor SocketService

1. Remove direct `io` import
2. Use `SocketAdapter.createSocketConnection()`
3. Simplify - remove complex reconnection logic (let Socket.io handle it)
4. Keep state management and event subscription

### Phase 3: Clean Server Auth

1. Remove token normalization middleware
2. Simplify `authMiddleware` to check ONLY `socket.handshake.auth.token`
3. Remove all fallback checks
4. Fail fast with clear error

### Phase 4: Update Client Usage

1. Ensure all code uses `SocketService` (not direct adapter)
2. Verify hooks use service correctly
3. Remove any direct socket.io-client imports

## Benefits

1. **Single Responsibility**: Each layer has one clear job
2. **Testability**: Easy to mock adapter for testing
3. **Maintainability**: Socket.io changes only affect adapter
4. **Clarity**: Clear separation of concerns
5. **No Redundancy**: One auth check, one connection point

## Migration Strategy

1. Start with server-side cleanup (simpler, less risk)
2. Then refactor client adapter/service
3. Test thoroughly after each phase
4. Keep old code commented until verified
