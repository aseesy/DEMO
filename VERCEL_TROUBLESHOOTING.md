# Vercel Troubleshooting Guide

## Common Issues That Prevent Vercel from Working

### 1. **Build Errors**

**Symptoms:**
- Deployment fails during build
- Error logs show compilation errors
- Build timeout

**Common Causes:**
- Missing dependencies in `package.json`
- TypeScript/ESLint errors
- Import errors (missing files/modules)
- Node version mismatch
- Build command incorrect

**Solutions:**
```bash
# Test build locally first
cd chat-client-vite
npm run build

# Check for errors
npm run lint

# Verify Node version matches
node --version  # Should match engines.node in package.json
```

---

### 2. **Configuration Issues**

**Symptoms:**
- 404 errors on routes
- Assets not loading
- Redirects not working

**Check `vercel.json`:**
- Root directory set correctly
- Build command matches `package.json`
- Output directory correct (`dist` for Vite)
- Rewrites/routes configured properly

**Current Config (chat-client-vite/vercel.json):**
```json
{
  "buildCommand": "npm ci && npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm ci",
  "framework": null,
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**Important:**
- `vercel.json` is located in `chat-client-vite/` directory (the only vercel.json)
- Vercel Root Directory must be set to `chat-client-vite` in Project Settings
- Paths in `vercel.json` are relative to `chat-client-vite/` (no `cd` commands needed)
- `package-lock.json` must exist for `npm ci` to work

---

### 3. **Environment Variables Missing**

**Symptoms:**
- API calls fail
- Features don't work
- Runtime errors about undefined variables

**Required Variables:**
- `VITE_API_URL` - Backend API URL
- `VITE_WS_URL` - WebSocket URL (optional)
- `VITE_GOOGLE_PLACES_API_KEY` - If using Google Places

**Check:**
```bash
cd chat-client-vite
vercel env ls
```

**Set Missing Variables:**
```bash
cd chat-client-vite
vercel env add VITE_API_URL production
# Enter: https://your-railway-backend.up.railway.app
```

**Or via Dashboard:**
1. Vercel Dashboard → Project → **Settings** → **Environment Variables**
2. Add `VITE_API_URL` with your Railway backend URL
3. Select all environments (Production, Preview, Development)
4. Click **Save**

**Note:** `VITE_API_URL` is required. If not set, the app will fall back to a hardcoded URL which may not be correct.

---

### 4. **Node Version Mismatch**

**Symptoms:**
- Build fails with version errors
- Runtime errors about unsupported features

**Check:**
- `package.json` has `engines.node` specified
- Vercel uses Node 18.x by default
- Your code requires Node 20+ (check `chat-server/package.json`)

**Fix:**
- Set Node version in Vercel dashboard:
  - Project → Settings → Node.js Version → Select version
- Or add to `vercel.json`:
```json
{
  "build": {
    "env": {
      "NODE_VERSION": "20"
    }
  }
}
```

---

### 5. **Build Command Issues**

**Symptoms:**
- Build completes but site doesn't work
- Wrong files deployed
- Missing assets

**Current Setup:**
- Root Directory: `chat-client-vite` (set in Vercel Project Settings)
- Build command: `npm ci && npm run build`
- Output: `dist` (relative to root directory)

**Verify:**
```bash
# Test build command locally
cd /Users/athenasees/Desktop/chat/chat-client-vite
npm ci && npm run build

# Check output exists
ls -la dist
```

---

### 6. **Framework Detection Issues**

**Symptoms:**
- Vercel auto-detects wrong framework
- Build uses wrong settings

**Fix:**
- Set `framework: null` in `vercel.json` (already done)
- Or explicitly set framework in Vercel dashboard

---

### 7. **File Size Limits**

**Symptoms:**
- Large files fail to upload
- Build times out
- Deployment fails

**Vercel Limits:**
- Function size: 50MB
- Asset size: Individual files should be < 10MB
- Total deployment: 100MB (free tier)

**Check:**
```bash
# Check build output size
du -sh chat-client-vite/dist

