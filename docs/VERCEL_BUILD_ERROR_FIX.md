# Vercel Build Error Fix - "Could not resolve entry module index.html"

**Date**: 2025-01-28  
**Error**: `Could not resolve entry module "index.html"`  
**Status**: ⚠️ **NEEDS FIX**

## Problem

Vercel deployments are failing with:

```
error during build:
Could not resolve entry module "index.html".
```

## Root Cause

Vercel is building from the **monorepo root** instead of the `chat-client-vite` directory. This means:

- ❌ Vite can't find `index.html` (it's in `chat-client-vite/`, not root)
- ❌ Build command runs from wrong directory
- ❌ `vercel.json` might not be applied correctly

## Solution: Set Root Directory in Vercel Dashboard

### Step 1: Go to Vercel Dashboard

1. Visit: https://vercel.com/dashboard
2. Click on **"chat-client-vite"** project

### Step 2: Set Root Directory

1. Go to **Settings** tab
2. Click **General** section
3. Find **Root Directory** setting
4. Set it to: `chat-client-vite`
5. Click **Save**

### Step 3: Verify Build Settings

1. Go to **Settings → Build & Development Settings**
2. Verify:
   - **Root Directory**: `chat-client-vite` ✅
   - **Framework Preset**: Other (or Vite)
   - **Build Command**: `npm run build` (or `npx vite build`)
   - **Output Directory**: `dist`
   - **Install Command**: `npm install` (or `npm ci`)

### Step 4: Trigger New Deployment

After saving settings:

1. Vercel will automatically redeploy
2. Or manually trigger: **Deployments** tab → **Redeploy**

## Alternative: Update vercel.json

If Root Directory can't be set in dashboard, update `vercel.json`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "cd chat-client-vite && npm run build",
  "outputDirectory": "chat-client-vite/dist",
  "installCommand": "cd chat-client-vite && npm ci",
  "framework": null,
  ...
}
```

**But this is NOT recommended** - setting Root Directory in dashboard is the correct solution.

## Verification

After fixing:

1. **Check deployment logs**:
   - Should show: `Running "install" command` from `chat-client-vite/`
   - Should show: `Running "build" command` from `chat-client-vite/`
   - Should find `index.html` successfully

2. **Check build output**:
   - Should create `dist/` directory
   - Should contain built files

3. **Test deployment**:
   - Should complete successfully
   - Frontend should be accessible

## Expected Build Logs (After Fix)

```
Running "install" command: `npm ci`...
> Installing dependencies in chat-client-vite/
> added 328 packages

Running "build" command: `npm run build`...
> vite v7.3.0 building client environment for production...
> ✓ built in Xms
> dist/index.html created
> dist/assets/... created
```

## Current vs Expected

**Current (Wrong)**:

- Build runs from: `/` (monorepo root)
- Looks for: `/index.html` ❌ (doesn't exist)
- Result: Build fails

**Expected (Correct)**:

- Build runs from: `/chat-client-vite/` ✅
- Looks for: `/chat-client-vite/index.html` ✅ (exists)
- Result: Build succeeds

---

**Action Required**: Set Root Directory to `chat-client-vite` in Vercel Dashboard
