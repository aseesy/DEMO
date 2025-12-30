# Vercel Project Cleanup Instructions

**Issue**: Vercel has 2 projects - "chat" and "chat-client-vite"  
**Solution**: Delete "chat" project, keep only "chat-client-vite"

## Current Status

✅ **"chat-client-vite"** is correctly linked (`.vercel` directory exists)  
❌ **"chat"** project should be deleted

## Step-by-Step: Delete "chat" Project

### Method 1: Via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**:
   - Visit: https://vercel.com/dashboard
   - Login if needed

2. **Find the "chat" project**:
   - Look for project named "chat" (not "chat-client-vite")
   - Click on it to open

3. **Navigate to Settings**:
   - Click **Settings** tab at the top
   - Scroll down to the bottom

4. **Delete Project**:
   - Find **"Danger Zone"** section (usually at the bottom)
   - Click **"Delete Project"** button
   - A confirmation dialog will appear
   - Type the project name: `chat`
   - Click **"Delete Project"** to confirm

5. **Verify Deletion**:
   - Return to dashboard
   - "chat" project should no longer appear
   - Only "chat-client-vite" should remain

### Method 2: Via Vercel CLI (If Dashboard Doesn't Work)

```bash
# List all projects to confirm names
vercel projects list

# Delete the "chat" project
vercel projects rm chat

# Confirm when prompted
```

## Verify "chat-client-vite" Project Configuration

After deleting "chat", verify "chat-client-vite" is correctly configured:

### 1. Root Directory

- Go to: **Settings → General**
- **Root Directory**: Should be `chat-client-vite` ✅
- If not, set it to `chat-client-vite`

### 2. Build Settings

- Go to: **Settings → Build & Development Settings**
- **Framework Preset**: Other (or Vite)
- **Build Command**: `npm run build` (or auto-detected)
- **Output Directory**: `dist`
- **Install Command**: `npm install` (or auto-detected)

### 3. Environment Variables

- Go to: **Settings → Environment Variables**
- Should have:
  - `VITE_API_URL` = `https://demo-production-6dcd.up.railway.app`
  - Any other required variables

### 4. Custom Domain

- Go to: **Settings → Domains**
- Should have your custom domain configured
- If missing, add it

### 5. GitHub Integration

- Go to: **Settings → Git**
- Should be connected to your GitHub repository
- **Production Branch**: `main`
- **Root Directory**: `chat-client-vite`

## Note: Recent Deployment Errors

I noticed recent deployments for "chat-client-vite" are showing errors. After cleaning up projects, you may want to:

1. **Check deployment logs** in Vercel dashboard
2. **Verify build settings** are correct
3. **Test a new deployment** after cleanup

## Verification Checklist

After cleanup:

- [ ] "chat" project deleted from Vercel
- [ ] Only "chat-client-vite" project remains
- [ ] Root Directory is `chat-client-vite`
- [ ] Build settings are correct
- [ ] Environment variables are set
- [ ] Custom domain is configured
- [ ] GitHub integration is connected

---

**Last Updated**: 2025-01-28
