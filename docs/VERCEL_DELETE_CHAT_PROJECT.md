# Delete "chat" Vercel Project - Keep Only "chat-client-vite"

**Goal**: Remove the duplicate "chat" project from Vercel, keep only "chat-client-vite"

## Current Situation

- ✅ **"chat-client-vite"** - Correct project (should keep)
- ❌ **"chat"** - Duplicate/incorrect project (should delete)

## Steps to Delete "chat" Project

### Step 1: Verify Which Project is Active

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Check "chat-client-vite" project**:
   - Click on the project
   - Go to **Settings → General**
   - Verify **Root Directory** is: `chat-client-vite` ✅
   - Check **Settings → Domains** - should have your custom domain
3. **Check "chat" project**:
   - Click on the project
   - Go to **Settings → General**
   - Note the **Root Directory** (likely wrong)
   - Check if it has any domains configured

**The project with `chat-client-vite` as root directory is the correct one.**

### Step 2: Delete "chat" Project

**⚠️ WARNING**: Make sure you're deleting the correct project!

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Click on "chat" project** (the one to delete)
3. **Navigate to Settings**:
   - Click **Settings** tab
   - Scroll to the bottom
4. **Delete Project**:
   - Find **"Danger Zone"** section
   - Click **"Delete Project"** button
   - Type the project name to confirm: `chat`
   - Click **"Delete Project"** to confirm

### Step 3: Verify "chat-client-vite" Project Settings

After deleting "chat", ensure "chat-client-vite" is correctly configured:

1. **Go to "chat-client-vite" project** in Vercel Dashboard
2. **Settings → General**:
   - ✅ **Root Directory**: `chat-client-vite`
   - ✅ **Project Name**: `chat-client-vite` (or your preference)
3. **Settings → Git**:
   - ✅ **Repository**: Connected to your GitHub repo
   - ✅ **Production Branch**: `main`
   - ✅ **Root Directory**: `chat-client-vite`
4. **Settings → Build & Development Settings**:
   - ✅ **Framework Preset**: Other (or Vite)
   - ✅ **Build Command**: `npm run build` (or auto-detected)
   - ✅ **Output Directory**: `dist`
   - ✅ **Install Command**: `npm install` (or auto-detected)
5. **Settings → Environment Variables**:
   - ✅ Should have `VITE_API_URL` pointing to Railway backend
   - ✅ Should have any other required env vars
6. **Settings → Domains**:
   - ✅ Should have your custom domain configured
   - ✅ Should have `www` subdomain if needed

### Step 4: Verify Deployment

1. **Check Deployments tab**:
   - Should show recent deployments
   - Should show successful builds
   - Build should complete with files in `dist/` directory
2. **Test the site**:
   - Visit your custom domain
   - Verify frontend loads correctly
   - Verify it connects to Railway backend

## Why Delete "chat" Project?

The "chat" project is likely:

- ❌ Pointing to wrong root directory (monorepo root instead of `chat-client-vite`)
- ❌ Not configured correctly for the frontend
- ❌ Causing confusion about which project is active
- ❌ Wasting resources (unnecessary deployments)

**Solution**: Keep only `chat-client-vite` which is correctly configured.

## Verification Checklist

After cleanup:

- [ ] Only **one** Vercel project exists: `chat-client-vite`
- [ ] Root Directory is set to: `chat-client-vite`
- [ ] Custom domain is configured correctly
- [ ] GitHub integration is connected
- [ ] Environment variables are set
- [ ] Recent deployments are working
- [ ] Frontend loads correctly in browser
- [ ] Frontend connects to Railway backend

## Alternative: If You Can't Delete via Dashboard

If the delete option isn't available in the dashboard:

1. **Contact Vercel Support**:
   - Go to: https://vercel.com/support
   - Request deletion of the "chat" project
   - Provide project name: `chat`

2. **Or use Vercel CLI** (if you have access):
   ```bash
   vercel projects rm chat
   ```

## Notes

- The `.vercel` directory in `chat-client-vite/` contains the project link
- This directory should remain - it links to the correct project
- After deleting "chat", only "chat-client-vite" will remain

---

**Last Updated**: 2025-01-28
