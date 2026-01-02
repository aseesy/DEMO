# Core User Flow Contracts & Smoke Tests

This document defines contracts and smoke tests for the 10 core user flows that must always work.

## Test Status Summary

| Flow                            | Contract Status | Smoke Test Status | Existing Tests                                                               |
| ------------------------------- | --------------- | ----------------- | ---------------------------------------------------------------------------- |
| 1. Authentication & Connection  | ✅ Complete     | ⚠️ Partial        | `socket.integration.test.js` (Connection tests)                              |
| 2. Join Room & Load History     | ✅ Complete     | ❌ Missing        | None found                                                                   |
| 3. Send Message                 | ✅ Complete     | ⚠️ Partial        | `socket.integration.test.js` ("should send and receive messages")            |
| 4. Receive Messages             | ✅ Complete     | ⚠️ Partial        | `socket.integration.test.js` (part of send/receive test)                     |
| 5. Reconnection & Offline Queue | ✅ Complete     | ⚠️ Partial        | `socket.integration.test.js` (Reconnection), `useChatSocket.network.test.js` |
| 6. Pagination                   | ✅ Complete     | ❌ Missing        | None found                                                                   |
| 7. AI Mediation                 | ✅ Complete     | ❌ Missing        | Unit tests exist, but no integration smoke test                              |
| 8. Room/Pairing                 | ✅ Complete     | ❌ Missing        | Some unit tests, no full flow test                                           |
| 9. Typing Indicators            | ✅ Complete     | ❌ Missing        | None found                                                                   |
| 10. Error Handling              | ✅ Complete     | ⚠️ Partial        | Multiple error tests, but no consolidated smoke test                         |

**Legend**:

- ✅ Complete: Contract fully defined
- ⚠️ Partial: Some tests exist but need consolidation/expansion
- ❌ Missing: No smoke test exists

---

## Flow 1: User Authentication & Socket Connection

### Contract

**Entry Conditions**:

- ✅ User has valid email/password OR valid Gmail session
- ✅ Server is running and accessible
- ✅ Network connectivity available
- ✅ Browser supports WebSocket (or polling fallback)

**Events/Actions**:

1. User submits login form (email/password or Gmail OAuth)
2. Server validates credentials and returns JWT token
3. Client stores token securely (localStorage/indexedDB)
4. Client creates SocketService instance
5. SocketService connects to server with auth token in query params
6. Server validates token on connection
7. Socket 'connect' event fires
8. Client updates connection state to 'connected'

**State Transitions**:

- **Client**: `isAuthenticated: false → true`
- **Client**: `connectionState: 'disconnected' → 'connecting' → 'connected'`
- **Client**: `socketService.socket: null → Socket instance`
- **Client**: `socketService.connectionState: 'disconnected' → 'connecting' → 'connected'`
- **Server**: Socket authenticated and registered in session manager

**Exit Conditions**:

- ✅ `socketService.isConnected() === true`
- ✅ `socketService.getConnectionState() === 'connected'`
- ✅ `socketService.getSocketId()` returns non-null socket ID
- ✅ Socket can emit events (connection is functional)

**Instrumentation Points**:

- `[SocketService] 🔌 Connecting to: {url}` - Connection attempt
- `[SocketService] ✅ Connected: {socketId}` - Connection success
- `[useSocketConnection] Effect running` - Hook execution
- Connection latency (time from connect() to 'connect' event)
- Connection success/failure rate
- Token validation errors

### Smoke Test

**Status**: ⚠️ **PARTIALLY EXISTS** - See `chat-server/__tests__/socket.integration.test.js` (Connection tests)

**File**: `chat-server/__tests__/core-flows/01-authentication-connection.smoke.test.js` (NEW - Consolidate existing)

```javascript
describe('Smoke Test: Authentication & Socket Connection', () => {
  it('should connect socket after authentication', async () => {
    // Entry: User has valid credentials
    const { email, password } = testUser;

    // Action 1: Authenticate
    const authResponse = await apiClient.post('/api/auth/login', { email, password });
    expect(authResponse.token).toBeDefined();

    // Action 2: Connect socket with token
    const socket = createAuthenticatedClient(authResponse.token);

    // Exit: Connection successful
    await new Promise((resolve, reject) => {
      socket.on('connect', () => {
        expect(socket.connected).toBe(true);
        expect(socket.id).toBeDefined();
        socket.disconnect();
        resolve();
      });
      socket.on('connect_error', reject);
      setTimeout(() => reject(new Error('Connection timeout')), 10000);
    });
  });
});
```

