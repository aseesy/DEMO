# Vercel GitHub Integration Fix

## Problem

**Symptom:** GitHub integration deployments fail, but CLI deployments work fine.

**Root Cause:** Vercel Root Directory setting mismatch between:

- **CLI deployments:** Work because we deploy from `chat-client-vite/` directory
- **GitHub integration:** Uses Vercel Dashboard Root Directory setting (may be wrong)

## Solution

### Step 1: Verify Vercel Dashboard Root Directory Setting

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select project: **`chat-client-vite`**
3. Go to **Settings** → **General**
4. Scroll to **Root Directory**
5. **Must be set to:** `chat-client-vite`

### Step 2: Verify vercel.json Location

The `vercel.json` file should be in `chat-client-vite/` directory:

```bash
ls -la chat-client-vite/vercel.json
```

**Current location:** ✅ `chat-client-vite/vercel.json` (correct)

### Step 3: Verify vercel.json Configuration

When Root Directory is set to `chat-client-vite`, the build commands should **NOT** include `cd chat-client-vite`:

**✅ CORRECT (current):**

```json
{
  "buildCommand": "npm install && npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install"
}
```

**❌ WRONG (would fail):**

```json
{
  "buildCommand": "cd chat-client-vite && npm install && npm run build",
  "outputDirectory": "chat-client-vite/dist"
}
```

### Step 4: Test GitHub Integration

1. Make a small change (e.g., update a comment)
2. Commit and push to `main` branch
3. Check Vercel Dashboard → Deployments
4. Verify build succeeds

## Why CLI Works But GitHub Doesn't

**CLI Deployment:**

```bash
cd chat-client-vite
vercel --prod
```

- Working directory: `chat-client-vite/`
- `vercel.json` found: `./vercel.json` ✅
- Build commands run from: `chat-client-vite/` ✅

**GitHub Integration:**

- Working directory: Repository root (or Root Directory setting)
- If Root Directory = `.` (root): ❌ Can't find `chat-client-vite/vercel.json`
- If Root Directory = `chat-client-vite`: ✅ Finds `vercel.json` and runs commands correctly

## Verification Checklist

- [ ] Vercel Dashboard → Settings → Root Directory = `chat-client-vite`
- [ ] `vercel.json` exists at `chat-client-vite/vercel.json`
- [ ] Build commands don't include `cd chat-client-vite`
- [ ] GitHub integration is connected to correct repository
- [ ] Test deployment from GitHub push succeeds

## Common Issues

### Issue: "vercel.json not found"

**Cause:** Root Directory is set to `.` (root) but `vercel.json` is in `chat-client-vite/`

**Fix:** Set Root Directory to `chat-client-vite` in Vercel Dashboard

### Issue: "cd: chat-client-vite: No such file or directory"

**Cause:** Root Directory is set to `chat-client-vite` but `vercel.json` has `cd chat-client-vite` commands

**Fix:** Remove `cd chat-client-vite` from build commands in `vercel.json`

### Issue: Build succeeds but wrong files deployed

**Cause:** Output directory path is wrong

**Fix:** When Root Directory = `chat-client-vite`, output should be `dist` (not `chat-client-vite/dist`)

## Current Configuration (Verified Working)

**Vercel Dashboard:**

- Root Directory: `chat-client-vite` ✅
- Project: `chat-client-vite`
- Framework: None (custom)

**vercel.json:**

- Location: `chat-client-vite/vercel.json` ✅
- Build Command: `npm install && npm run build` ✅
- Output Directory: `dist` ✅
- No `cd` commands ✅

**Result:** Both CLI and GitHub integration should work identically.
