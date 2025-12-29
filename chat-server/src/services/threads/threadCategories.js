/**
 * Thread Categories Module
 *
 * Provides default/suggested categories and keywords for AI suggestions.
 * Users can now create custom categories - these are just defaults/suggestions.
 * 
 * Architecture Change:
 * - Categories are no longer enforced/enum-constrained
 * - Database stores categories as TEXT (allows any string)
 * - These defaults are for AI suggestions and UI dropdowns only
 * - Users can create custom categories freely
 */

// =============================================================================
// DEFAULT CATEGORIES - Suggested categories for AI and UI
// Users can create custom categories - these are just defaults
// =============================================================================
const DEFAULT_CATEGORIES = [
  'schedule', // Pickup, dropoff, custody arrangements
  'medical', // Doctor appointments, health issues, medications
  'education', // School, homework, grades, teachers
  'finances', // Child support, shared expenses, reimbursements
  'activities', // Sports, hobbies, extracurriculars
  'travel', // Vacations, trips, travel arrangements
  'safety', // Emergency contacts, safety concerns
  'logistics', // General coordination, supplies, belongings (default)
  'co-parenting', // Relationship discussions, parenting decisions
];

// Keep THREAD_CATEGORIES for backward compatibility (deprecated - use DEFAULT_CATEGORIES)
const THREAD_CATEGORIES = DEFAULT_CATEGORIES;

// =============================================================================
// CATEGORY KEYWORDS for fast local matching and AI suggestions
// =============================================================================
const CATEGORY_KEYWORDS = {
  schedule: ['pickup', 'dropoff', 'drop-off', 'pick-up', 'custody', 'visitation', 'weekend', 'weekday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'morning', 'evening', 'afternoon', 'time', 'schedule', 'arrangement', 'switch', 'exchange'],
  medical: ['doctor', 'hospital', 'medicine', 'medication', 'prescription', 'appointment', 'sick', 'fever', 'health', 'dentist', 'therapy', 'therapist', 'vaccine', 'checkup', 'illness', 'symptoms', 'allergy'],
  education: ['school', 'homework', 'teacher', 'grade', 'class', 'test', 'exam', 'tutor', 'tutoring', 'college', 'education', 'learning', 'assignment', 'project', 'report', 'conference'],
  finances: ['money', 'payment', 'expense', 'cost', 'bill', 'support', 'reimburse', 'financial', 'budget', 'pay', 'paid', 'owe', 'debt', 'invoice', 'receipt', 'spend', 'spent'],
  activities: ['soccer', 'basketball', 'baseball', 'football', 'practice', 'game', 'sport', 'activity', 'hobby', 'lesson', 'camp', 'club', 'dance', 'music', 'piano', 'swim', 'swimming', 'gymnastics', 'martial', 'arts', 'recital', 'tournament'],
  travel: ['travel', 'trip', 'vacation', 'flight', 'passport', 'visit', 'holiday', 'plane', 'airport', 'hotel', 'drive', 'road', 'destination', 'traveling'],
  safety: ['emergency', 'safety', 'concern', 'danger', 'worry', 'secure', 'protect', 'urgent', 'warning', 'alert', 'accident', 'injury', 'hurt'],
  logistics: ['clothes', 'clothing', 'shoes', 'backpack', 'supplies', 'stuff', 'things', 'items', 'belongings', 'forgot', 'left', 'bring', 'pack', 'packed'],
  'co-parenting': ['parenting', 'decision', 'agree', 'discuss', 'relationship', 'communication', 'boundary', 'boundaries', 'conflict', 'disagreement', 'cooperate', 'rules', 'discipline'],
};

/**
 * Normalize and sanitize a category string
 * No longer validates against a hardcoded list - allows custom categories
 * @param {string} category - Category to normalize
 * @returns {string} - Normalized category (lowercase, trimmed, defaults to 'logistics' if empty)
 */
function normalizeCategory(category) {
  if (!category || typeof category !== 'string') {
    return 'logistics'; // Default category
  }
  // Normalize: lowercase, trim, remove extra spaces
  const normalized = category.trim().toLowerCase().replace(/\s+/g, '-');
  // Return default if empty after normalization
  return normalized || 'logistics';
}

/**
 * Validate that a category is valid (deprecated - use normalizeCategory instead)
 * Kept for backward compatibility - now just normalizes the category
 * @param {string} category - Category to validate
 * @returns {string} - Normalized category (defaults to 'logistics' if invalid)
 * @deprecated Use normalizeCategory instead - categories are no longer restricted
 */
function validateCategory(category) {
  // No longer restricts to hardcoded list - just normalizes
  return normalizeCategory(category);
}

/**
 * Check if a category is one of the default/suggested categories
 * Useful for UI dropdowns and AI suggestions
 * @param {string} category - Category to check
 * @returns {boolean} - True if it's a default category
 */
function isDefaultCategory(category) {
  if (!category) return false;
  return DEFAULT_CATEGORIES.includes(category.toLowerCase());
}

/**
 * Get keywords for a category
 * @param {string} category - Category name
 * @returns {string[]} - Array of keywords for the category
 */
function getCategoryKeywords(category) {
  return CATEGORY_KEYWORDS[category] || [];
}

module.exports = {
  // Default/suggested categories (for UI and AI)
  DEFAULT_CATEGORIES,
  THREAD_CATEGORIES, // Deprecated - kept for backward compatibility
  CATEGORY_KEYWORDS,
  
  // Category utilities
  normalizeCategory, // Use this for new code
  validateCategory, // Deprecated - use normalizeCategory instead
  isDefaultCategory, // Check if category is a default
  getCategoryKeywords,
};
