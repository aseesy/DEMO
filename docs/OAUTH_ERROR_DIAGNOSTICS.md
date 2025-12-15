# OAuth Error Diagnostics Guide

## "An Unexpected Error Occurred" - How to Diagnose

If you're seeing "An unexpected error occurred", the improved error handling will now show more specific errors. Here's how to find the actual issue:

### Step 1: Check Browser Console

1. **Open Browser Developer Tools:**
   - Chrome/Edge: `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
   - Firefox: `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
   - Safari: `Cmd+Option+I` (Mac)

2. **Go to Console Tab:**
   - Look for error messages starting with `❌`
   - Look for messages like:
     - `❌ Google OAuth error:`
     - `❌ Error in getOrCreateGoogleUser:`
     - `❌ Failed to create or find user`

3. **Check Network Tab:**
   - Go to **Network** tab
   - Look for the failed request: `/api/auth/google/callback`
   - Click on it to see:
     - **Status Code** (500, 400, etc.)
     - **Response** (the actual error message from server)

### Step 2: Check Railway Logs

1. **Go to Railway Dashboard:**
   - https://railway.app/dashboard
   - Select your project → **chat-server** service

2. **View Logs:**
   - Click **Deployments** tab
   - Click on the latest deployment
   - Click **View Logs**

3. **Look for Error Messages:**
   - Search for: `❌ Google OAuth error:`
   - Search for: `❌ Error in getOrCreateGoogleUser:`
   - Search for: `❌ Failed to create or find user`
   - Search for: `❌ Invalid user object returned:`

### Step 3: Common Error Codes and Fixes

#### `OAUTH_CONFIG_ERROR`
**Meaning:** OAuth credentials not configured  
**Fix:** Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to Railway Variables

#### `OAUTH_INVALID_CLIENT`
**Meaning:** OAuth credentials are incorrect  
**Fix:** Verify Client ID and Secret match Google Cloud Console

#### `USER_CREATION_ERROR`
**Meaning:** Failed to create user in database  
**Possible causes:**
- Database connection issue
- Username conflict (unlikely with auto-generation)
- Database constraint violation

**Fix:**
- Check Railway logs for specific database error
- Verify `DATABASE_URL` is set correctly
- Check if database is accessible

#### `INVALID_USER_DATA`
**Meaning:** User was created but returned invalid structure  
**Fix:** Check Railway logs for the actual user object structure

#### `TOKEN_GENERATION_ERROR`
**Meaning:** Failed to generate JWT token  
**Fix:** Verify `JWT_SECRET` is set in Railway Variables

#### `GOOGLE_USERINFO_ERROR`
**Meaning:** Failed to get user info from Google  
**Fix:** Check if Google OAuth token is valid

#### `INVALID_GOOGLE_USER`
**Meaning:** Google returned invalid user data  
**Fix:** Check Railway logs for what Google returned

### Step 4: Quick Checks

**Verify Environment Variables in Railway:**
- [ ] `GOOGLE_CLIENT_ID` is set
- [ ] `GOOGLE_CLIENT_SECRET` is set
- [ ] `JWT_SECRET` is set
- [ ] `DATABASE_URL` is set (if using PostgreSQL)

**Verify Google Cloud Console:**
- [ ] OAuth client is created
- [ ] Redirect URIs are configured correctly
- [ ] Client ID and Secret match Railway variables

### Step 5: Test Again

After checking logs and fixing issues:
1. Clear browser cache/cookies
2. Try signing in with Google again
3. Check browser console for new error messages
4. Check Railway logs for backend errors

## Getting Help

If the error persists:
1. Copy the exact error message from browser console
2. Copy the error from Railway logs
3. Note the error code (if any)
4. Check the Network tab response for the actual error details

The improved error handling should now show specific error messages instead of "An unexpected error occurred" for most cases.

