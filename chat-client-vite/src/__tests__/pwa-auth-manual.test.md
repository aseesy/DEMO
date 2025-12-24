# PWA Authentication Flow - Manual Test Guide

## Changes Made

### 1. AuthContext.jsx - Synchronous Auth State Initialization
- **Before**: Auth state initialized as `false`, then loaded from storage in `useEffect`
- **After**: Auth state initialized synchronously from storage using `useMemo`
- **Impact**: `isAuthenticated` is `true` on first render if valid token exists in storage

### 2. ChatRoom.jsx - Landing Page Logic
- **Before**: `showLanding` initialized only from storage, ignoring context auth state
- **After**: `showLanding` checks `isAuthenticated` from context AND storage
- **Impact**: Landing page hidden immediately if user is authenticated (from optimistic load)

### 3. ChatRoom.jsx - Redirect Logic
- **Before**: Could redirect before auth check completed
- **After**: Waits for `isCheckingAuth` to complete, then redirects based on auth state
- **Impact**: No premature redirects, authenticated users stay logged in

## Test Scenarios

### Test 1: PWA Launch with Stored Auth (Should Auto-Login)

**Steps:**
1. Open app in browser
2. Log in with valid credentials
3. Verify you're on dashboard/chat (not landing page)
4. Add app to home screen (PWA install)
5. Close app completely
6. Launch app from home screen icon

**Expected Result:**
- ✅ App opens directly to dashboard/chat
- ✅ No landing page shown
- ✅ No sign-in page shown
- ✅ User is automatically logged in

**If landing page appears:**
- Check browser console for errors
- Verify localStorage has:
  - `auth_token_backup` (JWT token)
  - `isAuthenticated` (should be `true`)
  - `username` (your username)
- Check if token is expired (tokens expire after set time)

### Test 2: PWA Launch without Stored Auth (Should Show Sign-In)

**Steps:**
1. Clear browser localStorage
2. Close app completely
3. Launch app from home screen icon

**Expected Result:**
- ✅ App redirects to `/signin`
- ✅ Sign-in page is shown
- ✅ User can log in

### Test 3: Token Expiration Handling

**Steps:**
1. Log in
2. Manually expire token in localStorage (or wait for expiration)
3. Launch app from home screen

**Expected Result:**
- ✅ App detects expired token
- ✅ Clears auth state
- ✅ Redirects to sign-in page

## Debugging

If auto-login doesn't work:

1. **Check localStorage:**
   ```javascript
   // In browser console:
   localStorage.getItem('auth_token_backup')
   localStorage.getItem('isAuthenticated')
   localStorage.getItem('username')
   ```

2. **Check token expiration:**
   ```javascript
   // In browser console:
   const token = localStorage.getItem('auth_token_backup');
   if (token) {
     const payload = JSON.parse(atob(token.split('.')[1]));
     const exp = new Date(payload.exp * 1000);
     console.log('Token expires:', exp);
     console.log('Is expired:', Date.now() >= payload.exp * 1000);
   }
   ```

3. **Check React state:**
   - Open React DevTools
   - Check `AuthProvider` component
   - Verify `isAuthenticated` is `true`
   - Verify `isCheckingAuth` is `false` after initial load

4. **Check network requests:**
   - Open DevTools Network tab
   - Look for `/api/auth/verify` request
   - Verify it returns `{ authenticated: true }`

## Implementation Details

### AuthContext Initialization Flow:
1. Component mounts
2. `useMemo` runs synchronously, loads auth from storage
3. State initialized with stored values (if valid)
4. `useEffect` runs, calls `verifySession()` to confirm with server
5. Server verification updates state if needed

### ChatRoom Landing Page Logic:
1. `showLanding` initialized checking `isAuthenticated` from context
2. If `isAuthenticated` is `true`, `showLanding = false`
3. `useEffect` watches `isAuthenticated` and updates `showLanding`
4. Landing page only shown if `!isAuthenticated && showLanding`

