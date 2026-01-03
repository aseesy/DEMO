# Vercel Root Directory Fix

## Problem

Vercel error:
```
sh: line 1: cd: chat-client-vite: No such file or directory
Error: Command "cd chat-client-vite && npm ci --include=dev" exited with 1
```

## Root Cause

Vercel is trying to `cd chat-client-vite` but can't find the directory. This happens when:

1. **Vercel Root Directory Setting**: Vercel might be configured to use a subdirectory as the root
2. **Repository Structure**: The directory structure on GitHub might be different
3. **Build Context**: Vercel might be running from a different location

## Solutions

### Solution 1: Check Vercel Root Directory Setting (Recommended)

1. Go to Vercel Dashboard → Your Project → Settings
2. Scroll to **"Root Directory"**
3. Make sure it's set to **"." (repository root)** or **empty**
4. If it's set to `chat-client-vite`, change it to `.` (root)

### Solution 2: Move vercel.json to chat-client-vite (Alternative)

If Vercel is configured to use `chat-client-vite` as root:

1. Move `vercel.json` to `chat-client-vite/vercel.json`
2. Update paths in `vercel.json`:
   ```json
   {
     "buildCommand": "npm ci && npm run build",
     "outputDirectory": "dist",
     "installCommand": "npm ci"
   }
   ```

### Solution 3: Use Absolute Paths (Not Recommended)

Update `vercel.json` to use absolute paths (but this is fragile).

## Current Configuration

**vercel.json location:** Repository root (`/`)  
**Expected structure:**
```
/
├── vercel.json
├── chat-client-vite/
│   ├── package.json
│   ├── src/
│   └── dist/ (after build)
└── chat-server/
```

## Verification Steps

1. **Check GitHub repository structure:**
   ```bash
   git ls-files | grep -E "(vercel\.json|chat-client-vite)" | head -10
   ```

2. **Verify vercel.json is committed:**
   ```bash
   git status vercel.json
   ```

3. **Test build command locally:**
   ```bash
   cd /path/to/repo
   cd chat-client-vite && npm ci && npm run build
   ```

## Fix Applied

Updated `vercel.json` to use `npm ci` instead of `npm install` (matches Vercel's default behavior).

**Next Steps:**
1. Check Vercel Dashboard → Settings → Root Directory
2. Ensure it's set to repository root (`.` or empty)
3. Redeploy

