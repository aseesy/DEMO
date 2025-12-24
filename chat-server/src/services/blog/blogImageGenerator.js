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

  console.log(`[blogImageGenerator] Generating ${size} image with DALL-E 3...`);
  console.log(`[blogImageGenerator] Prompt: ${prompt.substring(0, 100)}...`);

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

    console.log(`[blogImageGenerator] ✅ Image generated successfully`);
    return {
      url: imageUrl,
      revised_prompt: revisedPrompt,
      provider: 'dall-e-3',
    };
  } catch (error) {
    console.error('[blogImageGenerator] ❌ DALL-E 3 generation failed:', error);
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
  
  console.log(`[blogImageGenerator] Generating ${size} image with Flux API...`);
  console.log(`[blogImageGenerator] Prompt: ${prompt.substring(0, 100)}...`);

  try {
    // Use Node.js built-in fetch (available in Node 18+)
    // For older versions, you may need to install node-fetch
    const fetch = globalThis.fetch || require('node-fetch');
    
    const response = await fetch(`${IMAGE_CONFIG.FLUX.baseUrl}/image/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
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
    console.error('[blogImageGenerator] ❌ Flux API generation failed:', error);
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
          'Accept': 'image/*',
        },
      };

      console.log(`[blogImageGenerator] Downloading from: ${url.hostname}${url.pathname.substring(0, 50)}...`);

      const request = protocol.request(options, (response) => {
        // Handle redirects (301, 302, etc.)
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          console.log(`[blogImageGenerator] Following redirect to: ${response.headers.location}`);
          request.destroy();
          return downloadAndSaveImage(response.headers.location, filePath)
            .then(resolve)
            .catch(reject);
        }

        if (response.statusCode !== 200) {
          // Collect error response body
          let errorBody = '';
          response.on('data', (chunk) => {
            errorBody += chunk.toString();
          });
          response.on('end', () => {
            console.error(`[blogImageGenerator] ❌ Download failed: ${response.statusCode}`);
            if (errorBody) {
              console.error(`[blogImageGenerator] Error response: ${errorBody.substring(0, 500)}`);
            }
            reject(new Error(`Failed to download image: ${response.statusCode}${errorBody ? ' - ' + errorBody.substring(0, 200) : ''}`));
          });
          return;
        }

        const fileStream = createWriteStream(filePath);
        response.pipe(fileStream);

        fileStream.on('finish', async () => {
          fileStream.close();
          console.log(`[blogImageGenerator] ✅ Image downloaded to ${filePath}`);
          
          // Optimize image if sharp is available
          if (sharp) {
            try {
              const optimizedPath = await optimizeImage(filePath);
              console.log(`[blogImageGenerator] ✅ Image optimized`);
              resolve(optimizedPath);
            } catch (optimizeError) {
              console.warn(`[blogImageGenerator] ⚠️  Image optimization failed: ${optimizeError.message}`);
              console.warn(`[blogImageGenerator] ⚠️  Using original image`);
              resolve(filePath);
            }
          } else {
            resolve(filePath);
          }
        });

        fileStream.on('error', (err) => {
          console.error(`[blogImageGenerator] ❌ File stream error:`, err.message);
          fs.unlink(filePath).catch(() => {});
          reject(err);
        });
      });

      request.on('error', (err) => {
        console.error(`[blogImageGenerator] ❌ Request error:`, err.message);
        reject(err);
      });

      // Set timeout (30 seconds)
      request.setTimeout(30000, () => {
        request.destroy();
        reject(new Error('Download timeout after 30 seconds'));
      });

      request.end();
    } catch (error) {
      console.error(`[blogImageGenerator] ❌ URL parsing error:`, error.message);
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
      const savings = ((originalSize - newSize) / originalSize * 100).toFixed(1);
      
      console.log(`[blogImageGenerator] Optimized: ${(originalSize / 1024 / 1024).toFixed(2)}MB → ${(newSize / 1024 / 1024).toFixed(2)}MB (${savings}% reduction)`);
    }
    
    return filePath;
  } catch (error) {
    console.error(`[blogImageGenerator] Optimization error:`, error.message);
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
  const titleText = typeof title === 'string' ? title : 
                   (title?.props?.children?.join ? title.props.children.join(' ') : 
                   String(title));
  
  // Build a more specific prompt using subtitle and excerpt for better relevance
  let specificContext = '';
  if (subtitle) {
    specificContext = `The article explores: "${subtitle}". `;
  }
  
  // Create more specific visual metaphors based on the title/subtitle
  let visualMetaphor = '';
  const titleLower = titleText.toLowerCase();
  if (titleLower.includes('trigger') || titleLower.includes('hurtful') || titleLower.includes('emotional')) {
    visualMetaphor = 'Visual metaphor: gentle waves or ripples representing emotional responses, soft gradients showing how neutral messages can create emotional reactions.';
  } else if (titleLower.includes('regulation') || titleLower.includes('calm') || titleLower.includes('pause')) {
    visualMetaphor = 'Visual metaphor: peaceful, balanced composition with smooth transitions, representing emotional regulation and inner calm.';
  } else if (titleLower.includes('reaction') || titleLower.includes('response')) {
    visualMetaphor = 'Visual metaphor: two paths diverging - one reactive (sharp, angular) and one responsive (smooth, considered), showing the choice between reactions.';
  } else if (titleLower.includes('conflict') || titleLower.includes('argument') || titleLower.includes('cycle')) {
    visualMetaphor = 'Visual metaphor: interconnected loops or cycles being gently broken, representing breaking communication patterns.';
  } else if (titleLower.includes('defensive') || titleLower.includes('escalat')) {
    visualMetaphor = 'Visual metaphor: barriers or walls softening into open pathways, representing de-escalation and understanding.';
  } else if (titleLower.includes('child') || titleLower.includes('kid') || titleLower.includes('stability')) {
    visualMetaphor = 'Visual metaphor: stable foundation with gentle, protective elements, representing security and stability for children.';
  } else if (titleLower.includes('ai') || titleLower.includes('technology') || titleLower.includes('mediation')) {
    visualMetaphor = 'Visual metaphor: modern, tech-forward design with human-centered elements, representing AI-assisted communication.';
  } else {
    visualMetaphor = 'Visual metaphor: abstract representation of communication and connection, showing peaceful interaction.';
  }
  
  const basePrompt = `Create a professional, modern blog header image for a co-parenting communication article titled "${titleText}". 
${specificContext}
${visualMetaphor}

The image must:
- Be visually specific to the article's core concept (not generic)
- Use calming, peaceful colors (soft teal #4DA8B0, white, soft grays)
- Be abstract or metaphorical (no literal photos of people)
- Represent the psychological or emotional concepts discussed in the article
- Have a professional, trustworthy, modern aesthetic
- Be suitable for a mental health and communication blog
- Use clean, minimalist design principles
- Be 16:9 aspect ratio, horizontal layout

Style: Modern, minimalist, professional, calming, trustworthy, conceptually relevant
Colors: Teal (#4DA8B0), white, soft grays, subtle gradients
Mood: Peaceful, hopeful, supportive, professional, conceptually aligned with the article's theme`;

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
  
  const titleText = typeof title === 'string' ? title : 
                   (title?.props?.children?.join ? title.props.children.join(' ') : 
                   String(title));
  
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
      console.log(`[blogImageGenerator] ✅ Image saved to: ${localPath}`);
    } catch (downloadError) {
      console.error(`[blogImageGenerator] ⚠️  Failed to download image: ${downloadError.message}`);
      console.error(`[blogImageGenerator] ⚠️  Image URL is still available: ${result.url}`);
      console.error(`[blogImageGenerator] ⚠️  Note: URLs expire after ~2 hours, download immediately`);
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
      console.error(`[blogImageGenerator] ⚠️  Failed to download image: ${downloadError.message}`);
      console.error(`[blogImageGenerator] ⚠️  Image URL is still available: ${result.url}`);
      console.error(`[blogImageGenerator] ⚠️  Note: URLs expire after ~2 hours, download immediately`);
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
  console.log(`[blogImageGenerator] Generating all images for article: ${articleMeta.title}`);
  
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
    console.error('[blogImageGenerator] ❌ Failed to generate images:', error);
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

