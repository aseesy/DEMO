/**
 * Blog Image Helper
 *
 * Automatically loads blog images from the backend API.
 * Images are served from /api/blog/images/* endpoint.
 */

import { API_BASE_URL } from '../../config.js';

/**
 * Get image path for an article by its slug
 * @param {string} slug - Article slug (e.g., 'emotional-triggers')
 * @returns {string} Image URL from backend API
 */
export function getBlogImage(slug) {
  // Blog images are served from backend API
  // Format: /api/blog/images/{slug}.png
  const imagePath = `${API_BASE_URL}/api/blog/images/${slug}.png`;

  // Add cache-busting query parameter
  const separator = imagePath.includes('?') ? '&' : '?';
  return `${imagePath}${separator}v=8`;
}

/**
 * Get image path from article path
 * Extracts slug from path and returns the corresponding image
 * @param {string} articlePath - Article path (e.g., '/co-parenting-communication/emotional-triggers')
 * @returns {string|null} Image path or null if not found
 */
export function getBlogImageFromPath(articlePath) {
  if (!articlePath) return null;

  // Extract slug from path
  const pathParts = articlePath.split('/').filter(Boolean);
  const slug = pathParts[pathParts.length - 1];

  return getBlogImage(slug);
}

/**
 * Get image path from article title
 * Converts title to slug and looks up image
 * @param {string} title - Article title
 * @returns {string|null} Image path or null if not found
 */
export function getBlogImageFromTitle(title) {
  if (!title) return null;

  // Convert title to slug
  const slug =
    typeof title === 'string'
      ? title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
      : String(title)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');

  return getBlogImage(slug);
}

/**
 * Check if image mapping is loaded (always true for API-based images)
 * @returns {boolean}
 */
export function isImageMapLoaded() {
  return true;
}

/**
 * Get all available image slugs (not applicable for API-based images)
 * @returns {string[]}
 */
export function getAvailableImageSlugs() {
  return [];
}
