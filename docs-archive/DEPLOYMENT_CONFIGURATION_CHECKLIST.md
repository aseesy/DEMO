# 🚀 Deployment Configuration Checklist

## ✅ Current Configuration Status

**Last Updated:** $(date)
**Railway Backend URL:** `https://demo-production-6dcd.up.railway.app`
**Production Domain:** `www.coparentliaizen.com`

---

## 📋 Vercel Configuration (Frontend)

### Step 1: Verify Project Settings
- [ ] Go to Vercel Dashboard → Your Project → Settings
- [ ] **Root Directory:** Should be `chat-client-vite` (or leave blank if repo root)
- [ ] **Framework Preset:** Vite
- [ ] **Build Command:** `npm run build` (auto-detected)
- [ ] **Output Directory:** `dist` (auto-detected)
- [ ] **Install Command:** `npm install` (auto-detected)

### Step 2: Environment Variables (CRITICAL)
Go to **Settings** → **Environment Variables** and verify these are set:

#### Required Variables:
- [ ] **`VITE_API_URL`** = `https://demo-production-6dcd.up.railway.app`
  - **Environments:** Production, Preview, Development (check all)
  - **This is the most important one!**

#### Optional Variables (if using these features):
- [ ] **`VITE_GA_MEASUREMENT_ID`** = Your Google Analytics ID (e.g., `G-LXL84X75FM`)
- [ ] **`VITE_GOOGLE_TAG`** = Your Google Tag Manager ID (if using GTM)
- [ ] **`VITE_GOOGLE_PLACES_API_KEY`** = Your Google Places API key (if using address autocomplete)

### Step 3: Custom Domain
- [ ] **Domain added:** `www.coparentliaizen.com`
- [ ] **Domain added:** `coparentliaizen.com` (root domain)
- [ ] **SSL Certificate:** Should be automatically provisioned by Vercel
- [ ] **DNS configured:** Check that DNS records in Hostinger point to Vercel

### Step 4: GitHub Integration
- [ ] **Repository connected:** Your GitHub repo is linked
- [ ] **Auto-deploy enabled:** Deploys on push to main branch
- [ ] **Branch:** Main branch is set as production branch

---

## 🚂 Railway Configuration (Backend)

### Step 1: Verify Service Settings
- [ ] Go to Railway Dashboard → Your Service → Settings
- [ ] **Root Directory:** Should be `chat-server`
- [ ] **Start Command:** `node server.js` (or `cd chat-server && node server.js` if root is repo)
- [ ] **Port:** Railway automatically sets PORT (usually 3001)

### Step 2: Environment Variables (CRITICAL)
Go to **Variables** tab and verify these are set:

#### Required Variables:
- [ ] **`NODE_ENV`** = `production`
- [ ] **`PORT`** = `3001` (Railway may set this automatically)
- [ ] **`FRONTEND_URL`** = `https://www.coparentliaizen.com,https://coparentliaizen.com,https://*.vercel.app`
  - **Important:** This allows CORS from your production domain and all Vercel preview deployments

#### Security Variables:
- [ ] **`JWT_SECRET`** = A long, random secret (minimum 32 characters)
  - Example: Generate with: `openssl rand -base64 32`

#### AI/Email Variables (if using):
- [ ] **`OPENAI_API_KEY`** = Your OpenAI API key (starts with `sk-`)
- [ ] **`GMAIL_USER`** = Your Gmail address (e.g., `info@liaizen.com`)
- [ ] **`GMAIL_APP_PASSWORD`** = Gmail app-specific password (not your regular password)
- [ ] **`EMAIL_FROM`** = Email address for sending emails
- [ ] **`EMAIL_SERVICE`** = `gmail`

#### OAuth Variables (if using Google Sign-In):
- [ ] **`OAUTH_CLIENT_ID`** = Your Google OAuth Client ID
- [ ] **`OAUTH_CLIENT_SECRET`** = Your Google OAuth Client Secret

