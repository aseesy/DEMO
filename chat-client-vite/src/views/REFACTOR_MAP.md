# ChatRoom.jsx Refactor Dependency Map

## Overview

- **Total Lines:** 3,192
- **useState hooks:** 34
- **useEffect hooks:** 18
- **useCallback hooks:** 14
- **Custom hooks:** 10

---

## Imports (Shared Across Views)

### React & Router

```js
import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
```

### Custom Hooks

```js
import { useAuth } from './hooks/useAuth.js';
import { useTasks } from './hooks/useTasks.js';
import { useChat } from './hooks/useChat.js';
import { useContacts } from './hooks/useContacts.js';
import { useProfile } from './hooks/useProfile.js';
import { useNotifications } from './hooks/useNotifications.js';
import { useInAppNotifications } from './hooks/useInAppNotifications.js';
import { useToast } from './hooks/useToast.js';
```

### Components

```js
import { ContactsPanel } from './components/ContactsPanel.jsx';
import { ProfilePanel } from './components/ProfilePanel.jsx';
import { UpdatesPanel } from './components/UpdatesPanel.jsx';
import { CommunicationStatsWidget } from './components/CommunicationStatsWidget.jsx';
import { Navigation } from './components/Navigation.jsx';
import { TaskFormModal } from './components/modals/TaskFormModal.jsx';
import { WelcomeModal } from './components/modals/WelcomeModal.jsx';
// ... more modals
```

---

## View Boundaries

| View      | Lines     | Approx Size                   |
| --------- | --------- | ----------------------------- |
| Dashboard | 1144-1611 | ~467 lines                    |
| Chat      | 1611-2793 | ~1,182 lines                  |
| Contacts  | 2793-2798 | ~5 lines (uses ContactsPanel) |
| Profile   | 2798-2809 | ~11 lines (uses ProfilePanel) |
| Settings  | 2809-3081 | ~272 lines                    |
| Account   | 3081+     | Lazy loaded (AccountView)     |

---

## State Dependencies by View

### DASHBOARD VIEW

**State Used:**

- `tasks` (from useTasks hook)
- `contacts` (from useContacts hook)
- `profile` (from useProfile hook)
- `setCurrentView` (navigation)
- `showWelcomeModal`, `showProfileTaskModal`, `showInviteModal`
- `hasCoParentConnected`, `hasPendingInvitation`
- `user` (from useAuth hook)

**Callbacks Used:**

- `toggleTaskStatus`
- `saveTask`
- Modal show/hide handlers

**Components Rendered:**

- Task cards
- Stats widgets (CommunicationStatsWidget)
- Onboarding prompts
- Modals (WelcomeModal, ProfileTaskModal, InviteTaskModal)

---

### CHAT VIEW

**State Used:**

- `messages` (from useChat hook)
- `input`, `setInput`
- `isConnected`, `socketRef`
- `showThreadsPanel`
- `flaggingMessage`, `flagReason`
- `pendingOriginalMessageToRemove`
- `feedbackGiven`

**Callbacks Used:**

- `sendMessage`
- `flagMessage`
- `sendInterventionFeedback`
- `handleNewMessage`
- `shouldRemoveMessageOnRewrite`

**Components Rendered:**

- Message list
- Input area
- Thread panel
- FlaggingModal
- ObserverCard
- MessageSearch

---

### SETTINGS VIEW

**State Used:**

- `notificationPrefs`, `setNotificationPrefs`
- `isSaving`
- `user` (from useAuth hook)

**Callbacks Used:**

- `handleChange` (for notification settings)
- `handlePreview` (for notification preview)

**Components Rendered:**

- Notification toggles
- PrivacySettings component
- PWAInstallButton

---

### CONTACTS VIEW

**State Used:**

- `contacts` (from useContacts hook)
- `setCurrentView` (navigation)

**Components Rendered:**

- ContactsPanel (fully encapsulated)

---

### PROFILE VIEW

**State Used:**

- `profile` (from useProfile hook)
- `user` (from useAuth hook)

**Components Rendered:**

- ProfilePanel (fully encapsulated)

---

## Shared State (Must Stay in ChatRoom.jsx)

These state items are used across multiple views and should remain in the parent:

1. **`currentView`** - Controls which view is shown
2. **`user` / `isAuthenticated`** - From useAuth, used everywhere
3. **`showLanding`** - Controls landing page display
4. **`unreadCount`** - Shown in Navigation

---

## Refactor Order (Recommended)

### Phase 1: SettingsView (Low Risk)

- Self-contained notification preferences
- Only needs: `notificationPrefs`, `setNotificationPrefs`, `isSaving`, `user`
- Clean extraction with minimal dependencies

### Phase 2: DashboardView (Medium Risk)

- Needs task management callbacks
- Uses multiple hooks (tasks, contacts, profile)
- Has modal interactions

### Phase 3: ChatView (High Risk)

- Most complex - 1,182 lines
- Real-time socket connections
- Multiple interacting state pieces
- Consider breaking into sub-components first:
  - ChatMessageList
  - ChatInput
  - ChatThreadPanel

---

## Proposed Props Interface

### SettingsView

```jsx
<SettingsView
  user={user}
  notificationPrefs={notificationPrefs}
  setNotificationPrefs={setNotificationPrefs}
  isSaving={isSaving}
  onSave={handleChange}
  onPreview={handlePreview}
/>
```

### DashboardView

```jsx
<DashboardView
  user={user}
  tasks={tasks}
  contacts={contacts}
  profile={profile}
  hasCoParentConnected={hasCoParentConnected}
  hasPendingInvitation={hasPendingInvitation}
  onNavigate={setCurrentView}
  onToggleTask={toggleTaskStatus}
  onSaveTask={saveTask}
  onShowWelcome={() => setShowWelcomeModal(true)}
  onShowProfile={() => setShowProfileTaskModal(true)}
  onShowInvite={() => setShowInviteModal(true)}
/>
```

### ChatView

```jsx
<ChatView
  user={user}
  messages={messages}
  input={input}
  setInput={setInput}
  isConnected={isConnected}
  onSendMessage={sendMessage}
  onFlagMessage={flagMessage}
  onFeedback={sendInterventionFeedback}
  // ... many more props
/>
```

---

## Risk Assessment

| View      | Risk      | Reason                                    |
| --------- | --------- | ----------------------------------------- |
| Settings  | 🟢 Low    | Self-contained, few dependencies          |
| Contacts  | 🟢 Low    | Already uses ContactsPanel component      |
| Profile   | 🟢 Low    | Already uses ProfilePanel component       |
| Dashboard | 🟡 Medium | Multiple hooks, modal interactions        |
| Chat      | 🔴 High   | Complex state, sockets, many interactions |
