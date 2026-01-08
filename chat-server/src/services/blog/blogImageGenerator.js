/**
 * Blog Image Generator Service
 *
 * Generates blog header images and social media graphics using DALL-E 3 or Flux API.
 * Supports automatic generation based on article metadata.
 */

const OpenAI = require('openai');
const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const http = require('http');
const { createWriteStream } = require('fs');

const { defaultLogger: defaultLogger } = require('../../../src/infrastructure/logging/logger');

const logger = defaultLogger.child({
  module: 'blogImageGenerator',
});

// Try to load sharp for image optimization
let sharp = null;
try {
  sharp = require('sharp');
} catch (error) {
  // sharp not installed - optimization will be skipped
}

// Image generation configuration
const IMAGE_CONFIG = {
  // DALL-E 3 settings
  DALL_E: {
    model: 'dall-e-3',
    sizes: {
      header: '1792x1024', // 16:9 aspect ratio for blog headers
      socialSquare: '1024x1024', // 1:1 for Instagram
      socialWide: '1792x1024', // 16:9 for Twitter/Facebook
    },
    quality: 'hd',
    style: 'natural',
  },
  // Flux API settings (alternative)
  FLUX: {
    baseUrl: 'https://api.blackforestlabs.ai/v1',
    sizes: {
      header: { width: 1792, height: 1024 },
      socialSquare: { width: 1024, height: 1024 },
      socialWide: { width: 1792, height: 1024 },
    },
  },
};

/**
 * Get OpenAI client instance
 */
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }
  return new OpenAI({ apiKey });
}

/**
 * Generate image using DALL-E 3
 * @param {string} prompt - Image generation prompt
 * @param {string} size - Image size (header, socialSquare, socialWide)
 * @returns {Promise<{url: string, revised_prompt: string}>}
 */
async function generateWithDALLE(prompt, size = 'header') {
  const client = getOpenAIClient();
  const imageSize = IMAGE_CONFIG.DALL_E.sizes[size] || IMAGE_CONFIG.DALL_E.sizes.header;

  logger.debug('Log message', {
    value: `[blogImageGenerator] Generating ${size} image with DALL-E 3...`,
  });
  logger.debug('Log message', {
    value: `[blogImageGenerator] Prompt: ${prompt.substring(0, 100)}...`,
  });

  try {
    const response = await client.images.generate({
      model: IMAGE_CONFIG.DALL_E.model,
      prompt: prompt,
      size: imageSize,
      quality: IMAGE_CONFIG.DALL_E.quality,
      style: IMAGE_CONFIG.DALL_E.style,
      n: 1,
    });

    const imageUrl = response.data[0].url;
    const revisedPrompt = response.data[0].revised_prompt || prompt;

    logger.debug('Log message', {
      value: `[blogImageGenerator] ✅ Image generated successfully`,
    });
    return {
      url: imageUrl,
      revised_prompt: revisedPrompt,
      provider: 'dall-e-3',
    };
  } catch (error) {
    logger.error('[blogImageGenerator] ❌ DALL-E 3 generation failed', {
      error: error,
    });
    throw error;
  }
}

/**
 * Generate image using Flux API (alternative)
 * @param {string} prompt - Image generation prompt
 * @param {string} size - Image size (header, socialSquare, socialWide)
 * @returns {Promise<{url: string, revised_prompt: string}>}
 */
async function generateWithFlux(prompt, size = 'header') {
  const apiKey = process.env.FLUX_API_KEY;
  if (!apiKey) {
    throw new Error('FLUX_API_KEY not configured');
  }

  const dimensions = IMAGE_CONFIG.FLUX.sizes[size] || IMAGE_CONFIG.FLUX.sizes.header;

  logger.debug('Log message', {
    value: `[blogImageGenerator] Generating ${size} image with Flux API...`,
  });
  logger.debug('Log message', {
    value: `[blogImageGenerator] Prompt: ${prompt.substring(0, 100)}...`,
  });

  try {
    // Use Node.js built-in fetch (available in Node 18+)
    // For older versions, you may need to install node-fetch
    const fetch = globalThis.fetch || require('node-fetch');

    const response = await fetch(`${IMAGE_CONFIG.FLUX.baseUrl}/image/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        prompt: prompt,
        width: dimensions.width,
        height: dimensions.height,
        output_format: 'png',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Flux API error: ${error}`);
    }

    const data = await response.json();

    // Flux API response format may vary - adjust based on actual API documentation
    // Common formats: { image_url: string } or { url: string } or base64 data
    return {
      url: data.image_url || data.url || (data.data ? data.data.image_url : null),
      revised_prompt: prompt, // Flux doesn't revise prompts
      provider: 'flux',
    };
  } catch (error) {
    logger.error('[blogImageGenerator] ❌ Flux API generation failed', {
      error: error,
    });
    throw error;
  }
}

