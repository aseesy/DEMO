# Push Notification User Flow - Complete Implementation Guide

## Overview

This document explains the complete end-to-end flow of push notifications for new users, from signup to receiving notifications and clicking them.

## User Journey: New User → Coparent → Message → Notification

### Step 1: User Signs Up

**What Happens:**
1. User creates account via signup form
2. Account is created in database
3. User is logged in automatically
4. **Auto-subscription to push notifications begins**

**Implementation:**
```javascript
// App.jsx - Line 80-95
React.useEffect(() => {
  if (isAuthenticated && pwa.subscribeToPush) {
    const timer = setTimeout(() => {
      pwa.subscribeToPush().catch(error => {
        console.warn('[App] Could not subscribe to push notifications:', error);
      });
    }, 2000); // Wait for service worker to register
  }
}, [isAuthenticated, pwa.subscribeToPush]);
```

**What User Sees:**
- Browser/phone prompts: "Allow notifications from LiaiZen?"
- User clicks "Allow"
- Subscription is saved to database

**Database:**
- `push_subscriptions` table stores:
  - `user_id` - Links to user account
  - `endpoint` - Unique push service URL
  - `p256dh` and `auth` - Encryption keys
  - `is_active` - TRUE

### Step 2: Coparent Signs Up & Accounts Sync

**What Happens:**
1. Coparent creates account
2. System creates a "room" connecting both users
3. Both users are now in the same `room_members` table
4. **Both users already have push subscriptions** (from Step 1)

**Database State:**
- `rooms` table: One room with `room_id`
- `room_members` table: Two rows (one per user)
- `push_subscriptions` table: Two subscriptions (one per user)

### Step 3: Coparent Sends Message

**What Happens:**
1. Coparent types message and sends
2. Message goes through AI mediation
3. Message is saved to database
4. Message is broadcast via Socket.io to room
5. **Push notification is triggered automatically**

**Implementation:**
```javascript
// aiActionHelper.js - Line 239-267
setImmediate(async () => {
  try {
    // Get room members to find the recipient
    const roomMembersResult = await dbPostgres.query(
      `SELECT user_id, username FROM room_members rm
       JOIN users u ON rm.user_id = u.id
       WHERE rm.room_id = $1`,
      [user.roomId]
    );

    // Find the recipient (other user in room, not the sender)
    const recipient = roomMembersResult.rows.find(
      member => member.username?.toLowerCase() !== user.username?.toLowerCase()
    );

    if (recipient && recipient.user_id) {
      // Send push notification
      const pushNotificationService = require('../services/pushNotificationService');
      await pushNotificationService.notifyNewMessage(recipient.user_id, message);
    }
  } catch (pushError) {
    console.error('[processApprovedMessage] Error sending push notification:', pushError);
  }
});
```

**Notification Payload:**
```javascript
{
  title: "New message from [Coparent Name]",
  body: "[Message text truncated to 100 chars]",
  icon: "/icon-192.png",
  badge: "/icon-192.png",
  tag: "message-[messageId]",
  data: {
    url: "/?view=chat",  // Deep link to chat
    sender: "[Coparent Name]",
    messageId: "[messageId]",
    timestamp: "[ISO timestamp]"
  }
}
```

### Step 4: User Receives Notification on Phone

**What Happens:**
1. Push notification is sent to user's device via Web Push API
2. Device receives notification even if app is closed
3. Notification appears on lock screen/home screen
4. Phone vibrates (if enabled)
5. Notification shows:
   - **Title**: "New message from [Coparent Name]"
   - **Body**: Message preview (first 100 characters)
   - **Icon**: LiaiZen icon

**User Experience:**
- ✅ Notification appears on phone lock screen
- ✅ Notification appears in notification center
- ✅ Phone vibrates (if enabled)
- ✅ User knows they have a new message

### Step 5: User Clicks Notification

**Current Implementation:**
⚠️ **ISSUE IDENTIFIED**: Service worker doesn't handle `notificationclick` events

**What Should Happen:**
1. User taps notification on phone
2. Service worker receives `notificationclick` event
3. Service worker opens app with deep link: `/?view=chat`
4. App navigates to chat view
5. User sees the new message

**What Currently Happens:**
- Notification click may just open the app (not deep link to chat)
- Need to add `notificationclick` handler in service worker

## Implementation Status

### ✅ Working
- [x] Auto-subscription on login
- [x] Push notification sent when message received
- [x] Notification appears on phone
- [x] Notification shows correct title and body
- [x] Notification includes deep link data

### ⚠️ Needs Fix
- [ ] Service worker `notificationclick` handler
- [ ] Deep link navigation when notification clicked
- [ ] Handle notification clicks when app is closed vs. open

## Required Fixes

### 1. Add Notification Click Handler to Service Worker

**File**: `chat-client-vite/public/sw.js`

**Add:**
```javascript
// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification clicked:', event.notification.data);
  
  event.notification.close();
  
  // Get the URL from notification data
  const urlToOpen = event.notification.data?.url || '/?view=chat';
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(clientList => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          // App is open - focus it and navigate
          return client.focus().then(() => {
            // Send message to client to navigate
            client.postMessage({
              type: 'NAVIGATE',
              url: urlToOpen
            });
          });
        }
      }
      
      // App is not open - open it
      return clients.openWindow(urlToOpen);
    })
  );
});
```

### 2. Handle Navigation Message in App

**File**: `chat-client-vite/src/App.jsx` or `ChatRoom.jsx`

**Add:**
```javascript
// Listen for navigation messages from service worker
React.useEffect(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', event => {
      if (event.data && event.data.type === 'NAVIGATE') {
        // Navigate to the URL
        window.location.href = event.data.url;
      }
    });
  }
}, []);
```

## Testing the Complete Flow

### Test Scenario 1: New User Signup
1. ✅ User signs up
2. ✅ Browser prompts for notification permission
3. ✅ User allows notifications
4. ✅ Check database: `push_subscriptions` has entry for user
5. ✅ Check console: `[usePWA] ✅ Push subscription saved to server`

### Test Scenario 2: Coparent Signup & Sync
1. ✅ Coparent signs up
2. ✅ Check database: Both users in same room
3. ✅ Check database: Both users have push subscriptions

### Test Scenario 3: Message → Notification
1. ✅ Coparent sends message
2. ✅ Check server logs: `[PushNotification] Sent notifications: { userId, sent: 1, failed: 0 }`
3. ✅ User receives notification on phone
4. ✅ Notification shows correct title and body

### Test Scenario 4: Notification Click
1. ⚠️ User clicks notification
2. ⚠️ App should open (or focus if already open)
3. ⚠️ App should navigate to chat view
4. ⚠️ User should see the new message

## User Experience Summary

### What Users Will Experience:

1. **Signup**: 
   - "Allow notifications?" prompt
   - Click "Allow"
   - ✅ Subscribed automatically

2. **When Coparent Sends Message**:
   - 📱 Phone notification appears
   - 🔔 Phone vibrates (if enabled)
   - 📝 Shows: "New message from [Name]"
   - 💬 Shows message preview

3. **When User Clicks Notification**:
   - 📱 App opens (or focuses if already open)
   - 💬 Navigates directly to chat
   - 👀 User sees the new message

## Current Gaps

1. **Service Worker Click Handler**: Missing `notificationclick` event listener
2. **Deep Link Navigation**: Need to handle navigation when app receives message from service worker
3. **App State Handling**: Need to handle clicks when app is closed vs. open

## Next Steps

1. Add `notificationclick` handler to service worker
2. Add navigation message handler in app
3. Test complete flow end-to-end
4. Verify deep linking works on iOS and Android PWA

