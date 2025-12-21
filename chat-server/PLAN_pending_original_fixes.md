# Plan: Fix pending_original Message Handling Issues

## Overview

Fix critical issues in `pending_original` message handling in `server.js` to prevent race conditions, ensure proper cleanup, and reduce complexity.

## Issues to Fix

### 1. Race Condition in ID Generation (CRITICAL)

**Location**: `server.js` lines 1660-1688
**Problem**: `interventionId` generated twice with separate `Date.now()` calls can result in mismatched IDs
**Impact**: Frontend can't properly link pending messages to interventions

### 2. Missing roomId Field

**Location**: `server.js` line 1660
**Problem**: `pendingOriginalMessage` missing `roomId` field
**Impact**: Frontend filtering/display issues

### 3. Redundant Flag

**Location**: `server.js` line 1666
**Problem**: Both `type: 'pending_original'` and `isPendingOriginal: true` exist
**Impact**: Unnecessary complexity

### 4. messageStore Doesn't Exclude pending_original

**Location**: `messageStore.js` line 8-11
**Problem**: No explicit check for `pending_original` type
**Impact**: Potential database pollution if message accidentally saved

### 5. Timestamp Inconsistency

**Location**: `server.js` lines 1665, 1684
**Problem**: Different timestamp sources used
**Impact**: Message ordering issues

## Implementation Steps

### Step 1: Fix ID Generation Race Condition

**File**: `chat-server/server.js`
**Lines**: 1658-1688

**Changes**:

1. Generate `interventionId` once before creating messages
2. Use same ID for both `pendingOriginalMessage.interventionId` and `interventionMessage.id`
3. Ensure atomic ID generation

**Code Pattern**:

```javascript
// Generate IDs once, atomically
const baseTimestamp = Date.now();
const interventionId = `ai-intervention-${baseTimestamp}`;
const pendingOriginalId = `pending-original-${baseTimestamp}`;

const pendingOriginalMessage = {
  id: pendingOriginalId,
  type: 'pending_original',
  username: message.username,
  text: message.text,
  timestamp: message.timestamp,
  roomId: user.roomId, // ADD THIS
  interventionId: interventionId, // Use pre-generated ID
};

const interventionMessage = {
  id: interventionId, // Use same pre-generated ID
  type: 'ai_intervention',
  // ... rest of fields
  pendingOriginalId: pendingOriginalId, // Link back
  timestamp: message.timestamp, // Use same timestamp source
};
```

### Step 2: Add roomId to pendingOriginalMessage

**File**: `chat-server/server.js`
**Line**: ~1663

**Change**: Add `roomId: user.roomId` to `pendingOriginalMessage` object

### Step 3: Remove Redundant Flag

**File**: `chat-server/server.js`
**Line**: ~1666

**Change**: Remove `isPendingOriginal: true` - rely on `type: 'pending_original'` only

### Step 4: Update messageStore.saveMessage

**File**: `chat-server/messageStore.js`
**Lines**: 7-11

**Change**: Add explicit check for `pending_original` type

**Code**:

```javascript
async function saveMessage(message) {
  // Don't save private, flagged, or pending_original messages to database
  if (message.private || message.flagged || message.type === 'pending_original') {
    return;
  }
  // ... rest of function
}
```

### Step 5: Standardize Timestamp Usage

**File**: `chat-server/server.js`
**Lines**: 1665, 1684

**Change**: Use `message.timestamp` for both messages to ensure consistency

## Testing Checklist

1. **ID Linking Test**: Verify `pendingOriginalId` in intervention message matches `id` in pending message
2. **roomId Test**: Verify pending messages include `roomId` field
3. **Database Test**: Verify `pending_original` messages are never saved to database
4. **Frontend Integration**: Verify frontend can properly filter and remove pending messages
5. **Disconnect Test**: Verify no orphaned pending messages on disconnect (frontend handles this)
6. **Multiple Interventions**: Test multiple rapid interventions to ensure IDs don't collide

## Risk Assessment

**Low Risk Changes**:

- Adding `roomId` field (additive, won't break existing code)
- Removing redundant flag (frontend uses `type` already)
- Adding `pending_original` check in messageStore (defensive, prevents bugs)

**Medium Risk Changes**:

- ID generation fix (must ensure IDs still link correctly)
- Timestamp standardization (must ensure ordering still works)

## Rollback Plan

If issues occur:

1. All changes are in isolated sections
2. Can revert individual changes without affecting others
3. Frontend already handles `type: 'pending_original'` correctly
4. No database schema changes required

## Files to Modify

1. `chat-server/server.js` (lines ~1658-1688)
2. `chat-server/messageStore.js` (lines ~7-11)

## Verification

After implementation:

- Run server and test intervention flow
- Verify pending messages appear correctly
- Verify pending messages are removed when rewrite sent
- Check server logs for any errors
- Verify no `pending_original` messages in database
