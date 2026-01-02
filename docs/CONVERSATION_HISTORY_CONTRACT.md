# Formal Conversation History Contract

**Status**: Implemented (2026-01-02)

This document defines the formal protocol for managing conversation history within the application. It treats the conversation history as a system with strict invariants, independent of the user interface's presentation layer. The goal is to establish a deterministic architecture that ensures data integrity, consistency, and a reliable user experience, particularly concerning optimistic updates and message ordering.

## Implementation Status

| Invariant   | Status          | Implementation                                     |
| ----------- | --------------- | -------------------------------------------------- |
| I-1 to I-4  | Existing        | Message identity via server-assigned ID            |
| I-5 to I-7  | Existing        | Server timestamp ordering                          |
| I-8 to I-10 | Existing        | Cursor-based pagination                            |
| I-11        | **Implemented** | `message_reconciled` event in `messageApproval.js` |
| I-12        | **Implemented** | `handleMessageReconciled` in `MessageService.js`   |
| I-13        | Existing        | `optimisticId` included in `new_message` payload   |
| I-14        | **Implemented** | Optimistic messages tracked in `pendingMessages`   |
| I-15        | **Implemented** | `message_error` event + `handleMessageError`       |
| I-16        | Existing        | Server history priority on load                    |

**Critical Bug Fixed**: `optimisticId` was being dropped in `MessageTransportService.js` before reaching the server. Now properly passed through.

---

## 1. Message Identity Rules

The identity of a message is defined by a unique, immutable identifier and a clear lineage.

| Invariant                          | Rule                                                                                                                                           | Description                                                                                                     |
| :--------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------- |
| **I-1: Single Source of Truth**    | Every message MUST have a single, globally unique, and persistent identifier (`messageId`) assigned by the server upon successful persistence. | This ID is the primary key for all history operations (editing, deleting, reacting, threading).                 |
| **I-2: Client-Server Correlation** | Client-generated messages MUST include a temporary, client-unique identifier (`optimisticId`) in the `send_message` payload.                   | This ID is used exclusively for the client to correlate the optimistic message with the server's final message. |
| **I-3: Immutability of ID**        | The server MUST NOT change the `messageId` once it has been persisted and broadcasted.                                                         | Ensures reliable referencing across all clients and services.                                                   |
| **I-4: Message Type**              | Every message MUST have a defined `type` (e.g., `user`, `system`, `ai_intervention`, `contact_suggestion`).                                    | This allows clients to correctly render and process the message without relying on content heuristics.          |

## 2. Ordering Guarantees

Message ordering MUST be deterministic and consistent across all clients and server history.

| Invariant                           | Rule                                                                                                                                                                                                                                                                                                 | Description                                                                                                                 |
| :---------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------- |
| **I-5: Server Timestamp Authority** | The definitive order of messages is determined by the server-assigned timestamp (`timestamp`), which MUST be a high-precision, monotonic value (e.g., ISO 8601 format with milliseconds).                                                                                                            | This timestamp is assigned at the moment of successful persistence in the database, ensuring a single, authoritative order. |
| **I-6: Total Ordering**             | All messages within a single conversation room MUST be totally ordered by their server-assigned `timestamp`. In the event of a timestamp collision (which should be rare with high-precision timestamps), the server-assigned `messageId` (which is a UUID) MUST be used as a secondary tie-breaker. | This guarantees a single, non-ambiguous sequence for the conversation history.                                              |
| **I-7: Client Display Order**       | The client MUST display messages strictly in ascending order of the server-assigned `timestamp` (or `optimisticId` timestamp for pending messages).                                                                                                                                                  | This ensures a consistent chronological view for the user.                                                                  |

## 3. Pagination Rules

History loading MUST be cursor-based to ensure reliable, gap-free retrieval of messages.

| Invariant                       | Rule                                                                                                                                            | Description                                                                                                      |
| :------------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------- |
| **I-8: Cursor-Based Retrieval** | Pagination requests (`load_older_messages`) MUST use the `timestamp` of the oldest message currently displayed as the `beforeTimestamp` cursor. | This prevents the introduction of gaps or duplicates that can occur with page-number-based pagination.           |
| **I-9: Consistent Limit**       | The server MUST honor the requested `limit` (e.g., 50) and return messages strictly older than the `beforeTimestamp` cursor.                    | The server should ensure the query is `WHERE timestamp < :beforeTimestamp ORDER BY timestamp DESC LIMIT :limit`. |
| **I-10: Initial Load Anchor**   | The initial message load (`joined` event) MUST return the latest `N` messages, establishing the initial state of the conversation history.      | This set of messages acts as the initial anchor for all subsequent pagination requests.                          |

