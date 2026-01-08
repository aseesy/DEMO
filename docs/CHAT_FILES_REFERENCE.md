# Chat & Chat Features - Complete File Reference

**Last Updated:** 2026-01-07  
**Purpose:** Complete reference of all files responsible for **core chat messaging** functionality

**Note:** This list includes ONLY chat messaging features. Related features (invitations, contacts, topics/threading, navigation) are not included.

---

## 📁 Frontend Files (`chat-client-vite/src/`)

### Core Chat Feature

#### Main Components
- **`features/chat/ChatPage.jsx`** - Main chat interface (messages, input, header)
- **`features/chat/index.js`** - Chat feature exports (exports only)
- **`ChatRoom.jsx`** - ⚠️ LEGACY - Wrapper component, delegates to ChatPage

#### Context & State Management
- **`features/chat/context/ChatContext.jsx`** - Chat state context provider
- **`context/MediatorContext.jsx`** - AI mediation state (interventions, coaching)

#### Chat Components (`features/chat/components/`)
- **`ChatHeader.jsx`** - Chat header with user info
- **`MessagesContainer.jsx`** - Message list container
- **`VirtualizedMessagesContainer.jsx`** - Virtualized message list (performance)
- **`MessageItem.jsx`** - Individual message display component
- **`MessageInput.jsx`** - Message input field with send button
- **`MessageSearch.jsx`** - Search messages interface
- **`MediationBanner.jsx`** - AI intervention banner display
- **`CoachingSection.jsx`** - AI coaching tips display
- **`FlaggingModal.jsx`** - Message flagging modal
- **`ThreadsSidebar.jsx`** - Thread list sidebar
- **`ThreadReplyInput.jsx`** - Thread reply input component
- **`MoveMessageMenu.jsx`** - Move message to thread menu
- **`InviteLinkPanel.jsx`** - ⚠️ INVITE FEATURE (not chat core)
- **`InviteErrorPanel.jsx`** - ⚠️ INVITE FEATURE (not chat core)
- **`ManualInvitePanel.jsx`** - ⚠️ INVITE FEATURE (not chat core)
- **`TopicsPanel.jsx`** - ⚠️ TOPICS FEATURE (AI summaries, not chat core)
- **`components/index.js`** - Component exports (exports only)

#### Chat Hooks (`features/chat/hooks/`)
- **`useChatContextValue.js`** - Chat context value composition
- **`useDerivedState.js`** - Derived state calculations
- **`useMediationContext.js`** - AI mediation context hook
- **`useMessageMediation.js`** - Message mediation logic
- **`useMessageSending.js`** - Message sending logic
- **`useMessageTransport.js`** - Message transport layer
- **`useMessageUI.js`** - Message UI state management
- **`useDraftAnalysis.js`** - Draft message analysis
- **`useInputChange.js`** - Input change handlers
- **`useInputHandling.js`** - Input handling logic
- **`useTypingIndicator.js`** - Typing indicator logic

#### Chat Model/Logic (`features/chat/model/`)
- **`useSearchMessages.js`** - Message search functionality
- **`useSearchMessages.test.js`** - Search tests
- **`useMessagePagination.js`** - Message pagination logic
- **`useMessageHandlers.js`** - Message event handlers
- **`useNewMessageHandler.js`** - New message handler
- **`useInputMessage.js`** - Input message state
- **`useInputMessage.test.js`** - Input tests
- **`useScrollManager.js`** - Scroll position management
- **`useScrollManager.test.js`** - Scroll tests
- **`useDraftCoaching.js`** - Draft coaching logic
- **`useTypingIndicators.js`** - Typing indicators state
- **`useUnreadCount.js`** - Unread message count
- **`useMessageFlaggingModal.js`** - Message flagging modal logic
- **`messageUtils.js`** - Message utility functions
- **`messageUtils.test.js`** - Message utils tests
- **`socketEventHandlers.js`** - Socket event handling
- **`socketDebug.js`** - Socket debugging utilities

