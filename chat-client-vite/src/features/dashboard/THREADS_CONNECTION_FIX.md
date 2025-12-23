# Threads Connection Fix - Dashboard ↔ Chat

## Problem

Threads on the Dashboard were not connected to threads in Chat because they were using **two separate socket connections**:

1. **Dashboard**: Used `useThreads` hook → Created its own socket connection
2. **Chat**: Used `ChatContext` (via `useChatSocket`) → Created a different socket connection

This meant:

- ❌ Threads created in Chat didn't appear on Dashboard
- ❌ Threads created on Dashboard didn't appear in Chat
- ❌ Two separate socket connections (wasteful)
- ❌ Thread state was not synchronized

## Solution

**Dashboard now uses threads from `ChatContext`** (shared with Chat view):

```javascript
// OLD (useDashboard.js)
import { useThreads } from '../chat/model/useThreads.js';
const { threads, ... } = useThreads(username, shouldLoadThreads);

// NEW (useDashboard.js)
import { useChatContext } from '../chat/context/ChatContext.jsx';
const chatContext = useChatContext();
const threads = chatContext?.threads || [];
const selectedThreadId = chatContext?.selectedThreadId || null;
const setSelectedThreadId = chatContext?.setSelectedThreadId || (() => {});
const getThreadMessages = chatContext?.getThreadMessages || (() => {});
```

## Architecture

```
┌─────────────────────────────────────┐
│   ChatProvider (App Level)          │
│   - Provides ChatContext             │
│   - Manages single socket connection │
└──────────────┬──────────────────────┘
               │
       ┌───────┴────────┐
       │                │
       ↓                ↓
┌──────────────┐  ┌──────────────┐
│   Chat View  │  │  Dashboard   │
│              │  │              │
│ useChatContext│  │ useChatContext│
│              │  │              │
│  threads ✓   │  │  threads ✓   │
└──────────────┘  └──────────────┘
       │                │
       └────────┬───────┘
                ↓
        ┌───────────────┐
        │ useChatSocket │
        │ (single socket)│
        └───────────────┘
```

## Benefits

✅ **Single Source of Truth**: Threads come from one place (`ChatContext`)
✅ **Synchronized State**: Threads created in Chat appear on Dashboard immediately
✅ **Single Socket Connection**: No duplicate connections
✅ **Consistent State**: Both views see the same threads

## What Changed

### Files Modified

1. **`chat-client-vite/src/features/dashboard/useDashboard.js`**
   - Removed: `import { useThreads } from '../chat/model/useThreads.js'`
   - Added: `import { useChatContext } from '../chat/context/ChatContext.jsx'`
   - Changed: Thread state now comes from `ChatContext` instead of `useThreads`

### Thread State Available from ChatContext

- `threads` - Array of thread objects
- `selectedThreadId` - Currently selected thread ID
- `setSelectedThreadId` - Function to select a thread
- `getThreadMessages` - Function to load messages for a thread
- `getThreads` - Function to refresh threads list
- `createThread` - Function to create a new thread
- `addToThread` - Function to add message to thread

## Testing

To verify the fix works:

1. **Create a thread in Chat** → Should appear on Dashboard immediately
2. **Click a thread on Dashboard** → Should navigate to Chat and show that thread
3. **Check browser DevTools** → Should see only ONE socket connection (not two)

## Notes

- `useThreads` hook still exists but is no longer used by Dashboard
- `useThreads` may still be used elsewhere or can be deprecated
- `analyzeConversation` function is not exposed by ChatContext, but Dashboard doesn't need it (analysis happens automatically in ChatContext)
