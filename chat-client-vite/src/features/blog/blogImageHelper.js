/**
 * Blog Image Helper
 *
 * Automatically loads blog images from the generated mapping file.
 * This allows articles to automatically get their images without manual imports.
 */

import { blogImageMap as importedMap } from './blogImageMap';

// Use the imported map (will be empty object if file doesn't exist yet)
const blogImageMap = importedMap || {};
const imageMapLoaded = Object.keys(blogImageMap).length > 0;

// Debug: Log on import
if (typeof window !== 'undefined') {
  console.log('[blogImageHelper] Initialized:', {
    mapLoaded: imageMapLoaded,
    availableSlugs: Object.keys(blogImageMap),
    mapSize: Object.keys(blogImageMap).length,
  });
}

/**
 * Get image path for an article by its slug
 * @param {string} slug - Article slug (e.g., 'emotional-triggers')
 * @returns {string|null} Image path or null if not found
 */
export function getBlogImage(slug) {
  if (!imageMapLoaded) {
    console.warn(`[blogImageHelper] Image map not loaded. Slug: ${slug}`);
    return null;
  }
  const imagePath = blogImageMap[slug] || null;
  if (!imagePath) {
    console.warn(
      `[blogImageHelper] No image found for slug: ${slug}. Available slugs:`,
      Object.keys(blogImageMap)
    );
    return null;
  }

  // Add cache-busting query parameter to force browser to reload optimized images
  // This ensures browsers load the new optimized version instead of cached old version
  // Increment version when regenerating images: v=8 for concept-driven visual metaphors
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
 * Check if image mapping is loaded
 * @returns {boolean}
 */
export function isImageMapLoaded() {
  return imageMapLoaded;
}

/**
 * Get all available image slugs
 * @returns {string[]}
 */
export function getAvailableImageSlugs() {
  return Object.keys(blogImageMap);
}
