# 🚀 Vercel Frontend Deployment Guide

Complete guide to deploy frontend to Vercel and connect it to Railway backend.

## ✅ Setup Complete

The frontend is configured to work with Vercel:
- ✅ `vercel.json` created with static file serving configuration
- ✅ `config.js` updated to point to Railway backend
- ✅ Security headers configured
- ✅ CORS updated in backend to allow Vercel domains

## 📋 Deployment Steps

### Step 1: Install Vercel CLI (if not installed)

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Deploy to Vercel

From the `chat-client` directory:

```bash
cd chat-client
vercel
```

**When prompted:**
- **Set up and deploy?** → Yes
- **Which scope?** → Your account
- **Link to existing project?** → No
- **What's your project's name?** → `demo` (or your preferred name)
- **In which directory is your code located?** → `./` (current directory)
- **Want to override the settings?** → No

### Step 4: Production Deployment

After initial deployment, deploy to production:

```bash
vercel --prod
```

Or use the Vercel dashboard to promote the deployment.

## 🔗 Connect Frontend to Railway Backend

### Step 1: Get Railway Domain

1. Go to Railway Dashboard → Your Service
2. Go to **Settings** → **Networking**
3. Copy your Railway domain (e.g., `your-app.up.railway.app`)

### Step 2: Update Frontend Configuration

Update `chat-client/config.js`:

```javascript
// Replace RAILWAY_DOMAIN_PLACEHOLDER with your actual Railway domain
const RAILWAY_DOMAIN = 'https://your-app.up.railway.app';
```

Then commit and push:
```bash
git add chat-client/config.js
git commit -m "Update Railway domain in config"
git push
```

Vercel will auto-deploy the updated config.

## ⚙️ Railway Backend Configuration

### Step 1: Set Root Directory

In Railway Dashboard:
1. Go to your service → **Settings** → **Source**
2. Set **Root Directory** to: `chat-server`
3. Save

### Step 2: Update Environment Variables

In Railway Dashboard → **Variables** tab, add:

```env
FRONTEND_URL=https://coparentliaizen.com,https://www.coparentliaizen.com,https://*.vercel.app
```

This allows:
- Production domain (coparentliaizen.com)
- Vercel preview deployments (*.vercel.app)

### Step 3: Redeploy Railway

Railway should auto-deploy after you push changes, or manually trigger a redeploy.

## 🌐 Custom Domain Setup

### Vercel Domain Configuration

1. **In Vercel Dashboard:**
   - Go to your project → **Settings** → **Domains**
   - Add custom domain: `coparentliaizen.com`
   - Add `www.coparentliaizen.com`

2. **Vercel will provide DNS records:**
   - A record for root domain
   - CNAME for www subdomain

### Hostinger DNS Configuration

1. **Go to Hostinger DNS Zone Editor:**
   - Navigate to **Websites** → Your Domain → **DNS Zone Editor**

2. **Add DNS records from Vercel:**
   - Add A record for root domain (@)
   - Add CNAME record for www subdomain

3. **Wait for DNS propagation:**
   - Usually 5-15 minutes
   - Check with: https://www.whatsmydns.net

## ✅ Verification

After deployment:

1. **Frontend (Vercel):**
   - Visit your Vercel deployment URL
   - Should see your app interface
   - Check browser console for API configuration

2. **Backend (Railway):**
   - Visit your Railway domain
   - Should see: `{"name":"Multi-User Chat Server",...}`
   - Check `/health` endpoint

3. **Connection:**
   - Open browser console on Vercel frontend
   - Should see: `API Configuration: { API_URL: 'https://...', ... }`
   - Test API calls to Railway backend

## 🔧 Environment Variables

### Vercel (Frontend)
No environment variables needed - API URL is configured in `config.js`

### Railway (Backend)
All variables from `.env.example`:
- `NODE_ENV=production`
- `PORT=3001` (Railway sets this automatically)
- `FRONTEND_URL=https://coparentliaizen.com,https://www.coparentliaizen.com,https://*.vercel.app`
- `GMAIL_USER`, `GMAIL_APP_PASSWORD`
- `OPENAI_API_KEY`
- `JWT_SECRET`
- etc.

## 🆘 Troubleshooting

### Frontend can't connect to backend

**Check:**
1. Railway domain is correct in `config.js`
2. Railway backend is running (check Railway logs)
3. CORS is configured correctly (check `FRONTEND_URL` in Railway)
4. Browser console for CORS errors

### CORS Errors

**Solution:**
1. Verify `FRONTEND_URL` in Railway includes Vercel domains
2. Check Railway logs for CORS warnings
3. Verify frontend domain matches allowed origins

### WebSocket not connecting

**Check:**
1. Socket.io CORS configuration in `server.js`
2. Railway domain is correct
3. HTTPS is being used (WebSocket requires HTTPS in production)

## 📚 Additional Resources

- **Vercel Docs**: https://vercel.com/docs
- **Railway Docs**: https://docs.railway.app
- **Vercel CLI**: https://vercel.com/docs/cli

---

**Your frontend is now ready to deploy to Vercel!** 🚀

