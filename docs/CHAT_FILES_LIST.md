# Chat Files - Complete File Paths List

**Last Updated:** 2026-01-07  
**Purpose:** Simple list of all chat-related files with their exact file paths

---

## 📁 Frontend Files (`chat-client-vite/src/`)

### Core Chat Feature

#### Main Components
- `chat-client-vite/src/features/chat/ChatPage.jsx`
- `chat-client-vite/src/features/chat/index.js`
- `chat-client-vite/src/ChatRoom.jsx` ⚠️ LEGACY

#### Context & State
- `chat-client-vite/src/features/chat/context/ChatContext.jsx`
- `chat-client-vite/src/context/MediatorContext.jsx`

#### Chat Components
- `chat-client-vite/src/features/chat/components/ChatHeader.jsx`
- `chat-client-vite/src/features/chat/components/MessagesContainer.jsx`
- `chat-client-vite/src/features/chat/components/VirtualizedMessagesContainer.jsx`
- `chat-client-vite/src/features/chat/components/MessageItem.jsx`
- `chat-client-vite/src/features/chat/components/MessageInput.jsx`
- `chat-client-vite/src/features/chat/components/MessageSearch.jsx`
- `chat-client-vite/src/features/chat/components/MediationBanner.jsx`
- `chat-client-vite/src/features/chat/components/CoachingSection.jsx`
- `chat-client-vite/src/features/chat/components/FlaggingModal.jsx`
- `chat-client-vite/src/features/chat/components/ThreadsSidebar.jsx` ⚠️ THREADING
- `chat-client-vite/src/features/chat/components/ThreadReplyInput.jsx` ⚠️ THREADING
- `chat-client-vite/src/features/chat/components/MoveMessageMenu.jsx` ⚠️ THREADING
- `chat-client-vite/src/features/chat/components/InviteLinkPanel.jsx` ⚠️ INVITE
- `chat-client-vite/src/features/chat/components/InviteErrorPanel.jsx` ⚠️ INVITE
- `chat-client-vite/src/features/chat/components/ManualInvitePanel.jsx` ⚠️ INVITE
- `chat-client-vite/src/features/chat/components/TopicsPanel.jsx` ⚠️ TOPICS
- `chat-client-vite/src/features/chat/components/index.js`

#### Chat Hooks (`features/chat/hooks/`)
- `chat-client-vite/src/features/chat/hooks/useChatContextValue.js`
- `chat-client-vite/src/features/chat/hooks/useDerivedState.js`
- `chat-client-vite/src/features/chat/hooks/useMediationContext.js`
- `chat-client-vite/src/features/chat/hooks/useMessageMediation.js`
- `chat-client-vite/src/features/chat/hooks/useMessageSending.js`
- `chat-client-vite/src/features/chat/hooks/useMessageTransport.js`
- `chat-client-vite/src/features/chat/hooks/useMessageUI.js`
- `chat-client-vite/src/features/chat/hooks/useDraftAnalysis.js`
- `chat-client-vite/src/features/chat/hooks/useInputChange.js`
- `chat-client-vite/src/features/chat/hooks/useInputHandling.js`
- `chat-client-vite/src/features/chat/hooks/useTypingIndicator.js`

#### Chat Model/Logic (`features/chat/model/`)
- `chat-client-vite/src/features/chat/model/useSearchMessages.js`
- `chat-client-vite/src/features/chat/model/useSearchMessages.test.js`
- `chat-client-vite/src/features/chat/model/useMessagePagination.js`
- `chat-client-vite/src/features/chat/model/useMessageHandlers.js`
- `chat-client-vite/src/features/chat/model/useNewMessageHandler.js`
- `chat-client-vite/src/features/chat/model/useInputMessage.js`
- `chat-client-vite/src/features/chat/model/useInputMessage.test.js`
- `chat-client-vite/src/features/chat/model/useScrollManager.js`
- `chat-client-vite/src/features/chat/model/useScrollManager.test.js`
- `chat-client-vite/src/features/chat/model/useDraftCoaching.js`
- `chat-client-vite/src/features/chat/model/useTypingIndicators.js`
- `chat-client-vite/src/features/chat/model/useUnreadCount.js`
- `chat-client-vite/src/features/chat/model/useMessageFlaggingModal.js`
- `chat-client-vite/src/features/chat/model/messageUtils.js`
- `chat-client-vite/src/features/chat/model/messageUtils.test.js`
- `chat-client-vite/src/features/chat/model/socketEventHandlers.js`
- `chat-client-vite/src/features/chat/model/socketDebug.js`

#### Chat Handlers (`features/chat/handlers/`)
- `chat-client-vite/src/features/chat/handlers/messageHandlers.js`
- `chat-client-vite/src/features/chat/handlers/connectionHandlers.js`
- `chat-client-vite/src/features/chat/handlers/draftCoachingHandlers.js`
- `chat-client-vite/src/features/chat/handlers/errorHandlers.js`
- `chat-client-vite/src/features/chat/handlers/paginationHandlers.js`
- `chat-client-vite/src/features/chat/handlers/searchHandlers.js`
- `chat-client-vite/src/features/chat/handlers/threadHandlers.js` ⚠️ THREADING
- `chat-client-vite/src/features/chat/handlers/typingHandlers.js`
- `chat-client-vite/src/features/chat/handlers/userHandlers.js`

