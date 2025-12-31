# 🔀 Login to Dashboard Routing Flow

**Date**: 2025-12-30  
**Status**: ✅ **Complete Documentation**

## 📋 Overview

This document explains the files and flow responsible for routing users from login to dashboard after authentication.

## 🗂️ Key Files

### 1. **Route Configuration**
**File**: `chat-client-vite/src/App.jsx`

**Lines**: 211-236

```jsx
<BrowserRouter>
  <Routes>
    {/* Root route - shows landing or dashboard based on auth */}
    <Route path="/" element={<ChatRoom />} />
    {/* Sign in route - dedicated login/signup page */}
    <Route path="/signin" element={<LoginSignup />} />
    ...
  </Routes>
</BrowserRouter>
```

**Responsibility**: Defines React Router routes. Root path (`/`) renders `ChatRoom`, which conditionally shows landing page or dashboard based on auth state.

---

### 2. **Login Component**
**File**: `chat-client-vite/src/features/auth/components/LoginSignup.jsx`

**Key Sections**:
- **Lines 36-73**: Component setup with `useAuth()` and `useAuthRedirect()`
- **Lines 89-102**: Form submission handler (`handleSubmit`)
- **Lines 68-73**: Uses `useAuthRedirect` hook to redirect after authentication

**Flow**:
1. User submits login form
2. Calls `handleLogin()` from `useAuth()` hook
3. On success, `isAuthenticated` becomes `true`
4. `useAuthRedirect` hook detects authentication
5. Redirects to home (`/`) after 100ms delay

---

### 3. **Auth Redirect Hook**
**File**: `chat-client-vite/src/features/auth/model/useAuthRedirect.js`

**Key Code** (Lines 34-70):

```javascript
export function useAuthRedirect({
  isAuthenticated = false,
  isNewSignup = false,
  afterLoginPath = DEFAULT_REDIRECT_PATHS.afterLogin,  // NavigationPaths.HOME = '/'
  afterSignupPath = DEFAULT_REDIRECT_PATHS.afterSignup, // NavigationPaths.INVITE_COPARENT
  delay = 100,
  clearInviteCode = true,
} = {}) {
  const { navigate } = useAppNavigation();

  React.useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const timer = setTimeout(() => {
      // Clear pending invite code if requested
      if (clearInviteCode) {
        storage.remove(StorageKeys.PENDING_INVITE_CODE);
      }

      // Navigate based on signup vs login
      const destination = isNewSignup ? afterSignupPath : afterLoginPath;
      navigate(destination, { replace: true });  // Navigates to '/' for login
    }, delay);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isNewSignup, afterLoginPath, afterSignupPath, delay, clearInviteCode, navigate]);
}
```

**Responsibility**: 
- Watches `isAuthenticated` state
- After login: Redirects to `NavigationPaths.HOME` (`/`)
- After signup: Redirects to `NavigationPaths.INVITE_COPARENT` (`/invite-coparent`)
- Uses `replace: true` to avoid adding to browser history

---

### 4. **Navigation Paths**
**File**: `chat-client-vite/src/adapters/navigation/NavigationAdapter.js`

**Key Constants**:

```javascript
export const NavigationPaths = {
  HOME: '/',
  SIGNIN: '/signin',
  INVITE_COPARENT: '/invite-coparent',
  ACCEPT_INVITE: '/accept-invite',
  // ... more paths
};
```

**Responsibility**: Centralized path constants used throughout the app.

---

### 5. **Main Routing Component**
**File**: `chat-client-vite/src/ChatRoom.jsx`

**Key Sections**:

#### **Authentication Check & Redirect** (Lines 201-239)

```javascript
React.useEffect(() => {
  const currentPath = window.location.pathname;

  // Don't redirect while checking auth
  if (isCheckingAuth) {
    return;
  }

  // If authenticated, ensure we're not on sign-in page (redirect to home)
  if (isAuthenticated) {
    const isOnSignIn = currentPath === '/signin' || currentPath === '/sign-in';
    if (isOnSignIn && !hasRedirectedRef.current) {
      navigate('/', { replace: true });  // Redirect from /signin to /
      return;
    }
    // Ensure landing page is hidden
    if (showLandingRef.current) {
      setShowLanding(false);
    }
    return;
  }
  // ... not authenticated logic
}, [isCheckingAuth, isAuthenticated, navigate]);
```

**Responsibility**: 
- Redirects authenticated users away from `/signin` to `/`
- Hides landing page when authenticated

#### **View Rendering** (Lines 636-713)

```javascript
// Main authenticated UI
return (
  <>
    <Navigation currentView={currentView} setCurrentView={setCurrentView} ... />
    
    {/* Conditional rendering based on currentView */}
    {currentView === 'dashboard' && (
      <DashboardView
        username={username}
        email={email}
        ...
      />
    )}
    
    {currentView === 'chat' && (
      <ChatView ... />
    )}
    ...
  </>
);
```

