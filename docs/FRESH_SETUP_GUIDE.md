# 🚀 Fresh Vercel & Railway Setup Guide

**Date**: 2025-12-30  
**Status**: ✅ **READY FOR FRESH SETUP**

## 🎯 Overview

Complete removal and fresh reconfiguration of Vercel and Railway deployments.

## ✅ What Was Removed

- ❌ All `.vercel/` directories
- ❌ All `vercel.json` files
- ❌ All `railway.toml` files

## ✅ What Was Created

- ✅ Root `vercel.json` (fresh, clean config)
- ✅ Root `railway.toml` (fresh, clean config)
- ✅ `scripts/setup-vercel-railway.sh` (automated setup script)

## 🚀 Setup Steps

### Step 1: Run Setup Script

```bash
cd /Users/athenasees/Desktop/chat
./scripts/setup-vercel-railway.sh
```

This script will:

1. ✅ Verify config files exist
2. ✅ Link Vercel project from root
3. ✅ Set Vercel environment variables
4. ✅ Set Railway environment variables
5. ✅ Verify everything is configured

### Step 2: Commit Config Files

```bash
git add vercel.json railway.toml scripts/setup-vercel-railway.sh
git commit -m "Fresh Vercel and Railway configuration"
git push
```

### Step 3: Verify Deployments

**Vercel**:

- Go to: https://vercel.com/dashboard
- Check latest deployment
- Verify build succeeds

**Railway**:

- Go to: https://railway.app/dashboard
- Check latest deployment
- Verify service starts correctly

## 📁 Final Structure

```
/                           ← Monorepo root
├── .vercel/               ← Created by vercel link (root only)
├── vercel.json            ← ✅ Root Vercel config
├── railway.toml           ← ✅ Root Railway config
├── scripts/
│   └── setup-vercel-railway.sh  ← ✅ Automated setup script
├── chat-client-vite/
│   └── dist/              ← Build output (created on build)
└── chat-server/
    └── server.js           ← Entry point
```

## ✅ Configuration Details

### Root `vercel.json`

```json
{
  "buildCommand": "cd chat-client-vite && npm ci && npm run build",
  "outputDirectory": "chat-client-vite/dist",
  "installCommand": "cd chat-client-vite && npm ci",
  "framework": null,
  "rewrites": [...],
  "headers": [...]
}
```

**How it works**:

- Builds from monorepo root
- Changes to `chat-client-vite/` for install/build
- Outputs to `chat-client-vite/dist`
- Works regardless of Dashboard Root Directory setting

### Root `railway.toml`

```toml
[service]
rootDirectory = "chat-server"

[build]
builder = "nixpacks"
buildCommand = "npm install --legacy-peer-deps"

[deploy]
startCommand = "node server.js"
healthcheckPath = "/health"
healthcheckTimeout = 2000
```

**How it works**:

- Railway detects root `railway.toml`
- Reads `rootDirectory = "chat-server"`
- Changes to `chat-server/` directory
- Runs build and start commands from there

## 🔧 Manual Setup (Alternative)

If the script doesn't work, set up manually:

### Vercel Manual Setup

1. **Link project**:

   ```bash
   cd /Users/athenasees/Desktop/chat
   vercel link --yes
   ```

2. **Set environment variables**:
   ```bash
   cd chat-client-vite
   echo "https://demo-production-6dcd.up.railway.app" | vercel env add VITE_API_URL production
   echo "https://demo-production-6dcd.up.railway.app" | vercel env add VITE_API_URL preview
   echo "http://localhost:3000" | vercel env add VITE_API_URL development
   ```

### Railway Manual Setup

1. **Set environment variables**:
   ```bash
   cd /Users/athenasees/Desktop/chat
   railway variables --set "NODE_ENV=production"
   railway variables --set "PORT=3000"
   railway variables --set "FRONTEND_URL=https://coparentliaizen.com,https://www.coparentliaizen.com,https://*.vercel.app"
   # ... (see scripts/set-railway-vars.sh for full list)
   ```

## ✅ Verification Checklist

- [ ] Root `vercel.json` exists
- [ ] Root `railway.toml` exists
- [ ] `.vercel/` directory exists (created by `vercel link`)
- [ ] Vercel environment variables set (`VITE_API_URL`)
- [ ] Railway environment variables set (`NODE_ENV`, `PORT`, `FRONTEND_URL`, `JWT_SECRET`, etc.)
- [ ] Config files committed to git
- [ ] Vercel deployment succeeds
- [ ] Railway deployment succeeds

## 🚨 Troubleshooting

### Vercel Build Fails

1. Check build logs in Vercel Dashboard
2. Verify `vercel.json` is at root
3. Verify environment variables are set
4. Check that `chat-client-vite/package.json` has `"build": "vite build"`

### Railway Deployment Fails

1. Check Railway logs
2. Verify `railway.toml` is at root
3. Verify environment variables are set
4. Check that `chat-server/server.js` exists
5. Verify `FRONTEND_URL` has no spaces after commas

### Environment Variables Not Working

1. **Vercel**: Variables must start with `VITE_` to be available in build
2. **Railway**: Variables must be set in Railway Dashboard or via CLI
3. Both: Redeploy after setting variables

## 📝 Notes

- Config files are root-only (no subdirectory configs)
- Environment variables are set separately (not in config files)
- `.vercel/` directory is gitignored (local linking info)
- Both configs work regardless of Dashboard Root Directory settings
