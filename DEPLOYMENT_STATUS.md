# Deployment Status

**Date**: January 3, 2026  
**Status**: ⚠️ Partial Deployment - Issues Found

---

## Current Status

### ✅ Marketing Site

- **URL**: `https://www.coparentliaizen.com`
- **Status**: Live (HTTP 200)
- **Issue**: ⚠️ Currently serving MAIN APP instead of marketing site
- **Action Needed**:
  1. Deploy marketing site to separate Vercel project
  2. Point `www.coparentliaizen.com` to marketing site project
  3. Point `app.coparentliaizen.com` to main app project

### ❌ Main App

- **URL**: `https://app.coparentliaizen.com`
- **Status**: DNS not configured
- **Issue**: Domain doesn't resolve
- **Action Needed**:
  1. Deploy main app to Vercel
  2. Configure DNS for `app.coparentliaizen.com`

### ❌ Backend (Railway)

- **URL**: `https://demo-production-6dcd.up.railway.app`
- **Status**: 502 Bad Gateway
- **Issue**: Server not responding
- **Action Needed**:
  1. Check Railway deployment logs
  2. Verify server is running
  3. Check database connection
  4. Verify environment variables

---

## Immediate Actions Required

### 1. Fix Domain Configuration

**Current Problem**: `www.coparentliaizen.com` is pointing to the main app, not the marketing site.

**Solution**:

1. In Vercel Dashboard, find the project that `www.coparentliaizen.com` is connected to
2. This is likely the main app project
3. Remove `www.coparentliaizen.com` from this project's domains
4. Create a NEW Vercel project for the marketing site
5. Deploy marketing site to the new project
6. Add `www.coparentliaizen.com` to the marketing site project

### 2. Deploy Main App

1. Create a new Vercel project (or use existing if separate from marketing)
2. Set Root Directory: `chat-client-vite`
3. Set Environment Variable: `VITE_API_URL=https://demo-production-6dcd.up.railway.app`
4. Deploy
5. Add domain: `app.coparentliaizen.com`

### 3. Fix Railway Backend

1. Go to Railway Dashboard
2. Check deployment logs for errors
3. Verify:
   - Database connection
   - Environment variables
   - Server startup logs
4. Redeploy if needed

---

## Step-by-Step Fix

### Step 1: Check Current Vercel Projects

1. Go to https://vercel.com/dashboard
2. List all projects
3. Identify which project has `www.coparentliaizen.com`
4. Note the project name

### Step 2: Create Marketing Site Project

1. Click "Add New..." → "Project"
2. Import GitHub repo: `aseesy/DEMO`
3. Configure:
   - **Project Name**: `liaizen-marketing` (or similar)
   - **Root Directory**: `marketing-site`
   - **Framework**: Other
   - **Build Command**: `npm install && npm run build`
   - **Output Directory**: `dist`
4. Environment Variables:
   - `VITE_API_URL` = `https://demo-production-6dcd.up.railway.app`
5. Deploy

### Step 3: Update Domain Configuration

1. In the NEW marketing site project:
   - Go to Settings → Domains
   - Add: `www.coparentliaizen.com`
   - Follow DNS instructions

2. In the OLD main app project:
   - Go to Settings → Domains
   - Remove: `www.coparentliaizen.com`
   - Add: `app.coparentliaizen.com` (if not already there)

### Step 4: Deploy Main App (if not already)

1. If main app isn't deployed yet:
   - Create new project or use existing
   - Root Directory: `chat-client-vite`
   - Environment: `VITE_API_URL=https://demo-production-6dcd.up.railway.app`
   - Deploy
   - Add domain: `app.coparentliaizen.com`

### Step 5: Fix Railway Backend

1. Go to Railway Dashboard
2. Check deployment logs
3. Look for errors in:
   - Database connection
   - Module imports
   - Environment variables
4. Fix issues and redeploy

---

## Verification Checklist

After fixes:

- [ ] `www.coparentliaizen.com` shows marketing landing page
- [ ] `app.coparentliaizen.com` shows main app login
- [ ] Backend `/health` returns 200 OK
- [ ] Marketing site waitlist form works
- [ ] Main app authentication works
- [ ] No CORS errors in console
- [ ] Socket.io connects in main app

---

## Testing URLs

Once fixed, test:

```bash
# Marketing site
curl -I https://www.coparentliaizen.com

# Main app
curl -I https://app.coparentliaizen.com

# Backend health
curl https://demo-production-6dcd.up.railway.app/health

# Backend API
curl https://demo-production-6dcd.up.railway.app/api/stats/user-count
```

---

## Notes

- The marketing site and main app MUST be separate Vercel projects
- Each project needs its own Root Directory configuration
- Domain routing is handled by Vercel based on which project the domain is added to
- Backend must be running for both sites to work properly