/**
 * Download image from URL and save to disk
 * @param {string} imageUrl - URL of the image
 * @param {string} filePath - Path to save the image
 * @returns {Promise<string>} Path to saved image
 */
async function downloadAndSaveImage(imageUrl, filePath) {
  return new Promise((resolve, reject) => {
    try {
      // Parse URL to handle Azure Blob Storage URLs correctly
      // DALL-E 3 returns Azure Blob Storage URLs with SAS tokens that must be preserved
      const url = new URL(imageUrl);
      const protocol = url.protocol === 'https:' ? https : http;

      // Build request options - include all query parameters for Azure Blob Storage SAS tokens
      // CRITICAL: Must include url.search to preserve SAS token query parameters
      const options = {
        hostname: url.hostname,
        path: url.pathname + url.search, // Include query string for SAS tokens
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LiaiZen/1.0)',
          Accept: 'image/*',
        },
      };

      logger.debug('Log message', {
        value: `[blogImageGenerator] Downloading from: ${url.hostname}${url.pathname.substring(0, 50)}...`,
      });

      const request = protocol.request(options, response => {
        // Handle redirects (301, 302, etc.)
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          logger.debug('Log message', {
            value: `[blogImageGenerator] Following redirect to: ${response.headers.location}`,
          });
          request.destroy();
          return downloadAndSaveImage(response.headers.location, filePath)
            .then(resolve)
            .catch(reject);
        }

        if (response.statusCode !== 200) {
          // Collect error response body
          let errorBody = '';
          response.on('data', chunk => {
            errorBody += chunk.toString();
          });
          response.on('end', () => {
            logger.error('Log message', {
              value: `[blogImageGenerator] ❌ Download failed: ${response.statusCode}`,
            });
            if (errorBody) {
              logger.error('Log message', {
                value: `[blogImageGenerator] Error response: ${errorBody.substring(0, 500)}`,
              });
            }
            reject(
              new Error(
                `Failed to download image: ${response.statusCode}${errorBody ? ' - ' + errorBody.substring(0, 200) : ''}`
              )
            );
          });
          return;
        }

        const fileStream = createWriteStream(filePath);
        response.pipe(fileStream);

        fileStream.on('finish', async () => {
          fileStream.close();
          logger.debug('Log message', {
            value: `[blogImageGenerator] ✅ Image downloaded to ${filePath}`,
          });

          // Optimize image if sharp is available
          if (sharp) {
            try {
              const optimizedPath = await optimizeImage(filePath);
              logger.debug('Log message', {
                value: `[blogImageGenerator] ✅ Image optimized`,
              });
              resolve(optimizedPath);
            } catch (optimizeError) {
              logger.warn('Log message', {
                value: `[blogImageGenerator] ⚠️  Image optimization failed: ${optimizeError.message}`,
              });
              logger.warn('Log message', {
                value: `[blogImageGenerator] ⚠️  Using original image`,
              });
              resolve(filePath);
            }
          } else {
            resolve(filePath);
          }
        });

        fileStream.on('error', err => {
          logger.error('Log message', {
            arg0: `[blogImageGenerator] ❌ File stream error:`,
            message: err.message,
          });
          fs.unlink(filePath).catch(() => {});
          reject(err);
        });
      });

      request.on('error', err => {
        logger.error('Log message', {
          arg0: `[blogImageGenerator] ❌ Request error:`,
          message: err.message,
        });
        reject(err);
      });

      // Set timeout (30 seconds)
      request.setTimeout(30000, () => {
        request.destroy();
        reject(new Error('Download timeout after 30 seconds'));
      });

      request.end();
    } catch (error) {
      logger.error('Log message', {
        arg0: `[blogImageGenerator] ❌ URL parsing error:`,
        message: error.message,
      });
      reject(new Error(`Invalid image URL: ${error.message}`));
    }
  });
}

/**
 * Optimize image using sharp (compress PNG)
 * @param {string} filePath - Path to the image file
 * @returns {Promise<string>} Path to optimized image
 */
