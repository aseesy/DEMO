# Encapsulation Violation - useDashboard

## Problem Identified

**Issue:** `useDashboard` is reaching inside `taskFormModal` to extract methods and repackage them into `taskHandlers`.

### Current Code (Violation):

```javascript
// useDashboard.js
const {
  taskFormModal,  // Returns: { taskFormMode, setTaskFormMode, aiTaskDetails, setAiTaskDetails, ... }
} = useModalControllerDefault({ ... });

const taskHandlers = React.useMemo(
  () => ({
    setEditingTask,
    setShowTaskForm,
    setTaskFormMode: taskFormModal.setTaskFormMode,  // ❌ Reaching inside
    setAiTaskDetails: taskFormModal.setAiTaskDetails,  // ❌ Reaching inside
    setIsGeneratingTask: taskFormModal.setIsGeneratingTask,  // ❌ Reaching inside
    setTaskFormData,
    toggleTaskStatus,
  }),
  [..., taskFormModal.setTaskFormMode, taskFormModal.setAiTaskDetails, taskFormModal.setIsGeneratingTask, ...]
);
```

## Why This Is A Problem

1. **Violates Encapsulation** - `useDashboard` knows about the internal structure of `taskFormModal`
2. **Tight Coupling** - If `taskFormModal` structure changes, `useDashboard` breaks
3. **Unnecessary Indirection** - Extracting and repackaging adds complexity
4. **Inconsistent API** - Some handlers come from `useTasks`, others from `taskFormModal`

## Analysis

### How taskFormModal is Used:

1. **In useDashboard** - Methods extracted for `taskHandlers`
2. **In ChatRoom** - Used directly: `taskFormModal.taskFormMode`, `taskFormModal.setTaskFormMode`, etc.
3. **In GlobalModals** - Receives individual props: `taskFormMode`, `setTaskFormMode`, etc.

### Current Structure:

```
useModalControllerDefault returns:
{
  taskFormModal: {
    taskFormMode,
    setTaskFormMode,
    aiTaskDetails,
    setAiTaskDetails,
    isGeneratingTask,
    setIsGeneratingTask,
  }
}
```

## Solutions

### Option 1: Flatten taskFormModal in useModalControllerDefault

If these methods are critical for task handling, return them at the top level:

```javascript
// useModalControllerDefault returns:
{
  // Modal objects (for modal-specific operations)
  taskFormModal: { ... },

  // Flat handlers (for task operations)
  setTaskFormMode,
  setAiTaskDetails,
  setIsGeneratingTask,
  taskFormMode,
  aiTaskDetails,
  isGeneratingTask,
}
```

**Pros:**

- No reaching inside objects
- Direct access for taskHandlers
- Still maintains modal object for other uses

**Cons:**

- Duplicates some properties
- Might confuse which to use

### Option 2: Return taskFormModal handlers separately

```javascript
// useModalControllerDefault returns:
{
  taskFormModal: { ... },  // For modal operations
  taskFormHandlers: {      // For task operations
    setTaskFormMode,
    setAiTaskDetails,
    setIsGeneratingTask,
  }
}
```

**Pros:**

- Clear separation of concerns
- No duplication
- Explicit intent

**Cons:**

- Adds another object to return

### Option 3: Have useTaskFormModal return flat structure

Change `useTaskFormModal` to return handlers directly, not nested:

```javascript
// useTaskFormModal returns:
{
  taskFormMode,
  setTaskFormMode,
  aiTaskDetails,
  setAiTaskDetails,
  isGeneratingTask,
  setIsGeneratingTask,
}

// useModalControllerDefault spreads it:
{
  ...taskFormModal,  // Flat structure
  welcomeModal: { ... },
  ...
}
```

**Pros:**

- Simplest solution
- No reaching inside
- Direct access

**Cons:**

- Changes structure for all consumers
- Might break other code

## Recommendation

**Option 2** seems best - return `taskFormHandlers` separately. This:

- Maintains encapsulation
- Provides clear API
- Doesn't break existing code
- Makes intent explicit
