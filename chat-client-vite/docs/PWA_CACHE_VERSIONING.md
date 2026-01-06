# PWA Cache Versioning Guide

## Quick Reference

**Current Cache Version:** `liaizen-v1.0.0`

**Location:** `vite.config.js` (line 8)

```javascript
const CACHE_VERSION = 'liaizen-v1.0.0';
```

---

## How to Update Cache Version

### For Patch Updates (Bug Fixes)
```javascript
const CACHE_VERSION = 'liaizen-v1.0.1'; // Increment patch
```

### For Minor Updates (New Features)
```javascript
const CACHE_VERSION = 'liaizen-v1.1.0'; // Increment minor
```

### For Major Updates (Breaking Changes)
```javascript
const CACHE_VERSION = 'liaizen-v2.0.0'; // Increment major
```

---

## What Happens When Version Changes

1. **New Caches Created:**
   - All cache names get new version suffix
   - Example: `html-cache-liaizen-v1.0.0` → `html-cache-liaizen-v1.0.1`

2. **Old Caches Deleted:**
   - `cleanupOutdatedCaches: true` removes old caches
   - Happens automatically when new service worker activates

3. **Users Get Update Prompt:**
   - Service worker detects new version
   - Update banner appears
   - User clicks "Update Now"
   - New caches created, old ones deleted

---

## Version Format

**Format:** `liaizen-v{major}.{minor}.{patch}`

**Examples:**
- `liaizen-v1.0.0` - Initial version
- `liaizen-v1.0.1` - Bug fix
- `liaizen-v1.1.0` - New feature
- `liaizen-v2.0.0` - Breaking change

---

## When to Increment Version

### Increment Patch (1.0.0 → 1.0.1)
- Bug fixes
- Performance improvements
- Minor UI tweaks
- Security patches

### Increment Minor (1.0.0 → 1.1.0)
- New features
- New API endpoints
- New UI components
- Non-breaking changes

### Increment Major (1.0.0 → 2.0.0)
- Breaking API changes
- Major UI redesign
- Architecture changes
- Cache strategy changes

---

## Testing Version Updates

1. **Change version in `vite.config.js`**
2. **Build:** `npm run build`
3. **Deploy** to staging/production
4. **Wait 5 minutes** (update check interval)
5. **Verify** update banner appears
6. **Click "Update Now"**
7. **Verify** new caches created
8. **Verify** old caches deleted

---

## Cache Names by Version

All caches include version suffix:

- `workbox-precache-v2-{version}` - Precached assets
- `html-cache-{version}` - HTML pages
- `images-cache-{version}` - Images
- `google-fonts-cache-{version}` - Google Fonts API
- `google-fonts-static-cache-{version}` - Google Fonts static files
- `api-cache-{version}` - API responses

---

## Troubleshooting

### Users Not Getting Updates

1. **Check version changed:** Verify `CACHE_VERSION` updated
2. **Check deployment:** Verify new build deployed
3. **Check service worker:** Verify new service worker registered
4. **Check update interval:** Wait 5 minutes for auto-check
5. **Manual check:** User can refresh to trigger update check

### Old Caches Not Deleting

1. **Check `cleanupOutdatedCaches`:** Should be `true`
2. **Check service worker activation:** New SW must activate
3. **Manual cleanup:** Users can clear site data in browser settings

### Version Conflicts

1. **Clear all caches:** Uninstall and reinstall PWA
2. **Hard refresh:** Bypass cache temporarily
3. **Check cache names:** Verify version suffix matches

---

## Best Practices

1. **Always increment version on deployment**
2. **Use semantic versioning** (major.minor.patch)
3. **Document version changes** in commit messages
4. **Test updates** in staging before production
5. **Monitor update adoption** (how many users update)

---

## Related Documentation

- [PWA Caching Strategy](./PWA_CACHING_STRATEGY.md) - Full caching documentation
- [PWA Update Strategy](./PWA_AUTO_UPDATE.md) - Update flow details

