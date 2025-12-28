# Push Notification Testing Guide

## Root Cause Analysis Summary

### Issues Found:

1. **Service Worker Blocked for Safari**: The code was blocking service worker registration for ALL Safari browsers, including iOS Safari when installed as PWA
2. **iOS PWA Support**: iOS Safari DOES support service workers for PWAs installed to home screen (iOS 11.3+)
3. **Notification Format**: iOS requires absolute URLs for icon and badge

### Fixes Applied:

1. ✅ Updated `main.jsx` to allow service worker registration for iOS Safari when app is installed as PWA
2. ✅ Updated `usePWA.js` to allow service worker access for iOS Safari when app is installed as PWA
3. ✅ Updated `sw.js` to use absolute URLs for icon and badge (iOS requirement)

## Testing Steps

### Prerequisites:

1. App must be installed as PWA on iPhone (Add to Home Screen)
2. User must grant notification permissions
3. User must be authenticated
4. Service worker must be registered

### Test 1: Service Worker Registration

1. Open app on iPhone (installed as PWA)
2. Open Safari DevTools (if available) or check console logs
3. Verify: `[PWA] Service Worker registered successfully` appears in logs
4. If not appearing, check:
   - App is installed as PWA (standalone mode)
   - Not in development mode
   - Service worker file exists at `/sw.js`

### Test 2: Push Subscription

1. Go to Settings > Notifications
2. Click "Enable Notifications" button
3. Grant permission when prompted
4. Check console logs for:
   - `[usePWA] Push subscription created`
   - `[usePWA] ✅ Push subscription saved to server`
5. Verify subscription in database:
   ```sql
   SELECT * FROM push_subscriptions WHERE user_id = <user_id> AND is_active = TRUE;
   ```

### Test 3: Send Test Notification

1. Go to Settings > Notifications
2. Click "Test Notification" button
3. Verify notification appears on iPhone
4. Check server logs for:
   - `[PushNotification] Sending test notification to user: <user_id>`
   - `[PushNotification] Sent notifications: { userId, sent, failed }`

### Test 4: Real Message Notification

1. Have another user send a message
2. Verify notification appears on iPhone
3. Check server logs in `aiActionHelper.js`:
   - `[processApprovedMessage] Push notification check`
   - `[processApprovedMessage] Sending push notification to user`
   - `[processApprovedMessage] Push notification result`

### Test 5: Notification Click

1. Receive a push notification
2. Tap the notification
3. Verify app opens to chat view
4. Check console logs for:
   - `[SW] Notification clicked`
   - `[App] Service worker requested navigation to: /?view=chat`

## Debugging Checklist

### If Service Worker Not Registering:

- [ ] App is installed as PWA (not just Safari browser)
- [ ] Check `window.matchMedia('(display-mode: standalone)').matches` returns true
- [ ] Check `window.navigator.standalone` is true (iOS)
- [ ] Verify not in development mode
- [ ] Check `/sw.js` file is accessible

### If Push Subscription Fails:

- [ ] Notification permission is granted
- [ ] Service worker is registered and ready
- [ ] VAPID keys match between frontend and backend
- [ ] Check browser console for errors
- [ ] Verify API endpoint `/api/push/subscribe` is accessible

### If Notifications Not Received:

- [ ] Subscription exists in database and is active
- [ ] Check server logs for push notification attempts
- [ ] Verify recipient user_id is correct
- [ ] Check web-push library errors (410 Gone, 404 Not Found, 403 Forbidden)
- [ ] Verify notification payload format is correct

### If Notifications Not Displaying:

- [ ] Service worker push event handler is working
- [ ] Check service worker console for errors
- [ ] Verify icon/badge URLs are absolute (iOS requirement)
- [ ] Check notification permission is still granted
- [ ] Verify app is not in foreground (notifications may be suppressed)

## Common Issues

### Issue: "Service Worker not ready"

**Cause**: Service worker not registered or still installing
**Fix**: Wait for service worker to be ready, check registration status

### Issue: "Notification permission not granted"

**Cause**: User denied permission or permission was revoked
**Fix**: User must manually enable in browser settings

### Issue: "403 Forbidden" when sending notification

**Cause**: VAPID key mismatch or domain issue
**Fix**: Verify VAPID keys match between frontend and backend

### Issue: "410 Gone" when sending notification

**Cause**: Subscription endpoint is invalid (user uninstalled app or cleared data)
**Fix**: Deactivate subscription in database, user must resubscribe

### Issue: Notifications work in browser but not on iPhone

**Cause**: App not installed as PWA or service worker blocked
**Fix**: Install app to home screen, verify service worker registration

## Server-Side Debugging

Check these logs when testing:

1. `[processApprovedMessage] Push notification check` - Shows recipient lookup
2. `[PushNotification] notifyNewMessage called` - Shows notification attempt
3. `[PushNotification] Sent notifications: { sent, failed }` - Shows result
4. `[PushNotification] Failed to send to subscription` - Shows errors

## Database Queries

```sql
-- Check active subscriptions
SELECT user_id, endpoint, is_active, last_used_at
FROM push_subscriptions
WHERE is_active = TRUE
ORDER BY last_used_at DESC;

-- Check subscriptions for specific user
SELECT * FROM push_subscriptions
WHERE user_id = <user_id> AND is_active = TRUE;

-- Deactivate invalid subscriptions
UPDATE push_subscriptions
SET is_active = FALSE
WHERE endpoint LIKE '%invalid%';
```
