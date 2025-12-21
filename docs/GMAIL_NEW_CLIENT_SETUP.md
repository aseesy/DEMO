# Setting Up a New Gmail OAuth Client for LiaiZen

This guide will walk you through creating a new Gmail OAuth 2.0 client ID and secret from scratch for this project.

## Prerequisites

- A Google account (can be personal or workspace)
- Access to Google Cloud Console
- The Gmail account you want to use for sending emails (e.g., `info@coparentliaizen.com` or your Gmail address)

## Step 1: Create a Google Cloud Project

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create a New Project:**
   - Click the project dropdown at the top
   - Click "New Project"
   - Project name: `LiaiZen` or `CoParentLiaiZen`
   - Organization: (leave as default if personal account)
   - Click "Create"
   - Wait for project creation (may take a few seconds)

3. **Select the Project:**
   - Make sure your new project is selected in the project dropdown

## Step 2: Enable Gmail API

1. **Navigate to APIs & Services:**
   - Go to: https://console.cloud.google.com/apis/dashboard
   - Or: Click "APIs & Services" in the left menu → "Library"

2. **Enable Gmail API:**
   - Search for "Gmail API"
   - Click on "Gmail API"
   - Click "Enable"
   - Wait for it to enable (usually instant)

## Step 3: Configure OAuth Consent Screen

1. **Go to OAuth Consent Screen:**
   - Navigate to: https://console.cloud.google.com/apis/credentials/consent
   - Or: Click "APIs & Services" → "OAuth consent screen"

2. **Choose User Type:**
   - **External** (recommended for most users - allows anyone with a Google account)
   - **Internal** (only for Google Workspace organizations)
   - Click "Create"

3. **Fill in App Information:**
   - **App name:** `LiaiZen` or `Co-Parent LiaiZen`
   - **User support email:** Your email address
   - **Developer contact information:** Your email address
   - Click "Save and Continue"

4. **Scopes (Step 2):**
   - Click "Add or Remove Scopes"
   - **For Gmail Email Sending:**
     - Search for: `https://www.googleapis.com/auth/gmail.send`
     - Select it
   - **For Google Sign-In (User Authentication):**
     - Search for: `https://www.googleapis.com/auth/userinfo.email`
     - Select it
     - Search for: `https://www.googleapis.com/auth/userinfo.profile`
     - Select it
   - Click "Update"
   - Click "Save and Continue"

   **Note:** You can use the same OAuth Client ID for both Gmail email sending and Google Sign-In, or create separate ones for better security isolation.

5. **Test Users (Step 3):**
   - If using "External" user type, add test users:
   - Click "Add Users"
   - Add the Gmail address you'll use for sending emails
   - Click "Save and Continue"

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
   - **Name:** `LiaiZen Email Client` or `Gmail OAuth Client`
   - **Authorized JavaScript origins:**
     - Add: `http://localhost:3000` (for local development and token generation script)
     - Add: `https://coparentliaizen.com` (for production - required for Google Sign-In)
     - Add: `https://www.coparentliaizen.com` (for www subdomain - required for Google Sign-In)
   - **Authorized redirect URIs:**
     - Add: `http://localhost:3000/oauth/callback` (required for the refresh token generation script)
     - Add: `http://localhost:3000/auth/google/callback` (for local development Google Sign-In)
     - Add: `https://coparentliaizen.com/auth/google/callback` (for production Google Sign-In)
     - Add: `https://www.coparentliaizen.com/auth/google/callback` (for www subdomain Google Sign-In)
   - Click "Create"

   **Note:** For Google Sign-In (user authentication), you need production domains because:
   - Users will sign in through the browser on your Vercel frontend
   - Google redirects back to your frontend with the authorization code
   - The frontend then sends the code to your Railway backend
   - The redirect URIs must match your frontend domains (Vercel), not the backend

