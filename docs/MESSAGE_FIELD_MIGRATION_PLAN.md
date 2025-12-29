# Message Field Naming Migration Plan (Revised)

**Date**: 2025-12-29  
**Status**: Ready for Implementation  
**Priority**: High - Reduces confusion and prevents bugs  
**Estimated Time**: 2-3 days

---

## 🎯 Goal

Standardize message object structure using **sender/receiver objects** instead of flat fields:

- Remove confusing flat fields (`username`, `email`, `user_email`, `displayName`)
- Use structured `sender` and `receiver` objects with clear user information
- Make it obvious "who is talking to who about who and what"

---

## 📋 Current vs. Target Structure

### **Current (Confusing):**

```javascript
{
  id: messageId,
  type: 'user',
  username: userEmail,        // ❌ MISLEADING: Contains email!
  user_email: userEmail,       // ✅ Correct but inconsistent
  email: userEmail,            // ❌ Redundant duplicate
  displayName: displayName,    // ⚠️ Inconsistent casing
  text: cleanText,
  timestamp: timestamp,
  roomId: roomId,
}
```

### **Target (Clear & Structured):**

```javascript
{
  id: messageId,
  type: 'user',
  sender: {                    // ✅ Clear: who sent the message
    first_name: "Athena",
    last_name: "Sees",
    email: "athenasees@gmail.com",
    uuid: "550e8400-e29b-41d4-a716-446655440000"  // For privacy
  },
  receiver: {                  // ✅ Clear: who receives the message
    first_name: "John",
    last_name: "Doe",
    email: "john@example.com",
    uuid: "660e8400-e29b-41d4-a716-446655440001"
  },
  text: cleanText,
  timestamp: timestamp,
  roomId: roomId,
}
```

**Benefits:**

- ✅ Immediately clear who is talking to who
- ✅ All user info in one place
- ✅ Easy to extend (add more user fields later)
- ✅ Privacy-friendly (can use UUID instead of email when needed)
- ✅ Matches existing AI mediation context structure

