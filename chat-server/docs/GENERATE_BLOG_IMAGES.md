# Generating Images for Existing Blog Posts

This guide explains how to use DALL-E 3 to generate and save images for all your existing blog posts, preventing expiration issues.

## Problem

DALL-E 3 generates images and returns Azure Blob Storage URLs that **expire after ~2 hours**. If you want to use these images in your blog posts, you need to download and save them immediately.

## Solution

We've created a script that:
1. ✅ Reads all blog articles from `blogData.js`
2. ✅ Generates header images using DALL-E 3
3. ✅ **Downloads and saves them immediately** to prevent expiration
4. ✅ Creates a mapping file for easy use in React components

## Quick Start

### 1. Generate Images for All Articles

```bash
cd chat-server
node scripts/generate-all-blog-images.js
```

This will:
- Generate images for all 13+ articles
- Save them to `chat-client-vite/public/assets/blog-images/`
- Create a mapping file at `chat-client-vite/src/features/blog/blogImageMap.js`

### 2. Test First (Dry Run)

Before generating real images (which costs money), test the script:

```bash
node scripts/generate-all-blog-images.js --dry-run
```

This shows you:
- Which articles will get images
- What filenames will be used
- The output directory structure

### 3. Generate Images for Specific Articles

If you only want to generate images for a few articles, you can modify the script or use the API directly.

## Cost Estimate

**DALL-E 3 HD Pricing**: $0.080 per image

- **13 articles**: ~$1.04
- **All articles (20+)**: ~$1.60

**Note**: Images are generated once and saved locally, so you only pay once per article.

## Output Structure

After running the script, you'll have:

```
chat-client-vite/
├── public/
│   └── assets/
│       └── blog-images/
│           ├── emotional-triggers-header.png
│           ├── emotional-regulation-header.png
│           ├── reaction-vs-response-header.png
│           └── ... (one per article)
└── src/
    └── features/
        └── blog/
            └── blogImageMap.js  (auto-generated mapping)
```

## Using Generated Images in Components

### Option 1: Use the Mapping File

The script generates `blogImageMap.js` which you can import:

```jsx
import { blogImageMap, getBlogImage } from './blogImageMap';

export function MyArticle() {
  const meta = {
    title: 'My Article Title',
    heroImage: getBlogImage('my-article-slug'), // Automatically gets the right image
  };
  
  return <BlogArticleLayout meta={meta}>...</BlogArticleLayout>;
}
```

### Option 2: Direct Import

You can also import images directly:

```jsx
import emotionalTriggersImage from '/assets/blog-images/emotional-triggers-header.png';

export function EmotionalTriggers() {
  const meta = {
    title: 'Why Co-Parenting Messages Feel More Hurtful',
    heroImage: emotionalTriggersImage,
  };
  
  return <BlogArticleLayout meta={meta}>...</BlogArticleLayout>;
}
```

### Option 3: Update blogData.js

You can add image paths directly to `blogData.js`:

```javascript
{
  title: 'Why Co-Parenting Messages Feel More Hurtful',
  excerpt: '...',
  path: '/co-parenting-communication/emotional-triggers',
  image: '/assets/blog-images/emotional-triggers-header.png', // Add this
}
```

## Script Options

```bash
# Dry run (no API calls, no cost)
node scripts/generate-all-blog-images.js --dry-run

# Use Flux API instead of DALL-E 3
node scripts/generate-all-blog-images.js --provider=flux

# Default (DALL-E 3)
node scripts/generate-all-blog-images.js
```

## Troubleshooting

### Images Not Downloading

If images are generated but not downloading:

1. **Check the error message** - The script will show what went wrong
2. **URLs expire in 2 hours** - If the download fails, you'll see the URL in the output
3. **Manual download** - You can manually download from the URL before it expires

### Rate Limiting

The script includes a 2-second delay between requests to avoid rate limiting. If you hit rate limits:

- Wait a few minutes and retry
- Generate images in smaller batches
- Use the `--dry-run` flag to test first

### Missing Articles

If some articles aren't being found:

1. Check that the article exists in `blogData.js`
2. Verify the article has `title`, `excerpt`, and `path` fields
3. The script uses regex to extract articles - complex titles might not parse correctly

## Best Practices

1. **Generate images before publishing** - Run the script when you create new articles
2. **Commit images to git** - Save the generated images in your repository
3. **Use consistent naming** - The script uses article slugs for filenames
4. **Test with dry-run first** - Always test before generating real images

## Integration with Existing Articles

If you already have some articles with images (like `WhyArgumentsRepeat`), the script will:

- Generate new images for articles without images
- Skip articles that already have images (you can modify the script to regenerate)
- Create a unified mapping file for all images

## Next Steps

After generating images:

1. ✅ Review the generated images
2. ✅ Update blog components to use the mapping file
3. ✅ Commit images to git
4. ✅ Deploy to production

## Example: Updating an Article Component

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
import { getBlogImage } from './blogImageMap';

export function EmotionalTriggers() {
  const meta = {
    title: 'Why Co-Parenting Messages Feel More Hurtful',
    heroImage: getBlogImage('emotional-triggers'), // ✅ Now has an image!
  };
}
```

## Support

If you encounter issues:

1. Check the script output for error messages
2. Verify `OPENAI_API_KEY` is set in your `.env` file
3. Ensure the output directory is writable
4. Check that `blogData.js` is in the expected location

