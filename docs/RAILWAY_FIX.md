# 🔧 Railway Build Error Fix

If you're seeing "Error creating build plan with Railpack", follow these steps:

## ✅ Quick Fix Steps

### Step 1: Set Root Directory in Railway

1. **In Railway Dashboard:**
   - Go to your service (the one that's failing)
   - Click on **"Settings"** tab
   - Scroll down to **"Source"** section
   - Set **"Root Directory"** to: `chat-server`
   - Click **"Save"**

### Step 2: Verify Build Configuration

Railway should now detect:

- ✅ Node.js project (from `package.json` in `chat-server/`)
- ✅ Build command: `npm install`
- ✅ Start command: `npm start`

### Step 3: Redeploy

1. Click **"Deploy"** or **"Redeploy"** button
2. Or push a new commit to trigger auto-deploy

## 🎯 Alternative: Manual Configuration

If Railway still can't detect the build, you can manually configure:

### Option A: Use nixpacks.toml (Already Created)

I've created `chat-server/nixpacks.toml` which tells Railway:

- Use Node.js 18
- Run `npm install`
- Start with `npm start`

### Option B: Set Build/Start Commands in Railway

1. Go to **Settings** → **Build & Deploy**
2. **Build Command**: `cd chat-server && npm install`
3. **Start Command**: `cd chat-server && npm start`

## 📋 Complete Railway Service Settings

Here's what your Railway service should have:

### Source Settings

- **Repository**: Your GitHub repo (aseesy/DEMO)
- **Branch**: `main`
- **Root Directory**: `chat-server` ⬅️ **This is critical!**

### Build Settings

- **Build Command**: (auto-detected) `npm install`
- **Start Command**: (auto-detected) `npm start`

### Environment Variables

Make sure you've added all required variables (see RAILWAY_DEPLOYMENT.md)

## 🆘 Still Not Working?

### Check Logs

1. Go to **"Deployments"** tab
2. Click on the failed deployment
3. Check the **"Build Logs"** for specific errors

### Common Issues

**Issue: "Cannot find package.json"**

- ✅ Solution: Make sure Root Directory is set to `chat-server`

**Issue: "Command not found: npm"**

- ✅ Solution: Railway should auto-detect Node.js, but you can specify in nixpacks.toml

**Issue: "Port already in use"**

- ✅ Solution: Railway sets PORT automatically, make sure your code uses `process.env.PORT`

## ✅ Verification

After fixing, you should see:

- ✅ Build completes successfully
- ✅ Service starts and shows "Running"
- ✅ You get a Railway domain (e.g., `your-app.up.railway.app`)

---

**Once it's working, you can add your custom domain (coparentliaizen.com)!** 🚀
