# Fix: OAuth Error 401: invalid_client

## Error Description

**Error:** `401: invalid_client`  
**Flow:** `GeneralOAuthFlow`  
**Meaning:** Google OAuth client credentials are missing, incorrect, or misconfigured

## Common Causes

### 1. **Missing Environment Variables**

The following environment variables must be set in your Railway/production environment:

```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://coparentliaizen.com/auth/google/callback
```

### 2. **Incorrect Client ID or Secret**

- Client ID or Secret may be incorrect
- Credentials may have been regenerated in Google Cloud Console
- Copy/paste errors when setting environment variables

### 3. **Redirect URI Mismatch**

The redirect URI in your code must **exactly match** what's configured in Google Cloud Console:

**Required in Google Cloud Console:**

- `https://coparentliaizen.com/auth/google/callback`
- `https://www.coparentliaizen.com/auth/google/callback` (if using www)

**Check in code:**

- `GOOGLE_REDIRECT_URI` environment variable
- Or default: `${APP_URL}/auth/google/callback`

### 4. **OAuth Client Not Configured**

The OAuth client may not be properly set up in Google Cloud Console.

## Quick Fix Steps

### Step 1: Verify Environment Variables

**In Railway Dashboard:**

1. Go to your service → **Variables** tab
2. Verify these variables exist:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI` (optional, has default)

**Check values:**

- `GOOGLE_CLIENT_ID` should look like: `123456789-abcdefghijklmnop.apps.googleusercontent.com`
- `GOOGLE_CLIENT_SECRET` should be a long string (not empty)

### Step 2: Verify Google Cloud Console Configuration

1. **Go to Google Cloud Console:**
   - https://console.cloud.google.com/apis/credentials

2. **Find your OAuth 2.0 Client ID:**
   - Click on the client ID that matches your `GOOGLE_CLIENT_ID`

3. **Check Authorized redirect URIs:**
   - Must include: `https://coparentliaizen.com/auth/google/callback`
   - Must include: `https://www.coparentliaizen.com/auth/google/callback` (if using www)
   - Must **exactly match** (including https, no trailing slash)

4. **Check Authorized JavaScript origins:**
   - Must include: `https://coparentliaizen.com`
   - Must include: `https://www.coparentliaizen.com` (if using www)

### Step 3: Update Environment Variables (if needed)

**If credentials changed:**

1. Get new Client ID and Secret from Google Cloud Console
2. Update in Railway Dashboard → Variables
3. Redeploy service (or restart)

**If redirect URI changed:**

1. Update `GOOGLE_REDIRECT_URI` in Railway
2. Update redirect URI in Google Cloud Console to match
3. Save both

### Step 4: Test the Fix

1. **Clear browser cache/cookies** (OAuth state may be cached)
2. **Try signing in again**
3. **Check server logs** for any additional errors

## Detailed Troubleshooting

### Check Server Logs

Look for these log messages:

- `Google OAuth error:` - Shows the actual error
- Missing `GOOGLE_CLIENT_ID` - Will show undefined/null

### Verify Redirect URI Match

**In Google Cloud Console:**

```
Authorized redirect URIs:
✅ https://coparentliaizen.com/auth/google/callback
✅ https://www.coparentliaizen.com/auth/google/callback
```

**In Railway Environment:**

```bash
GOOGLE_REDIRECT_URI=https://coparentliaizen.com/auth/google/callback
```

**Must match exactly:**

- ✅ Same protocol (https)
- ✅ Same domain
- ✅ Same path
- ✅ No trailing slash
- ✅ Case-sensitive

### Common Mistakes

❌ **Wrong:** `http://coparentliaizen.com/auth/google/callback` (http instead of https)  
❌ **Wrong:** `https://coparentliaizen.com/auth/google/callback/` (trailing slash)  
❌ **Wrong:** `https://www.coparentliaizen.com/auth/google/callback` (www when not configured)  
✅ **Correct:** `https://coparentliaizen.com/auth/google/callback`

## Still Not Working?

### Check These Additional Items:

1. **OAuth Consent Screen:**
   - Must be configured in Google Cloud Console
   - App must be published (or test users added)

2. **API Enabled:**
   - Google+ API or Google Identity API must be enabled
   - Go to: https://console.cloud.google.com/apis/library

3. **Client Type:**
   - Must be "Web application" type
   - Not "Desktop" or "Mobile"

4. **Domain Verification:**
   - If using custom domain, may need domain verification
   - Check: https://console.cloud.google.com/apis/credentials/domainverification

## Quick Test

To verify your OAuth setup is working:

```bash
# Check if environment variables are set (in Railway logs or server)
echo $GOOGLE_CLIENT_ID
echo $GOOGLE_CLIENT_SECRET
echo $GOOGLE_REDIRECT_URI
```

If any are empty or undefined, that's the problem!

## Need Help?

If the issue persists:

1. Check Railway deployment logs for errors
2. Verify all environment variables are set correctly
3. Double-check Google Cloud Console configuration
4. Ensure redirect URIs match exactly