#### Chat Handlers (`features/chat/handlers/`)
- **`messageHandlers.js`** - Message event handlers
- **`connectionHandlers.js`** - Socket connection handlers
- **`draftCoachingHandlers.js`** - Draft coaching event handlers
- **`errorHandlers.js`** - Error handling
- **`paginationHandlers.js`** - Pagination event handlers
- **`searchHandlers.js`** - Search event handlers
- **`threadHandlers.js`** - Thread event handlers
- **`typingHandlers.js`** - Typing indicator handlers
- **`userHandlers.js`** - User event handlers

#### Chat Services (`services/chat/`)
- **`ChatRoomService.js`** - Chat room management service
- **`MessageService.js`** - Message CRUD operations
- **`MessageService.test.js`** - Tests (counted separately)
- **`ThreadService.js`** - ⚠️ THREADING FEATURE (not core messaging)
- **`ThreadService.test.js`** - Tests (counted separately)
- **`TypingService.js`** - Typing indicator service
- **`UnreadService.js`** - Unread count service
- **`CoachingService.js`** - AI coaching service
- **`index.js`** - Service exports (exports only)

#### Chat Hooks (`hooks/chat/`)
- **`useChatRoom.js`** - Chat room hook (room state)
- **`useMessages.js`** - Messages hook (message state)
- **`useThreads.js`** - ⚠️ THREADING FEATURE (not core messaging)
- **`useThreads.test.js`** - Tests (counted separately)
- **`useTyping.js`** - Typing hook (typing indicators)
- **`useUnread.js`** - Unread hook (unread counts)
- **`useCoaching.js`** - Coaching hook (AI interventions)
- **`index.js`** - Hook exports (exports only)

### Socket Infrastructure

#### Socket Services
- **`services/socket/SocketService.js`** - ⚠️ LEGACY - Not used (use v2)
- **`services/socket/SocketService.v2.js`** - V2 socket service (current)
- **`adapters/socket/SocketAdapter.js`** - Socket adapter layer

#### Socket Hooks
- **`hooks/socket/useSocket.js`** - Socket connection hook

#### Socket Utilities
- **`SocketDiagnostic.jsx`** - Development/debug tool
- **`features/chat/test/SocketTest.v2.jsx`** - Test/dev component (not production)

### Message Utilities

- **`utils/messageBuilder.js`** - Message builder utility
- **`utils/messageAnalyzer.js`** - Message analysis utility
- **`utils/messageAnalyzer.test.js`** - Message analyzer tests
- **`services/message/MessageQueueService.js`** - Message queue service
- **`services/message/MessageTransportService.js`** - Message transport service
- **`services/message/MessageValidationService.js`** - Message validation service
- **`services/api/messageApi.js`** - Message API client

---

## 🖥️ Backend Files (`chat-server/`)

### Socket Handlers (`socketHandlers/`)

#### Core Handlers
- **`messageHandler.js`** - Main message handler entry point
- **`connectionHandler.js`** - Socket connection handler
- **`threadHandler.js`** - ⚠️ THREADING FEATURE (not core messaging)
- **`topicsHandler.js`** - ⚠️ TOPICS FEATURE (AI summaries, not chat core)
- **`contactHandler.js`** - ⚠️ CONTACT FEATURE (contact detection, not chat core)
- **`feedbackHandler.js`** - User feedback handler (AI coaching feedback)
- **`coachingHandler.js`** - AI coaching handler
- **`navigationHandler.js`** - ⚠️ PAGINATION/NAVIGATION (message history loading)
- **`messageOperations.js`** - Message operations helper

#### Message Handlers (`messageHandlers/`)
- **`sendMessageHandler.js`** - Send message handler
- **`editMessageHandler.js`** - Edit message handler
- **`deleteMessageHandler.js`** - Delete message handler
- **`messagePersistence.js`** - Message persistence logic
- **`reactionHandler.js`** - Message reactions handler
- **`index.js`** - Message handlers exports

#### AI/AI Mediation Handlers
- **`aiHelper.js`** - Main AI helper entry point
- **`aiContextHelper.js`** - AI context enrichment
- **`aiHelperUtils.js`** - AI helper utilities
- **`aiActionHelper.js`** - AI action processing
- **`aiActionHelper/interventionProcessing.js`** - Intervention processing
- **`aiActionHelper/messageApproval.js`** - Message approval logic
- **`aiActionHelper/aiFailure.js`** - AI failure handling
- **`aiActionHelper/contactDetection.js`** - Contact detection in messages

