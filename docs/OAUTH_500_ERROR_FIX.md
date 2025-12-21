# Fix: OAuth Error 500 - Configuration Missing

## Error Description

**Error:** `500 Internal Server Error`  
**Endpoint:** `/api/auth/google`  
**Meaning:** Google OAuth client ID is not configured in Railway environment variables

## Root Cause

The `GOOGLE_CLIENT_ID` environment variable is missing or not set in your Railway deployment.

## Quick Fix

### Step 1: Add Environment Variable in Railway

1. **Go to Railway Dashboard:**
   - https://railway.app/dashboard
   - Select your project
   - Click on your `chat-server` service

2. **Go to Variables Tab:**
   - Click on **Variables** in the left sidebar
   - Or click the **Variables** button at the top

3. **Add GOOGLE_CLIENT_ID:**
   - Click **+ New Variable**
   - **Name:** `GOOGLE_CLIENT_ID`
   - **Value:** Your Google OAuth Client ID (from Google Cloud Console)
   - Format: `123456789-abcdefghijklmnop.apps.googleusercontent.com`
   - Click **Add**

4. **Add GOOGLE_CLIENT_SECRET:**
   - Click **+ New Variable**
   - **Name:** `GOOGLE_CLIENT_SECRET`
   - **Value:** Your Google OAuth Client Secret (from Google Cloud Console)
   - Click **Add**

5. **Optional - Add GOOGLE_REDIRECT_URI:**
   - Only needed if you want to override the default
   - **Name:** `GOOGLE_REDIRECT_URI`
   - **Value:** `https://coparentliaizen.com/auth/google/callback`
   - Or: `https://www.coparentliaizen.com/auth/google/callback` (if using www)

### Step 2: Get Your Google OAuth Credentials

If you don't have OAuth credentials yet:

1. **Go to Google Cloud Console:**
   - https://console.cloud.google.com/apis/credentials

2. **Create OAuth 2.0 Client ID:**
   - Click **+ Create Credentials** → **OAuth client ID**
   - Choose **Web application**
   - **Name:** `LiaiZen Google Sign-In`

3. **Configure Authorized JavaScript origins:**
   - Add: `https://coparentliaizen.com`
   - Add: `https://www.coparentliaizen.com` (if using www)

4. **Configure Authorized redirect URIs:**
   - Add: `https://coparentliaizen.com/auth/google/callback`
   - Add: `https://www.coparentliaizen.com/auth/google/callback` (if using www)

5. **Copy Credentials:**
   - **Client ID:** Copy this value → Use for `GOOGLE_CLIENT_ID`
   - **Client Secret:** Click "Show" → Copy → Use for `GOOGLE_CLIENT_SECRET`
   - ⚠️ **Important:** You can only see the secret once!

### Step 3: Redeploy or Restart

After adding environment variables:

1. **Railway will automatically redeploy** when you add variables
2. **Or manually trigger:** Click **Deployments** → **Redeploy**

### Step 4: Verify

1. **Check Railway Logs:**
   - Go to **Deployments** → Click latest deployment → **View Logs**
   - Look for: `✅ Server started` (should not show OAuth errors)

2. **Test Google Sign-In:**
   - Try signing in with Google
   - Should redirect to Google OAuth page (not 500 error)

## Required Environment Variables

```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://coparentliaizen.com/auth/google/callback  # Optional
```

## Verification Checklist

- [ ] `GOOGLE_CLIENT_ID` is set in Railway Variables
- [ ] `GOOGLE_CLIENT_SECRET` is set in Railway Variables
- [ ] Client ID format is correct (ends with `.apps.googleusercontent.com`)
- [ ] Client Secret is not empty
- [ ] Redirect URI matches Google Cloud Console configuration
- [ ] Service has been redeployed after adding variables
- [ ] No 500 errors in Railway logs

## Still Getting 500 Error?

### Check Railway Logs

1. Go to Railway Dashboard → Your Service → **Deployments**
2. Click on the latest deployment
3. Click **View Logs**
4. Look for: `❌ GOOGLE_CLIENT_ID is not set in environment variables`

If you see this, the variable wasn't set correctly.

### Common Issues

1. **Variable name typo:**
   - Must be exactly: `GOOGLE_CLIENT_ID` (case-sensitive)
   - Not: `GOOGLE_CLIENTID` or `google_client_id`

2. **Variable not saved:**
   - Make sure you clicked **Add** or **Save** after entering the value

3. **Service not redeployed:**
   - Railway auto-redeploys, but you can manually trigger: **Deployments** → **Redeploy**

4. **Wrong service:**
   - Make sure you added variables to the `chat-server` service, not the frontend

## Need Help?

If the issue persists:

1. Check Railway deployment logs for the exact error
2. Verify all environment variables are set correctly
3. Ensure OAuth client is configured in Google Cloud Console
4. Make sure redirect URIs match exactly
