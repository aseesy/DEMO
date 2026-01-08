# Port Configuration Fix

**Issue Found**: `server.js` was using hardcoded port 3000 instead of the config.js default (8080)

## Problem

1. **`chat-server/config.js`** defines `DEFAULT_BACKEND_PORT = 8080` ✅
2. **`chat-server/server.js`** was using `const PORT = process.env.PORT || 3000;` ❌

This meant:
- If `PORT` env var is not set, server would use **3000** (wrong)
- Config.js default of **8080** was being ignored
- Documentation said 8080 but code used 3000

## Fix Applied

Updated `server.js` to use `config.js` for default port:

```javascript
// Before:
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// After:
const { SERVER_PORT, SERVER_HOST } = require('./config');
const PORT = process.env.PORT || SERVER_PORT;
const HOST = SERVER_HOST;
```

Now:
- Server uses `config.js` default (8080) if PORT not set
- Single source of truth for port configuration
- Documentation and code are consistent

## About the `\n` Reference

The `\n` in `docs/ENVIRONMENT_VARIABLES.md` refers to **trailing newline characters** in `.env` files.

**Issue**: Sometimes when editing `.env` files, you might accidentally add a newline at the end:
```env
VITE_API_URL="http://localhost:8080\n"  # ← trailing newline
```

**Impact**: This can cause issues with URL parsing (though Vite usually handles it).

**Fix**: The documentation notes this as a known issue and recommends removing trailing newlines from `.env` values.

This is just documentation about a potential issue, not an actual problem in the code.

