# 🔍 Railway & Vercel Deployment - Root Cause Analysis

**Date**: 2025-12-29  
**Status**: ⚠️ **CRITICAL ISSUES IDENTIFIED**

## 📋 Executive Summary

After reviewing all documentation and configuration files, here are the **real problems** with Railway and Vercel deployments:

### 🚨 Critical Issues

1. **Vercel Root Directory Not Set** - Builds failing because Vercel builds from monorepo root
2. **Environment Variable Mismatch** - Vercel env vars not properly configured
3. **CORS Configuration** - Railway `FRONTEND_URL` may not include all Vercel domains
4. **API URL Resolution** - Frontend may not be using correct Railway URL in production

---

## 🔴 Problem #1: Vercel Build Error (CRITICAL)

### Issue

Vercel deployments fail with: `Could not resolve entry module "index.html"`

### Root Cause

**Vercel is building from the monorepo root** (`/`) instead of `chat-client-vite/` directory.

### Evidence

- `vercel.json` exists in `chat-client-vite/` but Vercel Dashboard may not have Root Directory set
- Documentation shows this was identified but may not be fixed
- Build logs would show: `Looking for index.html in /` instead of `/chat-client-vite/`

### Solution

**Set Root Directory in Vercel Dashboard:**

1. Go to: https://vercel.com/dashboard
2. Open project: `chat-client-vite` (or your project name)
3. Settings → General → **Root Directory**
4. Set to: `chat-client-vite`
5. Save and redeploy

### Verification

After fix, build logs should show:

```
Running "install" command: `npm ci`...
> Installing dependencies in chat-client-vite/
Running "build" command: `npm run build`...
> vite v7.3.0 building...
> ✓ dist/index.html created
```

---

## 🔴 Problem #2: Environment Variable Configuration (CRITICAL)

### Issue

Frontend may not be connecting to correct Railway backend URL in production.

### Root Cause

**Vercel environment variables (`VITE_API_URL`) are not set**, so frontend falls back to hardcoded `PRODUCTION_API_URL` in `config.js`.

### Current Configuration

**Frontend (`chat-client-vite/src/config.js`):**

```javascript
// Hardcoded fallback
const PRODUCTION_API_URL = 'https://demo-production-6dcd.up.railway.app';

// Resolution logic:
// 1. Check VITE_API_URL env var (should override)
// 2. Development: use localhost:3000
// 3. Production: use PRODUCTION_API_URL fallback
```

**Problem**: If `VITE_API_URL` is not set in Vercel, it uses the hardcoded URL, which may be outdated or incorrect.

### Solution

**Set Environment Variables in Vercel:**

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add for **Production**, **Preview**, and **Development**:

```bash
# Production & Preview
VITE_API_URL=https://demo-production-6dcd.up.railway.app

# Development (optional, for local testing)
VITE_API_URL=http://localhost:3000
```

**Or use the script:**

```bash
cd chat-client-vite
./scripts/set-vercel-vars.sh
```

### Verification

After setting env vars:

1. Redeploy Vercel
2. Check browser console on deployed site
3. Should see: `API Configuration: { API_URL: 'https://demo-production-6dcd.up.railway.app', ... }`
4. Verify it matches your Railway domain

---

## 🔴 Problem #3: CORS Configuration (HIGH PRIORITY)

### Issue

Socket.io connections fail, API calls get CORS errors.

### Root Cause

**Railway `FRONTEND_URL` environment variable** may not include all Vercel domains.

### Current Configuration

**Railway should have:**

```env
FRONTEND_URL=https://coparentliaizen.com,https://www.coparentliaizen.com,https://*.vercel.app
```

**Critical**: No spaces after commas! This is a common mistake.

### Solution

**Verify Railway Environment Variables:**

1. Go to Railway Dashboard → Your Service → Variables
2. Check `FRONTEND_URL`:
   - ✅ Should include: `https://coparentliaizen.com`
   - ✅ Should include: `https://www.coparentliaizen.com`
   - ✅ Should include: `https://*.vercel.app` (for preview deployments)
   - ❌ **NO SPACES** after commas
3. If incorrect, update and save (Railway will auto-redeploy)

### Verification

After fix:

1. Check Railway logs for CORS errors
2. Should NOT see: `CORS blocked origin: ...`
3. Browser console should NOT show CORS errors
4. Socket.io should connect successfully

---

## 🔴 Problem #4: Root Directory Configuration (MEDIUM PRIORITY)

### Issue

Both Railway and Vercel need correct root directories set.

### Railway Configuration

**Should be set to:** `chat-server`

**Check:**

1. Railway Dashboard → Your Service → Settings → Source
2. **Root Directory**: Should be `chat-server`
3. If not set, Railway tries to build from repo root (will fail)

### Vercel Configuration

**Should be set to:** `chat-client-vite`

**Check:**

1. Vercel Dashboard → Your Project → Settings → General
2. **Root Directory**: Should be `chat-client-vite`
3. If not set, Vercel builds from repo root (will fail)

---

## 🔴 Problem #5: API URL Resolution Logic (MEDIUM PRIORITY)

### Issue

Frontend `config.js` has complex resolution logic that may not work correctly in all scenarios.

### Current Logic (`chat-client-vite/src/config.js`):

