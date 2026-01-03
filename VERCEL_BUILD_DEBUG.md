# Vercel Build Debugging Guide

## ✅ Local Build Status

**Local build: SUCCESS** ✓
- Build completed in 1.40s
- Output directory: `chat-client-vite/dist`
- `index.html` exists
- All assets generated

**Warning (non-blocking):**
- Dynamic import warning for `apiClient.js` (this is fine, just a bundling optimization note)

---

## How to Check Vercel Build Errors

### Option 1: Vercel Dashboard (Easiest)

1. Go to https://vercel.com/dashboard
2. Select your project
3. Click on the **failed deployment**
4. Click **"View Build Logs"** or **"View Function Logs"**
5. Look for red error messages

### Option 2: Vercel CLI

```bash
# Install Vercel CLI if not installed
npm install -g vercel

# Login
vercel login

# Check recent deployments
cd chat-client-vite
vercel ls

# View logs for specific deployment
vercel logs [deployment-url]
```

### Option 3: Test Build Locally (What We Just Did)

```bash
cd chat-client-vite
npm run build
```

**Result:** ✅ Build succeeded locally

---

## Common Vercel Build Errors & Fixes

### 1. **Node Version Mismatch**

**Error:** `Error: Node version X.X.X is not supported`

**Fix:**
- Add to `vercel.json`:
```json
{
  "build": {
    "env": {
      "NODE_VERSION": "20"
    }
  }
}
```

Or set in Vercel Dashboard:
- Project → Settings → Node.js Version → Select "20.x"

---

### 2. **Missing Dependencies**

**Error:** `Cannot find module 'X'` or `Module not found`

**Fix:**
```bash
# Check if dependency is in package.json
cd chat-client-vite
npm install

# Verify all dependencies
npm list --depth=0
```

---

### 3. **Build Command Fails**

**Error:** `Build command failed` or `Command not found`

**Current Build Command:**
```json
"buildCommand": "cd chat-client-vite && npm install && npm run build"
```

**Test Locally:**
```bash
cd /Users/athenasees/Desktop/chat
cd chat-client-vite && npm install && npm run build
```

**If this works locally but fails on Vercel:**
- Check Vercel is using correct root directory
- Verify `vercel.json` is in project root
- Check build logs for specific error

---

### 4. **Output Directory Not Found**

**Error:** `Output directory "chat-client-vite/dist" does not exist`

**Current Config:**
```json
"outputDirectory": "chat-client-vite/dist"
```

**Verify:**
```bash
# After build, check if dist exists
ls -la chat-client-vite/dist/index.html
```

**If missing:**
- Build command might not be running from correct directory
- Check build logs to see where it's running

---

### 5. **Environment Variables Not Available During Build**

**Error:** `VITE_API_URL is undefined` (usually not an issue - Vite env vars are available at build time)

**Note:** `VITE_*` variables are injected at build time, not runtime. They should be available.

**Check:**
```bash
# Verify Vercel has the variable
cd chat-client-vite
vercel env ls
```

---

### 6. **Build Timeout**

**Error:** `Build exceeded maximum duration`

**Vercel Limits:**
- Free tier: 45 minutes
- Pro tier: 60 minutes

**Your build:** Takes ~1.4 seconds locally, so timeout is unlikely

---

### 7. **Framework Detection Issues**

**Error:** Vercel auto-detects wrong framework

**Fix:** Already set in `vercel.json`:
```json
"framework": null
```

---

### 8. **File Size Limits**

**Error:** `File size exceeds limit`

**Check:**
```bash
# Check for large files
find chat-client-vite/dist -type f -size +5M
```

**Your largest file:** `game_theory_matrix-Bfi-w2sY.png` (6MB) - should be fine

---

## Quick Diagnostic Commands

```bash
# 1. Test exact build command Vercel will use
cd /Users/athenasees/Desktop/chat
cd chat-client-vite && npm install && npm run build

# 2. Verify output exists
ls -la chat-client-vite/dist/index.html

# 3. Check Node version matches
node --version  # Should be >= 18.0.0 < 25.0.0

# 4. Check for TypeScript/ESLint errors
cd chat-client-vite
npm run lint

# 5. Check package.json is valid
npm install --dry-run
```

---

## Next Steps

1. **Check Vercel Dashboard** for specific error messages
2. **Compare** local build vs Vercel build logs
3. **Verify** environment variables are set in Vercel
4. **Check** Node version matches in Vercel settings

---

## If Build Works Locally But Fails on Vercel

**Most Common Causes:**

1. **Different Node version** - Set explicitly in Vercel
2. **Missing environment variables** - Check `vercel env ls`
3. **Build command path issues** - Verify `vercel.json` paths
4. **Dependencies not installing** - Check `package-lock.json` is committed
5. **Output directory path** - Verify relative to project root

---

## Current Configuration Summary

✅ **Build Command:** `cd chat-client-vite && npm install && npm run build`  
✅ **Output Directory:** `chat-client-vite/dist`  
✅ **Framework:** `null` (explicit)  
✅ **Local Build:** SUCCESS  
✅ **Node Version:** `>=18.0.0 <25.0.0` (compatible)

**Everything looks correct!** If Vercel is still failing, the error logs will tell us exactly what's wrong.

