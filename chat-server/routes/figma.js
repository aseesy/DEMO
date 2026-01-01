/**
 * Figma API Routes
 * @di-pattern: injected
 *
 * Handles Figma integration including file access, image export,
 * comment management, and component sync.
 * Extracted from server.js for better maintainability.
 */

const express = require('express');
const router = express.Router();

const { verifyAuth } = require('../middleware/auth');

// Service references - set from server.js
let figmaService;
let FigmaService;
let ComponentScanner;
let FigmaGenerator;

router.setHelpers = function (helpers) {
  figmaService = helpers.figmaService;
  FigmaService = helpers.FigmaService;
  ComponentScanner = helpers.ComponentScanner;
  FigmaGenerator = helpers.FigmaGenerator;
};

// ========================================
// Figma API Endpoints
// ========================================

/**
 * GET /api/figma/status
 * Check Figma service availability
 */
router.get('/status', (req, res) => {
  res.json({
    available: !!figmaService,
    message: figmaService
      ? 'Figma API service is available'
      : 'Figma API service not configured. Set FIGMA_ACCESS_TOKEN environment variable.',
  });
});

/**
 * GET /api/figma/file/:fileKey
 * Get file data from Figma
 */
router.get('/file/:fileKey', async (req, res) => {
  if (!figmaService) {
    return res.status(503).json({ error: 'Figma API service not configured' });
  }

  try {
    const { fileKey } = req.params;
    const { version, ids, depth, geometry, plugin_data, styles } = req.query;

    const options = {};
    if (version) options.version = version;
    if (ids) options.ids = ids.split(',');
    if (depth) options.depth = parseInt(depth);
    if (geometry === 'true') options.geometry = 'paths';
    if (plugin_data === 'true') options.plugin_data = true;
    if (styles === 'true') options.styles = true;

    const fileData = await figmaService.getFile(fileKey, options);
    res.json(fileData);
  } catch (error) {
    console.error('Error fetching Figma file:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/figma/file/:fileKey/nodes
 * Get specific nodes from a Figma file
 */
router.get('/file/:fileKey/nodes', async (req, res) => {
  if (!figmaService) {
    return res.status(503).json({ error: 'Figma API service not configured' });
  }

  try {
    const { fileKey } = req.params;
    const { ids } = req.query;

    if (!ids) {
      return res.status(400).json({ error: 'ids parameter is required' });
    }

    const nodeIds = ids.split(',');
    const nodeData = await figmaService.getFileNodes(fileKey, nodeIds);
    res.json(nodeData);
  } catch (error) {
    console.error('Error fetching Figma nodes:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/figma/images/:fileKey
 * Export images from Figma
 */
router.get('/images/:fileKey', async (req, res) => {
  if (!figmaService) {
    return res.status(503).json({ error: 'Figma API service not configured' });
  }

  try {
    const { fileKey } = req.params;
    const { ids, format = 'png', scale = 1, use_absolute_bounds } = req.query;

    if (!ids) {
      return res.status(400).json({ error: 'ids parameter is required' });
    }

    const nodeIds = ids.split(',');
    const imageData = await figmaService.getImages(fileKey, nodeIds, {
      format,
      scale: parseFloat(scale),
      use_absolute_bounds: use_absolute_bounds === 'true',
    });
    res.json(imageData);
  } catch (error) {
    console.error('Error exporting Figma images:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/figma/file/:fileKey/comments
 * Get comments from a Figma file
 */
router.get('/file/:fileKey/comments', async (req, res) => {
  if (!figmaService) {
    return res.status(503).json({ error: 'Figma API service not configured' });
  }

  try {
    const { fileKey } = req.params;
    const comments = await figmaService.getComments(fileKey);
    res.json(comments);
  } catch (error) {
    console.error('Error fetching Figma comments:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/figma/file/:fileKey/comments
 * Post a comment to a Figma file
 */
router.post('/file/:fileKey/comments', verifyAuth, async (req, res) => {
  if (!figmaService) {
    return res.status(503).json({ error: 'Figma API service not configured' });
  }

  try {
    const { fileKey } = req.params;
    const { message, comment_id } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }

    const comment = await figmaService.postComment(fileKey, message, comment_id);
    res.json(comment);
  } catch (error) {
    console.error('Error posting Figma comment:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/figma/extract
 * Extract file key from Figma URL
 */
router.post('/extract', (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'url is required' });
    }

    const fileKey = FigmaService.extractFileKey(url);
    const nodeId = FigmaService.extractNodeId(url);

    res.json({
      fileKey,
      nodeId,
      valid: !!fileKey,
    });
  } catch (error) {
    console.error('Error extracting Figma data:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/figma/sync-tokens
 * Sync design tokens from Figma plugin
 */
router.post('/sync-tokens', async (req, res) => {
  try {
    const { fileKey, tokens } = req.body;

    if (!tokens) {
      return res.status(400).json({ error: 'tokens are required' });
    }

    // Store or process tokens
    // For now, we'll log them and return success
    // You can extend this to save to a file or database

    console.log('Received tokens from Figma:', {
      fileKey: fileKey || 'unknown',
      tokenCount: {
        colors: Object.keys(tokens.colors || {}).length,
        spacing: Object.keys(tokens.spacing || {}).length,
        typography: Object.keys(tokens.typography || {}).length,
      },
    });

    // TODO: Save tokens to .design-tokens-mcp/tokens.json or merge with existing tokens

    res.json({
      success: true,
      message: 'Tokens synced successfully',
      tokens: tokens,
    });
  } catch (error) {
    console.error('Error syncing tokens:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/figma/scan-components
 * Scan components from codebase
 */
router.get('/scan-components', async (req, res) => {
  try {
    const scanner = new ComponentScanner();
    const components = await scanner.scanComponents();

    res.json({
      success: true,
      count: components.length,
      components: components.map(c => ({
        name: c.name,
        category: c.category,
        filename: c.filename,
        props: c.props,
        tokens: c.tokens,
        children: c.children.map(ch => ch.name),
      })),
    });
  } catch (error) {
    console.error('Error scanning components:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/figma/generate-structure
 * Generate Figma structure from components
 */
router.post('/generate-structure', async (req, res) => {
  try {
    const { componentNames, pageType = 'wireframes', fileKey } = req.body;

    const scanner = new ComponentScanner();
    const allComponents = await scanner.scanComponents();

    // Filter to requested components, or use all if none specified
    const components =
      componentNames && componentNames.length > 0
        ? allComponents.filter(c => componentNames.includes(c.name))
        : allComponents;

    // Generate Figma structure
    const generator = new FigmaGenerator(figmaService, fileKey);
    const figmaPage = await generator.generateFigmaPage(components, pageType);

    // Convert to plugin format
    const pluginFormat = generator.toFigmaPluginFormat(figmaPage);

    res.json({
      success: true,
      page: figmaPage,
      pluginFormat: pluginFormat,
      components: components.map(c => c.name),
    });
  } catch (error) {
    console.error('Error generating Figma structure:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/figma/sync-components
 * Sync components to Figma (sends data to plugin)
 */
router.post('/sync-components', async (req, res) => {
  try {
    const { componentNames, pageType = 'wireframes', fileKey } = req.body;

    if (!fileKey && !figmaService) {
      return res.status(400).json({
        error: 'fileKey is required, or set FIGMA_ACCESS_TOKEN to auto-create file',
      });
    }

    // Scan components
    const scanner = new ComponentScanner();
    const allComponents = await scanner.scanComponents();

    const components =
      componentNames && componentNames.length > 0
        ? allComponents.filter(c => componentNames.includes(c.name))
        : allComponents;

    // Generate Figma structure - use design generator for styled pages
    let generator;
    if (pageType === 'design') {
      const FigmaDesignGenerator = require('../figmaDesignGenerator');
      generator = new FigmaDesignGenerator(figmaService, fileKey);
    } else {
      generator = new FigmaGenerator(figmaService, fileKey);
    }
    const figmaPage = await generator.generateFigmaPage(components, pageType);

    // Return data for plugin to consume
    // The plugin will need to be running and listening for this data
    res.json({
      success: true,
      message: `Generated structure for ${components.length} components. Use Figma plugin to render.`,
      data: {
        command: 'create-structure',
        structure: figmaPage,
        components: components.map(c => ({
          name: c.name,
          category: c.category,
          structure: c.structure,
          styles: c.styles,
        })),
      },
    });
  } catch (error) {
    console.error('Error syncing components to Figma:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/figma/component/:componentName
 * Get component details for a specific component
 */
router.get('/component/:componentName', async (req, res) => {
  try {
    const { componentName } = req.params;

    const scanner = new ComponentScanner();
    const components = await scanner.scanComponents();

    const component = components.find(c => c.name.toLowerCase() === componentName.toLowerCase());

    if (!component) {
      return res.status(404).json({ error: 'Component not found' });
    }

    // Generate wireframe for this component
    const generator = new FigmaGenerator(figmaService, null);
    const wireframe = generator.generateWireframe(component);

    res.json({
      success: true,
      component: {
        name: component.name,
        category: component.category,
        props: component.props,
        structure: component.structure,
        styles: component.styles,
        tokens: component.tokens,
      },
      wireframe: wireframe,
    });
  } catch (error) {
    console.error('Error getting component:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
