# Implementation Plan: Tasks Feature Improvement

**Feature ID**: 005-tasks-feature-improvement
**Spec**: `specs/005-tasks-feature-improvement/spec.md`
**Created**: 2025-11-27

## Executive Summary

This plan consolidates the invite functionality into the tasks system and fixes task visibility issues. The implementation consists of four phases:

1. **Backend Task Backfill** - Ensure all users have onboarding tasks
2. **Frontend InviteTaskModal** - Combined invite/accept modal component
3. **Task Hook Improvements** - Remove 5-task limit, improve loading
4. **Dashboard Cleanup** - Remove standalone invite UI

## Phase 1: Backend Task Backfill

### 1.1 Add Backfill Logic to GET /api/tasks

**File**: `chat-server/server.js` (lines 4620-4722)

**Purpose**: Users who registered before onboarding tasks existed (or had task creation fail) currently see no tasks. Add backfill logic that runs on task fetch.

**Implementation**:

```javascript
// In GET /api/tasks, after getting targetUserId but before querying tasks

// Check if user has ANY tasks
const existingTasks = await dbSafe.safeSelect('tasks', { user_id: targetUserId }, { limit: 1 });

if (existingTasks.length === 0) {
  console.log(`[GET /api/tasks] No tasks found for user ${targetUserId}, triggering backfill`);
  await backfillOnboardingTasks(targetUserId);
}
```

### 1.2 Create backfillOnboardingTasks Function

**Location**: Add to `chat-server/server.js` or create `chat-server/taskBackfill.js`

**Tasks to Create**:

| Task Title | Priority | Type | Auto-Complete Condition |
|------------|----------|------|------------------------|
| Welcome to LiaiZen | medium | onboarding | Manual |
| Complete Your Profile | high | onboarding | Profile complete |
| Invite Your Co-Parent | high | onboarding | Co-parent connected |
| Add Your Children | medium | onboarding | Has child contact |

**Logic**:
```javascript
async function backfillOnboardingTasks(userId) {
  const now = new Date().toISOString();

  // Get user details to check conditions
  const users = await dbSafe.safeSelect('users', { id: userId }, { limit: 1 });
  if (users.length === 0) return;

  const user = users[0];

  // Check if user has co-parent
  const hasCoParent = await checkUserHasCoParent(userId);

  // Check if user has child contacts
  const childContacts = await dbSafe.safeSelect('contacts', {
    user_id: userId,
    relationship_type: 'child'
  }, { limit: 1 });
  const hasChildren = childContacts.length > 0;

  // Define onboarding tasks
  const onboardingTasks = [
    {
      title: 'Welcome to LiaiZen',
      description: 'LiaiZen is contextual and adapts to your unique situation...',
      priority: 'medium',
      type: 'onboarding',
      status: 'open' // Always open - manual completion
    },
    {
      title: 'Complete Your Profile',
      description: 'Help LiaiZen understand the dynamics of your co-parenting situation...',
      priority: 'high',
      type: 'onboarding',
      status: user.first_name && user.email_verified ? 'completed' : 'open'
    },
    {
      title: 'Invite Your Co-Parent',
      description: 'Connect with your co-parent to start communicating on LiaiZen.\n\nClick this task to send an invite or enter a code you received.',
      priority: 'high',
      type: 'onboarding',
      status: hasCoParent ? 'completed' : 'open'
    },
    {
      title: 'Add Your Children',
      description: 'Add your children as contacts...',
      priority: 'medium',
      type: 'onboarding',
      status: hasChildren ? 'completed' : 'open'
    }
  ];

  // Insert tasks that don't exist
  for (const task of onboardingTasks) {
    const existing = await dbSafe.safeSelect('tasks', {
      user_id: userId,
      title: task.title
    }, { limit: 1 });

    if (existing.length === 0) {
      await dbSafe.safeInsert('tasks', {
        user_id: userId,
        ...task,
        created_at: now,
        updated_at: now,
        completed_at: task.status === 'completed' ? now : null
      });
    }
  }
}
```

### 1.3 Add checkUserHasCoParent Helper

**Purpose**: Determine if user is paired with a co-parent

```javascript
async function checkUserHasCoParent(userId) {
  // Check pairing_sessions for completed pairing
  const pairings = await dbSafe.safeSelect('pairing_sessions', {
    status: 'completed'
  });

  // Check if user is initiator or invitee in any completed pairing
  for (const pairing of pairings) {
    if (pairing.initiator_id === userId || pairing.invitee_id === userId) {
      return true;
    }
  }

  // Also check rooms for 2-member rooms
  const roomMembers = await dbSafe.safeSelect('room_members', { user_id: userId });
  for (const member of roomMembers) {
    const otherMembers = await dbSafe.safeSelect('room_members', {
      room_id: member.room_id
    });
    if (otherMembers.length === 2) {
      return true;
    }
  }

  return false;
}
```

