# Vercel Configuration Guide

## Current Setup

**Root Directory:** `chat-client-vite` (configured in Vercel Dashboard)  
**vercel.json Location:** `chat-client-vite/vercel.json`  
**Environment Variable:** `VITE_API_URL` (set in Vercel Dashboard)

---

## Configuration Details

### vercel.json

Located at: `chat-client-vite/vercel.json`

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "npm ci && npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm ci",
  "framework": null,
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*\\.js)",
      "headers": [
        {
          "key": "Content-Type",
          "value": "application/javascript; charset=utf-8"
        },
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/assets/(.*\\.css)",
      "headers": [
        {
          "key": "Content-Type",
          "value": "text/css; charset=utf-8"
        },
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

**Key Points:**

- ✅ No `cd` commands needed (Vercel Root Directory is `chat-client-vite`)
- ✅ Paths are relative to `chat-client-vite/` directory
- ✅ Uses `npm ci` for reproducible builds
- ✅ Output directory is `dist` (relative to `chat-client-vite/`)

---

## Environment Variables

### Required Variable

**`VITE_API_URL`**

- **Purpose:** Backend API URL for the frontend to connect to
- **Example:** `https://demo-production-6dcd.up.railway.app`
- **Set in:** Vercel Dashboard → Project → Settings → Environment Variables
- **Environments:** Production, Preview, Development

**How to Set:**

```bash
cd chat-client-vite
vercel env add VITE_API_URL production
# Enter your Railway backend URL when prompted
```

**Or via Dashboard:**

1. Go to Vercel Dashboard → Your Project
2. Settings → Environment Variables
3. Add `VITE_API_URL` with your Railway backend URL
4. Select all environments
5. Click Save

---

## Vercel Dashboard Settings

### Root Directory

**Location:** Settings → General → Root Directory  
**Value:** `chat-client-vite`

This tells Vercel to:

- Build from the `chat-client-vite/` directory
- Use `chat-client-vite/vercel.json` for configuration
- Run build commands relative to `chat-client-vite/`

---

## Common Issues

### Issue: "cd: chat-client-vite: No such file or directory"

**Cause:** `vercel.json` contains `cd chat-client-vite` commands, but Vercel Root Directory is already set to `chat-client-vite`

**Solution:** Remove `cd chat-client-vite` from `vercel.json` commands. Paths should be relative to `chat-client-vite/` since that's the root directory.

### Issue: Build succeeds but connects to wrong backend

**Cause:** `VITE_API_URL` environment variable is not set, so the app falls back to hardcoded URL in `config.js`

**Solution:** Set `VITE_API_URL` in Vercel Dashboard → Environment Variables

### Issue: vercel.json not found

**Cause:** Looking for `vercel.json` in wrong location

**Solution:** `vercel.json` is in `chat-client-vite/` directory, not repository root

---

## Verification

### Check Configuration

```bash
# Verify vercel.json exists in correct location
ls -la chat-client-vite/vercel.json

# Check environment variables
cd chat-client-vite
vercel env ls

# Test build locally (should match Vercel build)
cd chat-client-vite
npm ci && npm run build
```

### Verify Vercel Settings

1. **Root Directory:**
   - Dashboard → Settings → General → Root Directory
   - Should be: `chat-client-vite`

2. **Environment Variables:**
   - Dashboard → Settings → Environment Variables
   - Should have: `VITE_API_URL` set for all environments

---

## Migration Notes

**Previous Configuration (Incorrect):**

- `vercel.json` was in repository root
- Commands used `cd chat-client-vite`
- Root Directory was not set in Vercel

**Current Configuration (Correct):**

- `vercel.json` is in `chat-client-vite/` directory
- Commands are relative (no `cd` needed)
- Root Directory is set to `chat-client-vite` in Vercel Dashboard

---

## Files

- ✅ `chat-client-vite/vercel.json` - Vercel configuration (correct location)
- ❌ `vercel.json` (root) - Removed (was incorrect)
