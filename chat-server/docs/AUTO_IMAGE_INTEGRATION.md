# Automatic Blog Image Integration

## Current Status

**Images will NOT appear automatically** - you need to update each article component to use the generated images.

## How It Works

1. **Generate Images**: Run `node scripts/generate-all-blog-images.js`
2. **Mapping File Created**: Script creates `blogImageMap.js` with all image paths
3. **Update Components**: Each article component needs to import and use the image

## Two Approaches

### Approach 1: Use the Helper (Recommended)

The `blogImageHelper.js` automatically loads images from the mapping file:

```jsx
import { getBlogImage } from './blogImageHelper';

export function EmotionalTriggers() {
  const meta = {
    title: 'Why Co-Parenting Messages Feel More Hurtful',
    heroImage: getBlogImage('emotional-triggers'), // ✅ Auto-loaded!
  };
}
```

**Benefits:**
- ✅ Automatic - no manual imports needed
- ✅ Works even if mapping file doesn't exist yet (returns null)
- ✅ Easy to update - just regenerate mapping file

### Approach 2: Direct Import

Import images directly from the public folder:

```jsx
import emotionalTriggersImage from '/assets/blog-images/emotional-triggers-header.png';

export function EmotionalTriggers() {
  const meta = {
    title: 'Why Co-Parenting Messages Feel More Hurtful',
    heroImage: emotionalTriggersImage,
  };
}
```

**Benefits:**
- ✅ Type-safe (TypeScript/IDE support)
- ✅ Build-time validation
- ❌ Requires manual import for each article

## Quick Integration Guide

### Step 1: Generate Images

```bash
cd chat-server
node scripts/generate-all-blog-images.js
```

This creates:
- Images in `chat-client-vite/public/assets/blog-images/`
- Mapping file at `chat-client-vite/src/features/blog/blogImageMap.js`

### Step 2: Update Article Components

For each article component, add:

```jsx
import { getBlogImage } from './blogImageHelper';

// In the component:
const meta = {
  // ... existing meta
  heroImage: getBlogImage('article-slug'), // Add this line
  heroImageAlt: 'Descriptive alt text', // Add this too
};
```

### Step 3: Find Article Slugs

Article slugs are extracted from the article path:
- Path: `/co-parenting-communication/emotional-triggers`
- Slug: `emotional-triggers`

Or check the generated `blogImageMap.js` file for all available slugs.

## Example: Updating EmotionalTriggers

**Before:**
```jsx
export function EmotionalTriggers() {
  const meta = {
    title: 'Why Co-Parenting Messages Feel More Hurtful',
    // No heroImage
  };
}
```

**After:**
```jsx
import { getBlogImage } from './blogImageHelper';

export function EmotionalTriggers() {
  const meta = {
    title: 'Why Co-Parenting Messages Feel More Hurtful',
    heroImage: getBlogImage('emotional-triggers'), // ✅ Added!
    heroImageAlt: 'Understanding emotional triggers in co-parenting',
  };
}
```

## Bulk Update Script

You can create a script to automatically update all article components, or manually update them one by one.

## Articles That Need Updates

Based on `blogData.js`, these articles need image integration:

1. ✅ `WhyArgumentsRepeat` - Already has image (manual import)
2. ❌ `EmotionalTriggers` - Needs update (example done above)
3. ❌ `EmotionalRegulation` - Needs update
4. ❌ `ReactionVsResponse` - Needs update
5. ❌ `PauseBeforeReacting` - Needs update
6. ❌ `DefensivenessStrategies` - Needs update
7. ❌ All other articles - Need updates

## Testing

After updating components:

1. **Check image loads**: Visit the article page
2. **Check alt text**: Verify accessibility
3. **Check responsive**: Images should work on mobile
4. **Check performance**: Images should be optimized (already done - PNG format)

## Future Enhancement: Auto-Detection

We could enhance `BlogArticleLayout` to automatically detect and load images:

```jsx
// In BlogArticleLayout.jsx
import { getBlogImageFromPath } from './blogImageHelper';

// Auto-detect image from article path
const autoImage = getBlogImageFromPath(articlePath);
if (autoImage && !meta.heroImage) {
  meta.heroImage = autoImage;
}
```

This would make images appear automatically, but requires passing the article path to the layout component.

## Summary

- ✅ Images are generated and saved
- ✅ Mapping file is created
- ❌ Components need manual updates (or use helper)
- 💡 Helper makes it easy - just one line per article

