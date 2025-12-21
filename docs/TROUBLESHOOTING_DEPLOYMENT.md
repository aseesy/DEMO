# Troubleshooting: Changes Not Appearing in Production

## Quick Checks

### 1. Verify Vercel Deployment Status

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Click on your project** (coparentliaizen)
3. **Check Deployments tab**:
   - Look for the latest deployment
   - Verify it shows commit `d1a13f5` or later
   - Check if deployment status is "Ready" (green)
   - Check build logs for any errors

### 2. Verify Vercel Root Directory

**Critical**: Vercel must be configured to build from `chat-client-vite` directory.

1. **Go to Vercel Dashboard** → Your Project → **Settings** → **General**
2. **Check Root Directory**:
   - Should be: `chat-client-vite`
   - If it's blank or wrong, set it to `chat-client-vite` and save
   - This will trigger a new deployment

### 3. Clear Browser Cache

The changes might be cached:

1. **Hard Refresh**:
   - Chrome/Edge: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Firefox: `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)
   - Safari: `Cmd+Option+R`

2. **Or Clear Cache**:
   - Open DevTools (F12)
   - Right-click the refresh button
   - Select "Empty Cache and Hard Reload"

### 4. Check What Should Be Visible

**Expected Changes**:

1. **Address Field (Profile Page)**:
   - **Before**: Infinite loading spinner when API key missing
   - **After**: Error icon (⚠️) when API key missing
   - **Test**: Go to Profile page → Address field should show error icon, not spinner

2. **Database Schema**:
   - **Before**: Error "first_name of relation users does not exist"
   - **After**: Profile saves successfully
   - **Test**: Try saving profile with first name

### 5. Verify Build Output

Check if Vercel actually built the new code:

1. **Go to Vercel Dashboard** → Deployments → Latest deployment
2. **Click on the deployment** to see details
3. **Check Build Logs**:
   - Look for: "Building from chat-client-vite"
   - Look for: "Build completed successfully"
   - Check for any errors or warnings

4. **Check Build Output**:
   - Look for files like `ProfilePanel.jsx` in build output
   - Verify the build includes your changes

### 6. Force Redeploy

If changes aren't showing:

1. **Manual Redeploy**:
   - Go to Vercel Dashboard → Deployments
   - Click three dots (...) on latest deployment
   - Click "Redeploy"
   - Select "Use existing Build Cache" = **OFF** (to force fresh build)

2. **Or Trigger via Git**:
   ```bash
   git commit --allow-empty -m "chore: trigger Vercel redeploy"
   git push origin main
   ```

### 7. Check Environment Variables

Verify Vercel has the correct environment variables:

1. **Go to Vercel Dashboard** → Settings → Environment Variables
2. **Verify these are set**:
   - `VITE_API_URL` = `https://demo-production-6dcd.up.railway.app`
   - `VITE_GOOGLE_PLACES_API_KEY` = (your API key, if using)

3. **Important**: After adding/changing env vars, you **must redeploy**

### 8. Verify Railway Deployment

Check if Railway deployed the migration:

1. **Go to Railway Dashboard**: https://railway.app/dashboard
2. **Check Deployments**:
   - Look for latest deployment
   - Verify it shows commit `d1a13f5` or later
   - Check deployment logs

3. **Check Migration Ran**:
   - Look in Railway logs for: "Migration query executed successfully"
   - Look for: "007_add_profile_columns.sql" in logs

### 9. Test in Incognito/Private Window

1. **Open incognito/private window**
2. **Visit**: https://www.coparentliaizen.com
3. **Test the changes**:
   - Go to Profile page
   - Check address field (should show error icon, not spinner)
   - Try saving profile with first name

### 10. Check Browser Console

1. **Open DevTools** (F12)
2. **Go to Console tab**
3. **Look for errors**:
   - Any JavaScript errors?
   - Any network errors?
   - Check if files are loading correctly

4. **Check Network tab**:
   - Look for `ProfilePanel.jsx` or `useGooglePlaces.js` in loaded files
   - Verify they're the latest version (check file size/timestamp)

## Common Issues

### Issue: Vercel Root Directory Wrong

**Symptom**: Build completes but changes don't appear

**Fix**:

1. Go to Vercel → Settings → General
2. Set Root Directory to: `chat-client-vite`
3. Save and redeploy

### Issue: Build Cache

**Symptom**: Old code still running

**Fix**:

1. Redeploy with "Use existing Build Cache" = OFF
2. Or clear browser cache

### Issue: Environment Variables Not Set

**Symptom**: Features not working (but code is deployed)

**Fix**:

1. Add missing environment variables in Vercel
2. Redeploy after adding

### Issue: Migration Not Running

**Symptom**: Database errors persist

**Fix**:

1. Check Railway logs for migration errors
2. Manually run migration: `node chat-server/run-migration.js`
3. Or restart Railway service to trigger migration

## Still Not Working?

If changes still don't appear after trying all above:

1. **Check Vercel Build Logs** for errors
2. **Check Railway Logs** for errors
3. **Verify Git commit** is actually on main branch
4. **Check if Vercel is connected to correct GitHub repo/branch**
5. **Contact support** with:
   - Vercel deployment URL
   - Railway deployment URL
   - Screenshot of what you're seeing
   - Browser console errors (if any)
