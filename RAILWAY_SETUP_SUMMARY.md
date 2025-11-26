# 🚂 Railway Setup Summary

## ✅ Active Railway Deployment (LiaiZen Demo)

**This is the one you've been using and updating:**

- **Railway Project**: LiaiZen Demo
- **Railway Service**: positive-recreation
- **Domain**: `demo-production-6dcd.up.railway.app` (referenced in codebase)
- **Status**: ✅ Active - This is your production backend
- **GitHub Connection**: Should be connected to your main repo
- **Branch**: Should be deploying from `main` branch

## ❌ Unused Railway Deployment (LiaiZen/production)

**This is the one you have NOT been using:**

- **Railway Project**: LiaiZen/production
- **Domains**:
  - `demo-production-80ef.up.railway.app`
  - `web-production-40b92d.up.railway.app`
- **Status**: ❌ Not in use - Can be deleted to avoid confusion

## 🔧 Current Configuration

### Vercel Frontend
- **Should point to**: `https://demo-production-6dcd.up.railway.app` (LiaiZen Demo)
- **Environment Variable**: `VITE_API_URL` in Vercel dashboard
- **Check**: Vercel Dashboard → Settings → Environment Variables → `VITE_API_URL`

### Railway Backend (LiaiZen Demo)
- **Project**: LiaiZen Demo
- **Service**: positive-recreation
- **Domain**: `demo-production-6dcd.up.railway.app`
- **FRONTEND_URL**: Should include:
  ```
  https://coparentliaizen.com,https://www.coparentliaizen.com,https://*.vercel.app
  ```
- **Check**: Railway Dashboard → LiaiZen Demo → positive-recreation → Variables → `FRONTEND_URL`

## ✅ Action Items

### 1. Verify Vercel is Using Correct Railway

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Open your project** (chat-client-vite or similar)
3. **Go to Settings → Environment Variables**
4. **Check `VITE_API_URL`**:
   - Should be: `https://demo-production-6dcd.up.railway.app`
   - If it's different, update it to point to LiaiZen Demo Railway
5. **If you updated it**: Redeploy Vercel (or wait for next deployment)

### 2. Verify Railway (LiaiZen Demo) Configuration

1. **Go to Railway Dashboard**: https://railway.app/dashboard
2. **Open "LiaiZen Demo" project**
3. **Open "positive-recreation" service**
3. **Check Settings → Source**:
   - Root Directory: `chat-server`
   - Branch: `main` (or your production branch)
4. **Check Variables**:
   - `FRONTEND_URL`: Should include Vercel domains
   - `DATABASE_URL`: Should be set (PostgreSQL)
   - `JWT_SECRET`: Should be set
   - `NODE_ENV`: `production`
   - Other required variables

### 3. Clean Up Unused Railway (Optional)

**If you want to delete the unused LiaiZen/production deployment:**

1. **Go to Railway Dashboard**: https://railway.app/dashboard
2. **Open "LiaiZen/production"** (or "LiaiZen DEMO/Production")
3. **Go to Settings → Danger Zone**
4. **Click "Delete Service"** (or "Delete Project")
5. **Confirm deletion**

**⚠️ Warning**: Make sure this is the unused one before deleting!

**To verify it's unused:**
- Check Vercel `VITE_API_URL` - does it point to `demo-production-80ef` or `web-production-40b92d`?
- If NO, then it's safe to delete
- If YES, then you need to update Vercel first

## 🧪 Verification

### Test Active Railway (LiaiZen Demo)

```bash
# Test health endpoint
curl https://demo-production-6dcd.up.railway.app/health

# Should return: {"status":"ok",...}
```

### Test from Vercel Frontend

1. **Visit**: `https://www.coparentliaizen.com`
2. **Open browser console** (F12)
3. **Check API calls**:
   - Should see requests to `demo-production-6dcd.up.railway.app`
   - Should NOT see requests to `demo-production-80ef` or `web-production-40b92d`

## 📋 Quick Checklist

- [ ] Verify Vercel `VITE_API_URL` points to `demo-production-6dcd.up.railway.app`
- [ ] Verify Railway (LiaiZen Demo) `FRONTEND_URL` includes Vercel domains
- [ ] Test Railway backend: `curl https://demo-production-6dcd.up.railway.app/health`
- [ ] Test from Vercel frontend - check browser console for API calls
- [ ] (Optional) Delete unused LiaiZen/production Railway deployment
- [ ] Document which Railway is active (this file)

## 🎯 Summary

**Use**: LiaiZen Demo → positive-recreation → `demo-production-6dcd.up.railway.app`  
**Don't use**: LiaiZen/production → `demo-production-80ef.up.railway.app` / `web-production-40b92d.up.railway.app`

Make sure Vercel is pointing to LiaiZen Demo Railway, and you can safely delete the unused LiaiZen/production deployment.

