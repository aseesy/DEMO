# Chat Routes & Events Reference

**Last Updated:** 2026-01-07  
**Purpose:** Complete reference of all REST API routes and Socket.io events for chat functionality

---

## 🌐 REST API Routes

### Messages API (`/api/messages`)

#### GET Endpoints

| Route | Method | Description | Auth Required |
|-------|--------|-------------|---------------|
| `/api/messages/room/:roomId` | GET | Get messages for a room (paginated) | ✅ Yes |
| `/api/messages/thread/:threadId` | GET | Get messages for a thread (paginated) | ✅ Yes |
| `/api/messages/:messageId` | GET | Get a single message by ID | ✅ Yes |

#### POST Endpoints

| Route | Method | Description | Auth Required |
|-------|--------|-------------|---------------|
| `/api/messages` | POST | Create a new message | ✅ Yes |
| `/api/messages/:messageId/reactions` | POST | Add a reaction to a message | ✅ Yes |

#### PUT/PATCH Endpoints

| Route | Method | Description | Auth Required |
|-------|--------|-------------|---------------|
| `/api/messages/:messageId` | PUT | Update a message (edit) | ✅ Yes |

#### DELETE Endpoints

| Route | Method | Description | Auth Required |
|-------|--------|-------------|---------------|
| `/api/messages/:messageId` | DELETE | Delete a message (soft delete) | ✅ Yes |
| `/api/messages/:messageId/reactions/:emoji` | DELETE | Remove a reaction from a message | ✅ Yes |

**Query Parameters for GET `/api/messages/room/:roomId`:**
- `limit` (default: 50, max: 500) - Number of messages to fetch
- `offset` (default: 0) - Pagination offset
- `before` - Timestamp for cursor-based pagination (before this time)
- `after` - Timestamp for cursor-based pagination (after this time)
- `threadId` - Filter by thread ID

### Rooms API (`/api/room`)

| Route | Method | Description | Auth Required |
|-------|--------|-------------|---------------|
| `/api/room/:username` | GET | Get user's room | ❌ No |
| `/api/room/shared-check/:username` | GET | Check if user is in a shared room | ❌ No |
| `/api/room/backfill-contacts` | POST | Backfill contacts for room | ❌ No |
| `/api/room/invite` | GET | Get or create invite for room | ✅ Yes |
| `/api/room/invite` | POST | Create invite (legacy) | ❌ No |
| `/api/room/invite/:inviteCode` | GET | Validate invite code | ❌ No |
| `/api/room/join` | POST | Accept invite (join room) | ❌ No |
| `/api/room/members/check` | GET | Check if room has multiple members | ✅ Yes |
| `/api/room/:roomId/members` | GET | Get room members | ❌ No |
| `/api/room/:roomId/invites` | GET | Get active invites for room | ❌ No |

### AI/Mediation API (`/api`)

| Route | Method | Description | Auth Required |
|-------|--------|-------------|---------------|
| `/api/tasks/generate` | POST | Generate task using AI | ❌ No |
| `/api/mediate/analyze` | POST | Analyze message using AI mediation | ✅ Yes |

---

## 🔌 Socket.io Events

### Client → Server Events (Sent by Frontend)

#### Connection & Room Management

| Event | Direction | Description | Payload |
|-------|-----------|-------------|---------|
| `join` | Client → Server | Join a chat room | `{ email, username }` |
| `disconnect` | Client → Server | Disconnect from socket | (automatic) |

#### Message Operations

| Event | Direction | Description | Payload |
|-------|-----------|-------------|---------|
| `send_message` | Client → Server | Send a new message | `{ text, roomId?, metadata? }` |
| `edit_message` | Client → Server | Edit an existing message | `{ messageId, text }` |
| `delete_message` | Client → Server | Delete a message | `{ messageId }` |
| `add_reaction` | Client → Server | Add reaction to message | `{ messageId, emoji }` |

#### Message History & Navigation

| Event | Direction | Description | Payload |
|-------|-----------|-------------|---------|
| `load_older_messages` | Client → Server | Load older messages (pagination) | `{ beforeTimestamp, limit? }` |
| `search_messages` | Client → Server | Search messages | `{ query, limit?, offset? }` |
| `jump_to_message` | Client → Server | Jump to specific message with context | `{ messageId }` |

