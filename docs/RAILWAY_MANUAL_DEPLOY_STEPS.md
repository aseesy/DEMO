# Railway Manual Deployment Steps

**Date**: 2025-01-28  
**Purpose**: Step-by-step guide to manually trigger Railway deployment

## Quick Manual Redeploy

### Method 1: Railway Dashboard (Easiest)

1. **Open Railway Dashboard**:
   - Go to: https://railway.app/dashboard
   - Login if needed

2. **Navigate to Service**:
   - Click on project: `positive-recreation`
   - Click on service: `DEMO`

3. **Redeploy**:
   - Click **"Deployments"** tab
   - Find the **latest deployment** (even if it's old)
   - Click **⋯** (three dots menu) on that deployment
   - Select **"Redeploy"**
   - Confirm the redeployment

4. **Monitor**:
   - Watch the deployment status
   - Check logs for build progress
   - Wait for status to show "Live"

### Method 2: Settings Redeploy

1. **Open Railway Dashboard**:
   - Go to: https://railway.app/dashboard
   - Navigate to: `positive-recreation` → `DEMO`

2. **Settings Tab**:
   - Click **"Settings"** tab
   - Scroll to **"Source"** section

3. **Redeploy**:
   - Click **"Redeploy"** button
   - Or click **"Disconnect"** then **"Connect GitHub"** again

### Method 3: Disconnect/Reconnect GitHub

1. **Open Railway Dashboard**:
   - Go to: https://railway.app/dashboard
   - Navigate to: `positive-recreation` → `DEMO` → **Settings**

2. **Disconnect**:
   - Scroll to **"Source"** section
   - Click **"Disconnect"**
   - Confirm disconnection

3. **Reconnect**:
   - Click **"Connect GitHub"**
   - Select your repository
   - Select branch: `main`
   - Set **Root Directory**: `chat-server`
   - Click **"Connect"**

4. **Auto-Deploy**:
   - Railway will automatically trigger a deployment
   - Monitor the Deployments tab

## Verify Deployment

After triggering deployment:

### 1. Check Status

- Go to **Deployments** tab
- Latest deployment should show:
  - **Building** → **Deploying** → **Live**

### 2. Check Logs

- Click on the deployment
- View **Logs** tab
- Look for:
  - `✅ Server started successfully`
  - `🐘 PostgreSQL mode: DATABASE_URL detected`
  - No error messages

### 3. Test Health Endpoint

```bash
curl https://demo-production-6dcd.up.railway.app/health
```

Should return:

```json
{
  "status": "ok",
  "database": {
    "connected": true,
    "status": "healthy"
  }
}
```

## Troubleshooting

### If Redeploy Doesn't Work

1. **Check Railway Status**: https://status.railway.app
2. **Verify Root Directory**: Should be `chat-server`
3. **Check Environment Variables**: All required vars should be set
4. **Review Build Logs**: Look for specific errors

### If Build Fails

1. **Check Logs**: Look for error messages
2. **Common Issues**:
   - Missing `DATABASE_URL`
   - Node.js version mismatch
   - Dependencies not installing
   - Build command errors

3. **Fix and Redeploy**:
   - Fix the issue
   - Commit and push
   - Redeploy again

---

**Note**: Manual redeploy will deploy the latest code from the connected GitHub branch.
