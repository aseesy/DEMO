# Chat History Troubleshooting Guide

## Why Users Might Not See Their Chat History

Based on code analysis, here are the potential reasons why a user might not be able to see their chat history:

### 1. **Missing Room Membership Check** ⚠️ CRITICAL

**Location**: `chat-server/routes/messages.js:19-45`

**Issue**: The REST API endpoint `/api/messages/room/:roomId` does NOT verify room membership before returning messages. It only checks authentication.

**Impact**:

- Users might see empty results if they're not a member of the room
- No clear error message indicating they're not authorized
- Could return messages from rooms they shouldn't have access to (security issue)

**Current Behavior**:

```javascript
router.get(
  '/room/:roomId',
  verifyAuth,
  asyncHandler(async (req, res) => {
    // Only checks authentication, NOT room membership
    const result = await messageService.getRoomMessages(roomId, options, userEmail);
    res.json({ success: true, data: result });
  })
);
```

**Recommendation**: Add room membership verification before returning messages.

---

### 2. **Invalid or Missing Room ID**

**Location**: Multiple files

**Issue**: If `roomId` is null, undefined, or empty, the query will fail or return no results.

**Check**:

- Verify `roomId` is set correctly in user session
- Check `userSessionService.getUserBySocketId()` returns correct `roomId`
- Verify room exists in database

**Error Handling**:

- `MessageService.getRoomMessages()` throws error if roomId is invalid
- But errors might be silently caught on client side

---

### 3. **Database Query Failures**

**Location**: `chat-server/src/repositories/postgres/MessageRepository.js`

**Issue**: Database queries might fail silently or return empty results.

**Potential Causes**:

- Database connection issues
- Missing database indexes
- Corrupted data
- Room doesn't exist in database

**Check Server Logs For**:

- `[getMessageHistory] Database query error`
- `[RoomService.joinSocketRoom] MessageService failed`
- `[RoomService.joinSocketRoom] Fallback getMessageHistory also failed`

---

### 4. **Message Filtering**

**Location**: `chat-server/socketHandlers/connectionOperations/messageHistory.js:131-133`

**Issue**: System messages are filtered out, which might make history appear empty.

**Filtered Messages**:

- `type = 'system'`
- Messages containing "joined the chat"
- Messages containing "left the chat"

**Impact**: If all messages in a room are system messages, history will appear empty.

---

### 5. **Client-Side Error Handling**

**Location**: `chat-client-vite/src/hooks/messages/useMessageHistory.js:46-48`

**Issue**: Errors are caught but might not be displayed to the user.

**Current Behavior**:

```javascript
catch (err) {
  console.error('[useMessageHistory] Error loading messages:', err);
  setError(err.message || 'Failed to load messages');
  // Error is set but might not be displayed in UI
}
```

**Check**:

- Verify error state is displayed in UI
- Check browser console for error messages
- Verify error messages are user-friendly

---

### 6. **Socket Connection Issues**

**Location**: `chat-server/src/services/room/roomService.js:392-527`

**Issue**: Message history is loaded via socket when joining a room. If socket connection fails, history won't load.

**Fallback Mechanism**:

- Primary: `MessageService.getRoomMessages()`
- Fallback: `getMessageHistory()` (old method)
- If both fail, returns error but might not be visible to user

**Check**:

- Verify socket connection is established
- Check for socket errors in browser console
- Verify `join_room` event is successful

---

### 7. **Authentication Issues**

**Location**: `chat-server/routes/messages.js:21`

**Issue**: If authentication fails, user won't be able to load messages.

**Check**:

- Verify JWT token is valid and not expired
- Check `verifyAuth` middleware is working
- Verify user email is correctly extracted from token

---

### 8. **Empty Room (No Messages)**

**Issue**: Room exists but has no messages yet.

**Check**:

- Verify messages exist in database for the room
- Check `total` count in API response
- Verify messages weren't deleted or filtered out

---

## Diagnostic Steps

### 1. Check Server Logs

Look for these log messages:

```
[getMessageHistory] Loading messages for room: <roomId>
[getMessageHistory] Total user messages in room: <count>
[getMessageHistory] Retrieved <count> messages from database
[RoomService.joinSocketRoom] MessageService failed: <error>
```

### 2. Check Browser Console

Look for:

- `[useMessageHistory] Error loading messages:`
- `[apiClient]` errors
- Network request failures (404, 403, 500)

### 3. Verify Room Membership

```sql
SELECT * FROM room_members WHERE room_id = '<roomId>' AND user_id = '<userId>';
```

### 4. Verify Messages Exist

```sql
SELECT COUNT(*) FROM messages WHERE room_id = '<roomId>' AND type != 'system';
```

### 5. Check API Response

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/messages/room/<roomId>
```

Expected response:

```json
{
  "success": true,
  "data": {
    "messages": [...],
    "total": <count>,
    "hasMore": false,
    "limit": 50,
    "offset": 0
  }
}
```

---

## Recommended Fixes

### 1. Add Room Membership Check to REST API ✅ IMPLEMENTED

```javascript
router.get(
  '/room/:roomId',
  verifyAuth,
  asyncHandler(async (req, res) => {
    const { roomId } = req.params;
    const userId = req.user.id || req.user.userId;

    // Verify room membership
    const isMember = await verifyRoomMembership(userId, roomId, dbSafe);
    if (!isMember) {
      return res.status(403).json({
        success: false,
        error: 'You are not a member of this room',
        code: 'ROOM_ACCESS_DENIED',
      });
    }

    // Continue with message loading...
  })
);
```

**Status**: ✅ **FIXED** - Room membership verification has been added to `/api/messages/room/:roomId` endpoint.

### 2. Improve Error Messages

- Return clear error messages when room membership check fails
- Return clear error messages when no messages are found
- Distinguish between "no messages" and "access denied"

### 3. Add Client-Side Error Display

- Display error messages in UI when message loading fails
- Show loading states while fetching
- Provide retry mechanism

### 4. Add Logging

- Log room membership checks
- Log message query results
- Log client-side errors with context

---

## Quick Checklist

- [ ] User is authenticated (JWT token valid)
- [ ] User is a member of the room (check `room_members` table)
- [ ] Room ID is valid and exists
- [ ] Messages exist in database for the room
- [ ] Socket connection is established (for socket-based loading)
- [ ] No database connection errors
- [ ] Client-side error handling is working
- [ ] Error messages are displayed to user