#### AI Mediation & Coaching

| Event | Direction | Description | Payload |
|-------|-----------|-------------|---------|
| `analyze_draft` | Client → Server | Analyze draft message (legacy) | `{ draftText }` |
| `approve_message` | Client → Server | Approve AI-suggested rewrite | `{ originalMessageId, rewriteIndex }` |
| `intervention_feedback` | Client → Server | Provide feedback on AI intervention | `{ interventionId, helpful, reason? }` |
| `override_intervention` | Client → Server | Override AI intervention and send original | `{ messageId }` |

#### Typing Indicators

| Event | Direction | Description | Payload |
|-------|-----------|-------------|---------|
| `typing` | Client → Server | User is typing | `{ roomId, isTyping }` |

#### Threading (⚠️ THREADING FEATURE)

| Event | Direction | Description | Payload |
|-------|-----------|-------------|---------|
| `create_thread` | Client → Server | Create a new thread | `{ roomId, title, messageId?, category? }` |
| `get_threads` | Client → Server | Get threads for room | `{ roomId }` |
| `get_thread_messages` | Client → Server | Get messages for thread | `{ threadId, limit?, offset? }` |
| `add_to_thread` | Client → Server | Add message to thread | `{ messageId, threadId }` |
| `remove_from_thread` | Client → Server | Remove message from thread | `{ messageId }` |
| `create_sub_thread` | Client → Server | Create sub-thread | `{ roomId, title, parentThreadId, parentMessageId? }` |
| `get_sub_threads` | Client → Server | Get sub-threads | `{ threadId }` |
| `get_thread_ancestors` | Client → Server | Get thread ancestors | `{ threadId }` |
| `get_thread_hierarchy` | Client → Server | Get thread hierarchy | `{ threadId }` |
| `reply_in_thread` | Client → Server | Reply in thread | `{ threadId, text, messageData? }` |
| `move_message_to_thread` | Client → Server | Move message to thread | `{ messageId, targetThreadId, roomId }` |
| `archive_thread` | Client → Server | Archive thread | `{ threadId, archived?, cascade? }` |
| `analyze_conversation_history` | Client → Server | Analyze conversation for threads | `{ roomId, limit? }` |
| `get_conversation_threads` | Client → Server | Get conversation threads | `{ roomId, limitPerCategory?, includeDetails? }` |
| `get_thread_details` | Client → Server | Get thread details | `{ threadId }` |
| `process_room_threads` | Client → Server | Process threads for room | `{ roomId }` |
| `backfill_room_threads` | Client → Server | Backfill threads for room | `{ roomId, limit?, batchSize? }` |

#### Topics (⚠️ TOPICS FEATURE - AI Summaries)

| Event | Direction | Description | Payload |
|-------|-----------|-------------|---------|
| `topics:subscribe` | Client → Server | Subscribe to topics for room | `{ roomId }` |
| `topics:unsubscribe` | Client → Server | Unsubscribe from topics | `{ roomId }` |
| `topics:detect` | Client → Server | Detect topics in room | `{ roomId, options? }` |
| `topics:regenerate` | Client → Server | Regenerate topic summary | `{ topicId }` |
| `topics:report` | Client → Server | Report inaccurate summary | `{ topicId, reason? }` |

#### Contacts (⚠️ CONTACT FEATURE)

| Event | Direction | Description | Payload |
|-------|-----------|-------------|---------|
| `contact_suggestion_response` | Client → Server | Respond to contact suggestion | `{ response, detectedName, relationship? }` |

---

### Server → Client Events (Emitted by Backend)

#### Connection & Room Events

| Event | Direction | Description | Payload |
|-------|-----------|-------------|---------|
| `join_success` | Server → Client | Successfully joined room | `{ email, username, roomId, roomName, users, roomMembers }` |
| `message_history` | Server → Client | Initial message history on join | `{ messages, hasMore }` |
| `user_joined` | Server → Client | User joined room (broadcast) | `{ users, roomMembers }` |
| `user_left` | Server → Client | User left room (broadcast) | `{ users, roomMembers }` |
| `replaced_by_new_connection` | Server → Client | Socket replaced by new connection | (no payload) |

