# Fix: redirect_uri_mismatch Error

If you're seeing this error when trying to generate a Gmail refresh token, you need to add the redirect URI to your Google Cloud Console OAuth credentials.

## Quick Fix

1. **Go to Google Cloud Console:**
   https://console.cloud.google.com/apis/credentials

2. **Find your OAuth 2.0 Client ID:**
   Look for: `353294951381-ht7qj05o0v4t01nibls59bba36erl9f7.apps.googleusercontent.com`

3. **Click on it to edit**

4. **Add the redirect URI:**

   **If using the helper script** (`generate-gmail-refresh-token.js`):
   - Under "Authorized redirect URIs", click "ADD URI"
   - Enter: `http://localhost:3000/oauth/callback`
   - Click "SAVE"

   ⚠️ **Note:** Google has deprecated the OOB flow. The script now uses a local web server.

   **If using OAuth Playground:**
   - Under "Authorized redirect URIs", click "ADD URI"
   - Enter: `https://developers.google.com/oauthplayground`
   - Click "SAVE"

5. **Wait a few minutes** for the changes to propagate (Google sometimes takes a minute)

6. **Try again** - the error should be resolved!

## Recommended: Use the Helper Script

The helper script (`urn:ietf:wg:oauth:2.0:oob`) is the recommended method because:

- It's designed for installed/desktop apps
- Simpler to set up
- More reliable

Just run:

```bash
cd chat-server
node generate-gmail-refresh-token.js
```

After adding the redirect URI above.
