/**
 * Figma API Service
 *
 * Integrates with Figma REST API to:
 * - Read file data and structure
 * - Export images and assets
 * - Get design tokens and component information
 * - Sync design specs to code
 */

const https = require('https');

const FIGMA_API_BASE = 'https://api.figma.com/v1';

class FigmaService {
  constructor(accessToken) {
    if (!accessToken) {
      throw new Error('Figma access token is required');
    }
    this.accessToken = accessToken;
  }

  /**
   * Make a request to Figma API
   * @private
   */
  async request(endpoint, options = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(`${FIGMA_API_BASE}${endpoint}`);

      if (options.params) {
        Object.keys(options.params).forEach(key => {
          url.searchParams.append(key, options.params[key]);
        });
      }

      const reqOptions = {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: options.method || 'GET',
        headers: {
          'X-Figma-Token': this.accessToken,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      };

      const req = https.request(reqOptions, res => {
        let data = '';

        res.on('data', chunk => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsed);
            } else {
              reject(new Error(`Figma API error: ${parsed.err || data}`));
            }
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        });
      });

      req.on('error', error => {
        reject(error);
      });

      if (options.body) {
        req.write(JSON.stringify(options.body));
      }

      req.end();
    });
  }

  /**
   * Get file data
   * @param {string} fileKey - Figma file key (from file URL)
   * @param {Object} options - Optional parameters (version, ids, depth, etc.)
   * @returns {Promise<Object>} File data
   */
  async getFile(fileKey, options = {}) {
    const params = {};
    if (options.version) params.version = options.version;
    if (options.ids) params.ids = Array.isArray(options.ids) ? options.ids.join(',') : options.ids;
    if (options.depth) params.depth = options.depth;
    if (options.geometry) params.geometry = options.geometry;
    if (options.plugin_data) params.plugin_data = options.plugin_data;
    if (options.styles) params.styles = options.styles;

    return this.request(`/files/${fileKey}`, { params });
  }

  /**
   * Get file nodes (specific nodes from a file)
   * @param {string} fileKey - Figma file key
   * @param {string|string[]} nodeIds - Node IDs to fetch
   * @param {Object} options - Optional parameters
   * @returns {Promise<Object>} Node data
   */
  async getFileNodes(fileKey, nodeIds, options = {}) {
    const ids = Array.isArray(nodeIds) ? nodeIds.join(',') : nodeIds;
    const params = { ids, ...options };
    return this.request(`/files/${fileKey}/nodes`, { params });
  }

  /**
   * Get images from file
   * @param {string} fileKey - Figma file key
   * @param {string|string[]} nodeIds - Node IDs to export
   * @param {Object} options - Export options (format, scale, use_absolute_bounds)
   * @returns {Promise<Object>} Image URLs
   */
  async getImages(fileKey, nodeIds, options = {}) {
    const ids = Array.isArray(nodeIds) ? nodeIds.join(',') : nodeIds;
    const params = {
      ids,
      format: options.format || 'png',
      scale: options.scale || 1,
      ...(options.use_absolute_bounds && { use_absolute_bounds: options.use_absolute_bounds }),
    };
    return this.request(`/images/${fileKey}`, { params });
  }

  /**
   * Get comments from file
   * @param {string} fileKey - Figma file key
   * @returns {Promise<Object>} Comments data
   */
  async getComments(fileKey) {
    return this.request(`/files/${fileKey}/comments`);
  }

  /**
   * Post a comment to file
   * @param {string} fileKey - Figma file key
   * @param {string} message - Comment message
   * @param {string} comment_id - Optional: reply to comment
   * @returns {Promise<Object>} Comment data
   */
  async postComment(fileKey, message, comment_id = null) {
    const body = { message };
    if (comment_id) {
      body.comment_id = comment_id;
    }
    return this.request(`/files/${fileKey}/comments`, {
      method: 'POST',
      body,
    });
  }

  /**
   * Get team projects
   * @param {string} teamId - Team ID
   * @returns {Promise<Object>} Projects data
   */
  async getTeamProjects(teamId) {
    return this.request(`/teams/${teamId}/projects`);
  }

  /**
   * Get project files
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>} Files data
   */
  async getProjectFiles(projectId) {
    return this.request(`/projects/${projectId}/files`);
  }

  /**
   * Extract file key from Figma URL
   * @param {string} url - Figma file URL
   * @returns {string} File key
   */
  static extractFileKey(url) {
    const match = url.match(/figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  }

  /**
   * Extract node ID from Figma URL
   * @param {string} url - Figma file URL with node parameter
   * @returns {string|null} Node ID
   */
  static extractNodeId(url) {
    const match = url.match(/node-id=([^&]+)/);
    return match ? decodeURIComponent(match[1].replace(/-/g, ':')) : null;
  }
}

module.exports = FigmaService;
