# PWA Caching Strategy

**Last Updated:** 2026-01-05  
**Cache Version:** `liaizen-v1.0.0`  
**Update Strategy:** User-Prompted (not automatic)

---

## Cache Versioning

All caches are versioned with the format: `{cache-name}-{version}`

**Current Version:** `liaizen-v1.0.0`

**To force cache invalidation:** Increment version in `vite.config.js`:
```javascript
const CACHE_VERSION = 'liaizen-v1.0.1'; // Increment for new deployment
```

---

## What is Cached Forever

These resources are cached indefinitely and only updated when the cache version changes:

### 1. Static Assets (Precached)
- **Strategy:** Precached on install
- **Cache Name:** `workbox-precache-v2-{version}`
- **Contents:**
  - JavaScript bundles (`/assets/*.js`)
  - CSS files (`/assets/*.css`)
  - Icons (`/icon-*.png`, `/favicon-*.png`)
  - Manifest (`/manifest.webmanifest`)
  - Service worker custom scripts (`/sw-custom.js`)
- **Update:** Only when cache version changes (new deployment)
- **Why:** These are versioned by build hash, so they're safe to cache forever

---

## What is Cached Temporarily

These resources are cached with expiration policies:

### 1. HTML Pages
- **Strategy:** NetworkFirst (3s timeout)
- **Cache Name:** `html-cache-{version}`
- **TTL:** 24 hours
- **Max Entries:** 10
- **Behavior:**
  - Try network first
  - If network takes >3s, serve from cache
  - Update cache in background
- **Why:** Ensures fresh content on slow connections while maintaining offline support

### 2. Images
- **Strategy:** CacheFirst
- **Cache Name:** `images-cache-{version}`
- **TTL:** 30 days
- **Max Entries:** 50
- **Behavior:**
  - Serve from cache if available
  - Fetch from network if not cached
  - Update cache on fetch
- **Why:** Images rarely change, cache-first improves performance

### 3. Google Fonts
- **Strategy:** CacheFirst
- **Cache Name:** `google-fonts-cache-{version}` and `google-fonts-static-cache-{version}`
- **TTL:** 1 year
- **Max Entries:** 10 each
- **Behavior:**
  - Serve from cache if available
  - Fetch from network if not cached
- **Why:** Fonts are immutable, safe to cache long-term

### 4. API Responses
- **Strategy:** StaleWhileRevalidate
- **Cache Name:** `api-cache-{version}`
- **TTL:** 24 hours
- **Max Entries:** 50
- **Behavior:**
  - Serve stale cache immediately
  - Fetch fresh data in background
  - Update cache with fresh data
- **Why:** Fast perceived performance, but may show stale data briefly
- **⚠️ Risk:** Users may see stale data for up to 24 hours
- **Mitigation:** Critical API endpoints should bypass cache (see "Never Cached")

---

## What is Never Cached

These resources are always fetched fresh from the network:

### 1. API Endpoints (Critical)
- **Pattern:** `/api/auth/*` (login, signup, verify session)
- **Pattern:** `/api/push/*` (push notification subscriptions)
- **Pattern:** `/api/room/messages` (real-time messages)
- **Why:** Authentication and real-time data must be fresh

### 2. Service Worker Script
- **File:** `/sw.js`
- **Why:** Service worker updates must be immediate

### 3. Development Assets
- **Pattern:** `localhost:*`
- **Why:** Development should never use cache

---

## Cache Invalidation Strategy

### Automatic Invalidation

1. **Version Change:**
   - When `CACHE_VERSION` changes, all caches are invalidated
   - Old caches are cleaned up by `cleanupOutdatedCaches: true`
   - New caches are created with new version suffix

2. **TTL Expiration:**
   - Caches expire based on `maxAgeSeconds`
   - Expired entries are removed on next access
   - `maxEntries` limits prevent unbounded growth

3. **Service Worker Update:**
   - New service worker activates
   - Old caches are marked for deletion
   - `cleanupOutdatedCaches` removes them

### Manual Invalidation

Users can clear cache by:
1. **Uninstalling PWA** - Removes all caches
2. **Browser Settings** - Clear site data
3. **Hard Refresh** - Bypasses cache for current page only

---

## Update Strategy

### Current: User-Prompted Updates

**Behavior:**
- Service worker checks for updates every 5 minutes
- When update detected, shows banner: "Update Available"
- User clicks "Update Now" → Page reloads with new version
- User can dismiss → Banner reappears after 1 hour