**Responsibility**: 
- Renders `DashboardView` when `currentView === 'dashboard'`
- Default view is `'dashboard'` (set in parent component)

---

### 6. **Auth Context**
**File**: `chat-client-vite/src/context/AuthContext.jsx`

**Key Function**: `login()` (Lines 348-408)

```javascript
const login = React.useCallback(async (email, password) => {
  setIsLoggingIn(true);
  setError(null);

  try {
    const response = await apiPost('/api/auth/login', {
      email: cleanEmail,
      password: cleanPassword,
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle error
      return { success: false, error: ... };
    }

    // Success - update auth state
    const { user, token } = data;
    
    setIsAuthenticated(true);  // ← This triggers useAuthRedirect
    authStorage.setAuthenticated(true);
    
    // Set token in TokenManager (synchronously)
    tokenManager.setToken(token);
    setToken(token);
    loginCompletedAtRef.current = Date.now();

    return { success: true, user };
  } catch (err) {
    // Handle error
  }
}, []);
```

**Responsibility**:
- Makes API call to `/api/auth/login`
- Updates `isAuthenticated` state to `true` on success
- Sets token in TokenManager and storage
- This state change triggers `useAuthRedirect` hook

---

### 7. **Dashboard View**
**File**: `chat-client-vite/src/features/dashboard/DashboardView.jsx`

**Responsibility**: 
- Rendered when `currentView === 'dashboard'`
- Shows dashboard content (tasks, contacts, stats, etc.)

---

## 🔄 Complete Flow

### Step-by-Step Flow:

1. **User visits `/signin`**
   - `App.jsx` routes to `<LoginSignup />` component

2. **User submits login form**
   - `LoginSignup.jsx` calls `handleLogin()` from `useAuth()` hook
   - `handleLogin()` calls `login()` from `AuthContext`

3. **AuthContext makes API call**
   - `AuthContext.jsx` → `login()` → `apiPost('/api/auth/login')`
   - Backend validates credentials and returns token

4. **Auth state updated**
   - `AuthContext.jsx` → `setIsAuthenticated(true)`
   - Token stored in TokenManager and localStorage

5. **Redirect hook triggers**
   - `useAuthRedirect` hook (in `LoginSignup.jsx`) detects `isAuthenticated === true`
   - After 100ms delay, calls `navigate('/', { replace: true })`

6. **Route changes to `/`**
   - React Router navigates to root path
   - `App.jsx` routes to `<ChatRoom />` component

7. **ChatRoom checks auth**
   - `ChatRoom.jsx` → `useEffect` detects `isAuthenticated === true`
   - Hides landing page (`setShowLanding(false)`)
   - If on `/signin`, redirects to `/` (safety check)

8. **Dashboard rendered**
   - `ChatRoom.jsx` → `currentView === 'dashboard'` (default)
   - Renders `<DashboardView />` component

---

## 🎯 Key Decision Points

### After Login:
- **Path**: `/` (NavigationPaths.HOME)
- **View**: `'dashboard'` (default currentView)
- **Component**: `<DashboardView />`

### After Signup:
- **Path**: `/invite-coparent` (NavigationPaths.INVITE_COPARENT)
- **View**: Determined by route/component
- **Component**: `<InviteCoParentPage />`

### Default View:
- When `currentView` is not explicitly set, it defaults to `'dashboard'`
- Set in parent component initialization

---

## 🔍 Important Notes

1. **Race Condition Prevention**:
   - `useAuthRedirect` uses a 100ms delay to ensure state is fully updated
   - `ChatRoom` checks `isCheckingAuth` before redirecting
   - TokenManager ensures token is available synchronously

2. **Multiple Redirect Mechanisms**:
   - `useAuthRedirect` hook (primary mechanism)
   - `ChatRoom` useEffect (safety check for authenticated users on `/signin`)

3. **State Management**:
   - Auth state: `AuthContext` (global)
   - View state: `currentView` in `ChatRoom` (local)
   - Navigation: React Router + `useAppNavigation` adapter

4. **Storage**:
   - Token stored in TokenManager (in-memory cache)
   - Token also in localStorage (`auth_token_backup`)
   - Auth flags in localStorage (`is_authenticated`, `username`)

---

## 📝 Summary

**Files responsible for login → dashboard routing**:

1. ✅ **App.jsx** - Route definitions
2. ✅ **LoginSignup.jsx** - Login form + redirect hook
3. ✅ **useAuthRedirect.js** - Redirect logic after auth
4. ✅ **AuthContext.jsx** - Auth state management
5. ✅ **ChatRoom.jsx** - Main routing component + view rendering
6. ✅ **NavigationAdapter.js** - Path constants
7. ✅ **DashboardView.jsx** - Dashboard component

**Flow**: Login → AuthContext updates state → useAuthRedirect navigates to `/` → ChatRoom renders DashboardView

