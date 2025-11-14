# ✅ Vercel + Railway Setup - Next Steps

## 🎉 What's Been Completed

1. ✅ **Vercel Configuration**: Created `chat-client/vercel.json` with security headers
2. ✅ **Frontend Deployed**: Deployed to Vercel at: `https://chat-client-cbpzjcnwy-aseesys-projects.vercel.app`
3. ✅ **Backend CORS Updated**: Updated to allow Vercel domains (including `*.vercel.app` wildcard)
4. ✅ **Static Serving Removed**: Removed static file serving from backend (frontend on Vercel)
5. ✅ **Railway Config Updated**: Simplified for `chat-server` root directory
6. ✅ **Frontend Config Updated**: `config.js` ready to point to Railway backend

## 📋 Next Steps to Complete Setup

### Step 1: Rename Vercel Project to "DEMO" (Optional)

**Option A: Rename in Dashboard**
1. Go to https://vercel.com/dashboard
2. Find project "chat-client"
3. Settings → General → Project Name
4. Change to "demo"
5. Save

**Option B: Create New Project**
- See `docs/VERCEL_PROJECT_RENAME.md` for details

### Step 2: Configure Railway Backend

1. **Set Root Directory**:
   - Railway Dashboard → Your Service → Settings → Source
   - Set **Root Directory** to: `chat-server`
   - Save

2. **Add Environment Variables**:
   - Go to **Variables** tab
   - Add all variables from `chat-server/.env.example`
   - **Important**: Set `FRONTEND_URL` to:
     ```
     https://coparentliaizen.com,https://www.coparentliaizen.com,https://*.vercel.app
     ```

3. **Deploy Railway Backend**:
   - Railway should auto-deploy after you push changes
   - Or manually trigger a redeploy

4. **Get Railway Domain**:
   - After deployment, go to **Settings** → **Networking**
   - Copy your Railway domain (e.g., `your-app.up.railway.app`)

### Step 3: Update Frontend Configuration

1. **Update `chat-client/config.js`**:
   - Replace `RAILWAY_DOMAIN_PLACEHOLDER` with your actual Railway domain
   - Example:
     ```javascript
     const RAILWAY_DOMAIN = 'https://your-app.up.railway.app';
     ```

2. **Commit and Push**:
   ```bash
   git add chat-client/config.js
   git commit -m "Update Railway domain in config"
   git push
   ```

3. **Vercel Auto-Deploys**:
   - Vercel will automatically deploy the updated config

### Step 4: Test Connection

1. **Visit Vercel Frontend**:
   - Go to your Vercel deployment URL
   - Open browser console (F12)

2. **Check API Configuration**:
   - Should see: `API Configuration: { API_URL: 'https://...', ... }`
   - Verify API_URL points to your Railway domain

3. **Test API Calls**:
   - Try to load the app
   - Check if it connects to Railway backend
   - Verify WebSocket connections work

## 🔗 Current URLs

- **Vercel Frontend**: https://chat-client-cbpzjcnwy-aseesys-projects.vercel.app
- **Railway Backend**: (Get from Railway dashboard after deployment)

## ⚙️ Railway Environment Variables

Make sure these are set in Railway:

```env
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://coparentliaizen.com,https://www.coparentliaizen.com,https://*.vercel.app

# Email Configuration
EMAIL_SERVICE=gmail
GMAIL_USER=info@liaizen.com
GMAIL_APP_PASSWORD=your_app_password
EMAIL_FROM=info@liaizen.com
APP_NAME=LiaiZen

# AI Moderation
OPENAI_API_KEY=sk-your-openai-api-key

# Security
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
```

## 🎯 Custom Domain Setup (Later)

### Vercel Domain
1. Vercel Dashboard → Project → Settings → Domains
2. Add `coparentliaizen.com` and `www.coparentliaizen.com`
3. Vercel will provide DNS records

### Hostinger DNS
1. Go to Hostinger DNS Zone Editor
2. Add DNS records from Vercel:
   - A record for root domain
   - CNAME for www subdomain

## ✅ Verification Checklist

- [ ] Railway backend deployed successfully
- [ ] Railway domain obtained
- [ ] `config.js` updated with Railway domain
- [ ] Railway `FRONTEND_URL` includes Vercel domains
- [ ] Frontend connects to Railway backend
- [ ] WebSocket connections work
- [ ] API calls succeed
- [ ] CORS errors resolved

---

**Once Railway backend is deployed, update `config.js` with the Railway domain and you're done!** 🚀