## 4. Deduplication Rules

The client MUST implement a strict deduplication mechanism to handle the transition from optimistic to server-persisted messages.

| Invariant                            | Rule                                                                                                                                                                                                                                                                                                                                                                                                                       | Description                                                                                                                                     |
| :----------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------- |
| **I-11: Reconciliation Event**       | The server MUST emit a dedicated `message_reconciled` event to the original sender upon successful persistence. This event MUST contain both the client's `optimisticId` and the server's final `messageId` and `timestamp`.                                                                                                                                                                                               | This replaces the current ambiguous `message_sent` event and provides the necessary correlation data.                                           |
| **I-12: Client Deduplication Logic** | Upon receiving the final server message via `new_message` (broadcast to all clients), the original sender's client MUST: 1) Match the incoming message to the optimistic message using the `optimisticId` (via the `message_reconciled` event). 2) Replace the optimistic message's ID and timestamp with the server's final `messageId` and `timestamp`. 3) Remove the optimistic message from the `pendingMessages` map. | This ensures the message is only displayed once and is correctly identified by its final server ID.                                             |
| **I-13: Broadcast Deduplication**    | The `new_message` event broadcast to all clients (including the sender) MUST contain the `optimisticId` if one was provided, allowing the sender's client to perform the reconciliation.                                                                                                                                                                                                                                   | This is a necessary redundancy to ensure all clients receive the message, while the sender's client uses the `optimisticId` for reconciliation. |

## 5. Reconciliation Rules (Optimistic vs. Server History)

The client's local state MUST converge to the server's state deterministically.

| Invariant                                | Rule                                                                                                                                                                                                                                                                                | Description                                                                                                                            |
| :--------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------- |
| **I-14: Optimistic Message Persistence** | An optimistic message MUST remain in the client's local state until the server confirms persistence via the `message_reconciled` event or confirms failure via a `message_error` event.                                                                                             | Prevents message loss on the client side during network latency.                                                                       |
| **I-15: Failure Handling**               | Upon receiving a `message_error` event, the client MUST mark the corresponding optimistic message as `failed` and retain it in the history for user action (e.g., retry, delete).                                                                                                   | The message is not removed from the history until the user explicitly deletes it.                                                      |
| **I-16: History Load Priority**          | When loading older messages (`load_older_messages`), the client MUST prioritize the server's history. Any optimistic messages that fall within the loaded history's timestamp range MUST be removed from the `pendingMessages` map, as the server's history is the source of truth. | This ensures that the server's history always overrides the client's optimistic state, preventing duplicates on refresh or pagination. |

---

## Socket Events

### Server → Client Events

| Event                | Recipients  | Payload                                  | Purpose                     |
| -------------------- | ----------- | ---------------------------------------- | --------------------------- |
| `message_reconciled` | Sender only | `{ optimisticId, messageId, timestamp }` | Confirm message persistence |
| `message_error`      | Sender only | `{ optimisticId, error, code }`          | Report message failure      |
| `new_message`        | Room (all)  | Full message object with `optimisticId`  | Broadcast new message       |

### Client → Server Events

| Event                 | Payload                       | Purpose          |
| --------------------- | ----------------------------- | ---------------- |
| `send_message`        | `{ text, optimisticId, ... }` | Send new message |
| `load_older_messages` | `{ beforeTimestamp, limit }`  | Pagination       |

---

## Files Modified

| File                                                               | Change                                          |
| ------------------------------------------------------------------ | ----------------------------------------------- |
| `chat-client-vite/src/services/message/MessageTransportService.js` | Pass `optimisticId` in emit                     |
| `chat-server/socketHandlers/aiActionHelper/messageApproval.js`     | Emit `message_reconciled` event                 |
| `chat-client-vite/src/services/chat/MessageService.js`             | Handle `message_reconciled` and `message_error` |
| `chat-server/socketHandlers/messageHandler.js`                     | Emit `message_error` on failures                |
