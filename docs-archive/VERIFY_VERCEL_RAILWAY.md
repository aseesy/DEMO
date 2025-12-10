# ✅ Verify Vercel is Using Correct Railway

## Quick Check

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Open your project** (likely `chat-client-vite` or similar)
3. **Go to Settings → Environment Variables**
4. **Check `VITE_API_URL`**:
   - ✅ **Should be**: `https://demo-production-6dcd.up.railway.app` (LiaiZen Demo - positive-recreation)
   - ❌ **Should NOT be**: `https://demo-production-80ef.up.railway.app` (LiaiZen/production)
   - ❌ **Should NOT be**: `https://web-production-40b92d.up.railway.app` (LiaiZen/production)

## If Vercel is Wrong

If `VITE_API_URL` points to the LiaiZen/production URLs:

1. **Update VITE_API_URL**:
   - Click on `VITE_API_URL` in Vercel
   - Change value to: `https://demo-production-6dcd.up.railway.app`
   - Make sure it's set for **Production**, **Preview**, and **Development**
   - Click **Save**

2. **Redeploy Vercel**:
   - Go to **Deployments** tab
   - Click **⋯** on latest deployment
   - Click **Redeploy**
   - Or push a small change to trigger auto-deploy

## If Vercel is Correct

If `VITE_API_URL` already points to `demo-production-6dcd.up.railway.app`:
- ✅ You're all set!
- You can safely delete the unused LiaiZen/production Railway deployment

