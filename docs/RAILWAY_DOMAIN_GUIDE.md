# 🚂 Railway Domain Guide

## ⚠️ Important: Internal vs Public Domains

Railway provides **two types of domains**:

### 1. Internal Domain (`*.railway.internal`)
- **Format**: `demo.railway.internal`
- **Purpose**: Internal communication within Railway network
- **Accessibility**: ❌ **NOT accessible from the internet** (including Vercel)
- **Use Case**: Service-to-service communication within Railway

### 2. Public Domain (`*.up.railway.app`)
- **Format**: `your-app.up.railway.app`
- **Purpose**: Public access from the internet
- **Accessibility**: ✅ **Accessible from anywhere** (including Vercel)
- **Use Case**: Public API endpoints, frontend connections

## 🔍 Finding Your Public Railway Domain

### Step 1: Check Railway Dashboard

1. **Go to Railway Dashboard**:
   - Navigate to: https://railway.app/dashboard
   - Open your service

2. **Check Settings → Networking**:
   - Go to **Settings** tab
   - Click on **Networking** section
   - Look for **Public Domain** or **Generate Domain**

3. **If no public domain exists**:
   - Click **Generate Domain** button
   - Railway will create a public domain (e.g., `your-app.up.railway.app`)
   - Copy this domain

### Step 2: Check Service Settings

1. **Go to Service Settings**:
   - Click on your service
   - Go to **Settings** tab
   - Look for **Networking** or **Domains** section

2. **Public Domain**:
   - Should show: `your-app.up.railway.app`
   - If not, click **Generate Domain**

### Step 3: Check Service URL

1. **In Railway Dashboard**:
   - Click on your service
   - Look at the top-right or service header
   - Should show the public domain URL
   - Or check the **Deployments** tab → Latest deployment → should show the domain

## 📋 Using the Correct Domain

### For Frontend Configuration (`config.js`)

**Use the PUBLIC domain** (not internal):

```javascript
// ✅ Correct - Public domain
const RAILWAY_DOMAIN = 'https://your-app.up.railway.app';

// ❌ Incorrect - Internal domain (won't work from Vercel)
const RAILWAY_DOMAIN = 'https://demo.railway.internal';
```

### For Environment Variables

**In Railway Variables**:
- `FRONTEND_URL` should use Vercel domains
- Backend will accept requests from these domains

## 🎯 Quick Checklist

- [ ] Found public Railway domain (format: `*.up.railway.app`)
- [ ] Public domain is accessible (test in browser)
- [ ] Updated `config.js` with public domain
- [ ] Committed and pushed changes
- [ ] Vercel auto-deployed with updated config
- [ ] Frontend connects to Railway backend successfully

## 🆘 Troubleshooting

### Can't Find Public Domain

1. **Generate Domain**:
   - Go to Railway Dashboard → Service → Settings → Networking
   - Click **Generate Domain** or **Create Domain**
   - Railway will create a public domain

2. **Check Service Type**:
   - Ensure service is set to **Public** (not Private)
   - Private services don't get public domains

3. **Check Railway Plan**:
   - Free tier should provide public domains
   - Check if service limits are reached

### Public Domain Not Working

1. **Check Domain Status**:
   - Go to Railway Dashboard → Service → Settings → Networking
   - Verify domain shows as **Active** or **Ready**

2. **Check SSL Certificate**:
   - Railway automatically provisions SSL
   - Domain should work with `https://`
   - Wait a few minutes for SSL to provision

3. **Test Domain**:
   - Visit: `https://your-app.up.railway.app`
   - Should see: `{"name":"Multi-User Chat Server",...}`
   - If not, check Railway logs

### Internal Domain Showing Instead

If you only see `demo.railway.internal`:

1. **Generate Public Domain**:
   - Railway Dashboard → Service → Settings → Networking
   - Click **Generate Domain** or **Create Domain**

2. **Check Service Configuration**:
   - Ensure service is public (not private)
   - Check service settings for domain options

3. **Check Railway Documentation**:
   - Visit: https://docs.railway.app/networking/domains
   - Follow steps to create public domain

## 📚 Additional Resources

- **Railway Domains Docs**: https://docs.railway.app/networking/domains
- **Railway Networking**: https://docs.railway.app/networking
- **Railway Dashboard**: https://railway.app/dashboard

---

**Remember: Use the public domain (`*.up.railway.app`) for frontend connections, not the internal domain (`*.railway.internal`)** 🚂

