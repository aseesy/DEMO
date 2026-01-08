/**
 * Blog Image Generation Routes
 * @di-pattern: direct
 *
 * API endpoints for generating blog header images and social media graphics
 * using DALL-E 3 or Flux API.
 */

const express = require('express');
const router = express.Router();
const { verifyAuth } = require('../middleware/auth');
const blogImageGenerator = require('../src/services/blog/blogImageGenerator');

const { defaultLogger: defaultLogger } = require('../src/infrastructure/logging/logger');

const logger = defaultLogger.child({
  module: 'blogImages',
});

/**
 * POST /api/blog/images/generate-header
 * Generate a blog header image
 *
 * Body: {
 *   title: string,
 *   subtitle: string,
 *   category: string (optional),
 *   provider: 'dall-e-3' | 'flux' (optional, defaults to 'dall-e-3'),
 *   saveLocally: boolean (optional, defaults to false)
 * }
 */
router.post('/generate-header', verifyAuth, async (req, res) => {
  try {
    const { title, subtitle, category, provider = 'dall-e-3', saveLocally = false } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const articleMeta = {
      title,
      subtitle,
      category,
    };

    const outputDir = saveLocally ? './generated-images/blog' : null;
    const result = await blogImageGenerator.generateHeaderImage(articleMeta, provider, outputDir);

    res.json({
      success: true,
      image: {
        url: result.url,
        localPath: result.localPath,
        revised_prompt: result.revised_prompt,
        provider: result.provider,
        type: result.type,
      },
    });
  } catch (error) {
    logger.error('[blogImages] Error generating header image', {
      error: error,
    });
    res.status(500).json({
      error: error.message || 'Failed to generate header image',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

/**
 * POST /api/blog/images/generate-social
 * Generate a social media graphic
 *
 * Body: {
 *   title: string,
 *   subtitle: string,
 *   platform: 'instagram' | 'twitter' | 'facebook',
 *   provider: 'dall-e-3' | 'flux' (optional),
 *   saveLocally: boolean (optional)
 * }
 */
router.post('/generate-social', verifyAuth, async (req, res) => {
  try {
    const {
      title,
      subtitle,
      platform = 'twitter',
      provider = 'dall-e-3',
      saveLocally = false,
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    if (!['instagram', 'twitter', 'facebook'].includes(platform)) {
      return res
        .status(400)
        .json({ error: 'Invalid platform. Use: instagram, twitter, or facebook' });
    }

    const articleMeta = {
      title,
      subtitle,
    };

    const outputDir = saveLocally ? './generated-images/blog/social' : null;
    const result = await blogImageGenerator.generateSocialMediaGraphic(
      articleMeta,
      platform,
      provider,
      outputDir
    );

    res.json({
      success: true,
      image: {
        url: result.url,
        localPath: result.localPath,
        revised_prompt: result.revised_prompt,
        provider: result.provider,
        type: result.type,
        platform: result.platform,
      },
    });
  } catch (error) {
    logger.error('[blogImages] Error generating social media graphic', {
      error: error,
    });
    res.status(500).json({
      error: error.message || 'Failed to generate social media graphic',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

/**
 * POST /api/blog/images/generate-all
 * Generate all images for a blog article (header + all social media)
 *
 * Body: {
 *   title: string,
 *   subtitle: string,
 *   category: string (optional),
 *   provider: 'dall-e-3' | 'flux' (optional),
 *   saveLocally: boolean (optional)
 * }
 */
router.post('/generate-all', verifyAuth, async (req, res) => {
  try {
    const { title, subtitle, category, provider = 'dall-e-3', saveLocally = false } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const articleMeta = {
      title,
      subtitle,
      category,
    };

    const outputDir = saveLocally ? './generated-images/blog' : null;
    const result = await blogImageGenerator.generateAllImages(articleMeta, provider, outputDir);

    res.json({
      success: true,
      images: {
        header: {
          url: result.header.url,
          localPath: result.header.localPath,
          revised_prompt: result.header.revised_prompt,
          provider: result.header.provider,
        },
        social: {
          instagram: {
            url: result.social.instagram.url,
            localPath: result.social.instagram.localPath,
            provider: result.social.instagram.provider,
          },
          twitter: {
            url: result.social.twitter.url,
            localPath: result.social.twitter.localPath,
            provider: result.social.twitter.provider,
          },
          facebook: {
            url: result.social.facebook.url,
            localPath: result.social.facebook.localPath,
            provider: result.social.facebook.provider,
          },
        },
      },
    });
  } catch (error) {
    logger.error('[blogImages] Error generating all images', {
      error: error,
    });
    res.status(500).json({
      error: error.message || 'Failed to generate images',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

module.exports = router;
