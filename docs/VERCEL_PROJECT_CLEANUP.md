# Vercel Project Cleanup - Remove Duplicate Projects

**Issue**: Vercel has 2 projects but should only use `chat-client-vite`, not `chat`

## Current Situation

You have **two Vercel projects**:

1. **"chat"** - ❌ Should be deleted (incorrect/duplicate)
2. **"chat-client-vite"** - ✅ Should be kept (correct frontend project)

## Solution: Delete the "chat" Project

### Step 1: Identify Which Project is Active

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Check both projects**:
   - Click on **"chat"** project
   - Click on **"chat-client-vite"** project
3. **Compare settings**:

#### Check Root Directory:

- **"chat-client-vite"** should have:
  - **Root Directory**: `chat-client-vite` ✅
- **"chat"** likely has:
  - **Root Directory**: `chat` or blank ❌

#### Check Custom Domains:

- Which project has your custom domain (`coparentliaizen.com`)?
- The project with the domain is the active one

#### Check Recent Deployments:

- Which project has recent deployments?
- The project with recent activity is likely the active one

### Step 2: Delete the "chat" Project

**⚠️ IMPORTANT**: Make sure you're deleting the correct project!

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Click on "chat" project** (the one to delete)
3. **Go to Settings**:
   - Click **Settings** tab
   - Scroll to bottom
4. **Delete Project**:
   - Find **"Delete Project"** section
   - Click **"Delete"** button
   - Type project name to confirm: `chat`
   - Click **"Delete Project"**

### Step 3: Verify "chat-client-vite" Project Settings

After deleting "chat", verify the correct project is configured:

1. **Go to "chat-client-vite" project** in Vercel Dashboard
2. **Check Settings → General**:
   - **Root Directory**: Should be `chat-client-vite` ✅
   - **Project Name**: Should be `chat-client-vite` (or your preference)
3. **Check Settings → Git**:
   - **Repository**: Should be connected to your GitHub repo
   - **Production Branch**: Should be `main`
   - **Root Directory**: Should be `chat-client-vite`
4. **Check Settings → Domains**:
   - Should have your custom domain configured
   - Should have `www` subdomain if needed

### Step 4: Verify Deployment

1. **Check Deployments tab**:
   - Should show recent deployments
   - Should show successful builds
2. **Test the site**:
   - Visit your custom domain
   - Verify frontend loads correctly
   - Verify it connects to Railway backend

## Alternative: Rename Projects (If Needed)

If you want to keep both but rename them:

1. **"chat-client-vite"** → Keep as is (or rename to `demo-frontend`)
2. **"chat"** → Delete (not needed)

## Verification Checklist

After cleanup:

- [ ] Only **one** Vercel project exists: `chat-client-vite`
- [ ] Root Directory is set to: `chat-client-vite`
- [ ] Custom domain is configured correctly
- [ ] GitHub integration is connected
- [ ] Recent deployments are working
- [ ] Frontend loads correctly in browser

## Why This Matters

Having two projects can cause:

- ❌ Confusion about which project is active
- ❌ Wasted resources (both projects deploy)
- ❌ DNS/domain conflicts
- ❌ Deployment confusion

**Solution**: Keep only `chat-client-vite` and delete `chat`.

---

**Last Updated**: 2025-01-28
