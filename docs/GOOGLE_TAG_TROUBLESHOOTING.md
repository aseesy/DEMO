# Google Tag Troubleshooting Guide

If Google Tag wasn't detected on your website, follow these steps:

## Quick Fix Checklist

### 1. Verify Environment Variable is Set

**In Development:**

```bash
cd chat-client-vite
cat .env | grep GOOGLE_TAG
```

**In Production (Vercel):**

- Go to Project Settings → Environment Variables
- Verify `VITE_GOOGLE_TAG` is set
- Value should include the complete `<script>` tag(s)

### 2. Check Tag Format

Your `VITE_GOOGLE_TAG` should look like this:

**For Google Analytics 4:**

```bash
VITE_GOOGLE_TAG="<script async src=\"https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX\"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>"
```

**For Google Tag Manager:**

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

### 3. Restart Development Server

After adding/changing `.env`:

```bash
# Stop server (Ctrl+C)
npm run dev
```

### 4. Check Browser Console

Open browser DevTools (F12) → Console tab. Look for:

- ✅ `Google Tag injected successfully` - Working!
- ⚠️ `No GOOGLE_TAG found in environment variables` - Not configured
- ⚠️ `Google Tag already present` - Tag exists (good!)

### 5. Verify Tag in Page Source

1. Right-click page → "View Page Source"
2. Search for `googletagmanager` or `google-analytics`
3. Tag should appear in `<head>` section

### 6. Production Deployment

**For Vercel:**

1. Go to Project Settings → Environment Variables
2. Add: `VITE_GOOGLE_TAG` = `<!-- Your complete tag snippet -->`
3. **Important:** Redeploy after adding variable
4. Check build logs for `[Vite Plugin] Google Tag injected into HTML`

## Manual Injection (Fallback)

If automatic injection isn't working, you can manually add the tag to `index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <!-- Google Tag - Paste your complete snippet here -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag() {
        dataLayer.push(arguments);
      }
      gtag('js', new Date());
      gtag('config', 'G-XXXXXXXXXX');
    </script>
    <!-- End Google Tag -->

    <meta charset="UTF-8" />
    <!-- rest of head -->
  </head>
</html>
```

**Note:** This bypasses the automatic injection system. Remove manual tag if you want to use env var method.

## Common Issues

### Issue: Tag Not Detected by Google

**Possible Causes:**

1. Tag not in `<head>` section
2. Tag injected too late (after page load)
3. Tag format incorrect
4. Environment variable not set in production

**Solution:**

- Check page source - tag should be in `<head>`
- Verify environment variable is set
- Use manual injection as temporary fix

### Issue: Tag Appears Twice

**Cause:** Both build-time and runtime injection ran

**Solution:**

- The system should prevent this automatically
- Check for `data-gtag="injected"` attribute
- Remove any manually added tags

### Issue: Tag Works in Dev but Not Production

**Cause:** Environment variable not set in production

**Solution:**

1. Add `VITE_GOOGLE_TAG` to Vercel environment variables
2. Redeploy
3. Check build logs

## Testing

### Test Tag Injection

1. **Development:**

   ```bash
   npm run dev
   # Open browser console
   # Should see: "Google Tag injected successfully"
   ```

2. **Production Build:**
   ```bash
   npm run build
   # Check dist/index.html
   # Should contain Google Tag in <head>
   ```

### Verify in Google Analytics

1. Go to Google Analytics → Realtime
2. Visit your site
3. Should see activity within seconds

## Still Not Working?

1. **Check build logs** for `[Vite Plugin]` messages
2. **Check browser console** for errors
3. **Verify tag format** - must include `<script>` tags
4. **Try manual injection** as test
5. **Check environment variable** is actually set (not just in .env file)

## Support

If still having issues:

1. Share browser console output
2. Share build logs
3. Verify environment variable format
4. Check if tag appears in page source
