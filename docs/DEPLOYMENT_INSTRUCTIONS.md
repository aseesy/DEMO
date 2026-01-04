# Deployment Instructions

## Marketing Site Deployment (Vercel)

### Step 1: Create New Vercel Project

1. Go to https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Other
   - **Root Directory**: `marketing-site`
   - **Build Command**: `npm install && npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Step 2: Set Environment Variables

In Vercel Dashboard → Project Settings → Environment Variables:

```
VITE_API_URL=https://demo-production-6dcd.up.railway.app
```

### Step 3: Deploy

- Vercel will auto-deploy on push to main branch
- Or manually trigger deployment from dashboard

### Step 4: Configure Domain

1. Go to **Settings** → **Domains**
2. Add domain: `www.coparentliaizen.com`
3. Follow DNS instructions

---

## Main App Deployment (Vercel)

### Step 1: Use Existing Project or Create New

If you have an existing Vercel project:

- Update Root Directory to: `chat-client-vite`
- Verify `vercel.json` is in `chat-client-vite/` directory

If creating new:

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

```
VITE_API_URL=https://demo-production-6dcd.up.railway.app
```

### Step 3: Deploy

- Auto-deploy on push to main
- Or manually trigger

### Step 4: Configure Domain

1. Go to **Settings** → **Domains**
2. Add domain: `app.coparentliaizen.com`
3. Follow DNS instructions

---

## Verification

After deployment, test:

1. **Marketing Site** (`www.coparentliaizen.com`):
   - Landing page loads
   - Waitlist form submits
   - Blog articles load
   - Blog images load from backend

2. **Main App** (`app.coparentliaizen.com`):
   - Login page loads
   - Authentication works
   - Chat functionality works
   - Socket.io connection works

3. **Backend** (Railway):
   - CORS allows both domains
   - API endpoints respond
   - Socket.io connections work

---

## Troubleshooting

### Build Fails

- Check build logs in Vercel dashboard
- Verify Root Directory is correct
- Verify environment variables are set

### CORS Errors

- Check Railway `FRONTEND_URL` includes both domains
- Verify backend middleware allows both origins

### Images Not Loading

- Verify blog images are in backend `/api/blog/images/` directory
- Check API_BASE_URL is correct in marketing site
