# Google Sign-In OAuth Setup Guide

This guide will help you set up Google Sign-In (OAuth 2.0) for user authentication in LiaiZen.

## Quick Overview

You need to:

1. Create a Google Cloud project
2. Enable OAuth 2.0 API
3. Configure OAuth consent screen
4. Create OAuth 2.0 credentials
5. Add environment variables to your backend
6. Test the setup

## Step 1: Create Google Cloud Project

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create a New Project:**
   - Click the project dropdown at the top
   - Click "New Project"
   - **Project name:** `LiaiZen` or `CoParentLiaiZen`
   - Click "Create"
   - Wait for project creation (may take a few seconds)

3. **Select the Project:**
   - Make sure your new project is selected in the project dropdown

## Step 2: Enable Required APIs

1. **Navigate to APIs & Services:**
   - Go to: https://console.cloud.google.com/apis/library
   - Or: Click "APIs & Services" → "Library"

2. **Enable OAuth 2.0 API:**
   - Search for "Google+ API" or "People API"
   - Click on it
   - Click "Enable"
   - **Note:** Google+ API is deprecated, but the OAuth 2.0 endpoints still work. You can also enable "People API" for better support.

3. **Enable Google Sign-In API (Optional but recommended):**
   - Search for "Identity Toolkit API" or "Google Sign-In API"
   - Click "Enable"

## Step 3: Configure OAuth Consent Screen

1. **Go to OAuth Consent Screen:**
   - Navigate to: https://console.cloud.google.com/apis/credentials/consent
   - Or: Click "APIs & Services" → "OAuth consent screen"

2. **Choose User Type:**
   - **External** (recommended - allows anyone with a Google account)
   - **Internal** (only for Google Workspace organizations)
   - Click "Create"

3. **Fill in App Information:**
   - **App name:** `LiaiZen` or `Co-Parent LiaiZen`
   - **User support email:** Your email address (e.g., `info@liaizen.com`)
   - **Developer contact information:** Your email address
   - Click "Save and Continue"

4. **Scopes (Step 2):**
   - Click "Add or Remove Scopes"
   - **Required scopes for Google Sign-In:**
     - `openid` (automatically added)
     - `https://www.googleapis.com/auth/userinfo.email`
     - `https://www.googleapis.com/auth/userinfo.profile`
   - Click "Update"
   - Click "Save and Continue"

5. **Test Users (Step 3):**
   - If using "External" user type and app is in testing mode:
     - Click "Add Users"
     - Add test user email addresses (users who can sign in during testing)
     - Click "Save and Continue"
   - **Note:** Once your app is published, anyone can sign in

6. **Summary (Step 4):**
   - Review your settings
   - Click "Back to Dashboard"

## Step 4: Create OAuth 2.0 Client Credentials

1. **Go to Credentials:**
   - Navigate to: https://console.cloud.google.com/apis/credentials
   - Or: Click "APIs & Services" → "Credentials"

2. **Create OAuth 2.0 Client ID:**
   - Click "Create Credentials" → "OAuth client ID"
   - If prompted, choose "Web application"

3. **Configure OAuth Client:**
   - **Name:** `LiaiZen Google Sign-In` or `LiaiZen OAuth Client`
   - **Authorized JavaScript origins:**
     - `http://localhost:3000` (for local development)
     - `https://app.coparentliaizen.com` (for production app)
     - `https://coparentliaizen.com` (for landing page)
   - **Authorized redirect URIs:**
     - `http://localhost:3000/auth/google/callback` (for local development)
     - `https://app.coparentliaizen.com/auth/google/callback` (for production)
   - Click "Create"

   **Note:** The app lives at `app.coparentliaizen.com`, while the landing page is at `coparentliaizen.com`. OAuth redirects go to the app subdomain.

4. **Save Your Credentials:**
   - **⚠️ IMPORTANT:** Copy these values immediately!
   - **Client ID:** Something like `123456789-abcdefghijklmnop.apps.googleusercontent.com`
   - **Client Secret:** Click "Show" and copy the secret (you can only see it once!)
   - Save them securely

## Step 5: Add Environment Variables

### For Local Development (`chat-server/.env`):

Add these variables to your `chat-server/.env` file:

```env
# Google OAuth for User Sign-In
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# App URL (for OAuth redirect)
APP_URL=http://localhost:3000
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
```

### For Railway (Production Backend):

