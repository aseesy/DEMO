# Why `conversationContext` Parameter Design?

## The Problem: Global State Issues

### Before Refactoring (Global State Pattern):

```javascript
// ❌ OLD WAY: Global module-level state
let escalationState = new Map();
let emotionalState = new Map();
let policyState = new Map();

function updateEscalationScore(roomId, patterns) {
  // Uses global escalationState
  if (!escalationState.has(roomId)) {
    escalationState.set(roomId, {...});
  }
  // ...
}
```

### Problems with Global State:

1. **State Leakage Between Rooms** 🚨
   - All rooms share the same global Maps
   - Room A's escalation state could affect Room B
   - No isolation between conversations

2. **Testing Difficulties** 🧪
   - Tests can't run in parallel (shared state)
   - Tests interfere with each other
   - Hard to reset state between tests
   - Can't test multiple scenarios simultaneously

3. **Concurrency Issues** ⚠️
   - Multiple requests for different rooms modify same global state
   - Race conditions possible
   - Hard to debug which room caused what change

4. **Memory Leaks** 💾
   - Global state never gets cleaned up
   - Old room data accumulates forever
   - No way to garbage collect unused rooms

5. **No Instance Isolation** 🔒
   - Can't have multiple mediator instances
   - Can't test different configurations
   - Everything is coupled to module-level state

---

## The Solution: Instance-Based State with Context Parameter

### After Refactoring (Context Parameter Pattern):

```javascript
// ✅ NEW WAY: Context passed as parameter
function updateEscalationScore(conversationContext, roomId, patterns) {
  // Uses conversationContext.escalationState (instance-specific)
  if (!conversationContext.escalationState.has(roomId)) {
    conversationContext.escalationState.set(roomId, {...});
  }
  // ...
}

// Each mediator instance has its own context
class AIMediator {
  constructor(conversationContext = null) {
    this.conversationContext = conversationContext || createConversationContext();
  }
}
```

---

## Benefits of This Design

### 1. **State Isolation** ✅

```javascript
// Room A has its own context
const mediatorA = new AIMediator(createConversationContext());
mediatorA.conversationContext.escalationState.set('room-A', {...});

// Room B has completely separate context
const mediatorB = new AIMediator(createConversationContext());
mediatorB.conversationContext.escalationState.set('room-B', {...});

// No interference between rooms!
```

**Why this matters:**

- Each conversation is isolated
- Room A's escalation doesn't affect Room B
- Can have different intervention thresholds per room
- Prevents cross-contamination of emotional states

### 2. **Testability** ✅

```javascript
// Each test gets fresh context
describe('State Manager', () => {
  let mockConversationContext;

  beforeEach(() => {
    mockConversationContext = {
      escalationState: new Map(),
      emotionalState: new Map(),
      policyState: new Map(),
    };
  });

  it('should update escalation', () => {
    // Isolated test - no interference from other tests
    stateManager.updateEscalationScore(mockConversationContext, 'room-1', patterns);
  });
});
```

**Why this matters:**

- Tests can run in parallel
- Each test has clean state
- Easy to test edge cases
- Can test multiple scenarios simultaneously

### 3. **Memory Management** ✅

```javascript
// When a mediator instance is destroyed, its context is garbage collected
const mediator = new AIMediator(createConversationContext());
// ... use mediator ...
// When mediator goes out of scope, context is cleaned up automatically
```

**Why this matters:**

- Old room data gets garbage collected
- No memory leaks
- Automatic cleanup when instances are destroyed
- Better resource management

### 4. **Concurrency Safety** ✅

```javascript
// Each request gets its own mediator instance with its own context
app.post('/analyze', (req, res) => {
  const mediator = new AIMediator(createConversationContext());
  // This request's state is isolated from other requests
  mediator.analyzeMessage(...);
});
```

**Why this matters:**

- No race conditions between requests
- Each request has isolated state
- Thread-safe (no shared mutable state)
- Easier to debug (state is request-scoped)

### 5. **Flexibility** ✅

```javascript
// Can create mediators with different configurations
const strictMediator = new AIMediator(createStrictContext());
const lenientMediator = new AIMediator(createLenientContext());

// Can share context between mediators if needed
const sharedContext = createConversationContext();
const mediator1 = new AIMediator(sharedContext);
const mediator2 = new AIMediator(sharedContext); // Same context
```

**Why this matters:**

- Can test different configurations
- Can share state between instances if needed
- More flexible architecture
- Easier to extend

### 6. **Explicit Dependencies** ✅

```javascript
// Function signature makes dependencies clear
function updateEscalationScore(conversationContext, roomId, patterns) {
  // ✅ Clear: needs conversationContext
  // ✅ Clear: operates on roomId
  // ✅ Clear: uses patterns
}

// vs old way:
function updateEscalationScore(roomId, patterns) {
  // ❌ Hidden: uses global state
  // ❌ Unclear: where does state come from?
}
```

**Why this matters:**

- Dependencies are explicit in function signature
- Easier to understand what function needs
- Easier to test (just pass mock context)
- Follows dependency injection pattern

---

## Real-World Example: The Bug We Just Fixed

### The Problem We Encountered:

```javascript
// In aiHelper.js - we had:
const participantUsernames = await getParticipantUsernames(
  dbSafe,
  user.roomId,
  activeUsers // ❌ undefined - global variable that doesn't exist
);
```

### Why This Happened:

The codebase was refactored from global state (`activeUsers` Map) to instance-based state (`userSessionService`), but some code wasn't updated.

### With Context Parameter Pattern:

```javascript
// Clear what's needed:
const participantUsernames = await getParticipantUsernames(
  dbSafe,
  user.roomId,
  userSessionService // ✅ Explicit dependency
);
```

**The context parameter pattern makes dependencies explicit**, so it's harder to miss them during refactoring.

---

## Design Principles Applied

### 1. **Dependency Injection**

- Dependencies are passed in, not accessed globally
- Makes code more testable and flexible

### 2. **Single Responsibility**

- `stateManager` only manages state
- Doesn't know about global state or singletons
- Just operates on the context it's given

### 3. **Immutability Where Possible**

- Context is passed by reference, but operations are scoped
- Each room's state is isolated within the context

### 4. **Testability**

- Easy to create mock contexts
- No global state to reset
- Tests are isolated

### 5. **Scalability**

- Can handle many concurrent rooms
- Each room's state is independent
- No shared bottlenecks

---

## Trade-offs

### Pros ✅

- State isolation
- Better testability
- No memory leaks
- Concurrency safety
- Explicit dependencies
- More flexible

### Cons ⚠️

- Slightly more verbose (need to pass context)
- Tests need to be updated (like we're doing now)
- More parameters in function signatures

**The trade-off is worth it** because:

- The verbosity is minimal (one extra parameter)
- The benefits (isolation, testability, safety) are huge
- It's a one-time cost to update tests
- The code is more maintainable long-term

---

## Summary

The `conversationContext` parameter design was chosen to:

1. **Prevent state leakage** between different rooms/conversations
2. **Enable parallel testing** without test interference
3. **Allow proper memory management** (garbage collection)
4. **Ensure concurrency safety** (no race conditions)
5. **Make dependencies explicit** (easier to understand and test)
6. **Provide flexibility** (can create different mediator instances)

This is a **common pattern** in modern software architecture:

- React Context API (similar concept)
- Dependency Injection (Spring, Angular)
- Functional Programming (passing state explicitly)

The design follows **SOLID principles**, especially:

- **Single Responsibility**: State management is isolated
- **Dependency Inversion**: Depends on abstractions (context), not concrete implementations
