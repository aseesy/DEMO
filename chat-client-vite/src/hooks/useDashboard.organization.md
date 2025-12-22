# useDashboard.js - Code Organization Analysis

## Current Structure

```javascript
1. Imports
2. Function signature + JSDoc
3. Instance variable: shouldLoadTasks (derived from params)
4. Hook call: useTasks() - returns task state
5. Hook call: useModalControllerDefault() - returns modal state
6. useMemo: taskState (depends on task variables)
7. useMemo: taskHandlers (depends on task variables + taskFormModal)
8. useMemo: modalHandlers (depends on modal objects)
9. useMemo: threadState (no dependencies)
10. Return statement (mixed: grouped props + raw state)
```

## Issues Found

### ❌ Issue 1: Return Statement Organization

**Problem:** Return statement mixes conceptual groups

```javascript
return {
  // Grouped props for DashboardView
  taskState,
  taskHandlers,
  modalHandlers,
  threadState,

  // Raw state for ChatRoom
  tasks,
  isLoadingTasks,
  showTaskForm,
  // ... mixed with modal state
  welcomeModal,
  // ...
};
```

**Issue:** Grouped props and raw state are interleaved, making it hard to see what's for DashboardView vs ChatRoom.

### ⚠️ Issue 2: Conceptual Affinity

**Current grouping:**

- ✅ Task-related: `useTasks()` → `taskState` → `taskHandlers` (good)
- ✅ Modal-related: `useModalControllerDefault()` → `modalHandlers` (good)
- ❌ Return statement: Mixed groups (bad)

### ✅ Issue 3: Dependent Functions

**Status:** Good - useMemo hooks are defined after their dependencies

- `taskState` depends on task variables ✓
- `taskHandlers` depends on task variables + taskFormModal ✓
- `modalHandlers` depends on modal objects ✓

### ✅ Issue 4: Instance Variables

**Status:** Good - `shouldLoadTasks` is defined before use

- Derived from params ✓
- Used immediately in `useTasks()` ✓

## Recommended Organization

### Best Practice Order for React Hooks:

1. **Parameters & Validation**
2. **Derived Values** (computed from params)
3. **Hook Calls** (dependencies)
4. **Computed Values** (useMemo, useCallback)
5. **Effects** (useEffect)
6. **Return Statement** (organized by conceptual groups)

### Improved Structure:

```javascript
export function useDashboard({ username, isAuthenticated, messages = [], setCurrentView }) {
  // ============================================
  // 1. DERIVED VALUES (from params)
  // ============================================
  const shouldLoadTasks = isAuthenticated && !!username;

  // ============================================
  // 2. HOOK CALLS (dependencies)
  // ============================================
  // Task state management
  const {
    tasks,
    isLoadingTasks,
    taskSearch,
    taskFilter,
    showTaskForm,
    editingTask,
    taskFormData,
    setShowTaskForm,
    setEditingTask,
    setTaskFormData,
    setTaskSearch,
    setTaskFilter,
    toggleTaskStatus,
    saveTask,
    loadTasks,
  } = useTasks(username, shouldLoadTasks);

  // Modal state management
  const { welcomeModal, profileTaskModal, inviteModal, taskFormModal } = useModalControllerDefault({
    messages,
    setCurrentView,
    dependencies: {},
  });

  // ============================================
  // 3. COMPUTED VALUES (useMemo)
  // ============================================
  // Grouped props for DashboardView
  const taskState = React.useMemo(
    () => ({
      tasks,
      isLoadingTasks,
      taskSearch,
      taskFilter,
      setTaskSearch,
      setTaskFilter,
    }),
    [tasks, isLoadingTasks, taskSearch, taskFilter]
  );

  const taskHandlers = React.useMemo(
    () => ({
      setEditingTask,
      setShowTaskForm,
      setTaskFormMode: taskFormModal.setTaskFormMode,
      setAiTaskDetails: taskFormModal.setAiTaskDetails,
      setIsGeneratingTask: taskFormModal.setIsGeneratingTask,
      setTaskFormData,
      toggleTaskStatus,
    }),
    [
      setEditingTask,
      setShowTaskForm,
      taskFormModal.setTaskFormMode,
      taskFormModal.setAiTaskDetails,
      taskFormModal.setIsGeneratingTask,
      setTaskFormData,
      toggleTaskStatus,
    ]
  );

  const modalHandlers = React.useMemo(
    () => ({
      setShowWelcomeModal: welcomeModal.setShow,
      setShowProfileTaskModal: profileTaskModal.setShow,
      setShowInviteModal: inviteModal.setShow,
    }),
    [welcomeModal.setShow, profileTaskModal.setShow, inviteModal.setShow]
  );

  const threadState = React.useMemo(
    () => ({
      threads: [],
      selectedThreadId: null,
      setSelectedThreadId: () => {},
      getThreadMessages: () => {},
    }),
    []
  );

  // ============================================
  // 4. RETURN (organized by conceptual groups)
  // ============================================
  return {
    // Grouped props for DashboardView
    taskState,
    taskHandlers,
    modalHandlers,
    threadState,

    // Raw task state for ChatRoom (GlobalModals)
    tasks,
    isLoadingTasks,
    showTaskForm,
    editingTask,
    taskFormData,
    setShowTaskForm,
    setEditingTask,
    setTaskFormData,
    setTaskSearch,
    setTaskFilter,
    toggleTaskStatus,
    saveTask,
    loadTasks,

    // Raw modal state for ChatRoom (GlobalModals)
    welcomeModal,
    profileTaskModal,
    inviteModal,
    taskFormModal,
  };
}
```

## Improvements Made

1. ✅ **Clear Section Headers** - Visual separation of concerns
2. ✅ **Logical Order** - Derived → Hooks → Computed → Return
3. ✅ **Conceptual Grouping in Return** - Grouped props first, then raw state grouped by type
4. ✅ **Better Comments** - Explain purpose of each section

## Assessment

### Current: **Good** (7/10)

- ✅ Instance variables in correct order
- ✅ Dependent functions after dependencies
- ✅ Conceptual affinity mostly good
- ❌ Return statement could be better organized

### Recommended: **Excellent** (9/10)

- ✅ All of the above
- ✅ Clear section headers
- ✅ Return statement organized by conceptual groups
- ✅ Better visual organization
