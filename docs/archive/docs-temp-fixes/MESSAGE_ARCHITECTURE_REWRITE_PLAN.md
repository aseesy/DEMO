# Message Architecture & API Rewrite Plan

## Current Issues

1. **No REST API**: Messages only accessible via Socket.io events
2. **Inconsistent Format**: Mix of `username`, `user_email`, `sender` structures
3. **Scattered Logic**: Message handling spread across multiple files
4. **No Standardized Pagination**: Different pagination approaches
5. **Poor Error Handling**: Inconsistent error responses
6. **No Message Validation**: Missing input validation
7. **Client-Side Complexity**: Complex merging/deduplication logic

## New Architecture

### 1. REST API Layer (`/api/messages`)

**Endpoints**:
- `GET /api/messages/room/:roomId` - Get messages for a room (paginated)
- `GET /api/messages/thread/:threadId` - Get messages for a thread (paginated)
- `GET /api/messages/:messageId` - Get single message
- `POST /api/messages` - Create new message
- `PUT /api/messages/:messageId` - Update message (edit)
- `DELETE /api/messages/:messageId` - Delete message
- `POST /api/messages/:messageId/reactions` - Add reaction
- `DELETE /api/messages/:messageId/reactions/:emoji` - Remove reaction

**Query Parameters**:
- `limit` (default: 50, max: 500)
- `offset` (default: 0)
- `before` (timestamp for cursor-based pagination)
- `after` (timestamp for cursor-based pagination)
- `threadId` (filter by thread)

### 2. Unified Message Service

**File**: `chat-server/src/services/messages/messageService.js`

**Responsibilities**:
- Message CRUD operations
- Message validation
- Message formatting (consistent structure)
- Pagination logic
- Error handling

### 3. Message Repository

**File**: `chat-server/src/repositories/postgres/MessageRepository.js`

**Responsibilities**:
- Database queries
- Query optimization
- Data transformation

### 4. Message DTOs (Data Transfer Objects)

**Standard Message Format**:
```javascript
{
  id: string,
  type: 'user' | 'system' | 'ai_intervention',
  sender: {
    id: number,
    email: string,
    firstName: string,
    lastName: string,
    displayName: string
  },
  receiver: {
    id: number,
    email: string,
    firstName: string,
    lastName: string,
    displayName: string
  } | null,
  text: string,
  timestamp: ISO8601 string,
  roomId: string,
  threadId: string | null,
  threadSequence: number | null,
  edited: boolean,
  editedAt: ISO8601 string | null,
  reactions: { [emoji: string]: string[] }, // emoji -> array of user emails
  metadata: {
    validation: string | null,
    tip1: string | null,
    tip2: string | null,
    rewrite: string | null,
    originalMessage: object | null
  }
}
```

### 5. Client-Side API Client

**File**: `chat-client-vite/src/services/api/messageApi.js`

**Methods**:
- `getRoomMessages(roomId, options)`
- `getThreadMessages(threadId, options)`
- `getMessage(messageId)`
- `createMessage(message)`
- `updateMessage(messageId, updates)`
- `deleteMessage(messageId)`
- `addReaction(messageId, emoji)`
- `removeReaction(messageId, emoji)`

### 6. Socket Events (Keep for Real-Time)

**Events**:
- `message:created` - New message
- `message:updated` - Message edited
- `message:deleted` - Message deleted
- `message:reaction_added` - Reaction added
- `message:reaction_removed` - Reaction removed

## Implementation Plan

### Phase 1: Server-Side Foundation
1. Create MessageRepository
2. Create MessageService
3. Create message DTOs/validators
4. Create REST API routes

### Phase 2: Socket Integration
1. Update socket handlers to use MessageService
2. Emit standardized events
3. Maintain backward compatibility

### Phase 3: Client-Side
1. Create messageApi client
2. Update hooks to use API
3. Simplify message state management
4. Remove complex merging logic

### Phase 4: Testing & Migration
1. Add comprehensive tests
2. Migrate existing code
3. Update documentation

## File Structure

```
chat-server/
  src/
    services/
      messages/
        messageService.js       # Main service
        messageValidator.js     # Validation
        messageFormatter.js     # Formatting
    repositories/
      postgres/
        MessageRepository.js    # Database layer
    routes/
      messages.js              # REST API routes
    controllers/
      messageController.js    # Request handlers

chat-client-vite/
  src/
    services/
      api/
        messageApi.js          # API client
    hooks/
      messages/
        useMessages.js         # Simplified hook
```

## Benefits

1. **RESTful API**: Standard HTTP endpoints
2. **Consistent Format**: Single message structure
3. **Better Testing**: Testable service layer
4. **Improved Performance**: Optimized queries
5. **Easier Debugging**: Clear error messages
6. **Type Safety**: Validation at boundaries
7. **Scalability**: Clean separation of concerns