---

## Flow 2: Join Chat Room & Load Message History

### Contract

**Entry Conditions**:

- ✅ User is authenticated (`isAuthenticated === true`)
- ✅ User has valid auth token
- ✅ Socket is connected (`socketService.isConnected() === true`)
- ✅ User is viewing chat view (`currentView === 'chat'`)
- ✅ User has an existing room (roomId exists in database)

**Events/Actions**:

1. Auto-join effect triggers (conditions met)
2. Client emits 'join' event with user email
3. Server validates user and resolves room
4. Server joins socket to room
5. Server emits 'joined' event with roomId and message history
6. Client receives 'joined' event
7. Client updates state: `isJoined: true`, `roomId: <roomId>`, `messages: <history>`

**State Transitions**:

- **Client**: `isJoined: false → true`
- **Client**: `roomId: null → <roomId>`
- **Client**: `messages: [] → <message array>`
- **Client**: `isInitialLoad: true → false`
- **Server**: Socket added to room (`socket.join(roomId)`)

**Exit Conditions**:

- ✅ `isJoined === true`
- ✅ `roomId` is valid string (not null/undefined)
- ✅ `messages.length > 0` (if room has messages)
- ✅ Messages are in chronological order (oldest first)
- ✅ Socket is in room on server

**Instrumentation Points**:

- `[useChatSocket] 📤 Emitting join: {email}` - Join attempt
- `[join] Received join event` - Server received join
- `[join] Resolved existing room: {roomId}` - Room resolution
- `[useChatSocket] Joined room: {data}` - Join success
- Join latency (time from emit to 'joined' event)
- Message history load time
- Room resolution time

### Smoke Test

**File**: `chat-server/__tests__/core-flows/02-join-room-history.smoke.test.js`

```javascript
describe('Smoke Test: Join Room & Load Message History', () => {
  it('should join room and receive message history', async () => {
    // Entry: Authenticated user with existing room
    const { socket, userId, roomId } = await createAuthenticatedUserWithRoom();

    // Action: Trigger join (simulate auto-join)
    socket.emit('join', { email: testUser.email });

    // Exit: Receive joined event with history
    const joinedData = await new Promise((resolve, reject) => {
      socket.on('joined', resolve);
      socket.on('error', reject);
      setTimeout(() => reject(new Error('Join timeout')), 10000);
    });

    expect(joinedData.roomId).toBe(roomId);
    expect(Array.isArray(joinedData.messages)).toBe(true);
    expect(joinedData.messages.length).toBeGreaterThan(0);

    // Verify socket is in room on server
    const room = await getRoomMembers(roomId);
    expect(room).toContain(userId);

    socket.disconnect();
  });
});
```

---

## Flow 3: Send Message

### Contract

**Entry Conditions**:

- ✅ User is authenticated and joined room
- ✅ Socket is connected (`socket.connected === true`)
- ✅ User is in room (`isJoined === true`)
- ✅ User has roomId
- ✅ Message text is non-empty string

**Events/Actions**:

1. User types message and submits
2. Client creates optimistic message (shows immediately in UI)
3. Client sets message status to 'pending'
4. Client emits 'send_message' event with text
5. Server receives 'send_message' event
6. Server validates message and user
7. Server saves message to database
8. Server broadcasts 'new_message' to room
9. Client receives 'new_message' event (confirms sent message)
10. Client updates message status to 'sent'
11. Client removes optimistic message, shows confirmed message

**State Transitions**:

- **Client**: `pendingMessages: [] → [optimistic] → []` (after confirmation)
- **Client**: `messages: [...] → [...confirmed]`
- **Client**: `messageStatuses: {} → {tempId: 'pending'} → {tempId: 'sent'}`
- **Server**: Message record inserted into database
- **Server**: Message broadcast to room participants

**Exit Conditions**:

- ✅ Message appears in `messages` array with server-generated ID
- ✅ Message status is 'sent' (not 'pending' or 'error')
- ✅ Optimistic message removed
- ✅ Message saved in database
- ✅ Message broadcast to room (other users receive it)

**Instrumentation Points**:

- `[send_message] Emitting message` - Message send attempt
- `[messageHandler] Received send_message` - Server received
- `[saveMessage] Saving message to database` - Database save
- `[new_message] Broadcasting to room` - Broadcast
- `[messageHandlers] Received new_message` - Client received
- Message send latency (time from emit to confirmation)
- Message send success/failure rate

