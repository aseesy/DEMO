# Pairing-Based Room Lookup Guide

## Overview

This document explains how to find chat rooms for paired users using the `user_pairing_status` VIEW.

## The Problem

Previously, room lookup code queried `pairing_sessions` and `room_members` tables directly, which could miss rooms if:
- Pairing status changed
- Room lookup only checked `room_members` and not pairings
- Inconsistent query patterns across the codebase

## The Solution: `user_pairing_status` VIEW

The `user_pairing_status` VIEW is the **canonical source** for finding rooms via pairings. It provides:

- `user_id` - The user's ID
- `partner_id` - The partner's user ID (if paired)
- `shared_room_id` - The room ID shared between paired users
- `status` - Pairing status ('pending' or 'active')
- `user_role` - User's role in pairing ('initiator' or 'acceptor')

## Naming Conventions

All database columns use **snake_case**:
- `shared_room_id` - Room ID for paired users
- `user_id` - User ID (from VIEW)
- `partner_id` - Partner's user ID (from VIEW)
- `pairing_id` - Pairing session ID (from VIEW)

## Code Patterns

### ✅ Correct: Using the VIEW

```javascript
// Via repository (recommended)
const activePairing = await pairingManager.getActivePairing(userId, db);
if (activePairing && activePairing.shared_room_id) {
  const roomId = activePairing.shared_room_id;
  // Use roomId
}

// Direct VIEW query (for scripts)
const result = await db.query(`
  SELECT ups.shared_room_id, ups.partner_id, ups.status
  FROM user_pairing_status ups
  WHERE ups.user_id = $1 AND ups.status = 'active'
`, [userId]);
```

### ❌ Incorrect: Querying pairing_sessions directly

```javascript
// DON'T DO THIS - bypasses the VIEW
const result = await db.query(`
  SELECT * FROM pairing_sessions
  WHERE (parent_a_id = $1 OR parent_b_id = $1) AND status = 'active'
`, [userId]);
```

## Updated Code Locations

All of these now use `user_pairing_status` VIEW:

1. **PostgresPairingRepository.findActiveByUserId()**
   - Uses VIEW to find active pairings
   - Returns `shared_room_id` for room lookup

2. **PostgresPairingRepository.findPendingByInitiator()**
   - Uses VIEW to find pending pairings
   - Includes `is_expired` check from VIEW

3. **pairingValidator.getPairingStatus()**
   - Uses VIEW for all pairing status queries
   - Returns consistent format with `sharedRoomId`

4. **connectionOperations.getExistingUserRoom()**
   - Uses `pairingManager.getActivePairing()` (which uses VIEW)
   - Falls back to `roomManager.getUserRoom()` if no pairing

5. **roomService.checkRoomMembers()**
   - Uses `pairingManager.getActivePairing()` (which uses VIEW)
   - Falls back to direct room lookup if no pairing

6. **find-room-by-users.js**
   - Uses VIEW directly for pairing-based room lookup
   - Falls back to `room_members` for non-paired rooms

## Benefits

1. **Consistency**: All code uses the same VIEW for pairing state
2. **Reliability**: VIEW handles edge cases (expired pairings, status changes)
3. **Maintainability**: Single source of truth for pairing state
4. **Performance**: VIEW is indexed and optimized

## Migration Notes

- Old code that queried `pairing_sessions` directly still works but should be updated
- The VIEW filters to only 'pending' and 'active' statuses automatically
- The VIEW includes `is_expired` flag for convenience
- All methods maintain backward compatibility in return format

