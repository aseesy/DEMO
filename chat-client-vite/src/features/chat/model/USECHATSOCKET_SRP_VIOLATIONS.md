# useChatSocket - Single Responsibility Principle Violations

## Problem: "God Hook" Anti-Pattern

`useChatSocket` is violating Single Responsibility Principle by managing **multiple unrelated concerns**:

### Current Responsibilities (Violations)

1. **❌ Socket Connection Management**
   - Creating socket connection
   - Managing connection lifecycle
   - Handling reconnection logic
   - **This is the ONLY valid responsibility**

2. **❌ HTTP Data Fetching** (Lines 152-200)
   - Fetching `roomId` from `/api/room/:username`
   - HTTP error handling
   - **This is NOT a socket concern - it's data fetching**

3. **❌ Room ID State Management** (Lines 47, 154-200, 215-228)
   - Managing `roomId` state
   - Tracking username changes
   - Clearing roomId on account switch
   - **This is a separate domain concern**

4. **❌ Thread Management** (Lines 44-46, 215-228, 230-247)
   - Thread state (`threads`, `threadMessages`)
   - Thread loading logic
   - Thread CRUD operations (`createThread`, `getThreads`, `getThreadMessages`, `addToThread`)
   - **This should be in a separate `useThreads` hook**

5. **❌ Message State Management** (Lines 38-42, 49-51)
   - Messages array
   - Pending messages
   - Message statuses
   - **This could be in `useMessages` hook**

6. **❌ Search State Management** (Lines 58-62, 270-287)
   - Search results
   - Search state
   - Search operations
   - **This should be in `useSearchMessages` hook** (already exists!)

7. **❌ Pagination State Management** (Lines 53-56, 249-268)
   - Loading older messages
   - Has more messages
   - Initial load state
   - **This should be in `useMessagePagination` hook**

8. **❌ Typing Indicators** (Line 42)
   - Typing users state
   - **This should be in `useTypingIndicators` hook**

9. **❌ Draft Coaching** (Line 65)
   - Draft coaching state
   - **This is UI state, not socket concern**

10. **❌ Unread Count** (Line 68)
    - Unread message count
    - **This is UI state, not socket concern**

11. **❌ Offline Queue Management** (Line 74)
    - Offline message queue
    - **This should be in `MessageQueueService`** (already exists!)

12. **❌ View-Specific Logic** (Lines 202-213)
    - Auto-joining when navigating to chat view
    - **This is navigation/routing concern, not socket**

## Why This Is Bad

### 1. **Tight Coupling**
- Changing room fetching logic requires modifying socket hook
- Changing thread management requires modifying socket hook
- Can't test socket connection without all other concerns

### 2. **Hard to Test**
- Can't test socket connection in isolation
- Can't test thread loading without mocking socket
- Can't test room fetching without socket setup

### 3. **Violates Open/Closed Principle**
- Adding new features (e.g., voice messages) requires modifying this hook
- Changing transport mechanism (Socket.io → WebSocket) requires touching thread logic

### 4. **Poor Separation of Concerns**
- Socket hook knows about HTTP endpoints
- Socket hook knows about thread business logic
- Socket hook knows about UI state (unread count, draft coaching)

### 5. **Code Duplication**
- `useThreads.js` also fetches roomId (duplicate logic)
- Both hooks manage socket connections separately

## Proposed Solution: Separation of Concerns

### Architecture

```
┌─────────────────────────────────────┐
│   useChatSocket (Socket Only)       │  ← Socket Connection ONLY
│   - Connection lifecycle             │
│   - Socket event handling            │
│   - Connection state                 │
└──────────────┬──────────────────────┘
               │ provides socketRef
               ↓
┌─────────────────────────────────────┐
│   useRoomId (Data Fetching)         │  ← Room ID Management
│   - Fetch roomId from API           │
│   - Track username changes           │
│   - Handle roomId state              │
└──────────────┬──────────────────────┘
               │ provides roomId
               ↓
┌─────────────────────────────────────┐
│   useThreads (Thread Management)    │  ← Thread State & Operations
│   - Thread state                     │
│   - Thread loading                   │
│   - Thread CRUD operations           │
│   - Uses socketRef from useChatSocket│
│   - Uses roomId from useRoomId       │
└─────────────────────────────────────┘
```

### Refactoring Plan

#### 1. Extract `useRoomId` Hook

**Location**: `src/hooks/room/useRoomId.js`

**Responsibility**: Room ID fetching and state management

```javascript
export function useRoomId(username, isAuthenticated) {
  const [roomId, setRoomId] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  // Fetch roomId from API
  // Handle username changes
  // Return { roomId, isLoading, error, setRoomId }
}
```

#### 2. Extract `useThreads` Hook (Refactor Existing)

**Location**: `src/features/chat/model/useThreads.js` (already exists, but needs refactoring)

**Responsibility**: Thread state and operations