### Smoke Test

**File**: `chat-server/__tests__/core-flows/03-send-message.smoke.test.js`

```javascript
describe('Smoke Test: Send Message', () => {
  it('should send message and receive confirmation', async () => {
    // Entry: Connected user in room
    const { socket, roomId } = await createAuthenticatedUserInRoom();

    // Action: Send message
    const messageText = 'Test message ' + Date.now();
    socket.emit('send_message', { text: messageText });

    // Exit: Receive confirmation
    const newMessage = await new Promise((resolve, reject) => {
      socket.on('new_message', resolve);
      socket.on('message_error', reject);
      setTimeout(() => reject(new Error('Send timeout')), 10000);
    });

    expect(newMessage.text).toBe(messageText);
    expect(newMessage.id).toBeDefined();
    expect(newMessage.timestamp).toBeDefined();

    // Verify message in database
    const dbMessage = await getMessageById(newMessage.id);
    expect(dbMessage.text).toBe(messageText);
    expect(dbMessage.room_id).toBe(roomId);

    socket.disconnect();
  });
});
```

---

## Flow 4: Receive Real-Time Messages

### Contract

**Entry Conditions**:

- ✅ User is authenticated and joined room
- ✅ Socket is connected and in room
- ✅ Another user sends message to same room
- ✅ Client is subscribed to 'new_message' events

**Events/Actions**:

1. Co-parent sends message (Flow 3)
2. Server broadcasts 'new_message' to room
3. Client receives 'new_message' event
4. Client adds message to messages array
5. Client updates UI (message appears in chat)
6. Client auto-scrolls if user is at bottom
7. Client updates unread count if not viewing chat

**State Transitions**:

- **Client**: `messages: [...] → [...newMessage]`
- **Client**: `unreadCount: N → N+1` (if `currentView !== 'chat'`)
- **UI**: New message element rendered
- **UI**: Scroll position updates (if at bottom)

**Exit Conditions**:

- ✅ Message appears in `messages` array
- ✅ Message displays in UI with correct sender info
- ✅ Message timestamp displays correctly
- ✅ Auto-scroll occurs (if conditions met)
- ✅ Unread count increments (if not viewing chat)

**Instrumentation Points**:

- `[messageHandlers] Received new_message` - Message received
- `[useChatSocket] New message received: {messageId}` - Handler triggered
- Message delivery latency (time from server broadcast to client receipt)
- UI render time for new message
- Auto-scroll execution

### Smoke Test

**File**: `chat-server/__tests__/core-flows/04-receive-message.smoke.test.js`

```javascript
describe('Smoke Test: Receive Real-Time Messages', () => {
  it('should receive message from co-parent in real-time', async () => {
    // Entry: Two users in same room
    const { socket1, socket2, roomId } = await createTwoUsersInRoom();

    // Action: User 1 sends, User 2 receives
    const messageText = 'Real-time test ' + Date.now();
    const receivedMessage = await new Promise((resolve, reject) => {
      socket2.on('new_message', resolve);
      socket1.emit('send_message', { text: messageText });
      setTimeout(() => reject(new Error('Receive timeout')), 10000);
    });

    // Exit: Message received correctly
    expect(receivedMessage.text).toBe(messageText);
    expect(receivedMessage.id).toBeDefined();

    socket1.disconnect();
    socket2.disconnect();
  });
});
```

---

## Flow 5: Network Reconnection & Offline Queue

### Contract

**Entry Conditions**:

- ✅ User is authenticated and connected
- ✅ User has pending messages (queued while offline)
- ✅ Network connection is restored

**Events/Actions**:

1. Network connection lost (simulated or real)
2. Socket emits 'disconnect' event
3. Client updates connection state to 'disconnected'
4. Client queues messages locally (localStorage/state)
5. Socket.io attempts reconnection (automatic)
6. Network connection restored
7. Socket reconnects
8. Socket emits 'connect' event
9. Client processes offline queue (sends queued messages)
10. Client updates connection state to 'connected'

**State Transitions**:

- **Client**: `connectionState: 'connected' → 'disconnected' → 'connecting' → 'connected'`
- **Client**: `offlineQueue: [] → [queued messages] → []` (after sending)
- **Client**: `messageStatuses: {...pending...} → {...sent...}`

