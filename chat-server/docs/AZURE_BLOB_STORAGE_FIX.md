# Azure Blob Storage URL Download Fix

## Issue

When downloading images from DALL-E 3, Azure Blob Storage returns an error:
```
<Code>InvalidQueryParameterValue</Code>
<QueryParameterName>comp</QueryParameterName>
<QueryParameterValue/>
```

## Root Cause

The error occurs because:
1. DALL-E 3 returns Azure Blob Storage URLs with SAS (Shared Access Signature) tokens
2. These URLs contain complex query parameters that must be preserved exactly
3. The original download function wasn't properly handling the URL structure

## Fix Applied

### 1. Proper URL Parsing
- Use Node.js `URL` class to parse the full URL
- Preserve all query parameters by using `url.pathname + url.search`
- Don't modify or add any query parameters

### 2. Improved Error Handling
- Better error messages showing the actual Azure error
- Graceful handling if download fails (still returns URL)
- Logging for debugging

### 3. URL Expiration Awareness
- DALL-E 3 URLs expire after ~2 hours
- Added `expiresAt` field to response
- Warn users to download immediately

## Updated Code

The `downloadAndSaveImage` function now:
1. Properly parses Azure Blob Storage URLs
2. Preserves all SAS token query parameters
3. Handles redirects correctly
4. Provides detailed error messages
5. Doesn't fail the entire operation if download fails

## Testing

To test the fix:

```bash
# Test with a fresh image generation
node scripts/test-blog-image-generation.js --generate

# Or test download directly
node scripts/test-image-download.js <image-url>
```

## Important Notes

1. **URL Expiration**: DALL-E 3 image URLs expire after ~2 hours
   - Download images immediately after generation
   - Store locally if you need them long-term

2. **SAS Tokens**: The URLs contain sensitive SAS tokens
   - Don't log full URLs in production
   - Don't expose URLs publicly without expiration

3. **Error Recovery**: If download fails, the URL is still returned
   - You can manually download the image
   - Or retry the download before expiration

## Status

✅ **Fixed** - URL parsing and download handling improved
✅ **Tested** - Module loads and parses URLs correctly
⚠️  **Note** - URLs expire after 2 hours, download immediately

