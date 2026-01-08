# useSearchMessages Fix: Remove socketRef Dependency

**Date**: 2025-01-01  
**Status**: ✅ **COMPLETE**

---

## Problem

`useSearchMessages` hook required `socketRef` parameter, but `ChatContext` wasn't passing it, causing search functionality to fail.

**Before**:
```javascript
export function useSearchMessages({ socketRef, username, setError }) {
  // Uses socketRef.current.emit() ❌
  socketRef.current.emit('search_messages', { query });
}

// In ChatContext:
const searchHook = useSearchMessages({ username, setError }); // ← Missing socketRef ❌
```

**Issue**: 
- `socketRef` was required but not passed from `ChatContext`
- Would throw error: "Cannot read property 'emit' of undefined"
- Search functionality broken

---

## Solution

Changed `useSearchMessages` to use `socketService.emit()` directly (consistent with architecture).

**After**:
```javascript
import { socketService } from '../../../services/socket/index.js';

export function useSearchMessages({ username, setError }) {
  // Uses socketService.emit() directly ✅
  socketService.emit('search_messages', { query });
}

// In ChatContext:
const searchHook = useSearchMessages({ username, setError }); // ← No socketRef needed ✅
```

---

## Changes Made

1. **Removed `socketRef` parameter** from hook signature
2. **Added `socketService` import**
3. **Updated `searchMessages` callback** to use `socketService.isConnected()` and `socketService.emit()`
4. **Updated `jumpToMessage` callback** to use `socketService.isConnected()` and `socketService.emit()`
5. **Updated `exitSearchMode` callback** to use `socketService.isConnected()` and `socketService.emit()`
6. **Removed `socketRef` from dependency arrays**

---

## Benefits

1. ✅ **Fixes bug** - Search functionality now works
2. ✅ **Consistent architecture** - Uses `socketService` singleton like other hooks
3. ✅ **Simpler API** - No need to pass `socketRef` around
4. ✅ **Better separation** - Hook doesn't depend on React refs for socket access

---

## Test Updates Needed

Tests will need to be updated to mock `socketService` instead of `socketRef`:

**Before**:
```javascript
const mockSocketRef = { current: { emit: vi.fn(), connected: true } };
useSearchMessages({ socketRef: mockSocketRef, ... });
```

**After**:
```javascript
vi.mock('../../../services/socket/index.js', () => ({
  socketService: {
    isConnected: vi.fn(() => true),
    emit: vi.fn(),
  },
}));
useSearchMessages({ username, setError });
```

---

## Files Changed

- `chat-client-vite/src/features/chat/model/useSearchMessages.js`
  - Removed `socketRef` parameter
  - Added `socketService` import
  - Updated all emit calls to use `socketService.emit()`
  - Updated connection checks to use `socketService.isConnected()`

