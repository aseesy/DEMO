# 🔧 Vercel Configuration Fix

## ⚠️ The Issue

You're seeing: **"Configuration Settings in the current Production deployment differ from your current Project Settings."**

This happens when `vercel.json` settings don't match what's configured in the Vercel dashboard.

## 📁 Current Setup

You have TWO `vercel.json` files:

1. **Root** (`/vercel.json`): For monorepo setup
   - `buildCommand`: `cd chat-client-vite && npm run build`
   - `outputDirectory`: `chat-client-vite/dist`
   - `installCommand`: `cd chat-client-vite && npm install`

2. **Subdirectory** (`/chat-client-vite/vercel.json`): For subdirectory setup
   - `buildCommand`: `npm run build`
   - `outputDirectory`: `dist`
   - `framework`: `vite`

## ✅ Solution: Choose One Configuration

### Option A: Use Root Directory = `chat-client-vite` (RECOMMENDED)

**In Vercel Dashboard:**
1. Go to **Settings** → **General**
2. Set **Root Directory** to: `chat-client-vite`
3. Save

**Result:**
- Vercel will use `chat-client-vite/vercel.json`
- Settings will match automatically
- No need to change code

**Then delete or ignore the root `vercel.json`** (or rename it to `vercel.json.backup`)

### Option B: Use Root Directory = `.` (root)

**In Vercel Dashboard:**
1. Go to **Settings** → **General**
2. Set **Root Directory** to: `.` (or leave blank)
3. Go to **Settings** → **Build & Development Settings**
4. Set:
   - **Framework Preset**: Vite
   - **Build Command**: `cd chat-client-vite && npm run build`
   - **Output Directory**: `chat-client-vite/dist`
   - **Install Command**: `cd chat-client-vite && npm install`
5. Save

**Result:**
- Vercel will use root `vercel.json`
- Settings will match

## 🎯 Recommended Action

**Use Option A** (Root Directory = `chat-client-vite`):

1. ✅ Set Root Directory to `chat-client-vite` in Vercel
2. ✅ Keep `chat-client-vite/vercel.json` as-is (it's correct)
3. ✅ Delete or rename root `vercel.json` to avoid confusion

This is cleaner and matches the project structure better.

## 🔍 How to Check Current Settings

1. **Go to Vercel Dashboard** → Your Project → **Settings** → **General**
2. Check **Root Directory** value
3. Go to **Settings** → **Build & Development Settings**
4. Compare with your `vercel.json` file

## 📝 After Fixing

1. **Redeploy** from Vercel dashboard
2. The warning should disappear
3. Future deployments will use the correct configuration

