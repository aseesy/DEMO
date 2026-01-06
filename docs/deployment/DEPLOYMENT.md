# 🚀 Deployment Guide

Complete guide to deploy LiaiZen to production using Railway (backend) and Vercel (frontend).

## 📋 Overview

- **Backend**: Railway (Node.js + PostgreSQL)
- **Frontend**: Vercel (React static site)
- **Database**: PostgreSQL (Railway addon)
- **Domain**: Custom domain with SSL

---

## 🚂 Backend Deployment (Railway)

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

1. **Create account**: https://railway.app
2. **Connect GitHub** when prompted
3. **Click "New Project"** → **"Deploy from GitHub repo"**
4. **Select your repository**
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
   - **Note**: Redis is optional - the app works without it, but it's recommended for production to prevent duplicate processing across instances

3. **Add Environment Variables:**
   Go to **Variables** tab and add:

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

4. **Verify DATABASE_URL:**
   - Railway automatically provides `DATABASE_URL` when PostgreSQL is connected
   - Check **Variables** → **Connected Variables** section
   - Should see: `DATABASE_URL=postgresql://...`

### Step 3: Custom Domain Setup

1. **In Railway Dashboard:**
   - Service → **Settings** → **Networking**
   - Click **"Custom Domain"** → Add `coparentliaizen.com`
   - Railway will provide DNS records

2. **Configure DNS in Hostinger:**
   - Go to DNS Zone Editor
   - Add records provided by Railway:
     - A record for root domain (@)
     - CNAME for www subdomain

3. **SSL Certificate:**
   - Railway automatically provisions SSL via Let's Encrypt
   - Wait 5-15 minutes after adding domain

### Step 4: Deploy

Railway auto-deploys when you push to main branch, or manually trigger from dashboard.

**Check deployment:**

- View logs in Railway dashboard
- Verify: `✅ PostgreSQL pool connected`
- Test: `https://your-railway-domain.up.railway.app/health`

---

## 🚀 Frontend Deployment (Vercel)

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login and Deploy

```bash
cd chat-client-vite
vercel login
vercel
```

**When prompted:**

- Set up and deploy? → **Yes**
- Link to existing project? → **No**
- Project name? → `liaizen` (or your preference)
- Directory? → `./` (current directory)

**Important:** After initial setup, configure the Root Directory in Vercel Dashboard:

- Go to **Settings** → **General** → **Root Directory**
- Set to: `chat-client-vite`
- This ensures Vercel builds from the correct directory

### Step 3: Production Deployment

```bash
vercel --prod
```

Or promote deployment from Vercel dashboard.

### Step 4: Configure Environment Variables

1. **Get Railway domain:**
   - Railway Dashboard → Service → **Settings** → **Networking**
   - Copy your Railway domain (e.g., `your-app.up.railway.app`)

2. **Set Vercel environment variable:**
   - Go to Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
   - Add `VITE_API_URL` with value: `https://your-railway-domain.up.railway.app`
   - Select environments: **Production**, **Preview**, and **Development**
   - Click **Save**

   **Or use CLI:**

   ```bash
   cd chat-client-vite
   vercel env add VITE_API_URL production
   # Enter: https://your-railway-domain.up.railway.app
   ```

3. **Important:** The `VITE_API_URL` environment variable is required. The application will fall back to a hardcoded URL if not set, which may not be correct for your deployment.

### Step 5: Custom Domain (Vercel)

1. **In Vercel Dashboard:**
   - Project → **Settings** → **Domains**
   - Add: `coparentliaizen.com` and `www.coparentliaizen.com`

2. **Configure DNS:**
   - Vercel provides DNS records
   - Add to Hostinger DNS Zone Editor
   - Wait for DNS propagation (5-15 minutes)

---

## ✅ Post-Deployment Checklist

### Backend (Railway)

- [ ] HTTPS working (`https://your-domain.com`)
- [ ] Health endpoint responds (`/health`)
- [ ] PostgreSQL connected (check logs)
- [ ] Environment variables set correctly
- [ ] WebSocket connections working
- [ ] Email sending works
- [ ] AI moderation working

### Frontend (Vercel)

- [ ] Site loads at custom domain
- [ ] API calls to Railway backend work
- [ ] WebSocket connections work
- [ ] No console errors
- [ ] SSL certificate active

### Integration

- [ ] Frontend can connect to backend
- [ ] CORS configured correctly
- [ ] Real-time messaging works
- [ ] User authentication works

---

## 🐛 Troubleshooting

### Database Connection Issues

**Problem:** `DATABASE_URL not set` error

**Solution:**

1. Verify PostgreSQL service is connected to chat-server service
2. Check **Variables** → **Connected Variables** for `DATABASE_URL`
3. If missing, manually add `DATABASE_URL` from PostgreSQL service → **Connect** tab

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
2. Check CORS settings in `server.js`
3. Ensure `FRONTEND_URL` includes your Vercel domain
4. Verify HTTPS is being used (required for WebSocket in production)

### Custom Domain Not Working

**Problem:** Domain doesn't resolve

**Solution:**

1. Wait 5-15 minutes for DNS propagation
2. Verify DNS records in Hostinger match Railway/Vercel requirements
3. Check domain settings in Railway/Vercel dashboards
4. Use https://www.whatsmydns.net to check propagation

### Environment Variables Not Working

**Problem:** Variables not accessible in code

**Solution:**

1. Check variable names match exactly (case-sensitive)
2. Redeploy after adding variables
3. Check logs for errors
4. Verify variables are in correct service (backend vs frontend)

---

## 💰 Pricing

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

---

## 📚 Additional Resources

- **Railway Docs**: https://docs.railway.app
- **Vercel Docs**: https://vercel.com/docs
- **Railway Discord**: https://discord.gg/railway
- **Vercel Support**: https://vercel.com/support

---

## 🎯 Quick Reference

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

# Open dashboard
railway open
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

---

**Ready to deploy?** Start with Railway backend setup, then deploy frontend to Vercel! 🚀