#### Chat Services (`services/chat/`)
- `chat-client-vite/src/services/chat/ChatRoomService.js`
- `chat-client-vite/src/services/chat/MessageService.js`
- `chat-client-vite/src/services/chat/MessageService.test.js`
- `chat-client-vite/src/services/chat/ThreadService.js` ⚠️ THREADING
- `chat-client-vite/src/services/chat/ThreadService.test.js` ⚠️ THREADING
- `chat-client-vite/src/services/chat/TypingService.js`
- `chat-client-vite/src/services/chat/UnreadService.js`
- `chat-client-vite/src/services/chat/CoachingService.js`
- `chat-client-vite/src/services/chat/index.js`

#### Chat Hooks (`hooks/chat/`)
- `chat-client-vite/src/hooks/chat/useChatRoom.js`
- `chat-client-vite/src/hooks/chat/useMessages.js`
- `chat-client-vite/src/hooks/chat/useThreads.js` ⚠️ THREADING
- `chat-client-vite/src/hooks/chat/useThreads.test.js` ⚠️ THREADING
- `chat-client-vite/src/hooks/chat/useTyping.js`
- `chat-client-vite/src/hooks/chat/useUnread.js`
- `chat-client-vite/src/hooks/chat/useCoaching.js`
- `chat-client-vite/src/hooks/chat/index.js`

### Socket Infrastructure

#### Socket Services
- `chat-client-vite/src/services/socket/SocketService.js` ⚠️ LEGACY
- `chat-client-vite/src/services/socket/SocketService.v2.js`
- `chat-client-vite/src/adapters/socket/SocketAdapter.js`

#### Socket Hooks
- `chat-client-vite/src/hooks/socket/useSocket.js`

#### Socket Utilities
- `chat-client-vite/src/SocketDiagnostic.jsx`
- `chat-client-vite/src/features/chat/test/SocketTest.v2.jsx`

### Message Utilities

- `chat-client-vite/src/utils/messageBuilder.js`
- `chat-client-vite/src/utils/messageBuilder.test.js`
- `chat-client-vite/src/utils/messageAnalyzer.js`
- `chat-client-vite/src/utils/messageAnalyzer.test.js`
- `chat-client-vite/src/services/message/MessageQueueService.js`
- `chat-client-vite/src/services/message/MessageTransportService.js`
- `chat-client-vite/src/services/message/MessageValidationService.js`
- `chat-client-vite/src/services/api/messageApi.js`

---

## 🖥️ Backend Files (`chat-server/`)

### Socket Handlers (`socketHandlers/`)

#### Core Handlers
- `chat-server/socketHandlers/messageHandler.js`
- `chat-server/socketHandlers/connectionHandler.js`
- `chat-server/socketHandlers/threadHandler.js` ⚠️ THREADING
- `chat-server/socketHandlers/topicsHandler.js` ⚠️ TOPICS
- `chat-server/socketHandlers/contactHandler.js` ⚠️ CONTACTS
- `chat-server/socketHandlers/feedbackHandler.js`
- `chat-server/socketHandlers/coachingHandler.js`
- `chat-server/socketHandlers/navigationHandler.js`
- `chat-server/socketHandlers/messageOperations.js`

#### Message Handlers (`socketHandlers/messageHandlers/`)
- `chat-server/socketHandlers/messageHandlers/sendMessageHandler.js`
- `chat-server/socketHandlers/messageHandlers/editMessageHandler.js`
- `chat-server/socketHandlers/messageHandlers/deleteMessageHandler.js`
- `chat-server/socketHandlers/messageHandlers/messagePersistence.js`
- `chat-server/socketHandlers/messageHandlers/reactionHandler.js`
- `chat-server/socketHandlers/messageHandlers/index.js`

#### AI/AI Mediation Handlers
- `chat-server/socketHandlers/aiHelper.js`
- `chat-server/socketHandlers/aiContextHelper.js`
- `chat-server/socketHandlers/aiHelperUtils.js`
- `chat-server/socketHandlers/aiActionHelper.js`
- `chat-server/socketHandlers/aiActionHelper/interventionProcessing.js`
- `chat-server/socketHandlers/aiActionHelper/messageApproval.js`
- `chat-server/socketHandlers/aiActionHelper/aiFailure.js`
- `chat-server/socketHandlers/aiActionHelper/contactDetection.js`

#### Connection Operations (`socketHandlers/connectionOperations/`)
- `chat-server/socketHandlers/connectionOperations/joinRoom.js`
- `chat-server/socketHandlers/connectionOperations/messageHistory.js`
- `chat-server/socketHandlers/connectionOperations/roomResolution.js`
- `chat-server/socketHandlers/connectionOperations/sessionManagement.js`
- `chat-server/socketHandlers/connectionOperations/systemMessages.js`
- `chat-server/socketHandlers/connectionOperations/userLookup.js`

