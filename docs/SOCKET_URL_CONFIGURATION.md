# Socket URL Configuration - Current Setup

## Primary Config Loader

**Location**: `chat-client-vite/src/config.js`

This is the **single source of truth** for socket URL configuration.

### Resolution Strategy (Lines 45-69)

```javascript
function getApiBaseUrl() {
  // 1. Explicit env var takes precedence
  if (import.meta.env.VITE_API_URL) {
    // IMPORTANT: Trim to remove any trailing newlines/whitespace
    // A trailing newline in the URL causes Socket.io namespace corruption
    return import.meta.env.VITE_API_URL.trim();
  }

  // 2. Development - use configured port
  if (isDevelopment()) {
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    return `http://${hostname}:${DEV_BACKEND_PORT}`; // DEV_BACKEND_PORT = 3000
  }

  // 3. Production fallback
  return PRODUCTION_API_URL; // 'https://demo-production-6dcd.up.railway.app'
}

function getSocketUrl() {
  // Socket URL is same as API URL (backend serves both)
  return getApiBaseUrl();
}
```

### Exported Values

- `SOCKET_URL` - Computed at build time (const export)
- `getSocketUrl()` - Function for runtime resolution
- Both available via `config.js` exports

---

## Environment Variables

### Primary Variable

- **`VITE_API_URL`** - Used for both API and Socket connections
  - Example: `VITE_API_URL=http://localhost:3000`
  - **CRITICAL**: Automatically trimmed to prevent newline corruption

### Fallback Logic

1. **If `VITE_API_URL` is set**: Use that (trimmed)
2. **If in development** (localhost/127.0.0.1): Use `http://${hostname}:3000`
3. **If in production**: Use `https://demo-production-6dcd.up.railway.app`

---

## Usage in Codebase

### ✅ Primary Usage (Recommended)

**`SocketService.v2.js`** (Current implementation):

```javascript
import { SOCKET_URL } from '../../config.js';

getSocketUrl() {
  let url;
  if (typeof window !== 'undefined' && window.SOCKET_URL) {
    url = window.SOCKET_URL; // Runtime override
  } else {
    url = SOCKET_URL; // From config.js
  }
  return url.trim(); // Safety trim
}
```

### ⚠️ Alternative Implementation (Not Used)

**`SocketAdapter.js`** (Lines 344-346):

```javascript
export function getSocketUrl() {
  return import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';
}
```

**Status**: This function exists but is **NOT used** by the main socket service. It's exported but `SocketService.v2.js` uses `SOCKET_URL` from `config.js` instead.

**Note**: The fallback to `localhost:3000` is correct (standardized port).

---

## Configuration Files

### Environment Files Found

- `.env` - Local development
- `.env.local` - Local overrides
- `.env.production` - Production config
- `.env.example` - Template (filtered by gitignore)

### Expected Format

```bash
# .env
VITE_API_URL=http://localhost:3000
```

---

## Current Flow

```
1. User sets VITE_API_URL in .env
   ↓
2. Vite loads env vars (import.meta.env.VITE_API_URL)
   ↓
3. config.js: getApiBaseUrl() reads VITE_API_URL
   ↓
4. config.js: getSocketUrl() returns same as API URL
   ↓
5. config.js: SOCKET_URL exported (computed at build time)
   ↓
6. SocketService.v2.js: Uses SOCKET_URL from config.js
   ↓
7. SocketAdapter: createSocketConnection(url, options)
```

---

## Issues & Recommendations

### ✅ What's Working

- Single source of truth in `config.js`
- Proper environment variable resolution
- URL trimming to prevent corruption
- Runtime override via `window.SOCKET_URL` (for debugging)

### ⚠️ Potential Issues

1. **Duplicate `getSocketUrl()` in SocketAdapter.js**
   - Not used by main service
   - Uses correct fallback (`localhost:3000`)
   - **Recommendation**: Remove or update to match `config.js` logic

2. **Build-time vs Runtime Resolution**
   - `SOCKET_URL` is computed at build time (const export)
   - If env vars change, need to rebuild
   - **Current**: Works fine, but be aware of this limitation

3. **Window Override**
   - `window.SOCKET_URL` can override config
   - Useful for debugging but could cause confusion
   - **Current**: Documented in code, acceptable

---

## Summary

**Current Config Loader**: `chat-client-vite/src/config.js`

**Socket URL Resolution**:

1. `VITE_API_URL` env var (trimmed)
2. Development: `http://localhost:3000`
3. Production: `https://demo-production-6dcd.up.railway.app`

**Used By**: `SocketService.v2.js` (primary), `SocketService.js` (legacy)

**Note**: Socket URL = API URL (backend serves both on same port)
