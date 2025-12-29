/**
 * Chat Feature
 *
 * Package-by-feature: Everything related to Chat lives here.
 * Delete this folder to remove the Chat feature entirely.
 *
 * Usage:
 *   import { ChatPage, useChatSocket, ChatHeader } from '@features/chat';
 */

// Page (The View)
export { ChatPage, ChatPage as ChatView } from './ChatPage.jsx';

// Context
export { ChatProvider, useChatContext } from './context/ChatContext.jsx';

// Model (The Logic)
export { useChatSocket } from './model/useChatSocket.js';
export { useInputMessage } from './model/useInputMessage.js';
export { useSearchMessages } from './model/useSearchMessages.js';
export { useSendMessage } from './model/useSendMessage.js';
export { useMessageHandlers } from './model/useMessageHandlers.js';
export { useNewMessageHandler } from './model/useNewMessageHandler.js';
export { useScrollManager } from './model/useScrollManager.js';
export { useMessageFlaggingModal } from './model/useMessageFlaggingModal.js';
export { setupSocketEventHandlers } from './model/socketEventHandlers.js';

// Components (The UI Details)
export { ThreadsSidebar } from './components/ThreadsSidebar.jsx';
export { ManualInvitePanel } from './components/ManualInvitePanel.jsx';
export { InviteErrorPanel } from './components/InviteErrorPanel.jsx';
export { InviteLinkPanel } from './components/InviteLinkPanel.jsx';
export { MessagesContainer } from './components/MessagesContainer.jsx';
export { ChatHeader } from './components/ChatHeader.jsx';
export { MessageInput } from './components/MessageInput.jsx';
export { CoachingSection } from './components/CoachingSection.jsx';
export { default as MediationBanner } from './components/MediationBanner.jsx';
