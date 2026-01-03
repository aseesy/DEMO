# Vercel Marketing Site Setup Guide

## Step-by-Step Instructions

### Step 1: Log in to Vercel

1. Go to https://vercel.com/login
2. Log in with your preferred method (GitHub, Google, etc.)

### Step 2: Create New Project for Marketing Site

1. Once logged in, go to https://vercel.com/dashboard
2. Click **"Add New..."** button (top right)
3. Select **"Project"**

### Step 3: Import Repository

1. You'll see a list of your GitHub repositories
2. Find and select: **`aseesy/DEMO`** (or your repo name)
3. Click **"Import"**

### Step 4: Configure Project Settings

**Project Name**: `liaizen-marketing` (or your preferred name)

**Framework Preset**:

- Select **"Other"** (not Next.js, React, etc.)

**Root Directory**:

- Click **"Edit"** next to Root Directory
- Enter: `marketing-site`
- Click **"Continue"**

**Build and Output Settings**:

- These should auto-detect from `marketing-site/vercel.json`
- Verify:
  - **Build Command**: `npm install && npm run build`
  - **Output Directory**: `dist`
  - **Install Command**: `npm install`

### Step 5: Add Environment Variables

Before deploying, click **"Environment Variables"** section:

1. Click **"Add"** or **"Add New"**
2. Add:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://demo-production-6dcd.up.railway.app`
   - **Environment**: Select all (Production, Preview, Development)
3. Click **"Save"**

### Step 6: Deploy

1. Click **"Deploy"** button
2. Wait for build to complete (usually 1-2 minutes)
3. You'll see a deployment URL like: `liaizen-marketing-xxx.vercel.app`

### Step 7: Configure Domain

1. After deployment succeeds, go to **Settings** → **Domains**
2. Click **"Add"** or **"Add Domain"**
3. Enter: `www.coparentliaizen.com`
4. Follow DNS configuration instructions:
   - You'll need to add a CNAME record in your DNS provider
   - Point `www` to the Vercel domain provided

### Step 8: Update Main App Domain

1. Go back to your **main app project** in Vercel
2. Go to **Settings** → **Domains**
3. **Remove** `www.coparentliaizen.com` (if it's there)
4. **Add** `app.coparentliaizen.com`
5. Follow DNS instructions for this domain too

---

## Alternative: Using Vercel CLI

If you prefer using the CLI:

```bash
# Install Vercel CLI globally
npm install -g vercel

# Navigate to marketing site directory
cd marketing-site

# Login to Vercel
vercel login

# Deploy (follow prompts)
vercel

# When prompted:
# - Set up and deploy? Yes
# - Which scope? (select your account)
# - Link to existing project? No
# - Project name? liaizen-marketing
# - Directory? ./ (current directory)
# - Override settings? No

# Add environment variable
vercel env add VITE_API_URL production
# Enter: https://demo-production-6dcd.up.railway.app

# Deploy to production
vercel --prod

# Add domain
vercel domains add www.coparentliaizen.com
```

---

## Verification Checklist

After setup:

- [ ] Marketing site project created in Vercel
- [ ] Root Directory set to `marketing-site`
- [ ] Environment variable `VITE_API_URL` added
- [ ] Build succeeds
- [ ] Domain `www.coparentliaizen.com` configured
- [ ] Marketing site loads at `www.coparentliaizen.com`
- [ ] Landing page displays (not main app)
- [ ] Waitlist form works
- [ ] Blog articles load

---

## Troubleshooting

### Build Fails

- Check Root Directory is `marketing-site`
- Verify `vercel.json` exists in `marketing-site/`
- Check build logs for specific errors

### Wrong Content Shows

- Verify Root Directory is `marketing-site` (not `chat-client-vite`)
- Check which project the domain is connected to
- Ensure domain is removed from main app project

### Environment Variable Not Working

- Verify variable name is exactly `VITE_API_URL`
- Check it's set for all environments (Production, Preview, Development)
- Redeploy after adding environment variables

---

## Next Steps

After marketing site is deployed:

1. **Test the site**: Visit `www.coparentliaizen.com`
2. **Verify it shows landing page** (not main app)
3. **Test waitlist form**
4. **Test blog articles**
5. **Update main app domain** to `app.coparentliaizen.com`