4. **Save Your Credentials:**
   - **⚠️ IMPORTANT:** Copy these values immediately!
   - **Client ID:** Something like `123456789-abcdefghijklmnop.apps.googleusercontent.com`
   - **Client Secret:** Click "Show" and copy the secret (you can only see it once!)
   - Save them securely (you'll need them in the next steps)

## Step 5: Generate Refresh Token

You have two options for generating a refresh token:

### Option A: Use the Included Script (Recommended)

1. **Update the script with your new Client ID:**

   ```bash
   cd chat-server
   # Edit generate-gmail-refresh-token.js
   # Update CLIENT_ID constant with your new Client ID
   ```

2. **Run the script:**

   ```bash
   node generate-gmail-refresh-token.js
   ```

3. **Follow the prompts:**
   - Enter your Client Secret when prompted
   - The script will open a browser window
   - Sign in with your Gmail account (the one you'll use for sending emails)
   - Authorize the app
   - The script will generate and display your refresh token

### Option B: Use OAuth Playground

1. **Go to OAuth Playground:**
   - Visit: https://developers.google.com/oauthplayground/

2. **Configure Playground:**
   - Click the gear icon (⚙️) in the top right
   - Check "Use your own OAuth credentials"
   - Enter your **Client ID**
   - Enter your **Client Secret**
   - Click "Close"

3. **Select Gmail Scope:**
   - In the left panel, find "Gmail API v1"
   - Select: `https://www.googleapis.com/auth/gmail.send`
   - Click "Authorize APIs"

4. **Authorize:**
   - Sign in with your Gmail account
   - Click "Allow"
   - You'll be redirected back to the playground

5. **Get Refresh Token:**
   - Click "Exchange authorization code for tokens"
   - Copy the **Refresh token** value

## Step 6: Configure Environment Variables

1. **Create/Update `.env` file** in `chat-server/`:

```env
# Email Configuration
EMAIL_SERVICE=gmail-oauth2
GMAIL_USER=info@liaizen.com
GMAIL_CLIENT_ID=YOUR_CLIENT_ID_HERE
GMAIL_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
GMAIL_REFRESH_TOKEN=YOUR_REFRESH_TOKEN_HERE
EMAIL_FROM=info@liaizen.com
APP_NAME=LiaiZen

# Frontend URL (for email links)
FRONTEND_URL=https://coparentliaizen.com
# For local development, use:
# FRONTEND_URL=http://localhost:3000
```

2. **For Railway Production:**
   - Add these same environment variables in Railway Dashboard
   - Go to your Railway service → Variables
   - Add each variable (make sure to use production `FRONTEND_URL`)

## Step 7: Update Code with New Client ID (Optional)

If you want to hardcode the Client ID in the refresh token generator script:

1. **Edit `chat-server/generate-gmail-refresh-token.js`:**
   ```javascript
   // Update this line with your new Client ID
   const CLIENT_ID = 'YOUR_NEW_CLIENT_ID_HERE.apps.googleusercontent.com';
   ```

## Step 8: Test Email Functionality

1. **Restart your server:**

   ```bash
   cd chat-server
   node server.js
   ```

2. **Test sending an email:**
   - In the frontend, try sending an invitation
   - Check server logs for:
     - ✅ `Email sent to ...` (success)
     - ❌ Error messages (if something is wrong)

3. **Check Gmail:**
   - Check the recipient's inbox (and spam folder)
   - Verify the email was sent from your configured Gmail account

## Troubleshooting

### "Invalid client" error

- Verify Client ID and Client Secret are correct
- Make sure there are no extra spaces
- Ensure you copied the complete values

### "Redirect URI mismatch" error

- Go back to Google Cloud Console → Credentials
- Check that your redirect URI is added in "Authorized redirect URIs"
- The URI must match exactly (including `http://` vs `https://`)

### "Access denied" or "Invalid grant"

- Your refresh token may have expired (rare, but can happen)
- Regenerate the refresh token using the steps above
- Make sure you're using the correct Gmail account

### "OAuth2 authentication failed"

- Verify all environment variables are set correctly
- Check that the refresh token was generated for the correct Gmail account
- Make sure the OAuth consent screen is properly configured

### Emails going to spam

- Gmail may flag emails from new accounts as spam initially
- Consider setting up SPF/DKIM records for your domain (advanced)
- For production, consider using a dedicated email service (SendGrid, Mailgun, etc.)

## Security Best Practices

1. **Never commit `.env` file to Git:**
   - Already in `.gitignore`
   - Keep credentials secret

2. **Use environment variables in production:**
   - Don't hardcode credentials in code
   - Use Railway's environment variables (or your hosting platform's)

3. **Rotate credentials if compromised:**
   - If you suspect credentials are compromised, create new ones immediately
   - Update environment variables
   - Revoke old credentials in Google Cloud Console

4. **Limit OAuth scopes:**
   - Only request the minimum scopes needed (`gmail.send` only)
   - Don't request read access unless necessary

## Alternative: Gmail App Password (Simpler)

If OAuth seems too complex, you can use Gmail App Passwords instead:

1. **Enable 2-Step Verification** on your Gmail account
2. **Generate App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Create a new app password for "Mail"
3. **Update `.env`:**
   ```env
   EMAIL_SERVICE=gmail
   GMAIL_USER=info@liaizen.com
   GMAIL_APP_PASSWORD=your-16-character-app-password
   ```

This is simpler but less secure than OAuth. OAuth is recommended for production.

---

## Quick Reference

- **Google Cloud Console:** https://console.cloud.google.com/
- **Credentials:** https://console.cloud.google.com/apis/credentials
- **OAuth Consent Screen:** https://console.cloud.google.com/apis/credentials/consent
- **OAuth Playground:** https://developers.google.com/oauthplayground/

---

## Summary Checklist

- [ ] Created Google Cloud Project
- [ ] Enabled Gmail API
- [ ] Configured OAuth Consent Screen
- [ ] Created OAuth 2.0 Client ID and Secret
- [ ] Added authorized redirect URIs
- [ ] Generated refresh token
- [ ] Added credentials to `.env` file
- [ ] Added credentials to Railway (if using)
- [ ] Tested email sending
- [ ] Verified emails are being received

---

**Need Help?** Check the main Gmail setup guide: `docs/GMAIL_SETUP.md`
