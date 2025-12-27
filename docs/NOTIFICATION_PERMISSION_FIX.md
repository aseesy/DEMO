# Notification Permission Fix

## Problem

Browser error: "Notification prompting can only be done from a user gesture"

This occurs when `Notification.requestPermission()` is called automatically without a user interaction (click, tap).

## Root Cause

The code was automatically calling `subscribeToPush()` when users logged in, which internally calls `Notification.requestPermission()`. Browsers require permission requests to be triggered by user gestures for security reasons.

## Solution

### 1. Modified `subscribeToPush()` in `usePWA.js`

**Before**: Always called `Notification.requestPermission()`

**After**: 
- Checks current permission status first
- Only requests permission if status is `'default'` (not yet asked)
- If permission is already `'granted'`, proceeds without requesting
- If permission is `'denied'`, doesn't request again

```javascript
// Check current permission status (don't request if already set)
let permission = Notification.permission;

// Only request permission if it's not already set (default state)
if (permission === 'default') {
  // This requires a user gesture - will fail if called automatically
  try {
    permission = await Notification.requestPermission();
  } catch (error) {
    console.warn('[usePWA] Cannot request permission without user gesture:', error);
    return null;
  }
}
```

### 2. Modified Auto-Subscription in `App.jsx`

**Before**: Automatically called `subscribeToPush()` on login

**After**: 
- Only auto-subscribes if permission is **already granted**
- Doesn't request permission automatically
- Logs message if permission not granted (user must enable manually)

```javascript
// Only auto-subscribe if permission is already granted
const currentPermission = typeof Notification !== 'undefined' ? Notification.permission : 'denied';

if (currentPermission === 'granted') {
  // Safe to subscribe - permission already granted
  pwa.subscribeToPush();
} else {
  console.log('[App] User must enable notifications manually.');
}
```

## User Flow

### First Time User
1. User logs in
2. **No automatic permission request** (would fail)
3. User sees notification settings in app
4. User clicks "Enable Notifications" button
5. Browser prompts for permission (user gesture)
6. User allows → Permission granted → Auto-subscribes

### Returning User (Permission Already Granted)
1. User logs in
2. Permission check: `'granted'`
3. **Auto-subscribes immediately** (no permission request needed)
4. Push notifications work automatically

### User Who Denied Permission
1. User logs in
2. Permission check: `'denied'`
3. **No automatic request** (user already rejected)
4. User must enable in browser settings manually

## Where Permission is Requested

### ✅ Correct: User Gesture Required
- `useNotifications.js` → `requestPermission()` - Called from button click
- `NotificationSettingsCard.jsx` → "Enable Notifications" button
- User explicitly clicks to enable

### ❌ Fixed: No Automatic Requests
- `App.jsx` → Only subscribes if permission already granted
- `usePWA.js` → Only requests if permission is 'default'
- `useNotifications.js` → Only subscribes if permission already granted

## Testing

### Test 1: First Time User
1. Clear browser data (including permissions)
2. Log in
3. **Should NOT see error** about user gesture
4. Click "Enable Notifications" button
5. Browser prompts → Allow
6. Should subscribe successfully

### Test 2: Permission Already Granted
1. Log in with permission already granted
2. **Should auto-subscribe** without requesting permission
3. No errors in console
4. Push notifications work

### Test 3: Permission Denied
1. Log in with permission denied
2. **Should NOT request permission** automatically
3. No errors in console
4. User must enable in browser settings

## Browser Requirements

All modern browsers require user gestures for:
- `Notification.requestPermission()`
- `navigator.mediaDevices.getUserMedia()`
- `window.showSaveFilePicker()`
- Other sensitive permissions

This is a security feature to prevent websites from spamming users with permission prompts.

## Related Files

- `chat-client-vite/src/hooks/pwa/usePWA.js` - Push subscription logic
- `chat-client-vite/src/App.jsx` - Auto-subscription on login
- `chat-client-vite/src/features/notifications/model/useNotifications.js` - Notification permission handling
- `chat-client-vite/src/features/notifications/components/NotificationSettingsCard.jsx` - UI for enabling notifications

