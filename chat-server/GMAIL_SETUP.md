# Gmail Email Setup Guide

This guide explains how to configure Gmail for sending invitation emails from `info@liaizen.com`.

## Quick Start: Get Your Client Secret

Before you begin, you need your **Client Secret** from Google Cloud Console:

1. Go to: https://console.cloud.google.com/apis/credentials
2. Find your OAuth 2.0 Client ID: `353294951381-ht7qj05o0v4t01nibls59bba36erl9f7.apps.googleusercontent.com`
3. Click on it to view details
4. Copy the **Client secret** value

## Option 1: Gmail App Password (Recommended - Simplest)

This is the easiest method. You'll use a Google App Password instead of OAuth.

### Steps:

1. **Enable 2-Step Verification** (if not already enabled)
   - Go to: https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Name it "Co-Parent Chat Server"
   - Copy the 16-character password (it will look like: `abcd efgh ijkl mnop`)

3. **Update `.env` file** in `chat-server/`:

```env
EMAIL_SERVICE=gmail
GMAIL_USER=info@liaizen.com
GMAIL_APP_PASSWORD=abcdefghijklmnop
EMAIL_FROM=info@liaizen.com
APP_NAME=Co-Parent Chat
FRONTEND_URL=http://localhost:3000
```

**Note:** Remove spaces from the app password when pasting it.

---

## Option 2: Gmail OAuth2 (More Secure)

For OAuth2, you'll need to complete the OAuth flow to get a refresh token.

### Prerequisites:

You have:
- ✅ Client ID: `353294951381-ht7qj05o0v4t01nibls59bba36erl9f7.apps.googleusercontent.com`
- ❌ Client Secret (needed)
- ❌ Refresh Token (needed - must be generated)

### Steps:

1. **Get Client Secret**
   - Go to: https://console.cloud.google.com/apis/credentials
   - Find your OAuth 2.0 Client ID
   - Click on it to view details
   - Copy the **Client secret** value

2. **Configure Redirect URI** (Required first!)
   
   Before generating the refresh token, you need to add the redirect URI:
   
   **For the helper script** (recommended):
   - Go to: https://console.cloud.google.com/apis/credentials
   - Click on your OAuth 2.0 Client ID
   - Under "Authorized redirect URIs", click "ADD URI"
   - Add: `http://localhost:3000/oauth/callback`
   - Click "SAVE"
   
   **OR if using OAuth Playground**:
   - Go to: https://console.cloud.google.com/apis/credentials
   - Click on your OAuth 2.0 Client ID
   - Under "Authorized redirect URIs", click "ADD URI"
   - Add: `https://developers.google.com/oauthplayground`
   - Click "SAVE"
   
   ⚠️ **Note:** Google has deprecated the OOB (out-of-band) flow. The helper script now uses a local web server instead.

3. **Generate Refresh Token**
   
   **Recommended - Use the included script:**
   
   ```bash
   cd chat-server
   node generate-gmail-refresh-token.js
   ```
   
   The script will:
   1. Ask for your Client Secret
   2. Generate an authorization URL
   3. Guide you through the OAuth flow
   4. Output all the values you need for your `.env` file
   
   **Alternative - Use OAuth Playground:**
   
   1. Go to: https://developers.google.com/oauthplayground/
   2. Click the gear icon (⚙️) in top right
   3. Check "Use your own OAuth credentials"
   4. Enter:
      - OAuth Client ID: `353294951381-ht7qj05o0v4t01nibls59bba36erl9f7.apps.googleusercontent.com`
      - OAuth Client secret: (your client secret)
   5. In the left panel, find "Gmail API v1"
   6. Select: `https://www.googleapis.com/auth/gmail.send`
   7. Click "Authorize APIs"
   8. Sign in and allow access
   9. Click "Exchange authorization code for tokens"
   10. Copy the "Refresh token" value

3. **Update `.env` file**:

```env
EMAIL_SERVICE=gmail-oauth2
GMAIL_USER=info@liaizen.com
GMAIL_CLIENT_ID=353294951381-ht7qj05o0v4t01nibls59bba36erl9f7.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=YOUR_CLIENT_SECRET
GMAIL_REFRESH_TOKEN=YOUR_REFRESH_TOKEN
EMAIL_FROM=info@liaizen.com
APP_NAME=Co-Parent Chat
FRONTEND_URL=http://localhost:3000
```

---

## Testing

After configuration, restart your server and test by sending an invitation:

```bash
cd chat-server
node server.js
```

Then in the frontend, try sending an email invitation. Check the server logs for:
- ✅ `Email sent to ...` (success)
- ❌ Error messages (if something is wrong)

---

## Troubleshooting

### "Invalid login" error
- Make sure you're using an App Password, not your regular Gmail password
- Verify the email address is correct

### "OAuth2 authentication failed"
- Check that Client ID, Client Secret, and Refresh Token are correct
- Verify the refresh token hasn't expired
- Make sure OAuth consent screen is configured in Google Cloud Console

### Emails going to spam
- Set up SPF/DKIM records for your domain (advanced)
- Use a custom domain email service (SendGrid, Mailgun, etc.)

---

## Recommendation

**Start with Option 1 (App Password)** - it's simpler and works immediately.  
Use Option 2 (OAuth2) if you need enhanced security or are building a larger production system.

