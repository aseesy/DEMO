# useDashboard.js - Architecture Analysis

## File Connections

### Imports (Dependencies)

1. **`useTasks`** - Task management hook
2. **`useModalControllerDefault`** - Modal state management hook

### Used By (Dependents)

1. **`ChatRoom.jsx`** - Main application component
   - Calls `useDashboard` at line 151
   - Passes props to `DashboardView` at line 324

### Returns To

1. **`DashboardView.jsx`** - Dashboard view component
   - Receives grouped props: `taskState`, `taskHandlers`, `modalHandlers`, `threadState`

## Architecture Issues Found

### ❌ Issue 1: Duplicate Task Loading

**Problem:**

```javascript
// ChatRoom.jsx (lines 131-147)
const {
  tasks,
  isLoadingTasks,
  // ... all task state
} = useTasks(username, shouldLoadTasks); // ❌ Tasks loaded here

// ChatRoom.jsx (lines 151-156)
const dashboardProps = useDashboard({
  username,
  isAuthenticated,
  messages: [],
  setCurrentView,
});

// useDashboard.js (lines 31-42)
const {
  tasks,
  isLoadingTasks,
  // ... all task state
} = useTasks(username, shouldLoadTasks); // ❌ Tasks loaded AGAIN here
```

**Impact:**

- Tasks are loaded twice (wasteful API calls)
- Two separate task state instances (potential sync issues)
- Dashboard uses its own task state, but ChatRoom also has task state

**Solution:**

- Remove `useTasks` from `ChatRoom.jsx` if it's only used for Dashboard
- OR: Pass task state from ChatRoom to useDashboard (but this violates encapsulation)

### ❌ Issue 2: Duplicate Modal Controller

**Problem:**

```javascript
// ChatRoom.jsx (lines 201-212)
const {
  welcomeModal,
  profileTaskModal,
  inviteModal,
  taskFormModal,
  contactSuggestionModal,
  messageFlaggingModal,
} = useModalControllerDefault({
  messages: [],
  setCurrentView,
  dependencies: {},
}); // ❌ Modal controller created here

// useDashboard.js (lines 45-54)
const { welcomeModal, profileTaskModal, inviteModal, taskFormModal } = useModalControllerDefault({
  messages,
  setCurrentView,
  dependencies: {},
}); // ❌ Modal controller created AGAIN here
```

**Impact:**

- Two separate modal state instances
- Dashboard modals and ChatRoom modals are not synchronized
- Comment in ChatRoom says "Dashboard uses modalHandlers from useDashboard" but ChatRoom also creates its own

**Solution:**

- Remove `useModalControllerDefault` from `ChatRoom.jsx` for modals used by Dashboard
- Use modals from `dashboardProps.modalHandlers` instead
- Keep `useModalControllerDefault` in ChatRoom only for modals NOT used by Dashboard

### ⚠️ Issue 3: Unused Messages Prop

**Problem:**

```javascript
// ChatRoom.jsx (line 154)
const dashboardProps = useDashboard({
  username,
  isAuthenticated,
  messages: [], // ⚠️ Empty array passed
  setCurrentView,
});

// useDashboard.js (line 50)
useModalControllerDefault({
  messages, // ⚠️ Empty array passed to modal controller
  setCurrentView,
  dependencies: {},
});
```

**Impact:**

- `messages` is always empty for Dashboard
- `contactSuggestionModal` won't detect suggestions (needs messages)
- But Dashboard might not need contact suggestions anyway

**Solution:**

- If Dashboard doesn't need messages, remove the prop
- OR: Pass actual messages if Dashboard should show contact suggestions

## Current Architecture Flow

```
ChatRoom.jsx
├── useTasks() ──────────────┐
│                           │
├── useDashboard()          │
│   ├── useTasks() ─────────┼─── ❌ Duplicate!
│   └── useModalControllerDefault()
│                           │
└── useModalControllerDefault() ── ❌ Duplicate!
```

## Recommended Architecture

```
ChatRoom.jsx
├── useDashboard() (owns tasks and modals for Dashboard)
│   ├── useTasks() ──────────┐
│   └── useModalControllerDefault() ──┐
│                                      │
└── useModalControllerDefault() ───────┼─── Only for non-Dashboard modals
    (contactSuggestionModal, messageFlaggingModal)
```

## Prop Flow Analysis

### ✅ Correct Prop Flow

```
useDashboard returns:
├── taskState ──────────────> DashboardView.taskState ✅
├── taskHandlers ────────────> DashboardView.taskHandlers ✅
├── modalHandlers ───────────> DashboardView.modalHandlers ✅
└── threadState ─────────────> DashboardView.threadState ✅
```

### ✅ Correct Props Passed

```
ChatRoom passes to DashboardView:
├── username ✅
├── hasCoParentConnected ✅
├── contacts ✅
├── setCurrentView ✅
├── taskState (from dashboardProps) ✅
├── taskHandlers (from dashboardProps) ✅
├── modalHandlers (from dashboardProps) ✅
└── threadState (from dashboardProps) ✅
```

## Summary

### ✅ What's Good

1. **Clean prop grouping** - Props are well-organized into logical objects
2. **ViewModel pattern** - useDashboard acts as ViewModel, encapsulating state
3. **Proper prop flow** - Props match between useDashboard return and DashboardView expectations
4. **Dependency inversion** - Dashboard owns its dependencies internally

### ❌ What Needs Fixing

1. **Duplicate task loading** - Tasks loaded twice (ChatRoom + useDashboard)
2. **Duplicate modal controller** - Modal state created twice (ChatRoom + useDashboard)
3. **Unused messages prop** - Empty array passed but not needed

### 🎯 Recommendations

1. Remove `useTasks` from `ChatRoom.jsx` if it's only used for Dashboard
2. Remove `useModalControllerDefault` from `ChatRoom.jsx` for Dashboard modals
3. Keep `useModalControllerDefault` in ChatRoom only for modals used by other views
4. Remove `messages` prop from `useDashboard` if Dashboard doesn't need it
