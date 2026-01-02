# Core User Flows - Must Always Work

These are the 5-10 essential user journeys that define the product. If any of these break, the application is fundamentally unusable.

---

## 1. **User Authentication & Socket Connection**

**Flow**: User logs in → Socket connects → Authentication validated → Connection state tracked

**Why Critical**: Everything depends on this. Without authentication and connection, no features work.

**Success Criteria**:

- ✅ User can log in with email/password or Gmail
- ✅ Auth token is stored securely
- ✅ Socket connects to server with auth token
- ✅ Connection state is tracked and UI updates reactively
- ✅ Connection errors are handled gracefully (show error, allow retry)
- ✅ Socket reconnects automatically on network issues

**Failure Modes to Prevent**:

- Socket fails to connect on login
- Auth token not passed to socket
- Connection state not reactive (UI doesn't update)
- Infinite connection attempts
- No error feedback to user

---

## 2. **Join Chat Room & Load Message History**

**Flow**: User authenticated → Navigate to chat view → Auto-join room → Receive message history → Display messages

**Why Critical**: Users can't communicate without joining their room and seeing past messages.

**Success Criteria**:

- ✅ User automatically joins room when authenticated and viewing chat
- ✅ Room membership persists (users return to same room)
- ✅ Message history loads on join (recent messages displayed)
- ✅ Messages display in chronological order
- ✅ Sender information displays correctly (name, email)
- ✅ Timestamps display correctly
- ✅ Pagination works (load older messages)

**Failure Modes to Prevent**:

- Join event fails silently
- Message history doesn't load
- Messages appear out of order
- Room ID is invalid/undefined
- Duplicate messages in history

---

## 3. **Send Message**

**Flow**: User types message → Submits → Message shows as pending → Sent to server → Confirmation received → Status updates

**Why Critical**: Core communication feature. If messages can't be sent, the app is useless.

**Success Criteria**:

- ✅ User can type and submit messages
- ✅ Message appears immediately in UI (optimistic update)
- ✅ Message status shows "pending" while sending
- ✅ Message sends via socket to server
- ✅ Message status updates to "sent" on confirmation
- ✅ Failed messages show error status
- ✅ Offline messages queue and send when reconnected
- ✅ Messages persist in database

**Failure Modes to Prevent**:

- Message doesn't send (socket not connected)
- Message disappears after sending (state issue)
- Duplicate messages sent
- Message status stuck on "pending"
- Offline messages lost
- Message not saved to database

---

## 4. **Receive Real-Time Messages**

**Flow**: Co-parent sends message → Server broadcasts → Socket receives event → UI updates → New message appears → Auto-scroll (if at bottom)

**Why Critical**: Real-time communication is the core value proposition. Messages must arrive immediately.

**Success Criteria**:

- ✅ Messages arrive within 2 seconds of sending
- ✅ New messages appear at bottom of list
- ✅ Sender information displays correctly
- ✅ Timestamp displays correctly
- ✅ Auto-scroll to bottom when user is at bottom
- ✅ No duplicate messages
- ✅ Message appears even if user is on different tab/view
- ✅ Unread count updates for non-chat views

**Failure Modes to Prevent**:

- Messages don't arrive (socket not subscribed)
- Messages arrive but UI doesn't update (state issue)
- Duplicate messages appear
- Messages appear in wrong order
- Auto-scroll doesn't work
- Unread count doesn't update

---

## 5. **Network Reconnection & Offline Queue**

**Flow**: Connection lost → Messages queue locally → Connection restored → Queued messages send → UI syncs with server

**Why Critical**: Mobile users experience network interruptions. Messages can't be lost.

**Success Criteria**:

- ✅ Connection loss detected immediately
- ✅ Connection state updates in UI (shows disconnected)
- ✅ Messages queue locally when offline
- ✅ Automatic reconnection attempts (with backoff)
- ✅ Queued messages send on reconnect
- ✅ Server state syncs on reconnect (no message loss)
- ✅ Duplicate prevention (optimistic messages don't duplicate)

**Failure Modes to Prevent**:

- Messages lost during network interruption
- Duplicate messages on reconnect
- Reconnection fails silently
- Queue doesn't persist (app refresh loses messages)
- Connection state doesn't update

---

## 6. **View Message History (Pagination)**

**Flow**: User scrolls to top → Load older messages → Previous messages appear above → Scroll position maintained

**Why Critical**: Users need to access past conversations for context and accountability.

**Success Criteria**:

- ✅ User can load older messages
- ✅ Older messages appear above current messages
- ✅ Scroll position maintained (doesn't jump to top)
- ✅ Loading indicator shows while fetching
- ✅ "No more messages" indicator when all loaded
- ✅ Pagination handles edge cases (empty room, single message)

**Failure Modes to Prevent**:

- Older messages don't load
- Scroll position jumps to top
- Infinite loading state
- Messages duplicated when loading older
- Performance issues with large message history

---

## 7. **AI Message Mediation (Draft Coaching)**

**Flow**: User types message → AI analyzes → Message blocked if hostile → Coaching shown → User can rewrite or send original

**Why Critical**: This is the differentiating feature - AI mediation reduces conflict. If it breaks, users can't benefit from coaching.

**Success Criteria**:

- ✅ Message analyzed before sending
- ✅ Hostile messages are blocked with explanation
- ✅ Coaching UI appears (Observer card)
- ✅ Rewrite options provided
- ✅ User can select rewrite or send original
- ✅ Original message preserved if user chooses to send
- ✅ Coaching doesn't block UI permanently

**Failure Modes to Prevent**:

- Messages send without analysis (coaching bypassed)
- Coaching UI blocks all messages (can't send anything)
- Rewrite doesn't preserve intent
- Analysis fails silently (messages blocked with no feedback)
- Coaching state gets stuck (can't dismiss)

---

## 8. **Room/Pairing Management**

**Flow**: User invited → Invitation accepted → Room created → Both users can join → Room persists across sessions

**Why Critical**: Users can't communicate without being in a room with their co-parent.

**Success Criteria**:

- ✅ Invitation system works (send/accept invitations)
- ✅ Room created when pairing established
- ✅ Both users can join same room
- ✅ Room membership persists (users return to same room)
- ✅ Room ID resolves correctly (no undefined errors)
- ✅ Duplicate connections handled (one socket per user)

**Failure Modes to Prevent**:

- Room not created on pairing
- Users can't find their room
- Room ID is undefined/null (causes crashes)
- Multiple rooms created for same pair
- Users can't join room (permission errors)

---

## 9. **Typing Indicators**

**Flow**: User types → Typing event sent → Co-parent sees "typing..." → User stops typing → Indicator disappears

**Why Critical**: Provides real-time feedback and engagement. While not critical for core functionality, it's expected behavior.

**Success Criteria**:

- ✅ Typing indicator appears when co-parent is typing
- ✅ Indicator disappears after user stops typing (timeout)
- ✅ Indicator doesn't persist indefinitely
- ✅ Multiple users' indicators work correctly
- ✅ No performance issues with frequent typing events

**Failure Modes to Prevent**:

- Indicator stuck on screen
- Indicator doesn't appear
- Performance issues (too many events)
- Indicator shows for wrong user

---

## 10. **Error Handling & User Feedback**

**Flow**: Error occurs → Error state tracked → User sees error message → User can retry/continue

**Why Critical**: Users need feedback when things go wrong. Silent failures create frustration.

**Success Criteria**:

- ✅ Connection errors show user-friendly message
- ✅ Message send failures show error (with retry option)
- ✅ Auth errors redirect to login
- ✅ Server errors don't crash the app
- ✅ Errors clear when resolved
- ✅ Offline state clearly communicated

**Failure Modes to Prevent**:

- Errors crash the app
- Errors show technical jargon to users
- No way to recover from errors
- Errors persist after resolution
- No feedback on connection issues

---

## Priority Ranking

If you must prioritize testing/debugging, focus in this order:

1. **Authentication & Connection** (Blocks everything)
2. **Send Message** (Core communication)
3. **Receive Messages** (Core communication)
4. **Join Room & Load History** (Required for context)
5. **Reconnection & Offline Queue** (Critical for mobile)
6. **AI Mediation** (Differentiating feature)
7. **Message History/Pagination** (Important for context)
8. **Room Management** (Required for pairing)
9. **Typing Indicators** (UX polish)
10. **Error Handling** (Resilience)

---

## Testing Recommendations

For each flow, test:

- ✅ **Happy path**: Everything works as expected
- ✅ **Error scenarios**: Network failures, server errors, invalid data
- ✅ **Edge cases**: Empty state, first message, reconnection, rapid actions
- ✅ **Mobile scenarios**: App backgrounding, network switching, low connectivity
- ✅ **Concurrent scenarios**: Multiple tabs, multiple users, rapid messages

---

## Architecture Dependencies

These flows depend on:

- ✅ SocketService (connection management)
- ✅ Auth system (authentication)
- ✅ Room resolution (room management)
- ✅ Message persistence (database)
- ✅ AI mediation service (coaching)
- ✅ Event subscription system (real-time updates)

---

## Contracts & Smoke Tests

Each flow has a detailed contract and smoke test defined in **[CORE_USER_FLOW_CONTRACTS.md](./CORE_USER_FLOW_CONTRACTS.md)**.

Contracts include:

- **Entry Conditions**: What must be true before the flow starts
- **Events/Actions**: Step-by-step what happens
- **State Transitions**: What changes in client and server state
- **Exit Conditions**: What "done" means
- **Instrumentation Points**: What to log/measure

Smoke tests are minimal tests that verify the core flow works end-to-end.

If any of these break, multiple flows will fail.
