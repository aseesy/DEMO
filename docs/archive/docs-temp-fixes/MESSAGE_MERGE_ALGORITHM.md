# Deterministic Message Merge Algorithm

**Date**: 2025-01-01  
**Status**: 📋 **PROPOSAL**

---

## Problem

Need deterministic algorithm for:
1. Merging optimistic messages with fetched history
2. Loading older messages (pagination)
3. Handling reconnect without duplication

---

## Assumptions

- Messages have unique IDs: `id` (server) or `tempId` (optimistic)
- Messages have `timestamp` (for sorting)
- Server includes `tempId` in confirmed messages to link back to optimistic

---

## Minimal Algorithm (Pseudocode)

```pseudocode
// State
messages = []  // Sorted array (oldest → newest)
pending = Map<tempId, message>  // Optimistic messages not confirmed

// Single merge function (handles all cases)
function merge(serverMsgs, existingMsgs, pendingMsgs):
  // 1. Build ID map from existing (preserve pending that weren't confirmed)
  byId = Map()
  for msg in existingMsgs:
    byId[msg.id or msg.tempId] = msg
  
  // 2. Process server messages (remove confirmed pending, add/update server)
  for msg in serverMsgs:
    id = msg.id or msg.tempId
    if msg.tempId: pendingMsgs.delete(msg.tempId)  // Confirmed
    byId[id] = msg  // Server version takes precedence
  
  // 3. Add unconfirmed pending
  for tempId, msg in pendingMsgs:
    if tempId not in byId:
      byId[tempId] = msg
  
  // 4. Sort deterministically (timestamp, then id)
  return sorted(byId.values(), key: (m) => (m.timestamp, m.id or m.tempId))

// Operations
function setHistory(serverMsgs):
  messages = merge(serverMsgs, [], pending)

function addNew(serverMsg):
  messages = merge([serverMsg], messages, pending)

function addOptimistic(tempId, msg):
  msg.tempId = tempId
  pending[tempId] = msg
  messages = merge([], messages, pending)

function prependOlder(olderMsgs):
  messages = merge(olderMsgs, messages, pending)

function reconnect(serverHistory):
  messages = merge(serverHistory, [], pending)
```

---

## Key Properties

1. **Deterministic**: Same inputs → same output (sorted by timestamp, then id)
2. **ID-Based Deduplication**: `msg.id` or `msg.tempId` as unique key
3. **Server Precedence**: Server messages (with `id`) overwrite optimistic (tempId only)
4. **Pending Persistence**: Unconfirmed optimistic messages survive reconnects
5. **Single Merge Function**: All operations use same merge logic

---

## Example Flow

### Initial Load
```
serverHistory = [msg1, msg2, msg3]
setMessageHistory(serverHistory)
→ messages = [msg1, msg2, msg3]
→ pendingMessages = {}
```

### User Sends Message (Optimistic)
```
addOptimisticMessage("temp-123", {text: "Hello", timestamp: now})
→ messages = [msg1, msg2, msg3, temp-123]
→ pendingMessages = {"temp-123": {...}}
```

### Server Confirms
```
addNewMessage({id: "server-456", tempId: "temp-123", text: "Hello", timestamp: now})
→ messages = [msg1, msg2, msg3, server-456]  // temp-123 replaced
→ pendingMessages = {}  // temp-123 removed
```

### Reconnect
```
handleReconnect([msg1, msg2, msg3, server-456])
→ messages = [msg1, msg2, msg3, server-456]
→ pendingMessages = {}  // No duplicates
```

### Load Older Messages
```
prependOlderMessages([older1, older2])
→ messages = [older1, older2, msg1, msg2, msg3, server-456]
→ oldestTimestamp = older1.timestamp
```

---

## Complexity

- **Time**: O(n log n) - sorting dominates (n = total messages)
- **Space**: O(n) - messages array + O(p) pending map (p = pending count, typically small)
- **Deterministic**: ✅ Same inputs → same output

---

## Why This Works

1. **Merge handles everything**: One function for all operations (replace, append, prepend)
2. **ID deduplication**: Map keyed by `id` or `tempId` prevents duplicates
3. **Server wins**: Server messages (with `id`) replace optimistic (tempId) when same tempId
4. **Pending survives**: Unconfirmed optimistic messages added back after server merge
5. **Deterministic sort**: timestamp + id ensures consistent ordering

