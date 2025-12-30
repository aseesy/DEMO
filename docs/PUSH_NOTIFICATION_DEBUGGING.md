# Push Notification Debugging Guide

## Issue: Not Receiving Real-Time Notifications

If test notifications work but real-time message notifications don't, follow these steps:

## Diagnostic Steps

### 1. Check Subscription Status

**Endpoint**: `GET /api/push/status`

This will show:

- Number of active subscriptions
- Subscription endpoints (truncated)
- Whether subscriptions have valid keys

**Expected**: Should show at least 1 active subscription if you've enabled notifications.

### 2. Check Server Logs

When a message is sent, look for these log entries:

```
[processApprovedMessage] Push notification check:
  - roomMembersCount: Should be 2 (sender + recipient)
  - recipientFound: Should be true
  - recipientUserId: Should be a number

[PushNotification] notifyNewMessage called:
  - recipientUserId: Should match your user ID
  - senderName: Should show sender's name
  - messageText: Should show message preview

[PushNotification] sendNotificationToUser called:
  - userId: Should match your user ID
  - subscriptionCount: Should be > 0
  - payloadTitle: Should show "New message from [name]"

[PushNotification] ✅ Sent notifications:
  - sent: Should be > 0
  - failed: Should be 0
```

### 3. Common Issues

#### Issue: "No active subscriptions found"

**Cause**: Subscription not saved or deactivated

**Fix**:

1. Go to PWA Settings → Notifications
2. Click "Test Notification" to verify subscription
3. Check `/api/push/status` endpoint to confirm subscription exists

#### Issue: "sent: 0, failed: 1"

**Possible Causes**:

- **403 Forbidden**: VAPID key mismatch or domain issue
  - Check that `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` match between frontend and backend
  - Verify domain matches subscription origin
- **410 Gone / 404 Not Found**: Subscription expired or invalid
  - Subscription will be automatically deactivated
  - Re-subscribe in PWA settings

- **Network Error**: Service worker not receiving push
  - Check service worker is registered
  - Verify `sw-custom.js` has push event handler

#### Issue: Recipient not found

**Cause**: Room membership query failing

**Check**:

- Verify both users are in the same room
- Check `room_members` table has correct entries
- Verify `user.roomId` is set correctly

### 4. Testing Flow

1. **Test Subscription**:

   ```bash
   # Check subscription status
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://your-domain.com/api/push/status

   # Send test notification
   curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
     https://your-domain.com/api/push/test
   ```

2. **Send Real Message**:
   - Have another user send you a message
   - Check server logs for push notification flow
   - Verify notification is sent (sent > 0)

3. **Check Service Worker**:
   - Open DevTools → Application → Service Workers
   - Verify service worker is active
   - Check Console for push event logs

### 5. Enhanced Logging

The code now includes detailed logging at each step:

- **Message Processing**: Logs when push notification is triggered
- **Recipient Lookup**: Logs room members and recipient identification
- **Subscription Check**: Logs subscription count and details
- **Send Attempt**: Logs each subscription attempt and result
- **Error Details**: Logs specific error codes and messages

### 6. Verification Checklist

- [ ] Test notification works (confirms subscription is valid)
- [ ] `/api/push/status` shows active subscription
- [ ] Server logs show recipient is found
- [ ] Server logs show subscription count > 0
- [ ] Server logs show `sent > 0` (not `failed > 0`)
- [ ] Service worker is registered and active
- [ ] Browser notification permission is granted
- [ ] VAPID keys match between frontend and backend

### 7. Next Steps if Still Not Working

1. **Check Browser Console**:
   - Look for service worker errors
   - Check for push event registration errors

2. **Check Network Tab**:
   - Verify `/api/push/subscribe` was called successfully
   - Check response status codes

3. **Verify Environment**:
   - Production: Check VAPID keys in environment variables
   - Development: Check VAPID keys in code match frontend

4. **Service Worker Debugging**:
   - Check `sw-custom.js` push event handler
   - Verify notification display logic

## Quick Fixes

### Re-subscribe to Push Notifications

1. Go to PWA Settings
2. Disable notifications
3. Re-enable notifications
4. Test notification

### Check VAPID Keys

```bash
# Backend (should match)
echo $VAPID_PUBLIC_KEY
echo $VAPID_PRIVATE_KEY

# Frontend (should match public key)
# Check usePWA.js or environment variable
```

### Verify Service Worker

```javascript
// In browser console
navigator.serviceWorker.ready.then(reg => {
  console.log('Service Worker:', reg.active);
  reg.pushManager.getSubscription().then(sub => {
    console.log('Subscription:', sub ? 'Active' : 'None');
  });
});
```
