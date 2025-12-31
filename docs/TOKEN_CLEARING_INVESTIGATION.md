# 🔍 Token Clearing Investigation

**Date**: 2025-12-30  
**Issue**: Token is cleared immediately after successful login

## 🔄 Flow Analysis

### Expected Flow:
1. ✅ User logs in → `login()` succeeds
2. ✅ Token set in `TokenManager` and `authStorage`
3. ✅ `loginCompletedAtRef.current = Date.now()` set
4. ✅ `useAuthRedirect` navigates to `/` (delay: 0ms for login)
5. ✅ `ChatRoom` renders
6. ⚠️ `useInviteManagement` calls `checkRoomMembers()` after 100ms
7. ⚠️ `queryRoomMembers()` calls `apiGet('/api/room/members/check')`
8. ❌ **401 error** → `dispatchAuthFailure` → `onAuthFailure` → `clearAuthState()`

### Problem Identified:

**Issue 1: Grace Period Dependency**
- `onAuthFailure` handler uses `loginCompletedAtRef.current` in closure
- But `loginCompletedAtRef` is NOT in the dependency array
- This means the closure might capture a stale value
- However, refs don't need to be in deps (they're stable references)

**Issue 2: Timing Race Condition**
- `useAuthRedirect` navigates immediately (delay: 0ms)
- `ChatRoom` mounts and `useInviteManagement` waits 100ms
- But `verifySession()` might not have completed yet
- If `verifySession()` is still running, `isCheckingAuth` should be `true`
- But if it completes before the API call, `isCheckingAuth` is `false`
- Then the grace period check happens, but might fail if timing is off

**Issue 3: Token Not Persisting**
- Browser evaluation shows `hasToken: false` after redirect
- This suggests token was cleared, not that it was never set
- Token should be in `localStorage.getItem('auth_token_backup')`
- But browser shows it's not there

## 🐛 Root Cause Hypothesis

**Most Likely**: The `onAuthFailure` handler's dependency array doesn't include `loginCompletedAtRef`, but that's fine since refs are stable. However, the **real issue** might be:

1. **Token not being sent correctly** - The Authorization header might be malformed
2. **Server rejecting valid token** - Backend might have an issue validating the token
3. **Race condition** - `verifySession()` completes and sets `isCheckingAuth = false` before the API call, then the API call gets 401, and grace period check fails

## 🔧 Potential Fixes

### Fix 1: Increase Grace Period
- Current: 3 seconds
- Problem: Might not be enough if multiple API calls happen
- Solution: Increase to 5 seconds OR make it configurable

### Fix 2: Check Token Before Clearing
- Current: Checks `token || authStorage.getToken()`
- Problem: Might check stale state
- Solution: Always check `tokenManager.getToken()` (single source of truth)

### Fix 3: Delay API Calls After Login
- Current: `useInviteManagement` waits 100ms
- Problem: Might be too short
- Solution: Wait longer OR check if login just completed

### Fix 4: Don't Clear Auth During Initial Load
- Current: Clears auth on 401
- Problem: Might clear during initial verification
- Solution: Add a flag to track if app just loaded

## 📊 Next Steps

1. Add more detailed logging to trace the exact sequence
2. Check server logs to see if token is being received
3. Verify token format is correct
4. Test with increased grace period
5. Add check to prevent clearing auth immediately after login