#### Message Events

| Event | Direction | Description | Payload |
|-------|-----------|-------------|---------|
| `new_message` | Server → Client | New message received (broadcast) | `{ message object }` |
| `message_edited` | Server → Client | Message was edited (broadcast) | `{ message object }` |
| `message_deleted` | Server → Client | Message was deleted (broadcast) | `{ messageId, roomId }` |
| `message_error` | Server → Client | Message send error | `{ error, message? }` |
| `message_reconciled` | Server → Client | Message reconciled (optimistic update) | `{ optimisticId, message }` |
| `message_save_failed` | Server → Client | Message persistence failed | `{ messageId, error }` |

#### Message Reactions

| Event | Direction | Description | Payload |
|-------|-----------|-------------|---------|
| `reaction_updated` | Server → Client | Reaction added/removed (broadcast) | `{ messageId, reactions, roomId }` |

#### Message History & Navigation

| Event | Direction | Description | Payload |
|-------|-----------|-------------|---------|
| `older_messages` | Server → Client | Older messages loaded | `{ messages, hasMore, query? }` |
| `search_results` | Server → Client | Search results | `{ messages, total, query }` |
| `jump_to_message_result` | Server → Client | Message context for jump | `{ message, before, after }` |

#### AI Mediation & Coaching

| Event | Direction | Description | Payload |
|-------|-----------|-------------|---------|
| `draft_coaching` | Server → Client | AI coaching/intervention (sender only) | `{ interventionId, tip, rewrites, blocked, metadata }` |
| `draft_analysis` | Server → Client | Draft analysis (legacy, sender only) | `{ coaching object }` |
| `feedback_recorded` | Server → Client | Feedback recorded | `{ success: true }` |
| `rewrite_recorded` | Server → Client | Rewrite usage recorded | `{ success: true }` |
| `override_success` | Server → Client | Intervention overridden | `{ messageId }` |

#### Typing Indicators

| Event | Direction | Description | Payload |
|-------|-----------|-------------|---------|
| `typing` | Server → Client | User typing indicator (broadcast) | `{ user, isTyping, roomId }` |

#### Threading Events (⚠️ THREADING FEATURE)

| Event | Direction | Description | Payload |
|-------|-----------|-------------|---------|
| `thread_created_success` | Server → Client | Thread created | `{ threadId, title }` |
| `threads_list` | Server → Client | Threads list for room | `{ threads }` |
| `thread_messages` | Server → Client | Messages for thread | `{ threadId, messages, hasMore }` |
| `message_added_to_thread` | Server → Client | Message added to thread | `{ messageId, threadId }` |
| `message_removed_from_thread` | Server → Client | Message removed from thread | `{ messageId }` |
| `sub_thread_created_success` | Server → Client | Sub-thread created | `{ threadId, title, parentThreadId }` |
| `thread_ancestors` | Server → Client | Thread ancestors | `{ threadId, ancestors }` |
| `sub_threads_list` | Server → Client | Sub-threads list | `{ parentThreadId, subThreads }` |
| `thread_hierarchy` | Server → Client | Thread hierarchy | `{ rootThreadId, hierarchy }` |
| `reply_in_thread_success` | Server → Client | Reply sent in thread | `{ threadId, message }` |
| `message_moved_to_thread_success` | Server → Client | Message moved to thread | `{ messageId, targetThreadId, oldThreadId? }` |
| `thread_archived_success` | Server → Client | Thread archived | `{ threadId, archived }` |
| `conversation_analysis_complete` | Server → Client | Conversation analysis complete | `{ roomId, threads }` |
| `conversation_threads` | Server → Client | Conversation threads | `{ roomId, threads }` |
| `thread_details` | Server → Client | Thread details | `{ thread }` |
| `process_room_threads_complete` | Server → Client | Thread processing complete | `{ roomId, threadsCreated }` |
| `backfill_room_threads_complete` | Server → Client | Thread backfill complete | `{ roomId, threadsCreated }` |

