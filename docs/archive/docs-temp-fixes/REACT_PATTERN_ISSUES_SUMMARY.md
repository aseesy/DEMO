# React Pattern Issues Summary

**Date**: 2025-01-01

---

## Critical Issues

### 🔴 Issue 1: useSearchMessages Missing socketRef (BUG)

**Location**: `ChatContext.jsx` line 93

```javascript
const searchHook = useSearchMessages({ username, setError }); // ← Missing socketRef ❌
```

**Problem**: `useSearchMessages` requires `socketRef` but it's not passed. The hook uses `socketRef.current.emit()` for search functionality.

**Impact**: Search functionality will fail with "Cannot read property 'emit' of undefined"

**Fix Options**:
1. **Option A (Preferred)**: Change `useSearchMessages` to use `socketService.emit()` directly instead of requiring socketRef
2. **Option B**: Add socketRef to ChatContext

**Priority**: 🔴 **HIGH** - Breaks search functionality

---

## Medium Priority Issues

### 🟡 Issue 2: ChatContext useMemo Dependencies on Whole Objects

**Location**: `ChatContext.jsx` lines 285-304

```javascript
const value = React.useMemo(
  () => ({ /* ... */ }),
  [
    room,      // ← Whole object (new ref each render if state changes)
    messaging, // ← Whole object (new ref each render if state changes)
    coaching,  // ← Whole object
    typing,    // ← Whole object
    threads,   // ← Whole object
    searchHook,// ← Whole object
    unread,    // ← Whole object
  ]
);
```

**Problem**: 
- Hooks return `{ ...state, ...callbacks }` - the object is a new reference when state changes
- This makes useMemo ineffective - it will re-compute on every state change
- All context consumers re-render even if their specific values haven't changed

**Impact**: Performance - unnecessary re-renders of all ChatContext consumers

**Fix**: Extract specific properties instead of whole objects:

```javascript
const value = React.useMemo(
  () => ({
    isJoined: room.isJoined,
    roomId: room.roomId,
    messages: messaging.messages,
    // ... specific properties only
  }),
  [
    room.isJoined,      // ← Specific property
    room.roomId,        // ← Specific property
    messaging.messages, // ← Specific property
    // ... specific properties only
  ]
);
```

**Priority**: 🟡 **MEDIUM** - Performance optimization

---

## Low Priority Issues

### 🟢 Issue 3: Console.log in Render

**Location**: `ChatContext.jsx` lines 30, 40, 44

```javascript
console.log('[ChatProvider] Rendering with:', ...); // ← In render
```

**Problem**: Console.log is a side effect, shouldn't be in render

**Fix**: Wrap in useEffect or DEV check:

```javascript
React.useEffect(() => {
  if (import.meta.env.DEV) {
    console.log('[ChatProvider] Rendering with:', ...);
  }
}, [deps]);
```

**Priority**: 🟢 **LOW** - Code smell, not breaking

### 🟢 Issue 4: useSocketEvents Dependency Array

**Location**: `useSocketSubscription.js` line 68

```javascript
}, [Object.keys(handlers).join(',')]); // ← String comparison
```

**Problem**: Dependency array uses string comparison, could be clearer

**Impact**: Works correctly (handlersRef.current is always current), but misleading

**Fix**: Document or use more explicit dependency

**Priority**: 🟢 **LOW** - Works, but could be clearer

---

## Recommendations

### Immediate (Fix Bugs)
1. ✅ **Fix useSearchMessages socketRef** - Either change hook to use socketService.emit() or add socketRef

### Soon (Performance)
2. ✅ **Optimize ChatContext useMemo** - Use specific properties instead of whole objects

### Nice to Have (Code Quality)
3. Move console.log to useEffect
4. Clarify useSocketEvents dependency array

---

## User's Addition: subscribeToState

**Location**: `useSocketConnection` lines 101-108

✅ **GOOD** - This is correct React pattern:
- Properly subscribes in useEffect
- Returns cleanup function
- Empty dependency array is correct (only run once)

