# Google Tag Setup Guide

This guide explains how to set up and use the Google Tag (Google Analytics or Google Tag Manager) in LiaiZen.

## Overview

The Google Tag is automatically injected into all pages from your `.env` file. The system:
- Checks for existing tags to prevent duplicates
- Injects the tag immediately after `<head>` on all pages
- Works with both Google Analytics 4 (GA4) and Google Tag Manager (GTM)

## Setup Instructions

### 1. Add Google Tag to Environment Variables

Add your Google Tag snippet to your `.env` file in `chat-client-vite/`:

```bash
# Option 1: Use VITE_GOOGLE_TAG (recommended for Vite)
VITE_GOOGLE_TAG="<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-XXXXXXX');</script>
<!-- End Google Tag Manager -->"

# Option 2: Use GOOGLE_TAG (also supported)
GOOGLE_TAG="<!-- Your Google Tag snippet here -->"
```

**Important Notes:**
- Include the **entire** Google Tag snippet (including `<script>` tags)
- For Google Tag Manager, include both the `<script>` and `<noscript>` portions
- The tag will be automatically injected into the `<head>` section

### 2. Example: Google Analytics 4 (GA4)

```bash
VITE_GOOGLE_TAG="<script async src=\"https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX\"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>"
```

### 3. Example: Google Tag Manager (GTM)

```bash
VITE_GOOGLE_TAG="<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-XXXXXXX');</script>
<!-- End Google Tag Manager -->
<noscript><iframe src=\"https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX\"
height=\"0\" width=\"0\" style=\"display:none;visibility:hidden\"></iframe></noscript>"
```

## How It Works

### Main App (index.html)

The Google Tag is injected in two ways:

1. **Build-time injection** (via Vite plugin):
   - The Vite plugin reads `VITE_GOOGLE_TAG` or `GOOGLE_TAG` from environment variables
   - Injects it directly into `index.html` during build
   - Works for production builds

2. **Runtime injection** (via JavaScript):
   - `injectGoogleTag.js` runs immediately when the app loads
   - Checks if tag already exists (prevents duplicates)
   - Parses and injects the tag into `<head>`
   - Works for both development and production

### Static HTML Files (terms.html, privacy.html, contact.html)

For static HTML files in the `public/` folder:
- The Vite plugin will inject the tag during build
- For development, the tag will be injected via the runtime script if you include it

**Note:** Static HTML files are served as-is, so they may need manual injection or server-side processing for development.

## Verification

### Check if Tag is Injected

1. **Open your app in browser**
2. **Open Developer Tools** (F12)
3. **Go to Elements/Inspector tab**
4. **Look in `<head>` section** - you should see your Google Tag script

### Check Console Logs

Open browser console and look for:
- `Google Tag injected successfully` - Tag was injected
- `Google Tag already present, skipping injection` - Tag already exists (good!)
- `No GOOGLE_TAG found in environment variables` - Tag not configured

### Verify in Google Analytics/Tag Manager

1. Go to your Google Analytics/Tag Manager dashboard
2. Check **Realtime** reports
3. Visit your site
4. You should see activity within seconds

## Troubleshooting

### Tag Not Appearing

1. **Check environment variable:**
   ```bash
   # In chat-client-vite/.env
   echo $VITE_GOOGLE_TAG
   ```

2. **Restart dev server** after adding/changing `.env` file:
   ```bash
   # Stop server (Ctrl+C)
   # Start again
   npm run dev
   ```

3. **Check browser console** for errors

4. **Verify tag format:**
   - Make sure you included the full `<script>` tags
   - Check for syntax errors in the tag snippet

### Duplicate Tags

The system automatically prevents duplicates by:
- Checking for existing tags before injection
- Marking injected tags with `data-gtag="injected"` attribute
- Skipping injection if tag already exists

If you see duplicates:
1. Check if tag was manually added to HTML
2. Remove manual tag and let the system inject it
3. Clear browser cache and reload

### Tag Not Working in Production

1. **Add environment variable to hosting platform:**
   - **Vercel**: Project Settings → Environment Variables
   - **Railway**: Variables tab
   - **Netlify**: Site Settings → Environment Variables

2. **Redeploy** after adding environment variable

3. **Verify variable name:**
   - Use `VITE_GOOGLE_TAG` (Vite requires `VITE_` prefix for client-side vars)
   - Or `GOOGLE_TAG` (also supported)

## Environment Variables

### Development (.env file)

```bash
# chat-client-vite/.env
VITE_GOOGLE_TAG="<!-- Your Google Tag snippet -->"
```

### Production (Hosting Platform)

**Vercel:**
- Go to Project Settings → Environment Variables
- Add: `VITE_GOOGLE_TAG` = `<!-- Your Google Tag snippet -->`
- Redeploy

**Railway:**
- Go to Variables tab
- Add: `VITE_GOOGLE_TAG` = `<!-- Your Google Tag snippet -->`
- Redeploy

## Files Modified

- `chat-client-vite/src/utils/injectGoogleTag.js` - Runtime injection script
- `chat-client-vite/src/main.jsx` - Calls injection on app load
- `chat-client-vite/vite.config.js` - Build-time injection plugin
- `chat-client-vite/index.html` - Main app HTML
- `chat-client-vite/public/terms.html` - Terms page
- `chat-client-vite/public/privacy.html` - Privacy page
- `chat-client-vite/public/contact.html` - Contact page

## Best Practices

1. **Use VITE_GOOGLE_TAG** (not GOOGLE_TAG) for Vite projects
2. **Include full tag snippet** including `<script>` tags
3. **Test in development** before deploying to production
4. **Verify in Google Analytics** Realtime reports
5. **Don't manually add tags** to HTML - let the system inject them
6. **Keep tag in .env** - never commit it to git (already in .gitignore)

## Security Notes

- Google Tag is injected client-side (visible in page source)
- This is normal and expected behavior for analytics tags
- No sensitive data should be in the tag snippet
- Tag only tracks public website usage

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify environment variable is set correctly
3. Restart dev server after changing `.env`
4. Check Google Analytics/Tag Manager dashboard for activity
5. Review this documentation

