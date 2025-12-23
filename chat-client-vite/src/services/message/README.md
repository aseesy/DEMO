# Message Services

This directory contains services for message handling, following the **Single Responsibility Principle**.

## Architecture

```
┌─────────────────────────────────────┐
│   UI Component (useSendMessage)     │
│   - UI state management              │
└──────────────┬──────────────────────┘
               │ orchestrates
               ↓
┌─────────────────────────────────────┐
│   MessageValidationService           │
│   - Business logic                   │
│   - Message analysis                 │
│   - Traffic control                  │
└──────────────┬──────────────────────┘
               │ uses
               ↓
┌─────────────────────────────────────┐
│   MessageTransportService            │
│   - Transport abstraction            │
│   - Socket.io / HTTP / WebSocket     │
└──────────────┬──────────────────────┘
               │ uses
               ↓
┌─────────────────────────────────────┐
│   SocketAdapter                     │
│   - socket.io-client wrapper         │
└─────────────────────────────────────┘
```

## Services

### MessageTransportService

**Responsibility**: Transport layer only

- Sends messages via any transport mechanism (Socket.io, HTTP, WebSocket)
- No validation, no business logic
- Abstracts transport details from business logic

**Usage:**

```javascript
import { createMessageTransportService } from '@/services/message';
import { SocketConnection } from '@/adapters/socket';

const transport = createMessageTransportService(socketConnection);
await transport.sendMessage({ text: 'Hello' });
```

### MessageValidationService

**Responsibility**: Business logic only

- Analyzes messages using Observer/Mediator framework
- Makes traffic control decisions (should message be sent?)
- No UI concerns, no transport concerns

**Usage:**

```javascript
import { createMessageValidationService } from '@/services/message';

const validation = createMessageValidationService();
const result = await validation.validateMessage('Hello');
if (result.shouldSend) {
  // Send message
} else {
  // Show intervention
}
```

### MessageQueueService

**Responsibility**: Queue management only

- Manages offline message queue
- Handles localStorage persistence
- No UI state, no transport

**Usage:**

```javascript
import { createMessageQueueService } from '@/services/message';

const queue = createMessageQueueService();
queue.enqueue(message);
const queued = queue.getQueue();
queue.dequeue(messageId);
```

## Benefits

1. **Testability**: Each service can be tested independently
2. **Flexibility**: Change transport/analysis without touching other layers
3. **Maintainability**: Single responsibility per service
4. **Reusability**: Services can be used across components

## Migration

See `../features/chat/model/USESENDMESSAGE_REFACTORING.md` for migration guide.
