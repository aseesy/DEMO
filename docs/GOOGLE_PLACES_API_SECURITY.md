# Google Places API Key Security Guide

## Understanding the Warning

Vercel warns that `VITE_GOOGLE_PLACES_API_KEY` will be exposed because:

- **Vite environment variables** prefixed with `VITE_` are bundled into client-side JavaScript
- This is **intentional and necessary** for Google Places API to work in the browser
- The API key **must** be accessible to client-side code

## This is Normal and Safe (When Properly Configured)

Google Places API is designed to be used client-side. The key is meant to be visible in your JavaScript bundle. However, you **must** restrict it properly in Google Cloud Console.

## How to Secure Your API Key

### Step 1: Restrict API Key by HTTP Referrer

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Find your Google Places API key
4. Click **Edit** (pencil icon)

### Step 2: Add Application Restrictions

1. Under **Application restrictions**, select **HTTP referrers (web sites)**
2. Click **Add an item**
3. Add your production domains:
   ```
   https://www.coparentliaizen.com/*
   https://coparentliaizen.com/*
   ```
4. For development, also add:
   ```
   http://localhost:5173/*
   http://127.0.0.1:5173/*
   ```
5. Click **Save**

### Step 3: Restrict API Usage

1. Under **API restrictions**, select **Restrict key**
2. Check only **Places API** (or **Maps JavaScript API** if you're using that)
3. Click **Save**

### Step 4: Set Quotas and Billing Limits

1. Go to **APIs & Services** → **Dashboard**
2. Click on **Places API**
3. Go to **Quotas** tab
4. Set daily quotas to prevent unexpected charges:
   - **Requests per day**: Set a reasonable limit (e.g., 10,000)
   - **Requests per minute per user**: Set limit (e.g., 100)

## Security Best Practices

### ✅ DO:

- **Restrict by HTTP referrer** - Only allow your domains
- **Restrict API usage** - Only enable Places API
- **Set quotas** - Prevent abuse and unexpected charges
- **Monitor usage** - Check Google Cloud Console regularly
- **Use separate keys** - One for dev, one for production

### ❌ DON'T:

- Don't use the same key for multiple projects
- Don't skip referrer restrictions
- Don't enable unnecessary APIs
- Don't ignore quota warnings

## Alternative: Backend Proxy (Advanced)

If you want to completely hide the API key, you can create a backend proxy endpoint:

```javascript
// chat-server/server.js
app.get('/api/places/autocomplete', async (req, res) => {
  const { input } = req.query;
  const apiKey = process.env.GOOGLE_PLACES_API_KEY; // Server-side only

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${input}&key=${apiKey}`
  );
  const data = await response.json();
  res.json(data);
});
```

However, this requires:

- More complex implementation
- Backend API calls (slower)
- Additional server resources
- More maintenance

**Recommendation**: Use HTTP referrer restrictions instead - it's simpler and Google's recommended approach.

## Verifying Your Restrictions

1. Open your production site: `https://www.coparentliaizen.com`
2. Open browser DevTools (F12)
3. Go to **Network** tab
4. Try using the address autocomplete
5. Look for requests to `maps.googleapis.com`
6. The API key should work on your site
7. Try accessing the API from a different domain - it should be **blocked**

## Testing Restrictions

To verify your restrictions work:

1. Copy your API key from the browser's network tab
2. Try using it from a different domain (e.g., `https://example.com`)
3. It should return an error: `RefererNotAllowedMapError`

If you get this error from other domains, your restrictions are working! ✅

## Cost Management

Google Places API pricing:

- **Autocomplete (Per Session)**: $2.83 per 1,000 sessions
- **Place Details**: $17 per 1,000 requests
- **Free tier**: $200/month credit (covers ~70,000 autocomplete sessions)

Set up billing alerts:

1. Go to **Billing** → **Budgets & alerts**
2. Create a budget for your project
3. Set alert threshold (e.g., 80% of free tier)

## Summary

**The Vercel warning is expected** - client-side API keys are visible by design. The security comes from:

1. ✅ **HTTP referrer restrictions** (only your domains can use it)
2. ✅ **API restrictions** (only Places API enabled)
3. ✅ **Quota limits** (prevent abuse)

This is Google's recommended approach and is secure when properly configured.

## Need Help?

If you need assistance:

1. Check [Google Places API documentation](https://developers.google.com/maps/documentation/places/web-service)
2. Review [API key best practices](https://developers.google.com/maps/api-security-best-practices)
3. Contact Google Cloud support if you have billing concerns
