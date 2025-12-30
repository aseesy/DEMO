# ✅ Railway & Vercel Verification Checklist

**Date**: 2025-12-29  
**Status**: Configuration fixes applied - Manual verification needed

## ✅ Completed Automatically

- [x] Railway `FRONTEND_URL` updated to include Vercel domains
- [x] Vercel `VITE_API_URL` verified for all environments (Production/Preview/Development)

## ⚠️ Manual Steps Required

### 1. Vercel Root Directory (CRITICAL)

**Problem**: Vercel builds from monorepo root instead of `chat-client-vite/`

**Fix**:

1. Go to: https://vercel.com/dashboard
2. Open project: `chat-client-vite`
3. Navigate to: **Settings** → **General**
4. Find: **Root Directory**
5. Set to: `chat-client-vite`
6. Click: **Save**
7. Trigger: **Redeploy** (or push a commit)

**Verification**:

- Build logs should show: `Running "build" command` from `chat-client-vite/`
- Build should complete successfully
- No "Could not resolve entry module index.html" error

---

### 2. Railway Backend Status (CRITICAL)

**Problem**: Backend returning 502 errors

**Check**:

```bash
curl https://demo-production-6dcd.up.railway.app/health
```

**Expected Response**:

```json
{ "status": "ok", "database": "connected", "timestamp": "..." }
```

**If Backend is Down**:

1. Go to: https://railway.app/dashboard
2. Open service: `positive-recreation` (or your service name)
3. Check: **Deployments** tab → Latest deployment
4. Check: **Logs** for errors
5. Verify: **Root Directory** is set to `chat-server`
6. Verify: All environment variables are set
7. Trigger: **Redeploy** if needed

---

### 3. Railway FRONTEND_URL Verification

**Check Current Value**:

```bash
railway variables --kv | grep FRONTEND_URL
```

**Expected Value**:

```
FRONTEND_URL=https://coparentliaizen.com,https://www.coparentliaizen.com,https://*.vercel.app
```

**If Incorrect**:

```bash
railway variables --set "FRONTEND_URL=https://coparentliaizen.com,https://www.coparentliaizen.com,https://*.vercel.app"
```

**Critical**: No spaces after commas!

---

### 4. Vercel Environment Variables Verification

**Check Current Values**:

```bash
cd chat-client-vite
vercel env ls | grep VITE_API_URL
```

**Expected**:

- Production: `https://demo-production-6dcd.up.railway.app`
- Preview: `https://demo-production-6dcd.up.railway.app`
- Development: `http://localhost:3000`

**If Missing**:

```bash
cd chat-client-vite
echo "https://demo-production-6dcd.up.railway.app" | vercel env add VITE_API_URL production
echo "https://demo-production-6dcd.up.railway.app" | vercel env add VITE_API_URL preview
echo "http://localhost:3000" | vercel env add VITE_API_URL development
```

---

## 🔍 End-to-End Verification

### Step 1: Test Railway Backend

```bash
# Health check
curl https://demo-production-6dcd.up.railway.app/health

# Root endpoint
curl https://demo-production-6dcd.up.railway.app
```

**Expected**: Both should return JSON responses

### Step 2: Test Vercel Frontend

1. Visit: https://www.coparentliaizen.com
2. Open browser console (F12)
3. Check for:
   - ✅ `API Configuration: { API_URL: 'https://demo-production-6dcd.up.railway.app', ... }`
   - ✅ No CORS errors
   - ✅ Socket.io connects successfully
   - ✅ No 401/403 errors

### Step 3: Test Connection

1. **Login Test**:
   - Try logging in on Vercel deployment
   - Should connect to Railway backend
   - Should authenticate successfully

2. **API Test**:
   - Check browser Network tab
   - API calls should go to Railway domain
   - Should return 200 OK (not 401/403/502)

3. **Socket.io Test**:
   - Check browser console
   - Should see: `Connected to server`
   - Should not see: `WebSocket connection failed`

---

## 📊 Configuration Summary

### Railway Configuration

- **Root Directory**: `chat-server` ✅
- **FRONTEND_URL**: `https://coparentliaizen.com,https://www.coparentliaizen.com,https://*.vercel.app` ✅
- **Backend Status**: ⚠️ **CHECK** (may be down - 502 error)

### Vercel Configuration

- **Root Directory**: ⚠️ **SET MANUALLY** (needs to be `chat-client-vite`)
- **VITE_API_URL**: ✅ Set for all environments
- **Frontend Status**: ✅ Accessible

---

## 🚨 Known Issues

1. **Railway Backend 502**: Backend may be down or misconfigured
   - Check Railway logs
   - Verify service is running
   - Check Root Directory is `chat-server`

2. **Vercel Root Directory**: Not set in Dashboard
   - Must be set manually
   - Critical for builds to succeed

3. **CORS Errors**: May occur if Railway `FRONTEND_URL` is incorrect
   - Verify includes all Vercel domains
   - No spaces after commas

---

## ✅ Success Criteria

All of these must be true:

- [ ] Railway backend responds to `/health` endpoint
- [ ] Vercel builds successfully (no "index.html" errors)
- [ ] Vercel Root Directory is set to `chat-client-vite`
- [ ] Railway `FRONTEND_URL` includes `https://*.vercel.app`
- [ ] Vercel `VITE_API_URL` points to Railway domain
- [ ] Frontend loads without errors
- [ ] Browser console shows correct `API_URL`
- [ ] No CORS errors in browser console
- [ ] Socket.io connects successfully
- [ ] Login works end-to-end

---

## 📚 Quick Reference

**Railway Dashboard**: https://railway.app/dashboard  
**Vercel Dashboard**: https://vercel.com/dashboard  
**Railway Backend**: https://demo-production-6dcd.up.railway.app  
**Vercel Frontend**: https://www.coparentliaizen.com

**Railway CLI**:

```bash
railway login
railway variables --kv
railway logs
```

**Vercel CLI**:

```bash
vercel login
vercel env ls
vercel --prod
```
