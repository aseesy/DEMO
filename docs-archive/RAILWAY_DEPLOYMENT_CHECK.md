# 🔍 Railway Deployment Check

## The Problem

You have **two Railway deployments**:

1. **"LiaiZen Demo"** (service: positive-recreation) - Active Railway deployment
2. **"LiaiZen/production"** - Another Railway deployment (unused)

This is causing confusion about which backend URL is being used.

## Current Configuration

The codebase currently references:

- **Railway URL**: `https://demo-production-6dcd.up.railway.app`

This URL is hardcoded in several places:

- Documentation files
- Configuration scripts
- API contracts

## 🔍 How to Identify the Correct Railway Deployment

### Step 1: Check Both Railway Dashboards

1. **Go to Railway Dashboard**: https://railway.app/dashboard
2. **Check "LiaiZen Demo"** (service: positive-recreation):
   - What's the domain? (e.g., `xxx.up.railway.app`)
   - Is it connected to your GitHub repo?
   - Does it have the latest code?
   - Check **Settings → Source** → What branch is it deploying from?

3. **Check "LiaiZen/production"**:
   - What's the domain? (e.g., `xxx.up.railway.app`)
   - Is it connected to your GitHub repo?
   - Does it have the latest code?
   - Check **Settings → Source** → What branch is it deploying from?

### Step 2: Check Vercel Configuration

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Open your project** (should be `chat-client-vite` or similar)
3. **Go to Settings → Environment Variables**
4. **Check `VITE_API_URL`**:
   - What Railway URL is it pointing to?
   - This tells us which Railway deployment Vercel is using

### Step 3: Test Both Railway Deployments

Test each Railway deployment:

```bash
# Test Railway deployment 1 (from "LiaiZen Demo" - positive-recreation)
curl https://[domain-from-liaizen-demo].up.railway.app/health

# Test Railway deployment 2 (from "LiaiZen/production")
curl https://[domain-from-liaizen-production].up.railway.app/health
```

Both should return: `{"status":"ok",...}`

## 🎯 Which One Should You Use?

**Recommendation**: Use **ONE** Railway deployment and delete/stop the other.

### Criteria for Choosing:

1. **Which one is connected to the correct GitHub repo?**
   - Should be connected to your main repo
   - Should be deploying from `main` branch (or your production branch)

2. **Which one has the correct environment variables?**
   - Check **Variables** tab in both
   - Which one has all the required variables set?
   - `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, etc.

3. **Which one is actually being used by Vercel?**
   - Check Vercel's `VITE_API_URL` environment variable
   - This is the one your frontend is connecting to

4. **Which one has the latest code?**
   - Check **Deployments** tab in both
   - Which one has the most recent deployment?
   - Which one has successful deployments?

## ✅ Action Plan

### Option 1: Keep "LiaiZen Demo" (positive-recreation) - This is the active one

1. **Verify it's the one Vercel is using**:
   - Check Vercel `VITE_API_URL` points to this deployment
   - If not, update Vercel to use this one

2. **Stop/Delete "LiaiZen/production" deployment**:
   - Go to Railway Dashboard → "LiaiZen/production"
   - **Settings → Danger Zone → Delete Service**
   - This prevents confusion and unnecessary costs

3. **Update documentation**:
   - Update any hardcoded URLs to match the correct Railway domain
   - Update `VITE_API_URL` in Vercel if needed

### Option 3: Consolidate (If both have different purposes)

If you need both for different reasons:

- **Production**: One for production (connected to Vercel)
- **Staging**: One for staging/testing
- **Update Vercel** to use the production one
- **Document** which is which

## 🔧 How to Update Configuration

### Step 1: Identify the Correct Railway Domain

Once you know which Railway deployment to use, note its domain:

- Example: `https://liaizen-production.up.railway.app`

### Step 2: Update Vercel Environment Variable

1. **Go to Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. **Find or add `VITE_API_URL`**:
   - Value: `https://[your-railway-domain].up.railway.app`
   - Environment: **Production**, **Preview**, **Development** (all)
3. **Save**
4. **Redeploy** Vercel (or wait for next deployment)

### Step 3: Update Railway FRONTEND_URL

1. **Go to Railway Dashboard** → Your Service → **Variables**
2. **Find or update `FRONTEND_URL`**:
   - Value: `https://coparentliaizen.com,https://www.coparentliaizen.com,https://*.vercel.app`
3. **Save** (Railway will auto-redeploy)

### Step 4: Update Documentation (Optional)

If you want to update hardcoded references in docs:

- `docs/RAILWAY_BACKEND_CONFIG.md`
- `check-deployment-config.sh`
- `quick-check.js`
- Any other files referencing the old Railway URL

## 🧪 Verification

After updating:

1. **Test Railway Backend**:

   ```bash
   curl https://[your-railway-domain].up.railway.app/health
   ```

   Should return: `{"status":"ok",...}`

2. **Test from Vercel Frontend**:
   - Visit: `https://www.coparentliaizen.com`
   - Open browser console (F12)
   - Check for API calls to your Railway domain
   - Should see successful connections

3. **Check Railway Logs**:
   - Go to Railway Dashboard → **Deployments** → Latest → **Logs**
   - Should see successful requests from Vercel

## 📋 Quick Checklist

- [ ] Identify which Railway deployment Vercel is currently using
- [ ] Check which Railway has the correct environment variables
- [ ] Check which Railway has the latest code deployed
- [ ] Decide which Railway to keep (delete the other)
- [ ] Update Vercel `VITE_API_URL` if needed
- [ ] Update Railway `FRONTEND_URL` if needed
- [ ] Test both frontend and backend connections
- [ ] Delete/stop the unused Railway deployment

## 💡 Next Steps

1. **Check Vercel Dashboard** → Environment Variables → `VITE_API_URL`
   - This tells you which Railway Vercel is currently using

2. **Check both Railway dashboards**:
   - Which one matches the Vercel `VITE_API_URL`?
   - That's your active deployment

3. **Delete the unused one** to avoid confusion and costs

4. **Update any mismatches** in configuration
