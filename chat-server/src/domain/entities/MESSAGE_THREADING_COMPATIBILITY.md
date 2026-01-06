# Message Entity Threading Compatibility

**Date**: 2025-01-05  
**Status**: ✅ Compatible

---

## Overview

The Message domain entity has been designed to be fully compatible with the existing threading system. This document confirms compatibility and provides usage guidelines.

---

## Threading Fields

The Message entity includes all required threading fields:

### Required Fields

1. **`threadId`** (string|null)
   - Thread ID if message belongs to a thread
   - Maps to database column: `thread_id`
   - Used by: Threading system, message queries

2. **`threadSequence`** (number|null)
   - Sequence number for ordering messages within a thread
   - Maps to database column: `thread_sequence`
   - Critical for: Temporal integrity, correct message ordering
   - Used by: Thread message queries, ordering logic

---

## Database Compatibility

### Database Schema

```sql
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  user_email TEXT NOT NULL,
  text TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  room_id TEXT,
  thread_id TEXT,              -- ✅ Supported
  thread_sequence INTEGER,      -- ✅ Supported
  ...
);
```

### Field Mapping

| Database Column | Entity Property | Type | Notes |
|----------------|-----------------|------|-------|
| `thread_id` | `threadId` | string\|null | Thread identifier |
| `thread_sequence` | `threadSequence` | number\|null | Ordering within thread |
| `user_email` | `username` | string | Supports both username and user_email |

---

## Factory Methods

### `fromDatabaseRow()`

Handles all threading fields correctly:

```javascript
const message = Message.fromDatabaseRow({
  id: 'msg-123',
  type: 'message',
  text: 'Hello',
  username: 'testuser',
  room_id: 'room-123',
  timestamp: new Date(),
  thread_id: 'thread-456',        // ✅ Handled
  thread_sequence: 5,              // ✅ Handled
});
```

**Features**:
- ✅ Supports both `username` and `user_email` fields (migration support)
- ✅ Handles `thread_id` and `thread_sequence`
- ✅ Converts `thread_sequence` to number
- ✅ Handles null values correctly

### `fromApiData()`

Handles both camelCase and snake_case:

```javascript
const message = Message.fromApiData({
  id: 'msg-123',
  threadId: 'thread-456',         // ✅ Handled
  threadSequence: 5,              // ✅ Handled
  // OR
  thread_id: 'thread-456',        // ✅ Also handled
  thread_sequence: 5,             // ✅ Also handled
});
```

---

## Threading Methods

### `isThreaded()`

Check if message belongs to a thread:

```javascript
if (message.isThreaded()) {
  // Message is in a thread
}
```

### `getThreadSequence()`

Get sequence number for ordering:

```javascript
const sequence = message.getThreadSequence();
// Returns: number | null
```

---

## Usage in Threading System

### Thread Message Queries

The Message entity is compatible with existing thread queries:

```javascript
// Repository query (existing code)
const messages = await messageRepository.findByThreadId(threadId);

// Convert to entities (if needed)
const entities = messages.map(msg => Message.fromApiData(msg));
```

### Thread Sequence Ordering

Thread sequence is preserved:

```javascript
// Messages are ordered by thread_sequence
const sorted = messages.sort((a, b) => {
  const seqA = a.threadSequence || 0;
  const seqB = b.threadSequence || 0;
  return seqA - seqB;
});
```

### Adding Messages to Threads

When adding a message to a thread, the sequence is set:

```javascript
// Existing code sets thread_sequence atomically
await addMessageToThread(messageId, threadId);
// thread_sequence is set by database

// Entity can be created from updated row
const message = Message.fromDatabaseRow(updatedRow);
// message.threadSequence is now set
```

---

## Compatibility Checklist

- [x] **Thread ID Support**: `threadId` field included
- [x] **Thread Sequence Support**: `threadSequence` field included
- [x] **Database Mapping**: Maps to `thread_id` and `thread_sequence`
- [x] **Factory Methods**: Handle threading fields correctly
- [x] **Null Handling**: Handles null threadId and threadSequence
- [x] **Type Conversion**: Converts threadSequence to number
- [x] **Migration Support**: Handles both username and user_email
- [x] **API Compatibility**: Supports both camelCase and snake_case

---

## Testing

All threading scenarios are covered in tests:

- ✅ Message with thread ID
- ✅ Message with thread sequence
- ✅ Message without thread (null values)
- ✅ Database row conversion
- ✅ API data conversion
- ✅ Thread sequence getter

---

## Breaking Changes

**None** - The Message entity is fully backward compatible:

1. ✅ Existing code continues to work
2. ✅ Threading fields are optional (can be null)
3. ✅ Factory methods handle all existing formats
4. ✅ No changes required to existing repositories or services

---

## Migration Path

If you want to use Message entities in threading code:

### Step 1: Use Factory Methods

```javascript
// Instead of plain objects
const message = Message.fromDatabaseRow(dbRow);
// or
const message = Message.fromApiData(apiData);
```

### Step 2: Use Entity Methods

```javascript
// Check if threaded
if (message.isThreaded()) {
  const sequence = message.getThreadSequence();
  // Use sequence for ordering
}
```

### Step 3: Convert Back (if needed)

```javascript
// Convert to plain object for API responses
const plain = message.toPlainObject();
// Includes threadId and threadSequence
```

---

## Conclusion

✅ **The Message entity is fully compatible with the threading system.**

- All threading fields are supported
- Factory methods handle all existing formats
- No breaking changes
- Threading functionality remains intact

**Status**: Safe to use Message entities without breaking threading.