**Exit Conditions**:

- ✅ Connection state returns to 'connected'
- ✅ All queued messages sent successfully
- ✅ Message statuses updated to 'sent'
- ✅ Offline queue is empty
- ✅ No duplicate messages

**Instrumentation Points**:

- `[SocketService] ❌ Disconnected: {reason}` - Disconnection
- `[SocketService] 🔄 Reconnection attempt: {attempt}` - Reconnection
- `[SocketService] ✅ Reconnected` - Reconnection success
- `[connectionHandlers] Processing offline queue` - Queue processing
- Reconnection latency
- Messages lost during disconnection
- Queue processing time

### Smoke Test

**Status**: ⚠️ **PARTIALLY EXISTS** - See `chat-server/__tests__/socket.integration.test.js` (Reconnection tests) and `chat-client-vite/src/features/chat/model/useChatSocket.network.test.js`

**File**: `chat-server/__tests__/core-flows/05-reconnection-offline-queue.smoke.test.js` (NEW - Consolidate existing)

```javascript
describe('Smoke Test: Network Reconnection & Offline Queue', () => {
  it('should reconnect and send queued messages', async () => {
    // Entry: Connected user
    const { socket } = await createAuthenticatedUser();
    await waitForConnection(socket);

    // Action 1: Disconnect
    socket.disconnect();
    await waitForDisconnection(socket);

    // Queue message while offline (simulate)
    const queuedMessage = { text: 'Queued message', id: 'temp-1' };
    // In real app, this would be stored in offlineQueue

    // Action 2: Reconnect
    socket.connect();
    const reconnectEvent = await new Promise((resolve, reject) => {
      socket.on('connect', resolve);
      setTimeout(() => reject(new Error('Reconnect timeout')), 10000);
    });

    // Exit: Socket reconnected
    expect(socket.connected).toBe(true);
    // Note: Full queue test requires client-side test (localStorage)

    socket.disconnect();
  });
});
```

---

## Flow 6: View Message History (Pagination)

### Contract

**Entry Conditions**:

- ✅ User is authenticated and joined room
- ✅ Room has messages (more than initial load limit)
- ✅ User scrolls to top of message list

**Events/Actions**:

