# Domain Configuration Fix - Step by Step

## Problem

- `www.coparentliaizen.com` is assigned to an old project (showing main app instead of marketing site)
- Main app project has incorrect Root Directory path

## Solution

### Step 1: Fix Main App Root Directory

1. Go to: https://vercel.com/aseesys-projects/chat-client-vite/settings
2. Scroll to **"Root Directory"** section
3. Change from: `chat-client-vite/chat-client-vite` (or whatever it is)
4. Change to: `chat-client-vite`
5. Click **"Save"**

### Step 2: Deploy Main App

After fixing Root Directory, deploy:

```bash
cd chat-client-vite
export PATH="$PATH:$(npm config get prefix)/bin"
vercel --prod
```

### Step 3: Move www.coparentliaizen.com Domain

1. Go to Vercel Dashboard: https://vercel.com/dashboard
2. **Find the project** that has `www.coparentliaizen.com`:
   - Look through all your projects
   - Check Settings → Domains in each project
   - The domain might be in a different team/scope
3. **Remove the domain**:
   - Go to that project → Settings → Domains
   - Find `www.coparentliaizen.com`
   - Click **"Remove"** or **"..."** → **"Remove"**
4. **Add to marketing site**:
   - Go to `marketing-site` project
   - Settings → Domains
   - Click **"Add Domain"**
   - Enter: `www.coparentliaizen.com`
   - Follow DNS instructions if prompted

### Step 4: Verify DNS for app.coparentliaizen.com

1. Go to: https://vercel.com/aseesys-projects/chat-client-vite/settings/domains
2. Find `app.coparentliaizen.com`
3. Check if DNS is configured:
   - If it shows "Valid Configuration" → Done!
   - If it shows DNS instructions → Follow them

---

## Quick Checklist

- [ ] Main app Root Directory fixed in Vercel dashboard
- [ ] Main app deployed successfully
- [ ] `www.coparentliaizen.com` removed from old project
- [ ] `www.coparentliaizen.com` added to `marketing-site` project
- [ ] `app.coparentliaizen.com` DNS configured
- [ ] Marketing site loads at `www.coparentliaizen.com`
- [ ] Main app loads at `app.coparentliaizen.com`

---

## Alternative: Use Vercel Dashboard to Deploy

If CLI deployment fails, use the dashboard:

1. Go to: https://vercel.com/aseesys-projects/chat-client-vite
2. Click **"Deployments"** tab
3. Click **"Redeploy"** on the latest deployment
4. Or trigger a new deployment by pushing to GitHub