#### Socket Middleware (`socketHandlers/socketMiddleware/`)
- `chat-server/socketHandlers/socketMiddleware/authMiddleware.js`
- `chat-server/socketHandlers/socketMiddleware/inputValidation.js`
- `chat-server/socketHandlers/socketMiddleware/payloadValidation.js`
- `chat-server/socketHandlers/socketMiddleware/rateLimiting.js`
- `chat-server/socketHandlers/socketMiddleware/roomMembership.js`
- `chat-server/socketHandlers/socketMiddleware/errorCodes.js`
- `chat-server/socketHandlers/socketMiddleware.js`

#### Utilities
- `chat-server/socketHandlers/utils/directHostilityCheck.js`
- `chat-server/socketHandlers/utils.js`
- `chat-server/socketHandlers/errorBoundary.js`
- `chat-server/socketHandlers/__tests__/errorBoundary.test.js`

### REST API Routes

#### Messages
- `chat-server/routes/messages.js`

#### Rooms
- `chat-server/routes/rooms.js`

#### AI/Mediation
- `chat-server/routes/ai.js`

#### Topics
- `chat-server/routes/topics.js` ⚠️ TOPICS

### Domain Layer (`src/domain/`)

#### Entities
- `chat-server/src/domain/entities/Message.js`
- `chat-server/src/domain/entities/__tests__/Message.test.js`

#### Value Objects
- `chat-server/src/domain/valueObjects/MessageId.js`
- `chat-server/src/domain/valueObjects/__tests__/MessageId.test.js`

### Services Layer (`src/services/`)

- `chat-server/src/services/messages/messageService.js`

### Repository Layer (`src/repositories/`)

- `chat-server/src/repositories/postgres/MessageRepository.js`

### Infrastructure

- `chat-server/sockets.js`
- `chat-server/messageStore.js` ⚠️ LEGACY

### Core Engine (`src/core/engine/`)

- `chat-server/src/core/engine/messageCache.js`

---

## 📋 Test Files

### Frontend Tests
- `chat-client-vite/src/features/chat/components/__tests__/MoveMessageMenu.test.jsx`
- `chat-client-vite/src/features/chat/components/__tests__/ThreadReplyInput.test.jsx`
- `chat-client-vite/src/features/chat/components/MediationBanner.test.jsx`
- `chat-client-vite/src/features/chat/model/useSearchMessages.test.js`
- `chat-client-vite/src/features/chat/model/messageUtils.test.js`
- `chat-client-vite/src/features/chat/model/useScrollManager.test.js`
- `chat-client-vite/src/features/chat/model/useInputMessage.test.js`
- `chat-client-vite/src/services/chat/MessageService.test.js`
- `chat-client-vite/src/services/chat/ThreadService.test.js`
- `chat-client-vite/src/hooks/chat/useThreads.test.js`
- `chat-client-vite/src/__tests__/ChatRoom.notificationNavigation.test.jsx`
- `chat-client-vite/src/utils/messageBuilder.test.js`
- `chat-client-vite/src/utils/messageAnalyzer.test.js`

### Backend Tests
- `chat-server/__tests__/services/messageService.test.js`
- `chat-server/__tests__/socketHandlers/messageOperations.test.js`
- `chat-server/__tests__/routes/messages.routes.test.js`
- `chat-server/__tests__/services/messageHistory.integration.test.js`
- `chat-server/__tests__/socketHandlers/aiActionHelper/messageApproval.test.js`
- `chat-server/__tests__/socket.integration.test.js`
- `chat-server/__tests__/user-acceptance/socket-edge-cases.integration.test.js`
- `chat-server/src/domain/entities/__tests__/Message.test.js`
- `chat-server/src/domain/valueObjects/__tests__/MessageId.test.js`

---

## 📊 Summary

### Core Chat Messaging Files (Production)

**Frontend:** 64 files
- Main Components: 1
- Chat Components: 12
- Chat Hooks: 10
- Chat Model/Logic: 16
- Chat Handlers: 8
- Chat Services: 6
- Chat Hooks (hooks/chat/): 5
- Socket Infrastructure: 2
- Message Utilities: 4

**Backend:** 46 files
- Socket Handlers (Core): 8
- Message Handlers: 6
- AI/Mediation Handlers: 7
- Connection Operations: 5
- Socket Middleware: 7
- Socket Utilities: 3
- REST Routes (Core): 2
- Domain Layer: 4
- Services Layer: 1
- Repository Layer: 1
- Infrastructure: 1
- Core Engine: 1

**Tests:** 22 files
- Frontend Tests: 13
- Backend Tests: 9

**Total Core Chat Files:** ~132 files (110 production + 22 tests)

### Related Features (Not Core Messaging)

**Threading:** ~15 files
**Topics:** ~5 files
**Invites:** ~3 files
**Contacts:** ~2 files

---

**Legend:**
- ⚠️ LEGACY = Deprecated/unused files
- ⚠️ THREADING = Threading feature (separate from core messaging)
- ⚠️ TOPICS = Topics/AI summaries feature (separate from core messaging)
- ⚠️ INVITE = Invitation feature (separate from core messaging)
- ⚠️ CONTACTS = Contact detection feature (separate from core messaging)

