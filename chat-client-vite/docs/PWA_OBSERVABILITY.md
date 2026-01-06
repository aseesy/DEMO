# PWA Observability Guide

**Last Updated:** 2026-01-05

---

## Overview

Your PWA now has comprehensive observability for:
- ✅ Service worker lifecycle events (install, update, activate)
- ✅ App version tracking and adoption
- ✅ Offline vs server error classification
- ✅ Users stuck on old versions detection

---

## What's Tracked

### 1. Service Worker Lifecycle Events

**Events Tracked:**
- `install` - Service worker installation (success/failure)
- `update` - Service worker update (success/failure, old/new version)
- `activate` - Service worker activation (success/failure)
- `controller_change` - When new service worker takes control
- `update_check` - Manual update check results
- `version_info` - Service worker version information

**Where to See:**
- Google Analytics: `service_worker_event` events
- Console logs: `[PWA Observability]` prefix
- Error tracking: Failed events tracked as errors

**Example:**
```javascript
// Tracked automatically when SW installs
trackServiceWorkerInstall(registration, true);

// Tracked automatically when SW updates
trackServiceWorkerUpdate(registration, true, null, 'v1.0.0', 'v1.0.1');
```

---

### 2. App Version Tracking

**Tracked:**
- Current app version on every page load
- Version adoption (when users upgrade)
- Version stored in localStorage
- Version sent to analytics as user property

**Where to See:**
- Google Analytics: `app_version` event + user property
- localStorage: `liaizen_app_version` key
- Console logs: `[PWA Observability] App version tracked`

**Example:**
```javascript
// Tracked automatically on app load
trackAppVersion(); // { app_version: 'liaizen-v1.0.0', ... }
```

---

### 3. Offline vs Server Error Classification

**Classification Logic:**

**Offline Errors:**
- `navigator.onLine === false`
- Error message contains: "failed to fetch", "networkerror", "offline"
- Error name: `NetworkError` or `TypeError` (from fetch)

**Server Errors:**
- Error message contains: "500", "502", "503", "504", "internal server error"
- HTTP status: 500-599

**Unknown Errors:**
- Everything else

**Where to See:**
- Google Analytics: `error_classified` events
- Console logs: `[PWA Observability] Error classified as {type}`
- Error tracking: Errors tracked with classification

**Example:**
```javascript
// Automatically classified on API errors
trackErrorWithClassification(error, 'api_get_/api/contacts');
// Returns: { type: 'offline' | 'server' | 'unknown', ... }
```

---

### 4. Users Stuck on Old Versions

**Detection:**
- Compares stored version vs current version
- Flags users stuck > 7 days
- Tracks days since update available

**Where to See:**
- Google Analytics: `stuck_on_old_version` events
- Console logs: `[PWA Observability] User stuck on old version`
- Error tracking: Tracked as error if stuck > 7 days

**Example:**
```javascript
// Automatically checked every 24 hours
trackStuckOnOldVersion('v1.0.0', 'v1.0.1', 8);
// Returns: { isStuck: true, daysSinceUpdate: 8 }
```

---

## Analytics Events

### Service Worker Events

**Event:** `service_worker_event`
```javascript
{
  event_category: 'service_worker',
  event_label: 'install' | 'update' | 'activate' | ...,
  app_version: 'liaizen-v1.0.0',
  success: true | false,
  error_message: '...', // if failed
}
```

### App Version Events

**Event:** `app_version`
```javascript
{
  event_category: 'pwa',
  app_version: 'liaizen-v1.0.0',
  is_pwa: true | false,
  has_service_worker: true | false,
  has_controller: true | false,
}
```

**Event:** `version_adoption`
```javascript
{
  event_category: 'pwa',
  version: 'liaizen-v1.0.1',
  previous_version: 'liaizen-v1.0.0',
  is_new_install: true | false,
}
```

### Error Classification Events

**Event:** `error_classified`
```javascript
{
  event_category: 'error',
  error_type: 'offline' | 'server' | 'unknown',
  context: 'api_get_/api/contacts',
  app_version: 'liaizen-v1.0.0',
  navigator_online: true | false,
  error_message: '...',
}
```

### Stuck Version Events

**Event:** `stuck_on_old_version`
```javascript
{
  event_category: 'service_worker',
  event_label: 'stuck_on_old_version',
  current_version: 'liaizen-v1.0.0',
  latest_version: 'liaizen-v1.0.1',
  days_since_update: 8,
  is_stuck: true,
}
```