1. User scrolls to top (triggers load older)
2. Client emits 'load_older' event with current offset
3. Server queries database for older messages
4. Server emits 'older_messages' event with messages
5. Client receives 'older_messages' event
6. Client prepends messages to messages array
7. Client maintains scroll position (doesn't jump)

**State Transitions**:

- **Client**: `isLoadingOlder: false → true → false`
- **Client**: `messages: [recent...] → [older...recent...]`
- **Client**: `hasMoreMessages: true → false` (if no more)
- **UI**: Scroll position maintained

**Exit Conditions**:

- ✅ Older messages appear above current messages
- ✅ Scroll position maintained (no jump to top)
- ✅ Loading indicator shows/hides correctly
- ✅ `hasMoreMessages` updates correctly

**Instrumentation Points**:

- `[useMessagePagination] Loading older messages` - Load attempt
- `[paginationHandlers] Received older_messages` - Messages received
- Pagination query time
- Message prepend time
- Scroll position accuracy

### Smoke Test

**File**: `chat-server/__tests__/core-flows/06-pagination.smoke.test.js`

```javascript
describe('Smoke Test: Message History Pagination', () => {
  it('should load older messages on request', async () => {
    // Entry: Room with many messages
    const { socket, roomId } = await createRoomWithManyMessages(100);

    // Action: Request older messages
    socket.emit('load_older', { offset: 50 });

    // Exit: Receive older messages
    const olderMessages = await new Promise((resolve, reject) => {
      socket.on('older_messages', resolve);
      socket.on('error', reject);
      setTimeout(() => reject(new Error('Pagination timeout')), 10000);
    });

    expect(Array.isArray(olderMessages.messages)).toBe(true);
    expect(olderMessages.messages.length).toBeGreaterThan(0);

    socket.disconnect();
  });
});
```

---

## Flow 7: AI Message Mediation (Draft Coaching)

### Contract

**Entry Conditions**:

- ✅ User is authenticated and in room
- ✅ User types message in input field
- ✅ AI mediation service is available

**Events/Actions**:

1. User types message
2. Client sends message to AI for analysis (optional: on draft)
3. Server analyzes message via AI mediation
4. Server determines if message should be blocked
5. If blocked, server emits 'draft_coaching' event
6. Client receives 'draft_coaching' event
7. Client displays coaching UI (Observer card)
8. User can select rewrite, send original, or edit

**State Transitions**:

- **Client**: `draftCoaching: null → <coaching object>`
- **Client**: `inputMessage: <text> → <text>` (preserved)
- **UI**: Coaching card appears
- **UI**: Message send blocked (until user action)

**Exit Conditions**:

- ✅ Coaching UI appears if message is problematic
- ✅ User can select rewrite option
- ✅ User can send original message
- ✅ Coaching state clears after action

**Instrumentation Points**:

- `[draft_coaching] Received coaching` - Coaching received
- `[AI Mediation] Analyzing message` - Analysis start
- `[AI Mediation] Blocked: {reason}` - Message blocked
- AI analysis latency
- Coaching acceptance rate
- Rewrite selection rate

### Smoke Test

**File**: `chat-server/__tests__/core-flows/07-ai-mediation.smoke.test.js`

```javascript
describe('Smoke Test: AI Message Mediation', () => {
  it('should analyze message and send coaching if needed', async () => {
    // Entry: Connected user
    const { socket } = await createAuthenticatedUser();

    // Action: Send potentially problematic message
    const problematicMessage = 'This is a test message that should trigger coaching';
    socket.emit('send_message', { text: problematicMessage });

    // Exit: Receive coaching or message confirmation
    const result = await new Promise((resolve, reject) => {
      socket.on('draft_coaching', coaching => {
        resolve({ type: 'coaching', coaching });
      });
      socket.on('new_message', message => {
        resolve({ type: 'sent', message });
      });
      setTimeout(() => reject(new Error('Mediation timeout')), 15000);
    });

    // Either coaching or message sent (depending on AI analysis)
    expect(['coaching', 'sent']).toContain(result.type);

    socket.disconnect();
  });
});
```

---

## Flow 8: Room/Pairing Management

### Contract

**Entry Conditions**:

- ✅ User 1 is authenticated
- ✅ User 2 email is known (for invitation)

**Events/Actions**:

1. User 1 creates invitation for User 2
2. Server creates invitation record
3. Server sends invitation (email or in-app notification)
4. User 2 accepts invitation
5. Server creates room and adds both users
6. Server creates room_members records
7. Both users can join room
8. Room persists across sessions

**State Transitions**:

- **Server**: Invitation created (`status: 'pending'`)
- **Server**: Room created (`roomId: <uuid>`)
- **Server**: Both users added to room_members
- **Client**: `roomId: null → <roomId>` (after join)

**Exit Conditions**:

- ✅ Room exists in database
- ✅ Both users in room_members table
- ✅ Both users can join room
- ✅ Room ID persists (same room on subsequent joins)

**Instrumentation Points**:

- `[invitation] Created invitation` - Invitation created
- `[room] Created room: {roomId}` - Room created
- `[join] Resolved existing room: {roomId}` - Room resolution
- Invitation acceptance rate
- Room creation time

### Smoke Test

**File**: `chat-server/__tests__/core-flows/08-room-pairing.smoke.test.js`

```javascript
describe('Smoke Test: Room/Pairing Management', () => {
  it('should create room when users pair', async () => {
    // Entry: Two users
    const { user1, user2 } = await createTwoUsers();

    // Action: Create invitation and accept
    const invitation = await createInvitation(user1.id, user2.email);
    await acceptInvitation(invitation.token);

    // Exit: Room exists and both users can join
    const room = await getUserRoom(user1.id);
    expect(room).toBeDefined();
    expect(room.roomId).toBeDefined();

    const roomMembers = await getRoomMembers(room.roomId);
    expect(roomMembers).toHaveLength(2);
    expect(roomMembers.map(m => m.user_id)).toContain(user1.id);
    expect(roomMembers.map(m => m.user_id)).toContain(user2.id);
  });
});
```

---

## Flow 9: Typing Indicators

### Contract

**Entry Conditions**:

- ✅ User is authenticated and in room
- ✅ User is typing in message input

**Events/Actions**:

1. User types character in input
2. Client emits 'typing' event
3. Server receives 'typing' event
4. Server broadcasts 'user_typing' to room (except sender)
5. Co-parent receives 'user_typing' event
6. Client adds user to typingUsers set
7. UI displays "User is typing..."
8. After timeout (2s), client emits 'stop_typing'
9. Server broadcasts 'user_stopped_typing'
10. Client removes user from typingUsers set

**State Transitions**:

- **Client**: `typingUsers: Set() → Set([username]) → Set()`
- **UI**: Typing indicator appears/disappears

**Exit Conditions**:

- ✅ Typing indicator appears when co-parent types
- ✅ Indicator disappears after timeout
- ✅ No persistent indicators (stuck on screen)

**Instrumentation Points**:

- `[typingHandlers] Received typing event` - Typing detected
- `[typingHandlers] Typing timeout cleared` - Typing stopped
- Typing indicator display time
- Typing event frequency

### Smoke Test

**File**: `chat-server/__tests__/core-flows/09-typing-indicators.smoke.test.js`

```javascript
describe('Smoke Test: Typing Indicators', () => {
  it('should broadcast typing indicator to co-parent', async () => {
    // Entry: Two users in room
    const { socket1, socket2 } = await createTwoUsersInRoom();

    // Action: User 1 types
    const typingReceived = new Promise(resolve => {
      socket2.on('user_typing', resolve);
    });

    socket1.emit('typing', {});

    // Exit: User 2 receives typing event
    const typingData = await typingReceived;
    expect(typingData.username).toBeDefined();

    socket1.disconnect();
    socket2.disconnect();
  });
});
```

---

## Flow 10: Error Handling & User Feedback

### Contract

**Entry Conditions**:

- ✅ Error condition occurs (network, server, validation, etc.)

**Events/Actions**:

1. Error occurs (connection error, send failure, etc.)
2. Error is caught and handled
3. Error state is set in client
4. User-friendly error message displayed
5. Error logged for debugging
6. User can retry/continue (if applicable)
7. Error clears when condition resolves

**State Transitions**:

- **Client**: `error: '' → <error message> → ''` (when resolved)
- **UI**: Error message displays
- **UI**: Error clears on resolution

**Exit Conditions**:

- ✅ Error message displayed to user (user-friendly)
- ✅ Error doesn't crash application
- ✅ User can recover (retry/continue)
- ✅ Error clears when resolved

**Instrumentation Points**:

- `[errorHandlers] Error: {message}` - Error caught
- `[SocketService] ⚠️ Connection error: {error}` - Connection error
- Error type and frequency
- Error recovery time
- User actions after error

### Smoke Test

**Status**: ⚠️ **PARTIALLY EXISTS** - See `chat-client-vite/src/features/chat/model/useChatSocket.network.test.js` and `chat-server/__tests__/socket.integration.test.js` (Error handling)

**File**: `chat-server/__tests__/core-flows/10-error-handling.smoke.test.js` (NEW - Consolidate existing)

```javascript
describe('Smoke Test: Error Handling', () => {
  it('should handle connection errors gracefully', async () => {
    // Entry: Valid socket
    const { socket } = await createAuthenticatedUser();

    // Action: Disconnect (simulate error)
    socket.disconnect();

    // Exit: Error handled (no crash)
    await waitForDisconnection(socket);
    expect(socket.connected).toBe(false);

    // Should be able to reconnect
    socket.connect();
    await waitForConnection(socket);
    expect(socket.connected).toBe(true);

    socket.disconnect();
  });
});
```

---

## Test Organization

### Directory Structure

```
chat-server/__tests__/core-flows/
├── 01-authentication-connection.smoke.test.js
├── 02-join-room-history.smoke.test.js
├── 03-send-message.smoke.test.js
├── 04-receive-message.smoke.test.js
├── 05-reconnection-offline-queue.smoke.test.js
├── 06-pagination.smoke.test.js
├── 07-ai-mediation.smoke.test.js
├── 08-room-pairing.smoke.test.js
├── 09-typing-indicators.smoke.test.js
└── 10-error-handling.smoke.test.js
```

### Running Tests

```bash
# Run all smoke tests
npm test -- core-flows

# Run specific flow
npm test -- 01-authentication-connection.smoke.test.js

# Run with coverage
npm test -- core-flows --coverage
```

### Test Helpers

Create shared test helpers in `chat-server/__tests__/core-flows/helpers.js`:

- `createAuthenticatedUser()` - Creates user and authenticates
- `createAuthenticatedUserInRoom()` - Creates user, room, and joins
- `createTwoUsersInRoom()` - Creates two users in same room
- `waitForConnection(socket)` - Waits for socket connection
- `waitForDisconnection(socket)` - Waits for socket disconnection
