# Socket Join Refactoring Plan

**Date**: 2025-01-01  
**Status**: 📋 **PLAN**

---

## Problem

The `joinRoom` use case in `connectionOperations/joinRoom.js` is a **procedural nightmare** doing:

1. Validation
2. User Lookup
3. Room Resolution
4. Duplicate Management
5. Socket Joining (session registration)
6. Contact creation
7. Message History Loading

This is **Control Coupling** - the use case knows too much about the internals of how messages are retrieved, rooms are resolved, etc.

---

## Solution

**Move orchestration to RoomService** - Create `joinSocketRoom` method that encapsulates all join logic.

**Architecture**:

```
Handler (thin) → Use Case (thin) → Service (orchestration)
```

**Current (bad)**:

```
Handler → Use Case (orchestrates everything - 121 lines)
```

**Target (good)**:

```
Handler → Use Case (thin - delegates) → RoomService.joinSocketRoom (orchestration)
```

---

## Steps

1. Create `RoomService.joinSocketRoom()` method
   - Takes: userIdentifier, socketId
   - Returns: JoinResult with all needed data
   - Handles all orchestration internally

2. Simplify `joinRoom.js` use case
   - Just calls `roomService.joinSocketRoom()`
   - Returns the result

3. Handler stays thin (already is)
   - Calls use case
   - Emits events based on result

---

## Benefits

- ✅ **Separation of Concerns**: Service handles business logic, use case just coordinates
- ✅ **Single Responsibility**: RoomService owns room join logic
- ✅ **Testability**: Can test service method in isolation
- ✅ **No Control Coupling**: Handler/use case don't know about message history loading internals
