# 🌐 Domain Setup Guide: coparentliaizen.com

## ✅ Correct Setup

- **Frontend (Vercel)**: `coparentliaizen.com` → Users visit this
- **Backend (Railway)**: `your-app.up.railway.app` → Railway's default domain (no custom domain needed)

## 📋 Step-by-Step Instructions

### Step 1: Remove Domain from Railway (if added)

1. **Go to Railway Dashboard**:
   - Navigate to your Railway service
   - Go to **Settings** → **Networking** (or **Domains**)

2. **Remove Custom Domain**:
   - If `coparentliaizen.com` is listed, remove it
   - Railway should use its default domain: `your-app.up.railway.app`
   - **Keep the Railway-provided domain** - this is what your frontend will connect to

### Step 2: Add Domain to Vercel

1. **Go to Vercel Dashboard**:
   - Navigate to your project: `chat-client` (or rename to `demo`)
   - Go to **Settings** → **Domains**

2. **Add Custom Domain**:
   - Click **Add Domain**
   - Enter: `coparentliaizen.com`
   - Click **Add**
   - Also add: `www.coparentliaizen.com` (as a separate domain)

3. **Vercel will provide DNS records**:
   - Vercel will show you the DNS records you need to add
   - You'll see something like:
     - **A Record**: `@` → `76.76.21.21` (example IP)
     - **CNAME Record**: `www` → `cname.vercel-dns.com` (example)

### Step 3: Configure DNS in Hostinger

1. **Go to Hostinger DNS Zone Editor**:
   - Log in to Hostinger
   - Go to **Websites** → Your Domain → **DNS Zone Editor**

2. **Remove old DNS records** (if any):
   - Remove any A records pointing to Railway
   - Remove any CNAME records pointing to Railway

3. **Add Vercel DNS records**:
   - **A Record** (Root Domain):
     - **Name**: `@` (or leave blank)
     - **Type**: `A`
     - **Value**: (IP address from Vercel)
     - **TTL**: `3600` (or default)
   - **CNAME Record** (www subdomain):
     - **Name**: `www`
     - **Type**: `CNAME`
     - **Value**: (CNAME from Vercel, e.g., `cname.vercel-dns.com`)
     - **TTL**: `3600` (or default)

4. **Save DNS records**:
   - Click **Save** or **Add Record**
   - Wait for DNS propagation (5-15 minutes)

### Step 4: Get Railway Domain

1. **Go to Railway Dashboard**:
   - Navigate to your service
   - Go to **Settings** → **Networking**

2. **Copy Railway Domain**:
   - Copy the Railway-provided domain (e.g., `your-app.up.railway.app`)
   - This is what your frontend will connect to

### Step 5: Update Frontend Configuration

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

### Step 6: Verify SSL Certificates

1. **Vercel SSL**:
   - Vercel automatically provisions SSL certificates
   - Check in Vercel Dashboard → **Settings** → **Domains**
   - SSL should show as "Valid" after DNS propagation

2. **Railway SSL**:
   - Railway automatically provisions SSL certificates for Railway domains
   - Your Railway domain (e.g., `your-app.up.railway.app`) will have SSL
   - No custom domain SSL needed for Railway

## ✅ Final Configuration

### Frontend (Vercel)

- **Domain**: `coparentliaizen.com` (users visit this)
- **SSL**: Automatic (Vercel provides)
- **DNS**: Points to Vercel via Hostinger

### Backend (Railway)

- **Domain**: `your-app.up.railway.app` (Railway-provided)
- **SSL**: Automatic (Railway provides)
- **No custom domain needed** - Railway domain works perfectly

### Connection Flow

1. User visits: `https://coparentliaizen.com` (Vercel)
2. Frontend loads from Vercel
3. Frontend connects to: `https://your-app.up.railway.app` (Railway backend)
4. All API calls and WebSocket connections go to Railway backend

## 🔍 Verification

1. **Check DNS Propagation**:
   - Visit: https://www.whatsmydns.net
   - Enter: `coparentliaizen.com`
   - Verify A record points to Vercel IP

2. **Test Domain**:
   - Visit: `https://coparentliaizen.com`
   - Should load your frontend from Vercel
   - Open browser console (F12)
   - Check: `API Configuration: { API_URL: 'https://your-app.up.railway.app', ... }`

3. **Test Backend**:
   - Visit: `https://your-app.up.railway.app`
   - Should see: `{"name":"Multi-User Chat Server",...}`

## 🎯 Summary

- ✅ **Domain goes to Vercel** (frontend)
- ✅ **Railway uses its default domain** (backend)
- ✅ **Frontend connects to Railway domain** (via `config.js`)
- ✅ **No custom domain needed for Railway**

---

**Once DNS propagates, your domain will point to Vercel, and your frontend will connect to Railway backend!** 🚀