**Why User-Prompted:**
- Prevents unexpected reloads during active use
- Gives users control over when to update
- Avoids losing unsent messages or form data

### Update Flow

1. **Detection:** Service worker detects new version
2. **Download:** New service worker downloads in background
3. **Notification:** Banner appears: "A new version is available"
4. **User Action:** User clicks "Update Now"
5. **Activation:** New service worker activates
6. **Reload:** Page reloads with new version

### Configuration

```javascript
// vite.config.js
registerType: 'promptUpdate', // Changed from 'autoUpdate'
skipWaiting: false,           // Changed from true - wait for user
clientsClaim: false,          // Changed from true - don't claim immediately
```

---

## Preventing Stale Data Issues

### Problem: Stale UI with Fresh Data

**Scenario:** User sees cached UI but receives fresh data from API, causing mismatches.

### Solutions

1. **Versioned Cache Names:**
   - All caches include version: `{name}-{version}`
   - Version changes on every deployment
   - Forces cache invalidation

2. **NetworkFirst for HTML:**
   - HTML always tries network first
   - Only falls back to cache if network is slow (>3s)
   - Ensures UI is fresh

3. **No Cache for Critical APIs:**
   - Auth endpoints never cached
   - Real-time endpoints never cached
   - Prevents stale authentication/data

4. **StaleWhileRevalidate for Non-Critical:**
   - Shows cached data immediately
   - Updates in background
   - Acceptable trade-off for non-critical data

5. **Cache Version in Service Worker:**
   - Service worker includes cache version
   - Mismatch triggers cache clear
   - Prevents version conflicts

---

## Cache Size Limits

| Cache Type | Max Entries | Max Size | TTL |
|------------|-------------|----------|-----|
| HTML | 10 | ~500KB | 24h |
| Images | 50 | ~50MB | 30d |
| Fonts | 10 | ~5MB | 1y |
| API | 50 | ~5MB | 24h |
| Precache | All | ~10MB | Forever |

**Total Estimated Cache:** ~70MB (well within browser limits)

---

## Testing Cache Strategy

### Test Scenarios

1. **Fresh Install:**
   - Install PWA
   - Verify all assets precached
   - Check cache names include version

2. **Update Detection:**
   - Deploy new version
   - Wait 5 minutes
   - Verify update banner appears
   - Click "Update Now"
   - Verify new version loads

3. **Offline Behavior:**
   - Go offline
   - Verify cached assets load
   - Verify API calls fail gracefully
   - Verify offline.html shows

4. **Stale Data Prevention:**
   - Load app
   - Deploy new version
   - Verify UI updates after user accepts update
   - Verify no stale data shown

5. **Cache Invalidation:**
   - Change cache version
   - Deploy
   - Verify old caches deleted
   - Verify new caches created

---

## Monitoring

### Cache Health Checks

1. **Cache Hit Rate:**
   - Monitor service worker cache hits
   - Track network vs cache requests
   - Alert if hit rate drops

2. **Cache Size:**
   - Monitor total cache size
   - Alert if approaching limits
   - Clean up if needed

3. **Update Adoption:**
   - Track how many users update
   - Monitor update prompt dismissals
   - Adjust strategy if needed

---

## Migration Notes

### From Auto-Update to Prompt-Update

**Breaking Changes:**
- Users must manually accept updates
- Updates won't happen automatically
- May need to prompt more aggressively

**Benefits:**
- No unexpected reloads
- User control
- Better UX during active use

---

## Future Improvements

1. **Background Sync:**
   - Queue failed requests
   - Retry when online
   - Better offline support

2. **IndexedDB Caching:**
   - Cache message history
   - Cache user preferences
   - Larger storage limits

3. **Cache Warming:**
   - Prefetch likely-needed resources
   - Improve perceived performance
   - Reduce network requests

4. **Analytics Integration:**
   - Track cache performance
   - Monitor update adoption
   - Optimize strategy

---

## Summary

✅ **Cached Forever:** Static assets (JS, CSS, icons) - versioned by build  
✅ **Cached Temporarily:** HTML (24h), Images (30d), Fonts (1y), API (24h)  
✅ **Never Cached:** Auth endpoints, real-time endpoints, service worker  
✅ **Update Strategy:** User-prompted (not automatic)  
✅ **Versioning:** All caches include version suffix  
✅ **Invalidation:** Automatic on version change, TTL expiration, or manual clear

**No more accidental caching. Everything is intentional and documented.**