**Note**: Keep `user_email` in database schema (don't change database column names).

---

## 🔄 Migration Strategy

### **Phase 1: Add New Structure (Backward Compatible)**

Add `sender` and `receiver` objects alongside old fields:

- ✅ No breaking changes
- ✅ Allows gradual migration
- ✅ Easy rollback

### **Phase 2: Update All Code**

Update all code to use new structure:

- ✅ Frontend components
- ✅ Backend handlers
- ✅ Database queries
- ✅ Tests

### **Phase 3: Remove Old Fields**

After all code uses new structure:

- ✅ Remove `username` field
- ✅ Remove `email` field
- ✅ Remove `displayName` field
- ✅ Keep `user_email` in database (column name)

---

## 📁 Files to Update

### **Backend Files (15 files)**

1. **Core Message Creation:**
   - `chat-server/socketHandlers/messageOperations.js` ⭐ **CRITICAL**
   - `chat-server/socketHandlers/messageHandler.js`
   - `chat-server/messageStore.js`

2. **Message History & Loading:**
   - `chat-server/socketHandlers/connectionOperations.js`
   - `chat-server/socketHandlers/navigationHandler.js`

3. **AI & Mediation:**
   - `chat-server/socketHandlers/aiHelper.js`
   - `chat-server/socketHandlers/aiActionHelper.js`
   - `chat-server/src/core/engine/mediator.js`
   - `chat-server/src/core/engine/contextBuilders/index.js`

4. **Services:**
   - `chat-server/services/pushNotificationService.js`
   - `chat-server/services/autoThreading.js`
   - `chat-server/src/services/threads/threadAnalysis.js`
   - `chat-server/src/services/threads/analyzers/AIThreadAnalyzer.js`

5. **Other:**
   - `chat-server/socketHandlers/contactHandler.js`
   - `chat-server/socketHandlers/threadHandler.js`

### **Frontend Files (8 files)**

1. **Notifications:**
   - `chat-client-vite/src/features/notifications/model/useNotifications.js` ⭐ **CRITICAL**
   - `chat-client-vite/src/features/chat/model/useNewMessageHandler.js`
   - `chat-client-vite/src/ChatRoom.jsx`

2. **Message Handling:**
   - `chat-client-vite/src/features/chat/handlers/messageHandlers.js`
   - `chat-client-vite/src/features/chat/model/useMessageHandlers.js`
   - `chat-client-vite/src/features/chat/model/messageUtils.js`

3. **Utilities:**
   - `chat-client-vite/src/utils/messageBuilder.js`
   - `chat-client-vite/src/utils/messageBuilder.test.js`

---

## 📝 Step-by-Step Implementation

### **Step 1: Create Helper Function to Build User Object**

**File**: `chat-server/socketHandlers/utils.js` (or new file)

```javascript
/**
 * Build a user object for sender/receiver
 * @param {Object} userData - User data from database or session
 * @returns {Object} User object with first_name, last_name, email, uuid
 */
function buildUserObject(userData) {
  return {
    first_name: userData.first_name || null,
    last_name: userData.last_name || null,
    email: userData.email || userData.user_email || userData.username || null,
    uuid: userData.uuid || userData.id || null, // Use user ID as UUID for now
  };
}

/**
 * Get display name from user object
 * @param {Object} user - User object
 * @returns {string} Display name (first_name + last_name, or first_name, or email)
 */
function getUserDisplayName(user) {
  if (user.first_name && user.last_name) {
    return `${user.first_name} ${user.last_name}`;
  }
  return user.first_name || user.email || 'Co-parent';
}
```

### **Step 2: Update Core Message Creation**

**File**: `chat-server/socketHandlers/messageOperations.js`

**Before:**

```javascript
function createUserMessage(socketId, user, cleanText, displayName, optimisticId = null) {
  const userEmail = user.email || user.username;
  const message = {
    id: `${Date.now()}-${socketId}`,
    type: 'user',
    username: userEmail,
    user_email: userEmail,
    email: userEmail,
    displayName,
    text: cleanText,
    timestamp: new Date().toISOString(),
    socketId,
    roomId: user.roomId,
  };
  return message;
}
```

**After:**

```javascript
const { buildUserObject, getUserDisplayName } = require('./utils');

async function createUserMessage(
  socketId,
  user,
  cleanText,
  displayName,
  optimisticId = null,
  dbSafe = null
) {
  const userEmail = user.email || user.username;

  // Build sender object
  const senderData = {
    email: userEmail,
    first_name: user.first_name || null,
    last_name: user.last_name || null,
    uuid: user.uuid || user.id || null,
  };
  const sender = buildUserObject(senderData);

  // Get receiver (other participant in room)
  let receiver = null;
  if (dbSafe && user.roomId) {
    try {
      // Get other participants in room
      const roomMembers = await getRoomParticipants(user.roomId, dbSafe);
      const otherParticipant = roomMembers.find(m => m.email !== userEmail);
      if (otherParticipant) {
        receiver = buildUserObject(otherParticipant);
      }
    } catch (err) {
      console.warn('[createUserMessage] Could not get receiver:', err.message);
    }
  }

  const message = {
    id: `${Date.now()}-${socketId}`,
    type: 'user',

    // ✅ NEW STRUCTURE (primary)
    sender,
    receiver, // May be null for group chats

    // ⚠️ LEGACY FIELDS (deprecated - will remove in Phase 3)
    username: userEmail, // Deprecated: use sender.email
    user_email: userEmail, // Keep for database column
    email: userEmail, // Deprecated: use sender.email
    displayName, // Deprecated: use getUserDisplayName(sender)

    // Core fields
    text: cleanText,
    timestamp: new Date().toISOString(),
    socketId,
    roomId: user.roomId,
  };

  if (optimisticId) {
    message.optimisticId = optimisticId;
  }

  return message;
}
```

### **Step 3: Update Message History Loading**

**File**: `chat-server/socketHandlers/connectionOperations.js`

**Before:**

```javascript
const message = {
  id: msg.id,
  type: msg.type || 'user_message',
  username: msg.user_email || msg.email || msg.username,
  user_email: msg.user_email || msg.email || msg.username,
  displayName: displayName,
  // ...
};
```

**After:**

```javascript
const { buildUserObject, getUserDisplayName } = require('./messageOperations');

// In getMessageHistory function:
const messages = result.rows.reverse().map(msg => {
  // Build sender object from message data
  const senderData = {
    email: msg.user_email || msg.email || msg.username,
    first_name: msg.first_name || null,
    last_name: msg.last_name || null,
    uuid: msg.user_id || null, // Use user_id as UUID
  };
  const sender = buildUserObject(senderData);

  // Try to get receiver from room participants
  let receiver = null;
  // (Get receiver logic here - may need to query room members)

  const message = {
    id: msg.id,
    type: msg.type || 'user_message',

    // ✅ NEW STRUCTURE
    sender,
    receiver,

    // ⚠️ LEGACY FIELDS
    username: msg.user_email || msg.email || msg.username,
    user_email: msg.user_email || msg.email || msg.username,
    email: msg.user_email || msg.email || msg.username,
    displayName: getUserDisplayName(sender),

    // Core fields
    text: msg.text,
    timestamp: msg.timestamp || msg.created_at,
    // ...
  };

  return message;
});
```

### **Step 4: Update Frontend Notifications**

**File**: `chat-client-vite/src/features/notifications/model/useNotifications.js`

**Before:**

```javascript
if (message.username?.toLowerCase() === username?.toLowerCase()) {
  return; // Don't notify for own messages
}

const notification = new Notification('New message from ' + message.username, notificationOptions);
```

**After:**

```javascript
// Use new structure, fallback to old for backward compatibility
const senderEmail =
  message.sender?.email || message.user_email || message.email || message.username;
if (senderEmail?.toLowerCase() === currentUserEmail?.toLowerCase()) {
  return; // Don't notify for own messages
}

// Get sender name from new structure
const senderName = message.sender
  ? message.sender.first_name && message.sender.last_name
    ? `${message.sender.first_name} ${message.sender.last_name}`
    : message.sender.first_name || message.sender.email || 'Co-parent'
  : message.displayName || message.username || 'Co-parent';

const notification = new Notification('New message from ' + senderName, notificationOptions);
```

### **Step 5: Update Message Display Components**

**File**: `chat-client-vite/src/features/chat/components/MessageBubble.jsx` (or wherever messages are displayed)

**Before:**

```javascript
<div className="message-sender">{message.displayName || message.username}</div>
```

**After:**

```javascript
// Helper function
function getSenderDisplayName(message) {
  if (message.sender) {
    if (message.sender.first_name && message.sender.last_name) {
      return `${message.sender.first_name} ${message.sender.last_name}`;
    }
    return message.sender.first_name || message.sender.email || 'Co-parent';
  }
  // Fallback to old structure
  return message.displayName || message.username || 'Co-parent';
}

<div className="message-sender">{getSenderDisplayName(message)}</div>;
```

---

## ✅ Testing Strategy

### **Unit Tests**

Update all message-related tests:

- `chat-client-vite/src/utils/messageBuilder.test.js`
- Test `buildUserObject()` function
- Test `getUserDisplayName()` function
- Test message creation with sender/receiver objects

### **Integration Tests**

Test scenarios:

1. ✅ Send message - verify sender object is present
2. ✅ Receive message - verify sender object is readable
3. ✅ Message history - verify old messages work with new code
4. ✅ Notifications - verify sender name displays correctly (first name, not email)
5. ✅ Message editing - verify ownership checks work
6. ✅ Message reactions - verify user identification works
7. ✅ Group chats - verify receiver is null or contains multiple participants

### **Manual Testing Checklist**

- [ ] Send a message - verify sender object is created correctly
- [ ] Receive a message - verify notification shows first name
- [ ] View message history - verify all messages display correctly
- [ ] Edit a message - verify it works
- [ ] Delete a message - verify it works
- [ ] React to a message - verify it works
- [ ] Check notifications - verify sender name (not email) shows
- [ ] Test in 1:1 chat - verify receiver is populated
- [ ] Test in group chat - verify receiver handling

---

## 🔄 Rollback Plan

If issues arise:

1. **Immediate Rollback**: Revert commits, old fields still work
2. **Partial Rollback**: Keep new structure but use old fields in critical paths
3. **Database**: No database changes needed (using `user_email` column)

---

## 📊 Progress Tracking

### **Phase 1: Add New Structure**

- [ ] Create `buildUserObject()` helper function
- [ ] Create `getUserDisplayName()` helper function
- [ ] Update `createUserMessage()` to include sender/receiver objects
- [ ] Update `getMessageHistory()` to include sender/receiver objects
- [ ] Test: Verify new structure is present in messages

### **Phase 2: Update Frontend**

- [ ] Update notification handlers to use sender object
- [ ] Update message display components to use sender object
- [ ] Update message utilities to use sender/receiver objects
- [ ] Update message builders to use sender/receiver objects
- [ ] Test: Verify notifications show first name

### **Phase 3: Update Backend**

- [ ] Update AI handlers to use sender/receiver objects
- [ ] Update push notification service to use sender object
- [ ] Update thread handlers to use sender/receiver objects
- [ ] Update contact handlers to use sender/receiver objects
- [ ] Test: Verify all handlers work

### **Phase 4: Remove Old Fields**

- [x] Remove `username` field from message creation
- [x] Remove `email` field from message creation
- [x] Remove `displayName` field (use `getUserDisplayName(sender)` only)
- [x] Update all code to remove fallbacks
- [ ] Test: Full regression test

### **Phase 5: Final Cleanup (COMPLETE)**

- [x] Remove legacy fields from `messageOperations.js` (createUserMessage, createEditedMessage)
- [x] Remove legacy fields from `connectionOperations.js` (getMessageHistory)
- [x] Remove legacy fields from `threadMessages.js`
- [x] Remove legacy fields from `PostgresThreadRepository.js`
- [x] Keep `user_email` field for database column mapping
- [x] Remove unused `displayName` variable
- [x] Add missing `buildUserObject` import

---

## 🚨 Risk Assessment

### **Low Risk**

- Adding new structure (backward compatible)
- Frontend changes (can test independently)

### **Medium Risk**

- Updating message creation (core functionality)
- Updating message history loading (affects all messages)
- Getting receiver information (may need additional queries)

### **High Risk**

- Removing old fields (breaking change)
- Database queries (if we change column names - we won't)

---

## 💡 Best Practices

1. **One file at a time**: Update and test each file before moving to next
2. **Keep old fields**: Don't remove until all code is migrated
3. **Add deprecation comments**: Mark old fields clearly
4. **Test thoroughly**: Each phase should be fully tested
5. **Document changes**: Update JSDoc comments
6. **Use helper functions**: `buildUserObject()` and `getUserDisplayName()` for consistency

---

## 🎯 Success Criteria

Migration is complete when:

1. ✅ All new messages include `sender` and `receiver` objects
2. ✅ All code uses new structure (with fallback to old)
3. ✅ All tests pass
4. ✅ Notifications show first name (not email)
5. ✅ No breaking changes for existing functionality
6. ✅ Old fields removed (Phase 4 complete)
7. ✅ Clear "who is talking to who" in every message

---

## 📅 Timeline Estimate

- **Phase 1** (Add new structure): 6-8 hours
- **Phase 2** (Update frontend): 6-8 hours
- **Phase 3** (Update backend): 8-10 hours
- **Phase 4** (Remove old fields): 2-4 hours
- **Testing**: 4-6 hours

**Total**: 2-3 days

---

## 🚀 Ready to Start?

Begin with **Phase 1, Step 1**: Create helper functions in `chat-server/socketHandlers/utils.js`
