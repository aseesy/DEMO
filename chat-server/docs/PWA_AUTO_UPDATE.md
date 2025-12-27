# PWA Auto-Update Implementation

## Overview

The PWA now automatically checks for updates and allows users to update without reinstalling the app.

## How It Works

### 1. Service Worker Updates
- Service worker checks for updates every 5 minutes
- When a new version is detected, it downloads in the background
- New service worker activates immediately using `skipWaiting()`
- Page automatically reloads to apply the update

### 2. Update Notification
- When an update is available, a banner appears at the top of the screen
- User can click "Update Now" to apply the update immediately
- User can dismiss the banner (it will reappear after 1 hour if update is still available)
- Update happens automatically in the background if user doesn't interact

### 3. Cache Management
- Old caches are automatically deleted when new service worker activates
- Network-first strategy for HTML files (ensures immediate updates)
- Cache-first strategy for assets (images, CSS, JS) for performance

## Service Worker Version

To force an update, increment `CACHE_VERSION` in `public/sw.js`:

```javascript
const CACHE_VERSION = 'liaizen-v4'; // Change to v5, v6, etc.
```

## User Experience

1. **Automatic Detection**: App checks for updates every 5 minutes
2. **Update Banner**: When update is available, banner appears at top
3. **One-Click Update**: User clicks "Update Now" → page reloads with new version
4. **No Reinstall Needed**: Users never need to delete and reinstall the PWA

## Technical Details

### Service Worker (`public/sw.js`)
- Handles custom web-push notifications via Web Push API
- Handles caching with versioned cache names
- Uses `skipWaiting()` to activate immediately
- Cleans up old caches on activation

### Update Detection (`usePWA.js`)
- Listens for `updatefound` event
- Detects when new service worker is installed
- Sets `updateAvailable` state
- Provides `applyUpdate()` function

### Update UI (`App.jsx`)
- Shows `PWAUpdateBanner` when update is available
- Handles update action and dismissal
- Automatically checks for updates on mount and every 5 minutes

## Testing

1. **Deploy a new version** with incremented `CACHE_VERSION`
2. **Open the PWA** - it should check for updates
3. **Wait for update** - banner should appear when update is detected
4. **Click "Update Now"** - page should reload with new version
5. **Verify** - check console logs for update messages

## Console Logs

Watch for these messages:
- `[SW] Installing service worker, version: liaizen-v4`
- `[usePWA] ✅ New Service Worker installed, update available`
- `[usePWA] Applying update...`
- `[usePWA] Service Worker controller changed, reloading...`

## Troubleshooting

### Update Not Detected
- Check service worker is registered: `navigator.serviceWorker.getRegistration()`
- Verify `CACHE_VERSION` was incremented
- Check browser console for errors
- Clear service worker cache and reload

### Update Banner Not Showing
- Check `pwa.updateAvailable` is `true`
- Verify `AppContent` component is rendering
- Check for JavaScript errors in console

### Update Not Applying
- Verify `skipWaiting()` is called in service worker
- Check `applyUpdate()` function is called
- Ensure page reload happens after update

## Future Improvements

- [ ] Add update progress indicator
- [ ] Allow users to schedule updates
- [ ] Show changelog in update banner
- [ ] Add "Check for Updates" button in settings
- [ ] Support background updates without user interaction