#### Topics Events (⚠️ TOPICS FEATURE)

| Event | Direction | Description | Payload |
|-------|-----------|-------------|---------|
| `topics:list` | Server → Client | Topics list for room | `{ roomId, topics }` |
| `topics:error` | Server → Client | Topics error | `{ error }` |
| `topics:reported` | Server → Client | Topic reported | `{ topicId, success }` |

#### Error Events

| Event | Direction | Description | Payload |
|-------|-----------|-------------|---------|
| `error` | Server → Client | General error | `{ message }` or `{ code, message }` |

---

## 📡 Frontend API Client Calls

### Message API Client (`services/api/messageApi.js`)

| Function | HTTP Method | Endpoint | Description |
|----------|-------------|----------|-------------|
| `getRoomMessages(roomId, options)` | GET | `/api/messages/room/:roomId` | Get messages for room |
| `getThreadMessages(threadId, options)` | GET | `/api/messages/thread/:threadId` | Get messages for thread |
| `getMessage(messageId)` | GET | `/api/messages/:messageId` | Get single message |
| `createMessage(messageData)` | POST | `/api/messages` | Create new message |
| `updateMessage(messageId, updates)` | PUT | `/api/messages/:messageId` | Update message |
| `deleteMessage(messageId)` | DELETE | `/api/messages/:messageId` | Delete message |
| `addReaction(messageId, emoji)` | POST | `/api/messages/:messageId/reactions` | Add reaction |
| `removeReaction(messageId, emoji)` | DELETE | `/api/messages/:messageId/reactions/:emoji` | Remove reaction |

---

## 🔄 Complete Event Flow Examples

### Sending a Message

```
Client: socket.emit('send_message', { text: 'Hello', roomId: 'room-123' })
  ↓
Server: Processes message → Runs AI mediation → Saves to DB
  ↓
Server: socket.emit('draft_coaching', { interventionId, tip, rewrites, blocked })
  (if AI intervention needed - sender only)
  ↓
Client: User approves rewrite OR overrides
  ↓
Server: socket.emit('new_message', { message }) (broadcast to room)
```

### Loading Messages

```
Client: socket.emit('join', { email: 'user@example.com' })
  ↓
Server: Validates user → Loads room → Fetches messages
  ↓
Server: socket.emit('join_success', { roomId, users, ... })
Server: socket.emit('message_history', { messages, hasMore })
  ↓
Client: User scrolls up → socket.emit('load_older_messages', { beforeTimestamp, limit: 50 })
  ↓
Server: socket.emit('older_messages', { messages, hasMore })
```

### Editing a Message

```
Client: socket.emit('edit_message', { messageId: 'msg-123', text: 'Updated text' })
  ↓
Server: Validates ownership → Updates DB → Broadcasts edit
  ↓
Server: io.to(roomId).emit('message_edited', { message })
```

---

## 📋 Route Summary by Feature

### Core Messaging (Production)
- **REST:** 8 endpoints (GET, POST, PUT, DELETE for messages + reactions)
- **Socket Events:** 12 client events, 14 server events
- **Total:** ~34 routes/events

### Room Management (Production)
- **REST:** 10 endpoints
- **Socket Events:** 2 client events, 4 server events
- **Total:** ~16 routes/events

### AI Mediation (Production)
- **REST:** 2 endpoints
- **Socket Events:** 4 client events, 5 server events
- **Total:** ~11 routes/events

### Threading (⚠️ Separate Feature)
- **Socket Events:** 16 client events, 15 server events
- **Total:** ~31 events

### Topics (⚠️ Separate Feature)
- **Socket Events:** 5 client events, 3 server events
- **Total:** ~8 events

### Contacts (⚠️ Separate Feature)
- **Socket Events:** 1 client event, 3 server events
- **Total:** ~4 events

---

## 🎯 Core Chat Messaging Routes (Production)

**Total: ~61 routes/events**
- REST API: 20 endpoints
- Socket Events: 41 events (22 client → server, 19 server → client)

---

**Note:** Events marked with ⚠️ are related features (threading, topics, contacts) but not core chat messaging functionality.

