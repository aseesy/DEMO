# Deployment Guide

Complete guide to deploy LiaiZen to production using Railway (backend) and Vercel (frontend).

## Overview

- **Backend**: Railway (Node.js + PostgreSQL)
- **Frontend**: Vercel (React static site)
- **Database**: PostgreSQL (Railway addon)
- **Domain**: Custom domain with SSL

## Domain Strategy

### Domain Routing

- **`coparentliaizen.com`** (apex) → Redirects to `www.coparentliaizen.com`
- **`www.coparentliaizen.com`** → Marketing site (landing page, blog)
- **`app.coparentliaizen.com`** → Main application (PWA, chat interface)

**Why this separation?**
- Marketing and application release cycles are independent
- Clear user experience distinction
- SEO benefits with www subdomain

## Backend Deployment (Railway)

### Why Railway?

**Pros:**
- ✅ Automatic SSL (HTTPS out of the box)
- ✅ Easy deployments (connect GitHub, auto-deploy on push)
- ✅ Built-in monitoring (logs and metrics)
- ✅ Simple setup (no server management)
- ✅ PostgreSQL addon (one-click database)
- ✅ WebSocket support (Socket.io works perfectly)

**Cons:**
- ⚠️ Ephemeral filesystem (files lost on redeploy - use PostgreSQL)
- ⚠️ Cost: $5-20/month after free tier
- ⚠️ Less control (can't SSH into server)

### Step 1: Create Railway Project

1. Create account at https://railway.app
2. Connect GitHub when prompted
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Railway will auto-detect it's a Node.js project

### Step 2: Configure Backend Service

1. **Set Root Directory:**
   - Service Settings → **Root Directory** → `chat-server`

2. **Add PostgreSQL Database:**
   - Click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
   - Railway automatically injects `DATABASE_URL` environment variable

3. **Add Redis (Optional but Recommended):**
   - Click **"+ New"** → **"Database"** → **"Add Redis"**
   - Railway automatically injects `REDIS_URL` environment variable
   - **Note**: Redis is optional but recommended for production

4. **Add Environment Variables:**
   Go to **Variables** tab and add:

   ```env
   NODE_ENV=production
   PORT=3000
   FRONTEND_URL=https://app.coparentliaizen.com,https://www.coparentliaizen.com,https://*.vercel.app

   # Email Configuration
   EMAIL_SERVICE=gmail
   GMAIL_USER=your_email@gmail.com
   GMAIL_APP_PASSWORD=your_app_password
   EMAIL_FROM=your_email@gmail.com
   APP_NAME=LiaiZen

   # AI Moderation
   OPENAI_API_KEY=sk-your-openai-api-key

   # Security
   JWT_SECRET=your-super-secret-jwt-key-min-32-chars
   ```

5. **Verify DATABASE_URL:**
   - Railway automatically provides `DATABASE_URL` when PostgreSQL is connected
   - Check **Variables** → **Connected Variables** section
   - Should see: `DATABASE_URL=postgresql://...`

### Step 3: Deploy

Railway auto-deploys when you push to `main` branch, or manually trigger from dashboard.

**Check deployment:**
- View logs in Railway dashboard
- Verify: `✅ PostgreSQL pool connected`
- Test: `https://your-railway-domain.up.railway.app/health`

## Frontend Deployment (Vercel)

### Step 1: Create Vercel Project

1. Go to https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Other
   - **Root Directory**: `chat-client-vite`
   - **Build Command**: `npm install && npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Step 2: Set Environment Variables

In Vercel Dashboard → Project Settings → Environment Variables:

```
VITE_API_URL=https://your-railway-domain.up.railway.app
VITE_WS_URL=wss://your-railway-domain.up.railway.app
```

Select all environments (Production, Preview, Development).

### Step 3: Deploy

- Vercel will auto-deploy on push to `main`
- Or manually trigger deployment from dashboard

### Step 4: Configure Custom Domain

1. Go to **Settings** → **Domains**
2. Add domain: `app.coparentliaizen.com`
3. Follow DNS configuration instructions:
   - Add CNAME record in your DNS provider
   - Point `app` to the Vercel domain provided

## Marketing Site Deployment (Vercel)

### Step 1: Create Separate Vercel Project

1. Go to https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. Import the same GitHub repository
4. Configure:
   - **Framework Preset**: Other
   - **Root Directory**: `marketing-site`
   - **Build Command**: `npm install && npm run build`
   - **Output Directory**: `dist`

### Step 2: Set Environment Variables

```
VITE_API_URL=https://your-railway-domain.up.railway.app
```

### Step 3: Configure Domains

1. Go to **Settings** → **Domains**
2. Add `www.coparentliaizen.com` as primary domain
3. Add `coparentliaizen.com` and configure **307 redirect** to `www.coparentliaizen.com`

## DNS Configuration

### Required DNS Records

In your DNS provider (e.g., Hostinger):

- **A Record** for `@` (apex) → Points to Vercel IP (provided by Vercel)
- **CNAME Record** for `www` → Points to Vercel CNAME (provided by Vercel)
- **CNAME Record** for `app` → Points to Vercel CNAME (provided by Vercel)

**Note:** The apex domain redirect (`coparentliaizen.com` → `www.coparentliaizen.com`) is handled at the Vercel level, not in DNS.

## Post-Deployment Checklist

### Backend (Railway)

- [ ] HTTPS working (Railway domain)
- [ ] Health endpoint responds (`/health`)
- [ ] PostgreSQL connected (check logs)
- [ ] Environment variables set correctly
- [ ] WebSocket connections working
- [ ] Email sending works
- [ ] AI mediation working

### Frontend (Vercel)

- [ ] Site loads at custom domain (`app.coparentliaizen.com`)
- [ ] API calls to Railway backend work
- [ ] WebSocket connections work (WSS)
- [ ] No console errors
- [ ] SSL certificate active

### Marketing Site (Vercel)

- [ ] Site loads at `www.coparentliaizen.com`
- [ ] Apex domain redirects correctly
- [ ] SSL certificate active

### Integration

- [ ] Frontend can connect to backend
- [ ] CORS configured correctly
- [ ] Real-time messaging works
- [ ] User authentication works

## Troubleshooting

### Database Connection Issues

**Problem:** `DATABASE_URL not set` error

**Solution:**
1. Verify PostgreSQL service is connected to chat-server service
2. Check **Variables** → **Connected Variables** for `DATABASE_URL`
3. If missing, manually add `DATABASE_URL` from PostgreSQL service

### CORS Errors

**Problem:** Frontend can't connect to backend

**Solution:**
1. Verify `FRONTEND_URL` in Railway includes Vercel domains
2. Check Railway logs for CORS warnings
3. Ensure frontend domain matches allowed origins

### WebSocket Not Connecting

**Problem:** Socket.io connections fail

**Solution:**
1. Verify Railway supports WebSockets (it does by default)
2. Check CORS settings include WebSocket origins
3. Ensure `FRONTEND_URL` includes your Vercel domain
4. Verify HTTPS/WSS is being used (required in production)

### Custom Domain Not Working

**Problem:** Domain doesn't resolve

**Solution:**
1. Wait 5-15 minutes for DNS propagation
2. Verify DNS records match Vercel requirements
3. Check domain settings in Vercel dashboard
4. Use https://www.whatsmydns.net to check propagation

### Environment Variables Not Working

**Problem:** Variables not accessible in code

**Solution:**
1. Check variable names match exactly (case-sensitive)
2. Redeploy after adding variables
3. Check logs for errors
4. Verify variables are in correct service (backend vs frontend)

## Pricing

### Railway

- **Free Tier**: $5 credit/month
- **Hobby Plan**: $5/month + usage
- **Pro Plan**: $20/month + usage
- **Typical Cost**: ~$15-20/month (backend + PostgreSQL)

### Vercel

- **Free Tier**: Unlimited for personal projects
- **Pro Plan**: $20/month for teams
- **Typical Cost**: Free for most use cases

**Total Estimated Cost**: ~$15-20/month

## Quick Reference

### Railway CLI (Optional)

```bash
# Install
npm i -g @railway/cli

# Login
railway login

# Link project
railway link

# Deploy
railway up

# View logs
railway logs
```

### Vercel CLI

```bash
# Deploy
vercel

# Production deploy
vercel --prod

# View deployments
vercel ls

# View logs
vercel logs
```

## Additional Resources

- **Railway Docs**: https://docs.railway.app
- **Vercel Docs**: https://vercel.com/docs
- **Detailed Deployment Guides**: See `docs/deployment/` directory

---

For architecture details, see [architecture.md](./architecture.md)  
For security information, see [security.md](./security.md)

