# Debugging Blog Images Not Appearing

## Quick Checklist

1. ✅ **Images exist**: Check `chat-client-vite/public/assets/blog-images/`
2. ✅ **Mapping file exists**: Check `chat-client-vite/src/features/blog/blogImageMap.js`
3. ✅ **Helper imported**: Component imports `getBlogImage` from `blogImageHelper`
4. ✅ **Helper called**: Component calls `getBlogImage('article-slug')` in meta
5. ✅ **Path format**: Images use `/assets/blog-images/...` (leading slash)
6. ✅ **Dev server**: Restart Vite dev server after adding images

## Common Issues

### Issue 1: Helper Returns Null

**Symptom**: `heroImage` is `null` or `undefined`

**Check**:
- Open browser console
- Look for warnings: `[blogImageHelper] Image map not loaded` or `No image found for slug`
- Verify the slug matches exactly (case-sensitive)

**Fix**:
```jsx
// Make sure slug matches exactly
heroImage: getBlogImage('emotional-triggers'), // ✅ Correct
heroImage: getBlogImage('Emotional-Triggers'), // ❌ Wrong (case mismatch)
```

### Issue 2: Image Path Not Found (404)

**Symptom**: Image path exists but browser shows 404

**Check**:
- Verify file exists: `ls chat-client-vite/public/assets/blog-images/`
- Check path format: Should be `/assets/blog-images/...` (leading slash)
- Restart Vite dev server after adding new images

**Fix**:
```jsx
// Correct path format
'/assets/blog-images/emotional-triggers-header.png' // ✅
'assets/blog-images/emotional-triggers-header.png'  // ❌ Missing leading slash
```

### Issue 3: Component Not Updated

**Symptom**: Only some articles show images

**Check**:
- Verify component imports helper: `import { getBlogImage } from './blogImageHelper';`
- Verify component calls helper: `heroImage: getBlogImage('slug')`
- Check browser console for errors

**Fix**:
Update each article component:
```jsx
import { getBlogImage } from './blogImageHelper';

const meta = {
  // ... other meta
  heroImage: getBlogImage('article-slug'),
  heroImageAlt: 'Descriptive alt text',
};
```

### Issue 4: Dev Server Cache

**Symptom**: Images exist but don't appear after update

**Fix**:
1. Stop Vite dev server (Ctrl+C)
2. Clear browser cache (Cmd+Shift+R or Ctrl+Shift+R)
3. Restart dev server: `npm run dev`

## Debug Steps

### Step 1: Check Helper is Working

Add console.log to component:
```jsx
const imagePath = getBlogImage('emotional-triggers');
console.log('Image path:', imagePath);
```

### Step 2: Check Image Map is Loaded

In browser console:
```javascript
import { isImageMapLoaded, getAvailableImageSlugs } from './blogImageHelper';
console.log('Map loaded:', isImageMapLoaded());
console.log('Available slugs:', getAvailableImageSlugs());
```

### Step 3: Verify File Exists

```bash
ls -la chat-client-vite/public/assets/blog-images/emotional-triggers-header.png
```

### Step 4: Test Image URL Directly

Open in browser:
```
http://localhost:5173/assets/blog-images/emotional-triggers-header.png
```

Should show the image. If 404, check:
- File exists in `public/assets/blog-images/`
- Vite dev server is running
- Path is correct (leading slash)

## Articles That Need Updates

Currently only these articles have images set up:
- ✅ `EmotionalTriggers` - Updated
- ✅ `EmotionalRegulation` - Updated
- ❌ All other articles - Need updates

To update all articles, add to each component:
```jsx
import { getBlogImage } from './blogImageHelper';

heroImage: getBlogImage('article-slug'),
```

## Testing

1. **Check browser console** for errors or warnings
2. **Inspect element** on the image area - check if `src` attribute is set
3. **Network tab** - check if image request is made and status code
4. **Verify path** - image src should be `/assets/blog-images/...`

## Still Not Working?

1. Check Vite config for any path aliases
2. Verify `public` folder is correctly configured
3. Check for any build errors
4. Try hard refresh (Cmd+Shift+R)
5. Check browser console for import errors