1. **Go to Railway Dashboard:**
   - Navigate to your project: https://railway.app/dashboard
   - Click on your backend service

2. **Add Environment Variables:**
   - Go to "Variables" tab
   - Click "New Variable"
   - Add each variable:
     - **Name:** `GOOGLE_CLIENT_ID`
     - **Value:** Your Client ID from Step 4
     - Click "Add"
   - **Name:** `GOOGLE_CLIENT_SECRET`
   - **Value:** Your Client Secret from Step 4
   - Click "Add"
   - **Name:** `APP_URL`
   - **Value:** `https://app.coparentliaizen.com`
   - Click "Add"
   - **Name:** `GOOGLE_REDIRECT_URI`
   - **Value:** `https://app.coparentliaizen.com/auth/google/callback`
   - Click "Add"

3. **Redeploy:**
   - Railway will automatically redeploy when you add environment variables
   - Or click "Redeploy" if needed

## Step 6: Test the Setup

### Local Testing:

1. **Start your backend server:**

   ```bash
   cd chat-server
   node server.js
   ```

2. **Start your frontend:**

   ```bash
   cd chat-client
   pnpm dev
   # or
   npm run dev
   ```

3. **Test Google Sign-In:**
   - Open: http://localhost:3000
   - Click "Sign in with Google"
   - You should be redirected to Google's sign-in page
   - After signing in, you should be redirected back and logged in

### Production Testing:

1. **Make sure your domain is configured:**
   - `app.coparentliaizen.com` should point to Vercel (the app)
   - `coparentliaizen.com` should point to Vercel (the landing page)
   - Railway backend should have `APP_URL` and `GOOGLE_REDIRECT_URI` set correctly

2. **Test on production:**
   - Visit: https://app.coparentliaizen.com
   - Click "Sign in with Google"
   - Complete the sign-in flow

## Troubleshooting

### "Google OAuth not configured" Error

- **Check:** Make sure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in your environment variables
- **For Railway:** Verify variables are added in the Railway dashboard
- **For Local:** Check your `chat-server/.env` file

### "redirect_uri_mismatch" Error

- **Check:** Make sure the redirect URI in Google Cloud Console matches exactly:
  - Local: `http://localhost:3000/auth/google/callback`
  - Production: `https://app.coparentliaizen.com/auth/google/callback`
- **Check:** Make sure Railway has `GOOGLE_REDIRECT_URI=https://app.coparentliaizen.com/auth/google/callback`
- **Note:** The redirect URI must match exactly (including `http://` vs `https://` and the exact subdomain)

### "Access blocked: This app's request is invalid" Error

- **Check:** Your OAuth consent screen might be in testing mode
- **Solution:** Add your email as a test user in the OAuth consent screen
- **Or:** Publish your app (if ready for production)

### Users Can't Sign In

- **Check:** Make sure the OAuth consent screen is published (if you want public access)
- **Check:** If in testing mode, users must be added as test users
- **Check:** Make sure all required scopes are added in the consent screen

## Important Notes

1. **Separate OAuth Clients:**
   - You can use the same OAuth Client ID for both Google Sign-In and Gmail email sending
   - Or create separate clients for better security isolation
   - If using the same client, make sure all required scopes are added

2. **Redirect URIs:**
   - Redirect URIs must match your app domain (`app.coparentliaizen.com`), not the landing page or backend
   - Google redirects users back to your app, which then completes authentication via the backend
   - The app and landing page are separate: `app.coparentliaizen.com` vs `coparentliaizen.com`

3. **Environment Variables:**
   - Never commit `.env` files to Git
   - Keep your Client Secret secure
   - Rotate secrets if compromised

4. **Testing vs Production:**
   - In testing mode, only added test users can sign in
   - Once published, anyone with a Google account can sign in
   - You can switch between testing and production in the OAuth consent screen

## Next Steps

After setting up OAuth:

1. Test the sign-in flow locally
2. Deploy to production
3. Test on production domain
4. Monitor for any errors in Railway logs

## Related Documentation

- [Gmail OAuth Setup](./GMAIL_NEW_CLIENT_SETUP.md) - For email sending (can use same OAuth client)
- [Railway Deployment](./RAILWAY_DEPLOYMENT.md) - Backend deployment guide
- [Vercel Deployment](./VERCEL_DEPLOYMENT.md) - Frontend deployment guide