# Check for large files
find chat-client-vite/dist -type f -size +5M
```

---

### 8. **CORS/API Connection Issues**

**Symptoms:**
- Frontend loads but API calls fail
- CORS errors in browser console
- 401/403 errors

**Check:**
- `VITE_API_URL` points to correct backend
- Backend `FRONTEND_URL` includes Vercel domain
- CORS configured on backend

**Test:**
```bash
# Check environment variable
vercel env ls production | grep VITE_API_URL

# Test API connection
curl https://your-vercel-app.vercel.app
```

---

### 9. **Routing Issues (SPA)**

**Symptoms:**
- Direct URL access returns 404
- Refresh breaks navigation
- Routes don't work

**Fix:**
- Ensure `vercel.json` has rewrites for SPA:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

### 10. **Dependencies Issues**

**Symptoms:**
- Build fails with module not found
- Runtime errors about missing packages
- Version conflicts

**Check:**
```bash
# Verify all dependencies installed
cd chat-client-vite
npm install

# Check for peer dependency warnings
npm install --legacy-peer-deps

# Verify lock file
ls package-lock.json
```

---

### 11. **Environment-Specific Issues**

**Symptoms:**
- Works locally but not on Vercel
- Different behavior in production

**Common Causes:**
- Hardcoded localhost URLs
- Missing environment variables
- Development-only code running in production

**Check:**
```javascript
// In your code, check for:
if (import.meta.env.DEV) {
  // This only runs in development
}

// Make sure production uses env vars:
const apiUrl = import.meta.env.VITE_API_URL || 'fallback'
```

---

### 12. **Build Timeout**

**Symptoms:**
- Build starts but times out
- Deployment hangs

**Vercel Limits:**
- Free tier: 45 minutes
- Pro tier: 60 minutes

**Solutions:**
- Optimize build (remove unused dependencies)
- Split builds if needed
- Check for infinite loops in build scripts

---

### 13. **Git Integration Issues**

**Symptoms:**
- Auto-deployments not triggering
- Wrong branch deployed
- Deployment stuck

**Check:**
- Vercel dashboard → Settings → Git
- Production branch set correctly (usually `main`)
- Auto-deploy enabled
- GitHub integration connected

---

### 14. **Output Directory Wrong**

**Symptoms:**
- Build succeeds but 404 on all routes
- Wrong files served

**Current Config (in chat-client-vite/vercel.json):**
```json
{
  "outputDirectory": "dist"
}
```

**Verify:**
```bash
# Check if dist exists after build (from chat-client-vite directory)
ls -la dist/index.html
```

---

### 15. **Service Worker/PWA Issues**

**Symptoms:**
- Caching issues
- Updates not showing
- Service worker errors

**Check:**
- `vite-plugin-pwa` configuration
- Service worker registration
- Cache strategies

---

## Quick Diagnostic Checklist

Run these commands to diagnose:

```bash
# 1. Test build locally
cd chat-client-vite
npm ci && npm run build

# 2. Check for lint errors
npm run lint

# 3. Verify environment variables
vercel env ls

# 4. Check Vercel config
cat vercel.json

# 5. Test deployment
vercel --prod

# 6. Check deployment logs
vercel logs
```

---

## Most Common Fixes

1. **Missing Environment Variables**
   ```bash
   vercel env add VITE_API_URL production
   ```

2. **Wrong Build Directory**
   - Check `chat-client-vite/vercel.json` → `outputDirectory`
   - Should be: `dist` (relative to root directory)

3. **Node Version**
   - Set in Vercel dashboard or `vercel.json`
   - Project requires Node >=20.0.0

4. **Build Command**
   - Vercel Root Directory must be `chat-client-vite`
   - Build command: `npm ci && npm run build`

5. **Framework Detection**
   - Set `framework: null` in `vercel.json`

6. **Missing package-lock.json**
   - `npm ci` requires `package-lock.json`
   - Run `npm install --package-lock-only` to generate it

---

## Get Help

1. **Check Vercel Dashboard:**
   - Project → Deployments → Click failed deployment → View logs

2. **Check Build Logs:**
   ```bash
   vercel logs [deployment-url]
   ```

3. **Test Locally:**
   ```bash
   npm run build
   npm run preview
   ```

4. **Vercel Status:**
   - https://vercel-status.com