### Step 3: Networking
- [ ] **Public Domain:** Railway should provide `demo-production-6dcd.up.railway.app`
- [ ] **Custom Domain:** NOT needed (backend uses Railway's default domain)
- [ ] **Health Check:** `/health` endpoint should return `{"status":"ok"}`

### Step 4: GitHub Integration
- [ ] **Repository connected:** Your GitHub repo is linked
- [ ] **Auto-deploy enabled:** Deploys on push to main branch
- [ ] **Branch:** Main branch is set as production branch

---

## 🔗 GitHub Configuration

### Step 1: Repository Settings
- [ ] **Repository:** Your code is in GitHub
- [ ] **Branch:** `main` branch is your production branch
- [ ] **Protected:** Consider protecting main branch (optional)

### Step 2: Webhooks/Integrations
- [ ] **Vercel Integration:** Connected and working (auto-deploys on push)
- [ ] **Railway Integration:** Connected and working (auto-deploys on push)

### Step 3: Secrets (if using GitHub Actions)
- [ ] Not needed if using Vercel/Railway auto-deploy
- [ ] If using GitHub Actions, add secrets there

---

## 🧪 Testing Checklist

### Test 1: Railway Backend
```bash
# Test backend is running
curl https://demo-production-6dcd.up.railway.app/health

# Should return: {"status":"ok",...}
```

- [ ] Backend responds to health check
- [ ] Backend returns JSON response

### Test 2: CORS Configuration
```bash
# Test CORS from production domain
curl -H "Origin: https://www.coparentliaizen.com" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://demo-production-6dcd.up.railway.app/api/stats/user-count

# Should return CORS headers including Access-Control-Allow-Origin
```

- [ ] CORS headers are present
- [ ] `Access-Control-Allow-Origin` includes your domain

### Test 3: Vercel Frontend
1. Visit `https://www.coparentliaizen.com`
2. Open browser DevTools (F12) → Console
3. Check for:
   - [ ] No CORS errors
   - [ ] API calls succeed
   - [ ] Socket.io connection works
   - [ ] Console shows: `API Configuration: { API_URL: 'https://demo-production-6dcd.up.railway.app', ... }`

### Test 4: Environment Variables
In browser console on production site, check:
```javascript
// Should show your Railway URL
console.log(import.meta.env.VITE_API_URL);
```

- [ ] `VITE_API_URL` is set correctly
- [ ] Points to `https://demo-production-6dcd.up.railway.app`

---

## 🔧 Quick Fixes

### If CORS errors persist:
1. **Check Railway `FRONTEND_URL` variable:**
   - Should include: `https://www.coparentliaizen.com,https://coparentliaizen.com,https://*.vercel.app`
   - No spaces after commas
   - All URLs use `https://`

2. **Restart Railway service:**
   - Go to Railway → Deployments → Redeploy latest

### If API calls fail:
1. **Check Vercel `VITE_API_URL` variable:**
   - Should be: `https://demo-production-6dcd.up.railway.app`
   - No trailing slash
   - Uses `https://`

2. **Redeploy Vercel:**
   - Go to Vercel → Deployments → Redeploy latest

### If deployment doesn't trigger:
1. **Check GitHub connection:**
   - Vercel: Settings → Git → Verify repo is connected
   - Railway: Settings → Source → Verify repo is connected

2. **Manually trigger:**
   - Vercel: Deployments → Redeploy
   - Railway: Deployments → Redeploy

---

## 📝 Current URLs Reference

- **Frontend (Vercel):** `https://www.coparentliaizen.com`
- **Backend (Railway):** `https://demo-production-6dcd.up.railway.app`
- **GitHub Repo:** (Your repo URL)

---

## ✅ Verification Commands

### Check Railway Backend:
```bash
# Health check
curl https://demo-production-6dcd.up.railway.app/health

# Test CORS
curl -H "Origin: https://www.coparentliaizen.com" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://demo-production-6dcd.up.railway.app/api/stats/user-count -v
```

### Check Vercel Frontend:
1. Visit: `https://www.coparentliaizen.com`
2. Open DevTools → Network tab
3. Look for requests to `demo-production-6dcd.up.railway.app`
4. Check they return 200 status (not CORS errors)

---

## 🎯 Priority Actions

**If you're seeing CORS errors right now:**

1. ✅ **Railway:** Verify `FRONTEND_URL` includes `https://www.coparentliaizen.com,https://coparentliaizen.com,https://*.vercel.app`
2. ✅ **Railway:** Restart/redeploy the service
3. ✅ **Vercel:** Verify `VITE_API_URL=https://demo-production-6dcd.up.railway.app` is set
4. ✅ **Vercel:** Redeploy to pick up environment variable changes

---

**Last Verified:** [Fill in after checking]

