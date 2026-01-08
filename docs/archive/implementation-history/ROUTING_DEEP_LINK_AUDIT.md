# Routing & Deep Linking Audit

## 🔍 Current State Analysis

### Issue Identified ❌

**Problem**: Deep linking with authentication redirects doesn't preserve return URLs.

**Scenario**:
1. User clicks deep link: `app.coparentliaizen.com/?view=chat&threadId=123`
2. User is not authenticated
3. System redirects to `/signin` 
4. **Original URL is lost** ❌
5. After login, user goes to HOME instead of original deep link ❌

### Current Implementation

#### 1. `useAuthRedirect.js` ❌
- **Issue**: Hardcoded redirect paths (HOME or INVITE_COPARENT)
- **Missing**: No return URL handling
- **Impact**: Users lose their intended destination after login

#### 2. `useNavigationManager.js` ❌
- **Issue**: Redirects to `/signin` but doesn't store original URL
- **Missing**: No return URL preservation
- **Impact**: Deep links are lost during auth redirect

#### 3. `AuthGuard.jsx` ❌
- **Issue**: Shows "Redirecting to sign up..." but doesn't preserve URL
- **Missing**: No return URL logic
- **Impact**: Same as above

### What Needs to Be Fixed

1. ✅ **Store Return URL**: When redirecting to login, save the original URL (path + query params)
2. ✅ **Restore After Login**: After successful authentication, redirect to stored return URL
3. ✅ **Handle Query Params**: Preserve all query parameters (view, threadId, etc.)
4. ✅ **Fallback Logic**: If no return URL, use default paths

## 📋 Implementation Plan

### Step 1: Add Return URL Storage
- Add `RETURN_URL` to StorageKeys
- Store full URL (pathname + search) when redirecting to login

### Step 2: Update useNavigationManager
- Before redirecting to `/signin`, store current URL as return URL
- Preserve query parameters in return URL

### Step 3: Update useAuthRedirect
- Check for stored return URL first
- If exists, redirect to return URL and clear it
- If not, use default paths

### Step 4: Update LoginSignup
- After successful login, use return URL if available

## 🎯 Expected Behavior After Fix

**Scenario**: User clicks `app.coparentliaizen.com/?view=chat&threadId=123`

1. ✅ User is not authenticated
2. ✅ System stores return URL: `/?view=chat&threadId=123`
3. ✅ System redirects to `/signin?returnUrl=/?view=chat&threadId=123` (or stores in localStorage)
4. ✅ User logs in successfully
5. ✅ System redirects to stored return URL: `/?view=chat&threadId=123`
6. ✅ User lands on intended page ✅

## 🔒 Security Considerations

- ✅ **Validate Return URLs**: Only allow same-origin URLs
- ✅ **Sanitize Input**: Prevent XSS via return URL
- ✅ **Clear After Use**: Remove return URL after successful redirect
- ✅ **Timeout**: Expire return URLs after reasonable time (e.g., 1 hour)

