# 🚂 Railway Backend Configuration

## ✅ Current Configuration

- **Railway Domain**: `demo-production-6dcd.up.railway.app`
- **Frontend**: Vercel (connects to Railway backend)
- **Status**: ✅ Configured and deployed

## ⚙️ Railway Environment Variables

Make sure these are set in Railway **Variables** tab:

### Required Variables

```env
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://coparentliaizen.com,https://www.coparentliaizen.com,https://*.vercel.app
```

### Email Configuration

```env
EMAIL_SERVICE=gmail
GMAIL_USER=info@liaizen.com
GMAIL_APP_PASSWORD=your_app_password
EMAIL_FROM=info@liaizen.com
APP_NAME=LiaiZen
```

### AI Moderation

```env
OPENAI_API_KEY=sk-your-openai-api-key
```

### Security

```env
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
```

## 🔍 Verify Railway Configuration

### Step 1: Check Railway Root Directory

1. **Go to Railway Dashboard**:
   - Navigate to: https://railway.app/dashboard
   - Open your service

2. **Check Settings → Source**:
   - Go to **Settings** tab
   - Click on **Source** section
   - Verify **Root Directory** is set to: `chat-server`
   - If not, set it and save

### Step 2: Check Environment Variables

1. **Go to Variables Tab**:
   - Click on **Variables** tab
   - Verify all required variables are set
   - **Important**: Check `FRONTEND_URL` includes Vercel domains:
     ```
     https://coparentliaizen.com,https://www.coparentliaizen.com,https://*.vercel.app
     ```

### Step 3: Test Railway Backend

1. **Test Backend Endpoint**:
   - Visit: `https://demo-production-6dcd.up.railway.app`
   - Should see: `{"name":"Multi-User Chat Server",...}`

2. **Test Health Endpoint**:
   - Visit: `https://demo-production-6dcd.up.railway.app/health`
   - Should see: `{"status":"ok",...}`

3. **Check Railway Logs**:
   - Go to **Deployments** tab
   - Click on latest deployment
   - View **Logs** for any errors

## 🔗 Connection Flow

1. **User visits**: `https://coparentliaizen.com` (Vercel)
2. **Frontend loads**: From Vercel
3. **Frontend connects**: To `https://demo-production-6dcd.up.railway.app` (Railway backend)
4. **API calls**: Go to Railway backend
5. **WebSocket connections**: Go to Railway backend

## ✅ Verification Checklist

- [ ] Railway root directory set to `chat-server`
- [ ] All environment variables set
- [ ] `FRONTEND_URL` includes Vercel domains
- [ ] Railway backend accessible at `https://demo-production-6dcd.up.railway.app`
- [ ] Health endpoint works
- [ ] Frontend config updated with Railway domain
- [ ] CORS allows Vercel domains
- [ ] WebSocket connections work
- [ ] API calls succeed

## 🆘 Troubleshooting

### CORS Errors

**Issue**: Frontend can't connect to Railway backend

**Solution**:

1. **Check `FRONTEND_URL` in Railway**:
   - Ensure it includes: `https://*.vercel.app`
   - Should be: `https://coparentliaizen.com,https://www.coparentliaizen.com,https://*.vercel.app`

2. **Check Railway Logs**:
   - Go to **Deployments** → Latest → **Logs**
   - Look for CORS errors
   - Check if origin is being blocked

3. **Verify Backend CORS Configuration**:
   - Check `chat-server/server.js`
   - Ensure `isOriginAllowed` function supports wildcard patterns

### Backend Not Responding

**Issue**: Railway backend not accessible

**Solution**:

1. **Check Railway Deployment**:
   - Go to **Deployments** tab
   - Verify latest deployment is successful
   - Check for errors in logs

2. **Check Railway Domain**:
   - Go to **Settings** → **Networking**
   - Verify domain is active
   - Check SSL certificate status

3. **Test Backend**:
   - Visit: `https://demo-production-6dcd.up.railway.app`
   - Should see backend response
   - If not, check Railway logs

### WebSocket Not Connecting

**Issue**: WebSocket connections fail

**Solution**:

1. **Check Socket.io CORS**:
   - Verify Socket.io CORS allows Vercel domains
   - Check `chat-server/server.js` Socket.io configuration

2. **Check Railway Logs**:
   - Look for WebSocket connection errors
   - Verify Socket.io is running

3. **Test WebSocket**:
   - Open browser console on Vercel frontend
   - Check for WebSocket connection errors
   - Verify `SOCKET_URL` points to Railway domain

## 📚 Additional Resources

- **Railway Docs**: https://docs.railway.app
- **Railway Dashboard**: https://railway.app/dashboard
- **Railway Networking**: https://docs.railway.app/networking

---

**Railway backend is configured and ready! Make sure all environment variables are set correctly.** 🚂