---

## Phase 2: Frontend InviteTaskModal Component

### 2.1 Create InviteTaskModal Component

**File**: `chat-client-vite/src/components/InviteTaskModal.jsx`

**Purpose**: Modal that opens when user clicks "Invite Your Co-Parent" task. Contains both "Send Invite" and "Have a Code?" functionality.

**Structure**:
```jsx
import React from 'react';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalBody, ModalFooter, ModalCloseButton } from './ui/Modal/Modal';
import { usePairing } from '../hooks/usePairing';

export function InviteTaskModal({ isOpen, onClose, onSuccess }) {
  const [activeTab, setActiveTab] = React.useState('send'); // 'send' | 'receive'
  const [inviteMethod, setInviteMethod] = React.useState('link'); // 'email' | 'link' | 'code'
  const [email, setEmail] = React.useState('');
  const [manualCode, setManualCode] = React.useState('');
  const [generatedResult, setGeneratedResult] = React.useState(null);

  const {
    createPairing,
    acceptPairing,
    validateCode,
    isCreating,
    isAccepting,
    isValidating,
    error,
    clearError,
    buildInviteUrl
  } = usePairing();

  // Tab: Send Invite
  // - Method selector (Email, Link, Code)
  // - Email input for email method
  // - Generate button
  // - Display result (code + link)
  // - Copy buttons

  // Tab: Have a Code
  // - Code input field
  // - Validate + Accept flow

  return (
    <Modal open={isOpen} onOpenChange={onClose}>
      <ModalContent className="max-w-md">
        <ModalHeader>
          <ModalTitle>Invite Your Co-Parent</ModalTitle>
          <ModalCloseButton />
        </ModalHeader>

        <ModalBody>
          {/* Tab Selector */}
          <div className="flex border-b border-gray-200 mb-4">
            <button
              onClick={() => setActiveTab('send')}
              className={`px-4 py-2 font-medium ${activeTab === 'send' ? 'border-b-2 border-teal-500 text-teal-700' : 'text-gray-500'}`}
            >
              Send Invite
            </button>
            <button
              onClick={() => setActiveTab('receive')}
              className={`px-4 py-2 font-medium ${activeTab === 'receive' ? 'border-b-2 border-teal-500 text-teal-700' : 'text-gray-500'}`}
            >
              Have a Code?
            </button>
          </div>

          {activeTab === 'send' && (
            <SendInviteTab
              method={inviteMethod}
              setMethod={setInviteMethod}
              email={email}
              setEmail={setEmail}
              result={generatedResult}
              setResult={setGeneratedResult}
              createPairing={createPairing}
              buildInviteUrl={buildInviteUrl}
              isCreating={isCreating}
              error={error}
            />
          )}

          {activeTab === 'receive' && (
            <HaveCodeTab
              code={manualCode}
              setCode={setManualCode}
              validateCode={validateCode}
              acceptPairing={acceptPairing}
              isValidating={isValidating}
              isAccepting={isAccepting}
              error={error}
              onSuccess={onSuccess}
            />
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
```

### 2.2 SendInviteTab Sub-component

**Features**:
- Method selector (Email, Link, Code icons)
- Email input field (for email method)
- Generate button
- Result display with:
  - Pairing code (e.g., LZ-842396)
  - Copy code button
  - Invite link (for link method)
  - Copy link button
  - Share button (mobile)

### 2.3 HaveCodeTab Sub-component

**Features**:
- Code input field with LZ- prefix hint
- Format validation (LZ-XXXXXX)
- Validate button → shows inviter name
- Accept/Connect button
- Success callback → refreshes tasks, closes modal

---

## Phase 3: Task Hook Improvements

### 3.1 Remove 5-Task Limit

**File**: `chat-client-vite/src/hooks/useTasks.js` (line 65)

**Current Code**:
```javascript
// Only limit to 5 if no search is active
if (!taskSearch) {
  setTasks(sorted.slice(0, 5));
  console.log(`[useTasks] Limited to 5 tasks for dashboard display`);
} else {
  setTasks(sorted);
}
```

**New Code**:
```javascript
// Show all tasks (pagination handled in UI if needed)
setTasks(sorted);
console.log(`[useTasks] Loaded ${sorted.length} tasks`);
```

### 3.2 Add Task Click Handler Support

**File**: `chat-client-vite/src/hooks/useTasks.js`

**Add**: Expose a way to handle special task types (onboarding tasks that open modals)