#### Connection Operations (`connectionOperations/`)
- **`joinRoom.js`** - Join room logic
- **`messageHistory.js`** - Message history retrieval
- **`roomResolution.js`** - Room resolution logic
- **`sessionManagement.js`** - Session management
- **`systemMessages.js`** - System message generation
- **`userLookup.js`** - User lookup utilities

#### Socket Middleware (`socketMiddleware/`)
- **`authMiddleware.js`** - Socket authentication
- **`inputValidation.js`** - Input validation middleware
- **`payloadValidation.js`** - Payload validation
- **`rateLimiting.js`** - Rate limiting middleware
- **`roomMembership.js`** - Room membership validation
- **`errorCodes.js`** - Error code definitions
- **`socketMiddleware.js`** - Middleware composition

#### Utilities
- **`utils/directHostilityCheck.js`** - Direct hostility detection
- **`utils.js`** - Socket handler utilities
- **`errorBoundary.js`** - Error boundary for socket handlers
- **`errorBoundary.test.js`** - Error boundary tests

### REST API Routes

#### Messages
- **`routes/messages.js`** - Message REST endpoints (GET, POST, PATCH, DELETE)

#### Rooms
- **`routes/rooms.js`** - Room REST endpoints

#### AI/Mediation
- **`routes/ai.js`** - AI/mediation REST endpoints

#### Topics
- **`routes/topics.js`** - ⚠️ TOPICS FEATURE (AI summaries, not chat core)

### Domain Layer (`src/domain/`)

#### Entities
- **`src/domain/entities/Message.js`** - Message entity
- **`src/domain/entities/__tests__/Message.test.js`** - Message entity tests

#### Value Objects
- **`src/domain/valueObjects/MessageId.js`** - Message ID value object
- **`src/domain/valueObjects/__tests__/MessageId.test.js`** - Message ID tests

### Services Layer (`src/services/`)

- **`src/services/messages/messageService.js`** - Message business logic service

### Repository Layer (`src/repositories/`)

- **`src/repositories/postgres/MessageRepository.js`** - Message database repository

### Infrastructure

- **`sockets.js`** - Main socket.io server setup
- **`messageStore.js`** - ⚠️ LEGACY - In-memory store (deprecated, use Postgres)

### Core Engine (`src/core/engine/`)

- **`src/core/engine/messageCache.js`** - Message caching layer

---

## 📋 Test Files

### Frontend Tests
- **`features/chat/components/__tests__/MoveMessageMenu.test.jsx`** - Move message menu tests
- **`features/chat/components/__tests__/ThreadReplyInput.test.jsx`** - Thread reply input tests
- **`features/chat/components/MediationBanner.test.jsx`** - Mediation banner tests
- **`features/chat/model/useSearchMessages.test.js`** - Search tests
- **`features/chat/model/messageUtils.test.js`** - Message utils tests
- **`features/chat/model/useScrollManager.test.js`** - Scroll manager tests
- **`features/chat/model/useInputMessage.test.js`** - Input message tests
- **`services/chat/MessageService.test.js`** - Message service tests
- **`services/chat/ThreadService.test.js`** - Thread service tests
- **`hooks/chat/useThreads.test.js`** - Threads hook tests
- **`__tests__/ChatRoom.notificationNavigation.test.jsx`** - Chat room navigation tests
- **`utils/messageBuilder.test.js`** - Message builder tests
- **`utils/messageAnalyzer.test.js`** - Message analyzer tests

### Backend Tests
- **`__tests__/services/messageService.test.js`** - Message service tests
- **`__tests__/socketHandlers/messageOperations.test.js`** - Message operations tests
- **`__tests__/routes/messages.routes.test.js`** - Message routes tests
- **`__tests__/services/messageHistory.integration.test.js`** - Message history integration tests
- **`__tests__/socketHandlers/aiActionHelper/messageApproval.test.js`** - Message approval tests
- **`__tests__/socket.integration.test.js`** - Socket integration tests
- **`__tests__/user-acceptance/socket-edge-cases.integration.test.js`** - Socket edge case tests
- **`src/domain/entities/__tests__/Message.test.js`** - Message entity tests
- **`src/domain/valueObjects/__tests__/MessageId.test.js`** - Message ID tests

