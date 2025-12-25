# How to Clear PWA Cache on iPhone

If you're not seeing the latest changes in your PWA on iPhone, follow these steps:

## Method 1: Delete and Reinstall PWA (Recommended)

1. **Delete the PWA from your home screen:**
   - Long-press the LiaiZen app icon on your home screen
   - Tap "Remove App" or the X button
   - Confirm deletion

2. **Clear Safari cache:**
   - Open Settings app
   - Go to Safari
   - Tap "Clear History and Website Data"
   - Confirm

3. **Reinstall the PWA:**
   - Open Safari
   - Navigate to `coparentliaizen.com`
   - Tap the Share button (square with arrow)
   - Tap "Add to Home Screen"
   - Tap "Add"

## Method 2: Force Service Worker Update

1. **Open the PWA in Safari (not the home screen app):**
   - Open Safari
   - Navigate to `coparentliaizen.com`

2. **Open Safari Developer Tools (if available):**
   - Connect iPhone to Mac
   - On Mac: Safari > Develop > [Your iPhone] > [coparentliaizen.com]
   - Go to Storage tab
   - Click "Service Workers"
   - Click "Unregister" for the service worker

3. **Or use Safari Settings:**
   - Settings > Safari > Advanced > Website Data
   - Find "coparentliaizen.com"
   - Swipe left and tap "Delete"

4. **Reload the page:**
   - Pull down to refresh or tap the reload button

## Method 3: Hard Refresh in Safari

1. **Open the PWA in Safari**
2. **Pull down to refresh** (this forces a network request)
3. **Or use the reload button** in the address bar

## Method 4: Clear All Website Data

1. **Settings > Safari > Advanced > Website Data**
2. **Tap "Remove All Website Data"**
3. **Confirm**
4. **Reopen the PWA**

## What Changed

The service worker cache version has been updated from `liaizen-v2` to `liaizen-v3`, which will force a cache refresh. The service worker now uses a **network-first strategy for HTML files**, so updates should be seen immediately on refresh.

## Verification

After clearing cache, you should see:

- Messages fitting properly within the screen (no horizontal overflow)
- No content cut off on the right side
- Proper layout on mobile viewport

If you still see issues after following these steps, the changes may need to be deployed to production first.
