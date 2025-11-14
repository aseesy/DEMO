# Troubleshooting OAuth Errors

## Error: invalid_client / Unauthorized

This error occurs when exchanging the authorization code for tokens. It means the **Client Secret is incorrect**.

### Solution:

1. **Verify your Client Secret:**
   - Go to: https://console.cloud.google.com/apis/credentials
   - Find your OAuth 2.0 Client ID: `353294951381-ht7qj05o0v4t01nibls59bba36erl9f7.apps.googleusercontent.com`
   - Click on it to view details
   - Copy the **Client Secret** again (make sure you get the entire value)

2. **Common issues:**
   - Client Secret was truncated (not fully copied)
   - Extra spaces before/after the secret
   - Wrong Client Secret (from a different OAuth client)
   - Client Secret was reset and you're using the old one

3. **If needed, create a new Client Secret:**
   - In Google Cloud Console, click on your OAuth 2.0 Client ID
   - Under "Client Secret", click the refresh/reload icon
   - Generate a new Client Secret
   - Copy it immediately (you can only see it once!)

4. **Run the script again:**
   ```bash
   node generate-gmail-refresh-token.js
   ```
   - Enter the correct Client Secret when prompted
   - Make sure there are no extra spaces

### Still having issues?

If you continue to get errors, you can:
1. Use **Option 1: Gmail App Password** instead (simpler, no OAuth needed)
2. Check that your OAuth consent screen is properly configured
3. Verify the OAuth 2.0 Client ID is active and not disabled

