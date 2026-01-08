# Quick Fix Checklist - Vercel Configuration

## ✅ What's Done

- Marketing site deployed and working
- Main app linked to Vercel
- Environment variables configured
- Domain `app.coparentliaizen.com` added to main app

## ⚠️ What Needs Manual Fix (5 minutes)

### 1. Fix Main App Root Directory (2 min)

**URL**: https://vercel.com/aseesys-projects/chat-client-vite/settings

1. Scroll to **"Root Directory"** section
2. Change from: `chat-client-vite/chat-client-vite` (or current value)
3. Change to: `chat-client-vite`
4. Click **"Save"**

### 2. Move Domain (2 min)

**URL**: https://vercel.com/dashboard

1. Find the project that has `www.coparentliaizen.com`
   - Check each project's Settings → Domains
2. **Remove** `www.coparentliaizen.com` from that project
3. Go to `marketing-site` project
4. **Add** `www.coparentliaizen.com` to marketing-site project

### 3. Deploy Main App (1 min)

After fixing Root Directory:

**Option A: Via Dashboard**

- Go to project → Deployments → Redeploy latest

**Option B: Via CLI**

```bash
cd chat-client-vite
export PATH="$PATH:$(npm config get prefix)/bin"
vercel --prod
```

## 🎯 Expected Result

After fixes:

- ✅ `www.coparentliaizen.com` → Marketing landing page
- ✅ `app.coparentliaizen.com` → Main app login page
- ✅ Both sites working in production

## 📝 Notes

- Root Directory fix is required before deployment will work
- Domain move is required for correct routing
- DNS for `app.coparentliaizen.com` may need configuration (check Vercel domain settings)