---

## Querying Analytics

### Find Service Worker Failures

**Google Analytics Query:**
```
Event: service_worker_event
Where: success = false
Group by: event_label (install, update, activate)
```

### Find Users Stuck on Old Versions

**Google Analytics Query:**
```
Event: stuck_on_old_version
Where: is_stuck = true
Group by: current_version
```

### Find Offline Errors

**Google Analytics Query:**
```
Event: error_classified
Where: error_type = offline
Group by: context
```

### Find Server Errors

**Google Analytics Query:**
```
Event: error_classified
Where: error_type = server
Group by: context
```

### Version Adoption Rate

**Google Analytics Query:**
```
Event: version_adoption
Group by: version
Count: unique users
```

---

## Console Logging

All observability events are logged to console with `[PWA Observability]` prefix:

```
[PWA Observability] SW Event: install { success: true, ... }
[PWA Observability] App version tracked: { app_version: 'liaizen-v1.0.0', ... }
[PWA Observability] Error classified as offline: { ... }
[PWA Observability] User stuck on old version: v1.0.0 (latest: v1.0.1, 8 days)
```

---

## Manual Testing

### Test Service Worker Install

1. Open DevTools → Application → Service Workers
2. Unregister existing service worker
3. Reload page
4. Check console for: `[PWA Observability] SW Event: install`
5. Check Analytics for: `service_worker_event` with `event_label: install`

### Test Version Tracking

1. Change `CACHE_VERSION` in `vite.config.js`
2. Build and deploy
3. Load app in browser
4. Check console for: `[PWA Observability] App version tracked`
5. Check Analytics for: `app_version` event
6. Check localStorage for: `liaizen_app_version`

### Test Error Classification

1. Go offline (DevTools → Network → Offline)
2. Make API call
3. Check console for: `[PWA Observability] Error classified as offline`
4. Check Analytics for: `error_classified` with `error_type: offline`

### Test Stuck Version Detection

1. Set old version in localStorage: `localStorage.setItem('liaizen_app_version', 'liaizen-v1.0.0')`
2. Set old timestamp: `localStorage.setItem('liaizen_app_version_timestamp', Date.now() - 8*24*60*60*1000)`
3. Load app
4. Wait for version check (runs every 24h)
5. Check console for: `[PWA Observability] User stuck on old version`
6. Check Analytics for: `stuck_on_old_version` event

---

## Configuration

### App Version

**Location:** `vite.config.js`
```javascript
const CACHE_VERSION = 'liaizen-v1.0.0';
```

**Environment Variable (Optional):**
```bash
VITE_APP_VERSION=liaizen-v1.0.0
```

### Service Worker Version

**Location:** `public/sw-custom.js`
```javascript
const SW_VERSION = 'liaizen-v1.0.0';
```

**Note:** Should match `CACHE_VERSION` in `vite.config.js`

---

## Troubleshooting

### No Events in Analytics

1. **Check Analytics Initialization:**
   - Verify `initAnalytics()` called in `main.jsx`
   - Check `window.gtag` exists

2. **Check Observability Initialization:**
   - Verify `initPWAObservability()` called in `main.jsx`
   - Check console for: `[PWA Observability] Initialized`

3. **Check Service Worker:**
   - Verify service worker registered
   - Check DevTools → Application → Service Workers

### Version Not Tracking

1. **Check localStorage:**
   - Open DevTools → Application → Local Storage
   - Look for `liaizen_app_version` key

2. **Check Version Source:**
   - Verify `CACHE_VERSION` set in `vite.config.js`
   - Check `VITE_APP_VERSION` env var (if used)

### Errors Not Classified

1. **Check Error Handler:**
   - Verify `trackErrorWithClassification()` called
   - Check error is caught in `apiClient.js`

2. **Check Classification Logic:**
   - Verify `classifyErrorType()` working
   - Check console for classification results

---

## Summary

✅ **Service Worker Events:** Tracked automatically on install/update/activate  
✅ **App Version:** Tracked on every page load, stored in localStorage  
✅ **Error Classification:** Offline vs server errors automatically classified  
✅ **Stuck Versions:** Users stuck > 7 days automatically detected  

**You can now answer:**
- ✅ Do I know when service worker install/update fails? **Yes - tracked in Analytics**
- ✅ Can I see offline errors vs server errors? **Yes - classified automatically**
- ✅ Do I know when users are stuck on old versions? **Yes - detected and tracked**