async function optimizeImage(filePath) {
  if (!sharp) {
    return filePath; // No optimization available
  }

  try {
    const stats = await fs.stat(filePath);
    const originalSize = stats.size;
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.png') {
      // Compress PNG
      await sharp(filePath)
        .png({
          quality: 85,
          compressionLevel: 9,
          adaptiveFiltering: true,
        })
        .toFile(filePath + '.tmp');

      // Replace original with optimized
      await fs.rename(filePath + '.tmp', filePath);

      const newStats = await fs.stat(filePath);
      const newSize = newStats.size;
      const savings = (((originalSize - newSize) / originalSize) * 100).toFixed(1);

      logger.debug('Log message', {
        value: `[blogImageGenerator] Optimized: ${(originalSize / 1024 / 1024).toFixed(2)}MB → ${(newSize / 1024 / 1024).toFixed(2)}MB (${savings}% reduction)`,
      });
    }

    return filePath;
  } catch (error) {
    logger.error('Log message', {
      arg0: `[blogImageGenerator] Optimization error:`,
      message: error.message,
    });
    throw error;
  }
}

/**
 * Create optimized prompt for blog header image
 * @param {Object} articleMeta - Article metadata
 * @returns {string} Optimized prompt
 */
function createHeaderImagePrompt(articleMeta) {
  const { title, subtitle, category } = articleMeta;

  // Extract text content from title (handle React elements)
  const titleText =
    typeof title === 'string'
      ? title
      : title?.props?.children?.join
        ? title.props.children.join(' ')
        : String(title);

  // Build a more specific prompt using subtitle and excerpt for better relevance
  let specificContext = '';
  if (subtitle) {
    specificContext = `The article explores: "${subtitle}". `;
  }

  // Create article-specific visual metaphors based on actual article concepts
  let visualMetaphor = '';
  const titleLower = titleText.toLowerCase();
  const subtitleLower = (subtitle || '').toLowerCase();

  // Emotional Triggers article - show threat filter concept
  if (
    titleLower.includes('trigger') ||
    titleLower.includes('hurtful') ||
    (titleLower.includes('emotional') && subtitleLower.includes('trigger'))
  ) {
    visualMetaphor = `CONCEPTUAL VISUAL: A friendly cartoon person holding a phone, looking at a simple message. The message is being filtered through a "threat filter" - shown as a gentle, semi-transparent filter or lens between the person and the message. Past conflict memories are represented as soft, faded shapes or clouds in the background. The person's body language shows a subtle stress response (slightly tense shoulders, concerned expression). The image shows the gap between a neutral message and how it's perceived through the threat filter. This visually represents: "neutral messages feeling like attacks due to threat filters shaped by past conflict."`;
  }
  // Emotional Regulation article
  else if (
    titleLower.includes('regulation') ||
    (titleLower.includes('emotional') && subtitleLower.includes('regulation'))
  ) {
    visualMetaphor = `CONCEPTUAL VISUAL: A friendly cartoon person in a moment of pause, taking a deep breath. Their body shows transition from tension (slightly hunched, tense) to calm (relaxed shoulders, peaceful expression). Soft, calming elements surround them - gentle waves, peaceful colors transitioning. This visually represents: "choosing when and how to respond rather than having your stress response choose for you."`;
  }
  // Reaction vs Response article
  else if (titleLower.includes('reaction') && titleLower.includes('response')) {
    visualMetaphor = `CONCEPTUAL VISUAL: A friendly cartoon person at a crossroads moment. Two paths diverge: one path shows immediate reaction (sharp, angular shapes, tense body language, rushed movement). The other path shows considered response (smooth, rounded shapes, calm body language, thoughtful pause). The person is shown in the moment of choice, representing the pause between stimulus and response.`;
  }
  // Pause Before Reacting article
  else if (
    titleLower.includes('pause') &&
    (titleLower.includes('react') || titleLower.includes('sending'))
  ) {
    visualMetaphor = `CONCEPTUAL VISUAL: A friendly cartoon person with their finger hovering over a "send" button on a phone. They're in a moment of pause - taking a breath, their body language showing the choice to wait. Soft, calming elements (gentle waves, peaceful colors) flow around them, representing the space created by pausing. This visually represents: "creating space between receiving a message and responding."`;
  }
  // Argument Cycle article
  else if (
    (titleLower.includes('argument') && titleLower.includes('repeat')) ||
    titleLower.includes('cycle')
  ) {
    visualMetaphor = `CONCEPTUAL VISUAL: A friendly cartoon showing two people in a communication loop or cycle. The cycle is being gently broken - shown as a circular pattern with one section opening or softening. The people are shown moving from conflict (tense, facing away) toward understanding (calmer, more open). This visually represents: "breaking the cycle of repeating arguments."`;
  }
  // Defensiveness article
  else if (titleLower.includes('defensive') || titleLower.includes('defensiveness')) {
    visualMetaphor = `CONCEPTUAL VISUAL: A friendly cartoon person with defensive barriers or walls around them, but the barriers are softening and opening into pathways. The person's body language transitions from closed/protective to more open. This visually represents: "strategies for communicating without triggering defense mechanisms."`;
  }
  // De-escalation article
  else if (titleLower.includes('de-escalat') || titleLower.includes('escalat')) {
    visualMetaphor = `CONCEPTUAL VISUAL: A friendly cartoon showing communication that starts heated (sharp, angular shapes, tense colors) gradually cooling and softening (smooth transitions, calmer colors, peaceful shapes). Two people moving from conflict toward calm. This visually represents: "lowering the temperature of heated exchanges."`;
  }
  // AI/Technology articles
  else if (
    titleLower.includes('ai') ||
    titleLower.includes('mediation') ||
    subtitleLower.includes('ai')
  ) {
    visualMetaphor = `CONCEPTUAL VISUAL: A friendly cartoon showing human-centered technology - a person communicating with gentle, supportive tech elements around them (soft digital shapes, helpful tools). The tech feels warm and supportive, not cold or robotic. This visually represents: "AI-assisted communication that feels human and supportive."`;
  }
  // Child/Stability articles
  else if (
    titleLower.includes('child') ||
    titleLower.includes('kid') ||
    titleLower.includes('stability')
  ) {
    visualMetaphor = `CONCEPTUAL VISUAL: A friendly cartoon showing a stable foundation with protective, gentle elements. A child or family in a secure, peaceful environment. Soft, protective shapes surrounding them. This visually represents: "security and stability for children in co-parenting."`;
  }
  // Default - communication concept
  else {
    visualMetaphor = `CONCEPTUAL VISUAL: A friendly cartoon showing peaceful communication between two people. They're in a calm, supportive interaction - gentle gestures, open body language, peaceful setting. This visually represents: "effective, peaceful co-parenting communication."`;
  }

  const basePrompt = `Create a blog header image in the EXACT CARTOON style of the family-exchange illustration on the landing page. Article: "${titleText}". ${specificContext}

CONCEPT (MOST IMPORTANT - visually represent this):
${visualMetaphor}

STYLE (match landing page exactly):
- Friendly cartoon: soft rounded characters, simple features, gentle expressions
- Rounded shapes, soft outlines, subtle grainy texture, simple details
- Colors: warm orange, bright yellow, soft teal/blue, browns, light grays, cream - diverse natural palette
- Simple background: cream/off-white, soft shadows, clean composition
- NOT photorealistic, NOT 3D, NOT abstract

REQUIREMENTS:
- Visually represent the article's core concept above
- Match landing page cartoon style exactly
- 16:9 horizontal layout
- NO TEXT OR WORDS
- Peaceful, friendly mood`;

  return basePrompt;
}

