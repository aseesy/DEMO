# Add OAuth Credentials to Railway - Quick Guide

## Step-by-Step Instructions

### Step 1: Go to Railway Dashboard

1. Open: https://railway.app/dashboard
2. Select your project
3. Click on **chat-server** service

### Step 2: Add Environment Variables

1. **Click "Variables" tab** (in the left sidebar or top menu)

2. **Add GOOGLE_CLIENT_ID:**
   - Click **+ New Variable** or **+ Add Variable**
   - **Variable Name:** `GOOGLE_CLIENT_ID`
   - **Variable Value:** Paste your OAuth Client ID
   - Click **Add** or **Save**

3. **Add GOOGLE_CLIENT_SECRET:**
   - Click **+ New Variable** again
   - **Variable Name:** `GOOGLE_CLIENT_SECRET`
   - **Variable Value:** Paste your OAuth Client Secret
   - Click **Add** or **Save**

### Step 3: Verify Variables Are Set

After adding, you should see both variables in the list:

- ✅ `GOOGLE_CLIENT_ID` = `your-client-id.apps.googleusercontent.com`
- ✅ `GOOGLE_CLIENT_SECRET` = `your-secret-value`

### Step 4: Wait for Redeploy

- Railway automatically redeploys when you add variables
- Check the **Deployments** tab to see the new deployment
- Wait for it to complete (usually 1-2 minutes)

### Step 5: Test

1. Go to your site: https://coparentliaizen.com
2. Click "Sign in with Google"
3. Should redirect to Google OAuth page (not 500 error)

## Important Notes

### Redirect URI Configuration

Make sure your Google OAuth client has these redirect URIs configured:

**In Google Cloud Console:**

- Go to: https://console.cloud.google.com/apis/credentials
- Click on your OAuth Client ID
- Under "Authorized redirect URIs", add:
  - `https://coparentliaizen.com/auth/google/callback`
  - `https://www.coparentliaizen.com/auth/google/callback` (if using www)

### Variable Format

- **GOOGLE_CLIENT_ID:** Should look like: `123456789-abcdefghijklmnop.apps.googleusercontent.com`
- **GOOGLE_CLIENT_SECRET:** Should be a long string (usually 24+ characters)

### Common Mistakes

❌ **Wrong variable name:**

- Not: `GOOGLE_CLIENTID` or `google_client_id`
- Must be: `GOOGLE_CLIENT_ID` (exact case)

❌ **Missing values:**

- Make sure both variables have values (not empty)
- Copy the entire Client ID and Secret

❌ **Extra spaces:**

- Don't add spaces before/after the values
- Paste directly without trimming

## Troubleshooting

### Still Getting 500 Error?

1. **Check Railway Logs:**
   - Go to **Deployments** → Latest deployment → **View Logs**
   - Look for: `❌ GOOGLE_CLIENT_ID is not set`
   - If you see this, the variable wasn't saved correctly

2. **Verify Variables:**
   - Go back to **Variables** tab
   - Make sure both variables are listed
   - Check that values are not empty

3. **Redeploy Manually:**
   - Go to **Deployments** tab
   - Click **Redeploy** button
   - Wait for deployment to complete

### Getting "invalid_client" Error?

This means the credentials are incorrect:

- Double-check Client ID matches Google Cloud Console
- Double-check Client Secret matches Google Cloud Console
- Make sure you copied the entire values (no truncation)

## Quick Checklist

- [ ] Opened Railway Dashboard
- [ ] Selected chat-server service
- [ ] Went to Variables tab
- [ ] Added `GOOGLE_CLIENT_ID` with correct value
- [ ] Added `GOOGLE_CLIENT_SECRET` with correct value
- [ ] Verified both variables are in the list
- [ ] Waited for auto-redeploy to complete
- [ ] Tested Google sign-in (no 500 error)