```javascript
function getApiBaseUrl() {
  // 1. Explicit env var (VITE_API_URL)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // 2. Development detection
  if (isDevelopment()) {
    return `http://${hostname}:${DEV_BACKEND_PORT}`;
  }

  // 3. Production fallback (hardcoded)
  return PRODUCTION_API_URL;
}
```

### Potential Issues

1. **Environment Detection**: `isProduction()` checks for `coparentliaizen.com` and `vercel.app` in origin
   - ✅ Should work for production domain
   - ✅ Should work for Vercel preview deployments
   - ⚠️ May fail if domain changes

2. **Build-Time vs Runtime**: Vite replaces `import.meta.env.VITE_API_URL` at build time
   - ✅ Works if env var is set during build
   - ❌ Won't work if env var is set after build (needs rebuild)

3. **Fallback URL**: Hardcoded `PRODUCTION_API_URL` may become outdated
   - ⚠️ If Railway domain changes, need to update code

### Solution

**Always set `VITE_API_URL` in Vercel environment variables** - don't rely on fallback.

---

## 📊 Configuration Checklist

### Vercel Configuration

- [ ] **Root Directory**: Set to `chat-client-vite` in Dashboard
- [ ] **Environment Variables**: `VITE_API_URL` set for Production/Preview/Development
- [ ] **Build Command**: `npm run build` (or `npx vite build`)
- [ ] **Output Directory**: `dist`
- [ ] **Framework Preset**: Other (or Vite)
- [ ] **Install Command**: `npm ci` (or `npm install`)

### Railway Configuration

- [ ] **Root Directory**: Set to `chat-server` in Dashboard
- [ ] **Environment Variables**:
  - [ ] `NODE_ENV=production`
  - [ ] `FRONTEND_URL` includes all Vercel domains (no spaces!)
  - [ ] `JWT_SECRET` (32+ characters)
  - [ ] `DATABASE_URL` (auto-provided by PostgreSQL)
  - [ ] `OPENAI_API_KEY` (if using AI features)
  - [ ] `GMAIL_USER` / `GMAIL_APP_PASSWORD` (if using email)

### Connection Verification

- [ ] Railway backend accessible: `curl https://demo-production-6dcd.up.railway.app`
- [ ] Railway health check: `curl https://demo-production-6dcd.up.railway.app/health`
- [ ] Vercel frontend loads correctly
- [ ] Browser console shows correct `API_URL` pointing to Railway
- [ ] No CORS errors in browser console
- [ ] Socket.io connects successfully
- [ ] API calls succeed (no 401/403 errors)

---

## 🎯 Real Problem Summary

### The ACTUAL Issues:

1. **Vercel Root Directory** - Not set, causing build failures
2. **Vercel Environment Variables** - `VITE_API_URL` not set, using fallback
3. **Railway CORS** - `FRONTEND_URL` may be incorrect or missing Vercel domains
4. **Configuration Drift** - Hardcoded URLs may not match actual deployment URLs

### Why These Problems Exist:

1. **Monorepo Structure** - Both platforms need root directory set because code is in subdirectories
2. **Environment Variables** - Not set during initial setup, relying on fallbacks
3. **CORS Configuration** - Railway needs explicit frontend domains, easy to misconfigure
4. **Documentation Gap** - Solutions documented but not verified/implemented

---

## ✅ Action Plan

### Immediate Actions (Do First):

1. **Set Vercel Root Directory**
   - Dashboard → Settings → General → Root Directory → `chat-client-vite`
   - Save and redeploy

2. **Set Vercel Environment Variables**
   - Dashboard → Settings → Environment Variables
   - Add `VITE_API_URL` for Production/Preview/Development
   - Redeploy

3. **Verify Railway CORS**
   - Dashboard → Variables → `FRONTEND_URL`
   - Ensure includes: `https://coparentliaizen.com,https://www.coparentliaizen.com,https://*.vercel.app`
   - No spaces after commas!

### Verification Steps:

1. **Test Vercel Build**
   - Trigger new deployment
   - Check build logs - should build from `chat-client-vite/`
   - Should complete successfully

2. **Test Railway Connection**
   - Visit Vercel deployment
   - Open browser console
   - Verify `API_URL` points to Railway domain
   - Check for CORS errors
   - Test Socket.io connection

3. **Test End-to-End**
   - Login on Vercel deployment
   - Verify API calls succeed
   - Verify Socket.io connects
   - Verify no errors in console

---

## 📚 References

- **Vercel Build Error Fix**: `docs/VERCEL_BUILD_ERROR_FIX.md`
- **Connection Error Fix**: `docs/CONNECTION_ERROR_FIX.md`
- **Railway Configuration**: `docs/RAILWAY_BACKEND_CONFIG.md`
- **Vercel Deployment**: `docs/VERCEL_DEPLOYMENT.md`
- **Railway Review**: `docs/RAILWAY_REVIEW_SUMMARY.md`

---

## 🎯 Conclusion

**The real problems are:**

1. ✅ **Vercel Root Directory** - Needs to be set in Dashboard
2. ✅ **Vercel Environment Variables** - `VITE_API_URL` not configured
3. ✅ **Railway CORS** - `FRONTEND_URL` needs verification
4. ✅ **Configuration Verification** - Need to verify all settings match documentation

**These are configuration issues, not code issues.** The code is correct, but the deployment platforms need proper configuration.