/**
 * Create optimized prompt for social media graphic
 * @param {Object} articleMeta - Article metadata
 * @param {string} platform - Social platform (instagram, twitter, facebook)
 * @returns {string} Optimized prompt
 */
function createSocialMediaPrompt(articleMeta, platform = 'twitter') {
  const { title, subtitle } = articleMeta;

  const titleText =
    typeof title === 'string'
      ? title
      : title?.props?.children?.join
        ? title.props.children.join(' ')
        : String(title);

  const aspectRatio = platform === 'instagram' ? '1:1 square' : '16:9 wide';

  const basePrompt = `Create a professional social media graphic for a co-parenting communication blog post.
The image should be:
- Eye-catching and shareable
- Includes space for text overlay (title will be added separately)
- Calming teal and white color palette
- Professional and trustworthy
- Represents the concept: "${titleText}"
- Abstract or metaphorical design
- ${aspectRatio} aspect ratio
- High contrast for text readability

Style: Modern, minimalist, professional, engaging
Colors: Teal (#4DA8B0), white, soft grays
Mood: Peaceful, hopeful, supportive, shareable`;

  return basePrompt;
}

/**
 * Generate blog header image
 * @param {Object} articleMeta - Article metadata (title, subtitle, category, etc.)
 * @param {string} provider - Image provider ('dall-e-3' or 'flux')
 * @param {string} outputDir - Directory to save the image
 * @returns {Promise<{url: string, localPath: string, revised_prompt: string}>}
 */
