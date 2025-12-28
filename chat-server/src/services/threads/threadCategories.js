/**
 * Thread Categories Module
 *
 * Defines valid thread categories and provides validation functions.
 * All threads must belong to one of these categories.
 */

// =============================================================================
// THREAD CATEGORIES - All threads must belong to one of these
// =============================================================================
const THREAD_CATEGORIES = [
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

/**
 * Validate that a category is valid
 * @param {string} category - Category to validate
 * @returns {string} - Valid category (defaults to 'logistics' if invalid)
 */
function validateCategory(category) {
  if (!category || !THREAD_CATEGORIES.includes(category.toLowerCase())) {
    return 'logistics'; // Default category
  }
  return category.toLowerCase();
}

module.exports = {
  THREAD_CATEGORIES,
  validateCategory,
};
