# Vercel Build Error: "Could not resolve entry module index.html"

## Problem

Vercel build fails with:

```
error during build:
Could not resolve entry module "index.html".
```

## Root Cause

This error occurs when:

1. **Vercel Root Directory is NOT set correctly** in the Vercel Dashboard
2. The build command runs from the wrong directory (repository root instead of `chat-client-vite/`)
3. Vite can't find `index.html` because it's looking in the wrong location

## Solution

### Step 1: Verify Vercel Dashboard Root Directory Setting

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select project: **`chat-client-vite`**
3. Go to **Settings** → **General**
4. Scroll to **Root Directory**
5. **MUST be set to:** `chat-client-vite` (NOT `.` or empty)

### Step 2: Verify vercel.json Location

The `vercel.json` file should be in `chat-client-vite/` directory:

```bash
ls -la chat-client-vite/vercel.json
```

**Current location:** ✅ `chat-client-vite/vercel.json` (correct)

### Step 3: Verify index.html Location

The `index.html` file should be in `chat-client-vite/` directory:

```bash
ls -la chat-client-vite/index.html
```

**Current location:** ✅ `chat-client-vite/index.html` (correct)

## Why This Happens

**When Root Directory = `.` (root):**

- Vercel runs build from repository root
- Build command looks for `index.html` at root → ❌ Not found
- `vercel.json` might not be found (if it's in `chat-client-vite/`)

**When Root Directory = `chat-client-vite`:**

- Vercel runs build from `chat-client-vite/` directory
- Build command finds `index.html` in current directory → ✅ Found
- `vercel.json` is in current directory → ✅ Found

## Verification

After setting Root Directory to `chat-client-vite`:

1. Make a small change (e.g., update a comment)
2. Commit and push to `main` branch
3. Check Vercel Dashboard → Deployments
4. Build should succeed and find `index.html`

## Current Configuration

**Vercel Dashboard:**

- Root Directory: **MUST be `chat-client-vite`** ⚠️
- Project: `chat-client-vite`
- Framework: None (custom)

**vercel.json:**

- Location: `chat-client-vite/vercel.json` ✅
- Build Command: `npm install && npm run build` ✅
- Output Directory: `dist` ✅

**Files:**

- `index.html`: `chat-client-vite/index.html` ✅
- `vite.config.js`: `chat-client-vite/vite.config.js` ✅

## Alternative: If Root Directory Must Be Root

If you cannot change the Root Directory setting, you would need to:

1. Move `vercel.json` to repository root
2. Update build command to: `cd chat-client-vite && npm install && npm run build`
3. Update output directory to: `chat-client-vite/dist`

**However, this is NOT recommended** - it's better to set Root Directory correctly.