**Changes**:
- Remove socket connection logic (use `socketRef` from `useChatSocket`)
- Remove roomId fetching (use `roomId` from `useRoomId`)
- Focus only on thread state and operations

#### 3. Extract `useMessages` Hook

**Location**: `src/features/chat/model/useMessages.js`

**Responsibility**: Message state management

```javascript
export function useMessages(socketRef) {
  const [messages, setMessages] = React.useState([]);
  const [pendingMessages, setPendingMessages] = React.useState(new Map());
  const [messageStatuses, setMessageStatuses] = React.useState(new Map());
  
  // Message state management only
  // Uses socketRef for operations
}
```

#### 4. Extract `useMessagePagination` Hook

**Location**: `src/features/chat/model/useMessagePagination.js`

**Responsibility**: Pagination state and operations

```javascript
export function useMessagePagination(socketRef, messages) {
  const [isLoadingOlder, setIsLoadingOlder] = React.useState(false);
  const [hasMoreMessages, setHasMoreMessages] = React.useState(true);
  const [isInitialLoad, setIsInitialLoad] = React.useState(true);
  
  const loadOlderMessages = React.useCallback(() => {
    // Pagination logic
  }, [messages, isLoadingOlder, hasMoreMessages]);
  
  return { isLoadingOlder, hasMoreMessages, isInitialLoad, loadOlderMessages };
}
```

#### 5. Extract `useTypingIndicators` Hook

**Location**: `src/features/chat/model/useTypingIndicators.js`

**Responsibility**: Typing indicator state

```javascript
export function useTypingIndicators(socketRef) {
  const [typingUsers, setTypingUsers] = React.useState(new Set());
  
  // Typing indicator logic
  return { typingUsers };
}
```

#### 6. Refactor `useChatSocket` to Socket-Only

**Responsibility**: Socket connection management ONLY

```javascript
export function useChatSocket({ username, isAuthenticated }) {
  const [isConnected, setIsConnected] = React.useState(false);
  const [isJoined, setIsJoined] = React.useState(false);
  const [error, setError] = React.useState('');
  const socketRef = React.useRef(null);

  // Socket connection lifecycle
  // Socket event handler setup
  // Connection state management

  return {
    socketRef,
    isConnected,
    isJoined,
    error,
    setError,
  };
}
```

### Integration Pattern

```javascript
// In ChatContext or ChatPage
const { socketRef, isConnected, isJoined } = useChatSocket({ username, isAuthenticated });
const { roomId, setRoomId } = useRoomId(username, isAuthenticated);
const { threads, getThreads, createThread } = useThreads(socketRef, roomId);
const { messages, setMessages } = useMessages(socketRef);
const { isLoadingOlder, loadOlderMessages } = useMessagePagination(socketRef, messages);
const { typingUsers } = useTypingIndicators(socketRef);
```

## Benefits

1. **✅ Single Responsibility**: Each hook has one clear purpose
2. **✅ Testability**: Can test each concern in isolation
3. **✅ Reusability**: Hooks can be used independently
4. **✅ Maintainability**: Changes are isolated to one hook
5. **✅ Flexibility**: Can swap implementations (e.g., different room fetching strategy)
6. **✅ No Duplication**: Room fetching logic in one place

## Migration Strategy

1. **Phase 1**: Extract `useRoomId` hook (low risk, high value)
2. **Phase 2**: Refactor `useThreads` to use `socketRef` and `roomId` from other hooks
3. **Phase 3**: Extract `useMessages` hook
4. **Phase 4**: Extract `useMessagePagination` hook
5. **Phase 5**: Extract `useTypingIndicators` hook
6. **Phase 6**: Refactor `useChatSocket` to socket-only
7. **Phase 7**: Update all consumers

## Current Duplication Issues

### 1. Search State Duplication
- `useChatSocket` manages: `searchResults`, `searchTotal`, `isSearching`, `highlightedMessageId`, `searchMessages`, `jumpToMessage`
- `useSearchMessages` hook already exists and manages the same state
- **Violation**: Search state is managed in TWO places

### 2. Room ID Fetching Duplication
- `useChatSocket` fetches roomId (lines 152-200)
- `useThreads` also fetches roomId (lines 54-96)
- **Violation**: Same HTTP fetch logic in two places

### 3. Socket Connection Duplication
- `useChatSocket` creates socket connection
- `useThreads` also creates its own socket connection
- **Violation**: Two separate socket connections for same user

## Priority

**High Priority** (Immediate SRP violations):
1. ✅ Extract `useRoomId` (HTTP fetching in socket hook) - **CRITICAL**
2. ✅ Refactor `useThreads` to use `socketRef` from `useChatSocket` - **CRITICAL**
3. ✅ Remove search state from `useChatSocket` (use `useSearchMessages` instead) - **CRITICAL**

**Medium Priority** (Code organization):
- Extract `useMessages` hook
- Extract `useMessagePagination` hook

**Low Priority** (Small concerns):
- Extract `useTypingIndicators` hook
- Move draft coaching to UI layer
- Move unread count to UI layer

