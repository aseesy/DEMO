# 🚂 Railway Deployment Guide

Complete guide to deploy your chat application to Railway.

## ✅ Why Railway?

**Pros:**
- ✅ **Automatic SSL** - HTTPS out of the box
- ✅ **Easy deployments** - Connect GitHub, auto-deploy on push
- ✅ **Built-in monitoring** - Logs and metrics included
- ✅ **Simple setup** - No server management needed
- ✅ **Free tier available** - $5 credit/month to start
- ✅ **PostgreSQL addon** - Easy database upgrade path
- ✅ **WebSocket support** - Socket.io works perfectly

**Cons:**
- ⚠️ **Ephemeral filesystem** - Files lost on redeploy (SQLite needs special handling)
- ⚠️ **Cost** - $5-20/month after free tier
- ⚠️ **Less control** - Can't SSH into server

## ⚠️ Critical: SQLite Persistence Issue

**Problem:** Railway's filesystem is ephemeral. Your `chat.db` file will be **lost on every redeploy** unless you use persistent storage.

**Solutions:**

### Option A: Use Railway Volumes (Recommended for SQLite)
- Add a persistent volume to store `chat.db`
- Database persists across deployments
- Easy to set up

### Option B: Migrate to PostgreSQL (Best for Production)
- Railway has one-click PostgreSQL addon
- Better for production (concurrent writes, backups)
- More scalable long-term

## 🚀 Step-by-Step Deployment

### Step 1: Prepare Your Repository

1. **Ensure your code is in GitHub** (Railway connects via GitHub)
2. **Create a Railway account**: https://railway.app
3. **Connect GitHub** when prompted

### Step 2: Create New Project

1. Click **"New Project"** in Railway dashboard
2. Select **"Deploy from GitHub repo"**
3. Choose your repository
4. Railway will auto-detect it's a Node.js project

### Step 3: Configure Backend Service

1. **Set Root Directory:**
   - In service settings, set **Root Directory** to `chat-server`

2. **Add Environment Variables:**
   Go to **Variables** tab and add:
   ```env
   NODE_ENV=production
   PORT=3001
   FRONTEND_URL=https://coparentliaizen.com,https://www.coparentliaizen.com
   
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

3. **Handle SQLite Database (Choose One):**

   **Option A: Use Railway Volume (SQLite)**
   - Go to **Volumes** tab
   - Click **"Add Volume"**
   - Mount path: `/app/data`
   - Update your code to use: `const DB_PATH = path.join('/app/data', 'chat.db');`
   - Or use environment variable: `DB_PATH=/app/data/chat.db`

   **Option B: Use PostgreSQL (Recommended)**
   - Click **"New"** → **"Database"** → **"Add PostgreSQL"**
   - Railway will create a PostgreSQL database
   - Add `DATABASE_URL` to your environment variables (Railway auto-provides this)
   - You'll need to migrate from SQLite to PostgreSQL (see migration guide below)

### Step 4: Configure Frontend Service

1. **Create Second Service:**
   - Click **"New Service"** → **"GitHub Repo"**
   - Select same repository
   - Set **Root Directory** to `chat-client`

2. **Configure Frontend:**
   - Railway will auto-detect static files
   - Or use a simple Node.js server to serve static files

3. **Update API URL:**
   - In `chat-client/config.js`, ensure it detects production domain
   - Or set environment variable for API URL

### Step 5: Custom Domain Setup

1. **In Railway Dashboard:**
   - Go to your service → **Settings** → **Networking**
   - Click **"Generate Domain"** (this gives you a Railway domain like `your-app.up.railway.app`)
   - Or click **"Custom Domain"** and add `coparentliaizen.com`

2. **Configure DNS in Hostinger:**
   - Go to Hostinger DNS Zone Editor
   - Add CNAME record:
     ```
     Type: CNAME
     Name: www
     Value: your-app.up.railway.app
     ```
   - For root domain (@), Railway will provide an IP address or use their ALIAS feature

3. **SSL Certificate:**
   - Railway automatically provisions SSL certificates via Let's Encrypt
   - Just wait a few minutes after adding custom domain

### Step 6: Deploy

1. **Railway auto-deploys** when you push to your main branch
2. **Or manually trigger** from Railway dashboard
3. **Check logs** in Railway dashboard to see deployment progress

## 📦 Railway Configuration Files

### Option 1: Using package.json Scripts

Railway will automatically:
- Run `npm install`
- Run `npm start` (from your package.json)

### Option 2: Create `railway.json` (Optional)

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd chat-server && npm install"
  },
  "deploy": {
    "startCommand": "cd chat-server && npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## 🗄️ Database Migration: SQLite → PostgreSQL

If you choose PostgreSQL (recommended for production):

### 1. Install PostgreSQL Client
```bash
npm install pg
```

### 2. Update `chat-server/db.js`
Replace SQLite code with PostgreSQL connection:
```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
```

### 3. Migrate Data (One-time)
Create a migration script to copy data from SQLite to PostgreSQL.

## 💰 Railway Pricing

- **Free Tier**: $5 credit/month (enough for small apps)
- **Hobby Plan**: $5/month + usage
- **Pro Plan**: $20/month + usage

**Typical Costs:**
- Backend service: ~$5-10/month
- Frontend service: ~$5/month
- PostgreSQL (if used): ~$5/month
- **Total: ~$15-20/month**

## ✅ Post-Deployment Checklist

- [ ] **Verify HTTPS** - Check `https://coparentliaizen.com` loads
- [ ] **Test API** - Verify API calls work from browser console
- [ ] **Test WebSocket** - Verify Socket.io connections work
- [ ] **Check Database** - Verify data persists (if using volume/PostgreSQL)
- [ ] **Monitor Logs** - Check Railway logs for errors
- [ ] **Set Up Alerts** - Configure Railway notifications
- [ ] **Test Email** - Verify email sending works
- [ ] **Test AI Moderation** - Verify OpenAI integration works

## 🐛 Troubleshooting

### Database File Not Persisting

**Problem:** `chat.db` disappears after redeploy

**Solution:**
- Use Railway Volume (mount at `/app/data`)
- Or migrate to PostgreSQL

### WebSocket Not Connecting

**Problem:** Socket.io connections fail

**Solution:**
- Verify Railway supports WebSockets (it does by default)
- Check CORS settings in your server
- Ensure `FRONTEND_URL` includes your Railway domain

### Environment Variables Not Working

**Problem:** Variables not accessible in code

**Solution:**
- Check variable names match exactly (case-sensitive)
- Redeploy after adding variables
- Check logs for errors

### Custom Domain Not Working

**Problem:** Domain doesn't resolve

**Solution:**
- Wait 5-15 minutes for DNS propagation
- Verify DNS records in Hostinger
- Check Railway domain settings

## 📚 Additional Resources

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Railway Status**: https://status.railway.app

## 🎯 Quick Start Commands

```bash
# 1. Install Railway CLI (optional)
npm i -g @railway/cli

# 2. Login
railway login

# 3. Link project
railway link

# 4. Deploy
railway up

# 5. View logs
railway logs

# 6. Open dashboard
railway open
```

---

**Ready to deploy?** Start with Step 1 and Railway will guide you through the rest! 🚀