```javascript
const getTaskAction = React.useCallback((task) => {
  // Special handling for invite task
  if (task.title === 'Invite Your Co-Parent' && task.status !== 'completed') {
    return { type: 'modal', modal: 'invite' };
  }
  // Other tasks navigate to task detail or toggle status
  return { type: 'toggle' };
}, []);

return {
  // ... existing exports
  getTaskAction,
};
```

---

## Phase 4: Dashboard Cleanup

### 4.1 Remove Standalone Invite UI

**File**: `chat-client-vite/src/ChatRoom.jsx` (lines 1145-1243)

**Remove**:
```jsx
{/* Co-Parent Connection Cards - Always visible at top when no co-parent */}
{!hasCoParentConnected && (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* Send Invite Card */}
    <div className="rounded-xl border-2 border-emerald-400 ...">
      ...
    </div>

    {/* Enter Invite Code Card */}
    <div className="rounded-xl border-2 border-teal-400 ...">
      ...
    </div>
  </div>
)}
```

**Also Remove**:
- Lines 1246-1261: Error message and acceptance notification sections (related to standalone invite)

### 4.2 Add InviteTaskModal Integration

**File**: `chat-client-vite/src/ChatRoom.jsx`

**Add State**:
```javascript
const [showInviteModal, setShowInviteModal] = React.useState(false);
```

**Add Modal to JSX**:
```jsx
{showInviteModal && (
  <InviteTaskModal
    isOpen={showInviteModal}
    onClose={() => setShowInviteModal(false)}
    onSuccess={() => {
      setShowInviteModal(false);
      loadTasks(); // Refresh tasks
      // Trigger co-parent connection refresh
    }}
  />
)}
```

### 4.3 Wire Task Click to Modal

**In Task List Section**:
```javascript
const handleTaskClick = (task) => {
  const action = getTaskAction(task);
  if (action.type === 'modal' && action.modal === 'invite') {
    setShowInviteModal(true);
  } else {
    toggleTaskStatus(task);
  }
};
```

---

## Implementation Order

### Step 1: Backend (Estimated: 2-3 hours)
1. Add `checkUserHasCoParent` helper function
2. Add `backfillOnboardingTasks` function
3. Integrate backfill into GET /api/tasks
4. Test with existing users

### Step 2: InviteTaskModal (Estimated: 3-4 hours)
1. Create base modal component with tabs
2. Implement SendInviteTab with method selector
3. Implement HaveCodeTab with validation
4. Add copy/share functionality
5. Test all invite flows

### Step 3: Hook Improvements (Estimated: 1 hour)
1. Remove 5-task limit from useTasks.js
2. Add getTaskAction helper
3. Test task loading

### Step 4: Dashboard Integration (Estimated: 2 hours)
1. Remove standalone invite UI from ChatRoom.jsx
2. Add InviteTaskModal import and state
3. Wire task click handler
4. Test end-to-end flow

### Step 5: Testing & Polish (Estimated: 2 hours)
1. Test new user flow (tasks appear)
2. Test existing user flow (tasks backfilled)
3. Test invite generation (all 3 methods)
4. Test code acceptance
5. Verify task auto-completes on connection
6. Mobile testing

---

## Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `chat-server/server.js` | Modify | Add backfill logic to GET /api/tasks |
| `chat-client-vite/src/hooks/useTasks.js` | Modify | Remove 5-task limit, add getTaskAction |
| `chat-client-vite/src/components/InviteTaskModal.jsx` | Create | New modal component |
| `chat-client-vite/src/ChatRoom.jsx` | Modify | Remove standalone invite UI, add modal |

---

## Dependencies

- **Feature 004**: Account Pairing Refactor (provides `/api/pairing/*` endpoints) - **COMPLETED**
- **usePairing hook**: Already created in Feature 004

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Duplicate tasks from backfill | Check for existing task by title before creating |
| Modal conflicts with existing modals | Use consistent modal pattern from Modal.jsx |
| Task not auto-completing | Ensure autoCompleteOnboardingTasks runs after pairing completes |
| Performance with many tasks | Consider pagination in future if needed |

---

## Testing Checklist

- [ ] New user registration creates onboarding tasks
- [ ] Existing user without tasks gets backfilled tasks
- [ ] Task backfill doesn't create duplicates
- [ ] "Invite Your Co-Parent" task opens modal
- [ ] Modal Send Invite tab - Email method works
- [ ] Modal Send Invite tab - Link method works
- [ ] Modal Send Invite tab - Code method works
- [ ] Modal Have a Code tab validates correctly
- [ ] Modal Have a Code tab accepts and pairs
- [ ] Task auto-completes when co-parent connects
- [ ] Dashboard no longer shows standalone invite cards
- [ ] All tasks visible (no 5-task limit)
- [ ] Mobile responsive modal
