# 🔍 Vercel Projects Check

## The Situation

You have **two Vercel projects**:
1. **"chat-client"** - One Vercel project
2. **"chat"** - Another Vercel project

You need to identify which one is **active** (the one serving your production site) and which one is **unused** (can be deleted).

## 🔍 How to Identify the Active Project

### Step 1: Check Custom Domain Configuration

The active project should have your custom domain configured:

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Check "chat-client" project**:
   - Go to **Settings → Domains**
   - Does it have `coparentliaizen.com` or `www.coparentliaizen.com`?
   - If YES → This is likely your active project
   - If NO → This might be unused

3. **Check "chat" project**:
   - Go to **Settings → Domains**
   - Does it have `coparentliaizen.com` or `www.coparentliaizen.com`?
   - If YES → This is likely your active project
   - If NO → This might be unused

**The project with the custom domain is your active one.**

### Step 2: Check GitHub Connection

The active project should be connected to your GitHub repo:

1. **Check "chat-client" project**:
   - Go to **Settings → Git**
   - Is it connected to your GitHub repository?
   - What branch is it deploying from? (should be `main`)
   - If connected → This could be active

2. **Check "chat" project**:
   - Go to **Settings → Git**
   - Is it connected to your GitHub repository?
   - What branch is it deploying from? (should be `main`)
   - If connected → This could be active

### Step 3: Check Root Directory

The active project should have the correct root directory:

1. **Check "chat-client" project**:
   - Go to **Settings → General**
   - What is the **Root Directory**?
   - Should be: `chat-client-vite` (or blank if repo root)
   - If correct → This is likely active

2. **Check "chat" project**:
   - Go to **Settings → General**
   - What is the **Root Directory**?
   - Should be: `chat-client-vite` (or blank if repo root)
   - If correct → This is likely active

### Step 4: Check Environment Variables

The active project should have `VITE_API_URL` configured:

1. **Check "chat-client" project**:
   - Go to **Settings → Environment Variables**
   - Does it have `VITE_API_URL`?
   - Value should be: `https://demo-production-6dcd.up.railway.app`
   - If YES → This is likely active

2. **Check "chat" project**:
   - Go to **Settings → Environment Variables**
   - Does it have `VITE_API_URL`?
   - Value should be: `https://demo-production-6dcd.up.railway.app`
   - If YES → This is likely active

### Step 5: Check Recent Deployments

The active project should have recent deployments:

1. **Check "chat-client" project**:
   - Go to **Deployments** tab
   - When was the last deployment?
   - Is it recent (within the last few days)?
   - If recent → This is likely active

2. **Check "chat" project**:
   - Go to **Deployments** tab
   - When was the last deployment?
   - Is it recent (within the last few days)?
   - If recent → This is likely active

## 🎯 Which One Should You Use?

**The active project should have:**
- ✅ Custom domain configured (`coparentliaizen.com`)
- ✅ Connected to your GitHub repo
- ✅ Root directory set to `chat-client-vite` (or correct path)
- ✅ `VITE_API_URL` environment variable set
- ✅ Recent deployments

**The unused project will likely have:**
- ❌ No custom domain (or different domain)
- ❌ Not connected to GitHub (or connected to wrong repo)
- ❌ Wrong root directory
- ❌ Missing or incorrect environment variables
- ❌ Old/no recent deployments

## ✅ Action Plan

### Option 1: Keep "chat-client" (If this is active)

1. **Verify it's the active one** (use checklist above)
2. **Delete "chat" project**:
   - Go to Vercel Dashboard → "chat" project
   - **Settings → General → Danger Zone**
   - Click **Delete Project**
   - Confirm deletion

### Option 2: Keep "chat" (If this is active)

1. **Verify it's the active one** (use checklist above)
2. **Delete "chat-client" project**:
   - Go to Vercel Dashboard → "chat-client" project
   - **Settings → General → Danger Zone**
   - Click **Delete Project**
   - Confirm deletion

### Option 3: Rename to Avoid Confusion

If you want to keep the active one but rename it:

1. **Go to active project** → **Settings → General**
2. **Change Project Name** to something clear like:
   - `liaizen-frontend`
   - `coparentliaizen-frontend`
   - `liaizen-production`
3. **Save**

## 📋 Quick Checklist

Use this checklist to identify the active project:

**"chat-client" project:**
- [ ] Has custom domain `coparentliaizen.com`?
- [ ] Connected to GitHub repo?
- [ ] Root directory is `chat-client-vite`?
- [ ] Has `VITE_API_URL` environment variable?
- [ ] Recent deployments?

**"chat" project:**
- [ ] Has custom domain `coparentliaizen.com`?
- [ ] Connected to GitHub repo?
- [ ] Root directory is `chat-client-vite`?
- [ ] Has `VITE_API_URL` environment variable?
- [ ] Recent deployments?

**The project with more checkmarks is your active one.**

## 🧪 Test Which One is Active

1. **Visit your production site**: `https://www.coparentliaizen.com`
2. **Open browser console** (F12)
3. **Check the deployment URL** in the console or network tab
4. **Match it to one of your Vercel projects**
5. **That's your active project**

## 💡 Recommendation

Based on your codebase structure:
- Your frontend code is in `chat-client-vite/` directory
- The `vercel.json` is in `chat-client-vite/`
- The active project should be named **"chat-client"** or similar

**Most likely scenario:**
- **"chat-client"** = Active project (serving production)
- **"chat"** = Old/unused project (can be deleted)

But verify using the checklist above before deleting anything!











