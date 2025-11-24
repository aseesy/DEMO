# Deployment Guide

## Quick Setup

### 1. Get Your Railway Backend URL

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click on your `chat-server` project
3. Go to **Settings** tab
4. Under **Networking**, find your public domain (e.g., `your-app.up.railway.app`)
5. Copy the full URL: `https://your-app.up.railway.app`

### 2. Set Environment Variable in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your `coparentliaizen` project
3. Go to **Settings** → **Environment Variables**
4. Add a new variable:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://your-app.up.railway.app` (your Railway URL from step 1)
   - **Environment**: Check all (Production, Preview, Development)
5. Click **Save**

### 3. Redeploy

After adding the environment variable, you need to trigger a new deployment:

**Option A: Redeploy from Vercel**
1. Go to **Deployments** tab
2. Click the three dots (...) on the latest deployment
3. Click **Redeploy**

**Option B: Push a small change**
```bash
git commit --allow-empty -m "chore: trigger Vercel redeploy"
git push origin main
```

### 4. Verify Connection

1. Visit https://www.coparentliaizen.com
2. Open browser DevTools (F12)
3. Check Console - should see successful socket.io connection
4. The error about "insecure content" should be gone

## Environment Variables Reference

### Frontend (Vercel)
- `VITE_API_URL` - Backend API URL (Railway)

### Backend (Railway)
- `PORT` - Server port (Railway sets automatically)
- `FRONTEND_URL` - Allowed CORS origins (should include `https://www.coparentliaizen.com,https://coparentliaizen.com`)
- `OPENAI_API_KEY` - OpenAI API key for AI mediator
- `JWT_SECRET` - Secret for JWT tokens
- `OAUTH_CLIENT_ID` - Google OAuth client ID
- `OAUTH_CLIENT_SECRET` - Google OAuth secret

## Troubleshooting

### "Unable to connect to server"
- ✅ Check Railway backend is running (green status)
- ✅ Verify `VITE_API_URL` is set in Vercel
- ✅ Ensure CORS allows your domain in Railway env vars

### Mixed Content Error (HTTP/HTTPS)
- ✅ Make sure Railway URL uses `https://` (not `http://`)
- ✅ Railway should automatically provide HTTPS

### CORS Errors
- ✅ Update Railway `FRONTEND_URL` to include your Vercel domain
- ✅ Format: `https://www.coparentliaizen.com,https://coparentliaizen.com`
