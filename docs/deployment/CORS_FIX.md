# CORS Fix for Production

**Issue:** Frontend at `https://www.coparentliaizen.com` cannot access backend API due to CORS policy.

**Error:**

```
Access to fetch at 'https://demo-production-6dcd.up.railway.app/api/auth/login'
from origin 'https://www.coparentliaizen.com' has been blocked by CORS policy:
Response to preflight request doesn't pass access control check:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

---

## Root Cause

The Railway backend's `FRONTEND_URL` environment variable doesn't include the production domain `https://www.coparentliaizen.com`.

**Current CORS Configuration:**

- Backend reads `FRONTEND_URL` from environment variable
- Splits by comma to get allowed origins
- Only origins in this list are allowed

---

## Fix Required

### Step 1: Update Railway Environment Variable

Go to Railway Dashboard → Your Project → Variables

**Update `FRONTEND_URL` to include:**

```
https://coparentliaizen.com,https://www.coparentliaizen.com,https://*.vercel.app
```

**Or if you want to be more specific:**

```
https://coparentliaizen.com,https://www.coparentliaizen.com,https://coparentliaizen.vercel.app,https://*.vercel.app
```

### Step 2: Verify the Fix

After updating the environment variable:

1. Railway will automatically redeploy
2. Check Railway logs for: `🔒 CORS enabled for: ...`
3. Verify it includes your production domains
4. Test login from `https://www.coparentliaizen.com`

---

## Current Configuration

**File:** `chat-server/config.js`

```javascript
const FRONTEND_URLS = (
  process.env.FRONTEND_URL ||
  `http://localhost:${DEFAULT_FRONTEND_PORT},http://localhost:${DEFAULT_BACKEND_PORT}`
)
  .split(',')
  .map(url => url.trim())
  .filter(Boolean);
```

**File:** `chat-server/middleware.js`

```javascript
function setupCors(app) {
  const allowedOrigins = [...FRONTEND_URLS];
  // ... CORS configuration uses allowedOrigins
}
```

---

## Quick Fix Command (Railway CLI)

If you have Railway CLI installed:

```bash
railway variables set FRONTEND_URL="https://coparentliaizen.com,https://www.coparentliaizen.com,https://*.vercel.app"
```

---

## Verification

After updating, check Railway logs for:

```
🔒 CORS enabled for: https://coparentliaizen.com, https://www.coparentliaizen.com, https://*.vercel.app
```

Then test:

1. Go to `https://www.coparentliaizen.com`
2. Try to login
3. Check browser console - CORS errors should be gone

---

**This is a Railway environment variable issue, not a code issue. The fix is to update `FRONTEND_URL` in Railway Dashboard.**