async function generateHeaderImage(articleMeta, provider = 'dall-e-3', outputDir = null) {
  const prompt = createHeaderImagePrompt(articleMeta);

  let result;
  if (provider === 'flux') {
    result = await generateWithFlux(prompt, 'header');
  } else {
    result = await generateWithDALLE(prompt, 'header');
  }

  // Save image if output directory is provided
  // IMPORTANT: Download immediately as Azure Blob Storage URLs expire after ~2 hours
  let localPath = null;
  if (outputDir) {
    // Allow custom filename via articleMeta, otherwise use timestamp
    const customFileName = articleMeta.imageFileName;
    const fileName = customFileName || `header-${Date.now()}.png`;
    const filePath = path.join(outputDir, fileName);
    await fs.mkdir(outputDir, { recursive: true });
    try {
      localPath = await downloadAndSaveImage(result.url, filePath);
      logger.debug('Log message', {
        value: `[blogImageGenerator] ✅ Image saved to: ${localPath}`,
      });
    } catch (downloadError) {
      logger.error('Log message', {
        value: `[blogImageGenerator] ⚠️  Failed to download image: ${downloadError.message}`,
      });
      logger.error('Log message', {
        value: `[blogImageGenerator] ⚠️  Image URL is still available: ${result.url}`,
      });
      logger.error('Log message', {
        value: `[blogImageGenerator] ⚠️  Note: URLs expire after ~2 hours, download immediately`,
      });
      // Don't fail the entire operation - return the URL even if download fails
    }
  }

  return {
    ...result,
    localPath,
    type: 'header',
  };
}

/**
 * Generate social media graphic
 * @param {Object} articleMeta - Article metadata
 * @param {string} platform - Social platform ('instagram', 'twitter', 'facebook')
 * @param {string} provider - Image provider ('dall-e-3' or 'flux')
 * @param {string} outputDir - Directory to save the image
 * @returns {Promise<{url: string, localPath: string, revised_prompt: string}>}
 */
async function generateSocialMediaGraphic(
  articleMeta,
  platform = 'twitter',
  provider = 'dall-e-3',
  outputDir = null
) {
  const prompt = createSocialMediaPrompt(articleMeta, platform);
  const size = platform === 'instagram' ? 'socialSquare' : 'socialWide';

  let result;
  if (provider === 'flux') {
    result = await generateWithFlux(prompt, size);
  } else {
    result = await generateWithDALLE(prompt, size);
  }

  // Save image if output directory is provided
  // IMPORTANT: Download immediately as Azure Blob Storage URLs expire after ~2 hours
  let localPath = null;
  if (outputDir) {
    const fileName = `social-${platform}-${Date.now()}.png`;
    const filePath = path.join(outputDir, fileName);
    await fs.mkdir(outputDir, { recursive: true });
    try {
      localPath = await downloadAndSaveImage(result.url, filePath);
    } catch (downloadError) {
      logger.error('Log message', {
        value: `[blogImageGenerator] ⚠️  Failed to download image: ${downloadError.message}`,
      });
      logger.error('Log message', {
        value: `[blogImageGenerator] ⚠️  Image URL is still available: ${result.url}`,
      });
      logger.error('Log message', {
        value: `[blogImageGenerator] ⚠️  Note: URLs expire after ~2 hours, download immediately`,
      });
      // Don't fail the entire operation - return the URL even if download fails
    }
  }

  return {
    ...result,
    localPath,
    type: 'social',
    platform,
  };
}

/**
 * Generate all images for a blog article (header + social media)
 * @param {Object} articleMeta - Article metadata
 * @param {string} provider - Image provider ('dall-e-3' or 'flux')
 * @param {string} outputDir - Directory to save images
 * @returns {Promise<Object>} Generated images
 */
async function generateAllImages(articleMeta, provider = 'dall-e-3', outputDir = null) {
  logger.debug('Log message', {
    value: `[blogImageGenerator] Generating all images for article: ${articleMeta.title}`,
  });

  try {
    const [header, instagram, twitter] = await Promise.all([
      generateHeaderImage(articleMeta, provider, outputDir),
      generateSocialMediaGraphic(articleMeta, 'instagram', provider, outputDir),
      generateSocialMediaGraphic(articleMeta, 'twitter', provider, outputDir),
    ]);

    return {
      header,
      social: {
        instagram,
        twitter,
        facebook: twitter, // Facebook uses same dimensions as Twitter
      },
    };
  } catch (error) {
    logger.error('[blogImageGenerator] ❌ Failed to generate images', {
      error: error,
    });
    throw error;
  }
}

module.exports = {
  generateHeaderImage,
  generateSocialMediaGraphic,
  generateAllImages,
  createHeaderImagePrompt,
  createSocialMediaPrompt,
};
