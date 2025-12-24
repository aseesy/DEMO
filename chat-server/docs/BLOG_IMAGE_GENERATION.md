# Blog Image Generation

This module automatically generates blog header images and social media graphics using DALL-E 3 or Flux API.

## Features

- ✅ **Automatic Header Images**: Generates 16:9 blog header images (1792x1024)
- ✅ **Social Media Graphics**: Creates graphics for Instagram (1:1), Twitter/Facebook (16:9)
- ✅ **Dual Provider Support**: Works with DALL-E 3 (default) or Flux API
- ✅ **Smart Prompts**: Automatically creates optimized prompts based on article metadata
- ✅ **Image Download**: Optionally saves generated images to disk
- ✅ **API Endpoints**: RESTful API for programmatic image generation

## Setup

### Environment Variables

```bash
# Required for DALL-E 3
OPENAI_API_KEY=sk-your-openai-api-key

# Optional for Flux API
FLUX_API_KEY=your-flux-api-key
IMAGE_PROVIDER=dall-e-3  # or 'flux'
```

### Installation

The module uses existing dependencies:
- `openai` - Already installed
- Node.js 18+ (for built-in `fetch`)

For Node.js < 18, install `node-fetch`:
```bash
npm install node-fetch
```

## Usage

### API Endpoints

#### Generate Header Image

```bash
POST /api/blog/images/generate-header
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Article Title",
  "subtitle": "Article subtitle",
  "category": "Co-Parenting Communication",
  "provider": "dall-e-3",  // optional
  "saveLocally": false      // optional
}
```

Response:
```json
{
  "success": true,
  "image": {
    "url": "https://...",
    "localPath": "/path/to/image.png",
    "revised_prompt": "...",
    "provider": "dall-e-3",
    "type": "header"
  }
}
```

#### Generate Social Media Graphic

```bash
POST /api/blog/images/generate-social
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Article Title",
  "subtitle": "Article subtitle",
  "platform": "twitter",  // instagram, twitter, or facebook
  "provider": "dall-e-3",
  "saveLocally": false
}
```

#### Generate All Images

```bash
POST /api/blog/images/generate-all
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Article Title",
  "subtitle": "Article subtitle",
  "category": "Co-Parenting Communication",
  "provider": "dall-e-3",
  "saveLocally": true
}
```

### Command Line Script

Generate images for a specific article:

```bash
node scripts/generate-blog-images.js why-arguments-repeat
```

Generate images for all articles:

```bash
node scripts/generate-blog-images.js all
```

Use Flux API instead:

```bash
IMAGE_PROVIDER=flux node scripts/generate-blog-images.js why-arguments-repeat
```

## Image Specifications

### Header Images
- **Size**: 1792x1024 (16:9 aspect ratio)
- **Format**: PNG
- **Quality**: HD
- **Style**: Natural, professional, calming
- **Colors**: Teal (#4DA8B0), white, soft grays

### Social Media Graphics

**Instagram**:
- **Size**: 1024x1024 (1:1 square)
- **Use**: Instagram posts, stories

**Twitter/Facebook**:
- **Size**: 1792x1024 (16:9 wide)
- **Use**: Twitter cards, Facebook link previews

## Prompt Engineering

The module automatically creates optimized prompts based on:
- Article title
- Article subtitle
- Category/theme
- Platform requirements

Example generated prompt:
```
Create a professional, modern blog header image for a co-parenting communication article. 
The image should be:
- Calming and peaceful (soft teal and white color palette)
- Professional and trustworthy
- Visually represents the concept: "Why Negotiation Feels Like War"
- Abstract or metaphorical (not literal photos of people)
- Suitable for a mental health and communication blog
- High quality, clean design
- 16:9 aspect ratio, horizontal layout

Style: Modern, minimalist, professional, calming, trustworthy
Colors: Teal (#4DA8B0), white, soft grays
Mood: Peaceful, hopeful, supportive, professional
```

## Integration with Blog Articles

To automatically generate images when creating a new blog article:

```javascript
const blogImageGenerator = require('./src/services/blog/blogImageGenerator');

const articleMeta = {
  title: 'Your Article Title',
  subtitle: 'Your article subtitle',
  category: 'Co-Parenting Communication',
};

// Generate all images
const images = await blogImageGenerator.generateAllImages(
  articleMeta,
  'dall-e-3',
  './public/blog-images'  // Save to public folder
);

// Use in your blog component
<BlogArticleLayout 
  meta={{
    ...articleMeta,
    heroImage: images.header.localPath || images.header.url,
  }}
/>
```

## Cost Considerations

### DALL-E 3 Pricing
- **Standard**: $0.040 per image
- **HD**: $0.080 per image (used by default)
- **Rate Limits**: 7 requests per minute

### Flux API Pricing
- Check Black Forest Labs pricing
- Generally more cost-effective for bulk generation

### Recommendations
- Generate images once per article
- Cache generated images locally
- Use `saveLocally: true` to avoid re-downloading
- Consider Flux API for bulk generation

## Error Handling

The module handles:
- API key validation
- Rate limiting
- Network errors
- Invalid responses
- File system errors

All errors are logged with context for debugging.

## Future Enhancements

- [ ] Image caching and deduplication
- [ ] Batch generation for multiple articles
- [ ] Custom prompt templates
- [ ] Image optimization (compression, WebP conversion)
- [ ] CDN integration for generated images
- [ ] Automatic image replacement in blog articles

