# Push Notification Troubleshooting

## Issue: Test Notifications Work, But Real-Time Notifications Don't

### Understanding the Difference

**Test Notification** (works):

- Uses local browser `Notification` API
- Shows immediately in browser
- Doesn't require server-side push subscription
- Works even if push subscription fails

**Real-Time Push Notification** (not working):

- Requires Web Push API subscription
- Subscription must be saved to server database
- Server sends push via `web-push` library
- Service worker receives push event and displays notification

### Diagnostic Steps

#### 1. Check Browser Console Logs

Look for these logs when the app loads:

```
[useNotifications] Permission granted, subscribing to push notifications...
[usePWA] Existing subscription found, syncing to server...
[usePWA] ✅ Existing subscription synced to server: {...}
```

OR

```
[usePWA] Subscribing to push notifications, sending to server...
[usePWA] ✅ Push subscription saved to server: {...}
```

**If you see errors like:**

- `❌ Error saving subscription to server` → Subscription not saved, push won't work
- `⚠️ Dev mode: Push subscriptions may not work correctly` → Running in dev mode (now fixed)
- `Could not subscribe to push` → Service worker or permission issue

#### 2. Check Subscription Status

**In Browser Console:**

```javascript
// Check if subscription exists
navigator.serviceWorker.ready.then(reg => {
  reg.pushManager.getSubscription().then(sub => {
    console.log('Subscription:', sub ? 'Active' : 'None');
    if (sub) {
      console.log('Endpoint:', sub.endpoint);
    }
  });
});
```

**Via API:**

```bash
GET /api/push/status
```

Should return:

```json
{
  "success": true,
  "userId": 123,
  "subscriptionCount": 1,
  "subscriptions": [...]
}
```

#### 3. Check Server Logs When Message is Sent

When someone sends you a message, look for:

```
[processApprovedMessage] Push notification check:
  recipientFound: true
  recipientUserId: [your user ID]

[PushNotification] notifyNewMessage called:
  recipientUserId: [your user ID]
  senderName: [sender name]

[PushNotification] sendNotificationToUser called:
  userId: [your user ID]
  subscriptionCount: [should be > 0]

[PushNotification] ✅ Sent notifications:
  sent: [should be > 0]
  failed: [should be 0]
```

#### 4. Common Issues and Fixes

##### Issue: "subscriptionCount: 0"

**Cause**: Subscription not saved to database

**Fix**:

1. Check browser console for subscription errors
2. Re-subscribe: Go to Settings → Notifications → Toggle off/on
3. Check `/api/push/status` to verify subscription saved

##### Issue: "sent: 0, failed: 1"

**Possible Causes**:

1. **403 Forbidden**:
   - VAPID key mismatch
   - Domain mismatch
   - Check `VAPID_PUBLIC_KEY` matches between frontend and backend

2. **410 Gone / 404 Not Found**:
   - Subscription expired
   - Browser unsubscribed
   - **Fix**: Re-subscribe in PWA settings

3. **Network Error**:
   - Service worker not receiving push
   - Check service worker is active
   - Check `sw-custom.js` has push event handler

##### Issue: "No recipient found"

**Cause**: Room membership query failing

**Check**:

- Both users in same room
- `room_members` table has correct entries
- `user.roomId` is set correctly

##### Issue: Dev Mode Blocking Subscription

**Fixed**: Dev mode check now allows subscriptions (with warning)

**If still having issues**:

- Check console for `⚠️ Dev mode` warning
- Try production build for full testing

### Verification Checklist

- [ ] Browser console shows subscription success logs
- [ ] `/api/push/status` shows `subscriptionCount > 0`
- [ ] Server logs show `subscriptionCount > 0` when message sent
- [ ] Server logs show `sent > 0` (not `failed > 0`)
- [ ] Service worker is registered and active
- [ ] Browser notification permission is granted
- [ ] VAPID keys match between frontend and backend

### Next Steps

1. **Check Browser Console**: Look for subscription logs
2. **Check Server Logs**: Look for push notification flow when message sent
3. **Verify Subscription**: Use `/api/push/status` endpoint
4. **Re-subscribe**: Toggle notifications off/on in settings

The enhanced logging should now show exactly where the flow is breaking.