---

## 📊 File Count Summary (Core Chat Messaging Only)

### Frontend (Production Code)
- **Main Components:** 1 file (`ChatPage.jsx` - others are legacy/wrappers)
- **Chat Components:** 12 files (excludes invite panels, topics panel)
- **Chat Hooks (features/chat/hooks/):** 10 files
- **Chat Model/Logic:** 16 files (includes tests separately below)
- **Chat Handlers:** 8 files
- **Chat Services:** 6 files (excludes ThreadService - threading feature)
- **Chat Hooks (hooks/chat/):** 5 files (excludes useThreads - threading)
- **Socket Infrastructure:** 2 files (excludes legacy SocketService.js)
- **Message Utilities:** 4 files (MessageQueue, Transport, Validation, API)
- **Total Frontend Production:** ~64 files

### Frontend (Tests/Dev Tools)
- **Test Files:** 11 files
- **Dev Tools:** 2 files (`SocketDiagnostic.jsx`, `SocketTest.v2.jsx`)
- **Total Frontend Tests/Dev:** ~13 files

### Backend (Production Code)
- **Socket Handlers (Core):** 8 files (excludes threading, topics, contacts, navigation)
- **Message Handlers:** 6 files
- **AI/Mediation Handlers:** 7 files
- **Connection Operations:** 5 files
- **Socket Middleware:** 7 files
- **Socket Utilities:** 3 files
- **REST Routes (Core):** 2 files (messages, rooms - excludes topics, ai)
- **Domain Layer:** 4 files
- **Services Layer:** 1 file
- **Repository Layer:** 1 file
- **Infrastructure:** 1 file (excludes legacy messageStore.js)
- **Core Engine:** 1 file
- **Total Backend Production:** ~46 files

### Backend (Tests)
- **Test Files:** 9+ files
- **Total Backend Tests:** ~9 files

### Excluded (Not Core Chat Messaging)
- **Threading Feature:** ThreadService, useThreads, ThreadsSidebar, threadHandler (separate feature)
- **Topics Feature:** TopicsPanel, topicsHandler, routes/topics.js (AI summaries feature)
- **Invite Feature:** InviteLinkPanel, InviteErrorPanel, ManualInvitePanel (invitation feature)
- **Contact Feature:** contactHandler (contact detection feature)
- **Legacy Files:** ChatRoom.jsx, SocketService.js, messageStore.js (deprecated)
- **Export Files:** All `index.js` files (just exports)
- **Navigation:** navigationHandler.js (pagination, not core messaging)

### Core Chat Messaging Total: **~110 files** (64 frontend + 46 backend production code)
### Including Tests: **~132 files** (110 production + 22 tests/dev tools)

---

## 🎯 Key Features by File Group

### Real-Time Messaging
- `SocketService.v2.js`, `messageHandlers/`, `useMessages.js`, `MessageService.js`

### AI Mediation
- `aiHelper.js`, `useMessageMediation.js`, `MediationBanner.jsx`, `CoachingSection.jsx`

### Threading
- `ThreadService.js`, `useThreads.js`, `ThreadsSidebar.jsx`, `threadHandler.js`

### Typing Indicators
- `TypingService.js`, `useTyping.js`, `typingHandlers.js`

### Unread Counts
- `UnreadService.js`, `useUnread.js`, `useUnreadCount.js`

### Message Search
- `useSearchMessages.js`, `MessageSearch.jsx`, `searchHandlers.js`

### Message Persistence
- `MessageRepository.js`, `messagePersistence.js`, `messageService.js`

---

## 📖 Related Documentation

- **`docs/ARCHITECTURE.md`** - Overall system architecture
- **`CLAUDE.md`** - Project documentation (section on chat)
- **`specs/conversation-threading/`** - Threading feature specifications

---

**Note:** This is a living document. Files may be added or removed as the chat feature evolves.

