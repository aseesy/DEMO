# Railway OAuth Setup - Step by Step

## Current Error

**Error:** `500 Internal Server Error` on `/api/auth/google`  
**Cause:** `GOOGLE_CLIENT_ID` environment variable is missing in Railway

## Quick Fix (5 minutes)

### Step 1: Get Google OAuth Credentials

1. **Go to Google Cloud Console:**
   - https://console.cloud.google.com/apis/credentials

2. **Create OAuth 2.0 Client ID** (if you don't have one):
   - Click **+ Create Credentials** → **OAuth client ID**
   - Choose **Web application**
   - **Name:** `LiaiZen Production`

3. **Configure Authorized JavaScript origins:**
   - Click **+ Add URI**
   - Add: `https://coparentliaizen.com`
   - Add: `https://www.coparentliaizen.com`
   - Click **Save**

4. **Configure Authorized redirect URIs:**
   - Click **+ Add URI**
   - Add: `https://coparentliaizen.com/auth/google/callback`
   - Add: `https://www.coparentliaizen.com/auth/google/callback`
   - Click **Save**

5. **Copy Your Credentials:**
   - **Client ID:** Copy this (looks like: `123456789-abc...apps.googleusercontent.com`)
   - **Client Secret:** Click "Show" → Copy (you can only see it once!)

### Step 2: Add to Railway

1. **Go to Railway Dashboard:**
   - https://railway.app/dashboard
   - Select your project
   - Click on **chat-server** service

2. **Go to Variables Tab:**
   - Click **Variables** in the left sidebar

3. **Add GOOGLE_CLIENT_ID:**
   - Click **+ New Variable**
   - **Name:** `GOOGLE_CLIENT_ID`
   - **Value:** Paste your Client ID from Step 1
   - Click **Add**

4. **Add GOOGLE_CLIENT_SECRET:**
   - Click **+ New Variable**
   - **Name:** `GOOGLE_CLIENT_SECRET`
   - **Value:** Paste your Client Secret from Step 1
   - Click **Add**

5. **Optional - Add GOOGLE_REDIRECT_URI:**
   - Only if you want to override the default
   - **Name:** `GOOGLE_REDIRECT_URI`
   - **Value:** `https://coparentliaizen.com/auth/google/callback`
   - Click **Add**

### Step 3: Verify

1. **Railway will auto-redeploy** when you add variables
2. **Wait for deployment to complete** (check Deployments tab)
3. **Test Google Sign-In:**
   - Go to your site
   - Click "Sign in with Google"
   - Should redirect to Google (not 500 error)

## Verification Checklist

- [ ] OAuth Client created in Google Cloud Console
- [ ] Authorized JavaScript origins configured
- [ ] Authorized redirect URIs configured
- [ ] `GOOGLE_CLIENT_ID` added to Railway Variables
- [ ] `GOOGLE_CLIENT_SECRET` added to Railway Variables
- [ ] Railway deployment completed successfully
- [ ] No 500 errors when clicking "Sign in with Google"

## Troubleshooting

### Still Getting 500 Error?

1. **Check Railway Logs:**
   - Go to **Deployments** → Latest deployment → **View Logs**
   - Look for: `❌ GOOGLE_CLIENT_ID is not set`
   - If you see this, the variable wasn't saved correctly

2. **Verify Variable Names:**
   - Must be exactly: `GOOGLE_CLIENT_ID` (case-sensitive)
   - Not: `GOOGLE_CLIENTID` or `google_client_id`

3. **Check Variable Values:**
   - Client ID should end with `.apps.googleusercontent.com`
   - Client Secret should be a long string (not empty)

4. **Redeploy Manually:**
   - Go to **Deployments** tab
   - Click **Redeploy** to force a new deployment

### Getting "invalid_client" Error?

This means the credentials are set but incorrect:
- Verify Client ID matches Google Cloud Console
- Verify Client Secret matches Google Cloud Console
- Check redirect URI matches exactly

### Redirect URI Mismatch?

The redirect URI in Railway must **exactly match** Google Cloud Console:
- ✅ `https://coparentliaizen.com/auth/google/callback`
- ❌ `https://coparentliaizen.com/auth/google/callback/` (trailing slash)
- ❌ `http://coparentliaizen.com/auth/google/callback` (http not https)

## Need Help?

If issues persist:
1. Check Railway deployment logs
2. Verify all environment variables are set
3. Double-check Google Cloud Console configuration
4. Ensure redirect URIs match exactly

