/**
 * Centralized Thread Categories Configuration
 *
 * Single source of truth for thread category metadata used across the application.
 * Categories align with the database ENUM defined in migration 027_thread_categories.sql
 */

export const THREAD_CATEGORIES = {
  schedule: {
    label: 'Schedule',
    color: 'bg-blue-100 text-blue-700',
    borderColor: 'border-blue-200',
    icon: '📅',
    description: 'Pickup, dropoff, custody arrangements',
  },
  medical: {
    label: 'Medical',
    color: 'bg-red-100 text-red-700',
    borderColor: 'border-red-200',
    icon: '🏥',
    description: 'Doctor appointments, health issues, medications',
  },
  education: {
    label: 'Education',
    color: 'bg-purple-100 text-purple-700',
    borderColor: 'border-purple-200',
    icon: '📚',
    description: 'School, homework, grades, teachers',
  },
  finances: {
    label: 'Finances',
    color: 'bg-green-100 text-green-700',
    borderColor: 'border-green-200',
    icon: '💰',
    description: 'Child support, shared expenses, reimbursements',
  },
  activities: {
    label: 'Activities',
    color: 'bg-orange-100 text-orange-700',
    borderColor: 'border-orange-200',
    icon: '⚽',
    description: 'Sports, hobbies, extracurriculars',
  },
  travel: {
    label: 'Travel',
    color: 'bg-cyan-100 text-cyan-700',
    borderColor: 'border-cyan-200',
    icon: '✈️',
    description: 'Vacations, trips, travel arrangements',
  },
  safety: {
    label: 'Safety',
    color: 'bg-yellow-100 text-yellow-800',
    borderColor: 'border-yellow-200',
    icon: '🛡️',
    description: 'Emergency contacts, safety concerns',
  },
  logistics: {
    label: 'Logistics',
    color: 'bg-gray-100 text-gray-700',
    borderColor: 'border-gray-200',
    icon: '📦',
    description: 'General coordination, supplies, belongings',
  },
  'co-parenting': {
    label: 'Co-Parenting',
    color: 'bg-teal-100 text-teal-700',
    borderColor: 'border-teal-200',
    icon: '🤝',
    description: 'Relationship discussions, parenting decisions',
  },
};

/**
 * Display order for categories (most important first)
 */
export const CATEGORY_DISPLAY_ORDER = [
  'safety',
  'medical',
  'schedule',
  'education',
  'finances',
  'activities',
  'travel',
  'co-parenting',
  'logistics',
];

/**
 * Get category configuration with fallback to logistics
 * @param {string} category - The category key
 * @returns {object} Category configuration
 */
export function getCategoryConfig(category) {
  return THREAD_CATEGORIES[category] || THREAD_CATEGORIES.logistics;
}

/**
 * Get all category keys
 * @returns {string[]} Array of category keys
 */
export function getCategoryKeys() {
  return Object.keys(THREAD_CATEGORIES);
}

/**
 * Group threads by category
 * @param {Array} threads - Array of thread objects
 * @returns {object} Threads grouped by category { category: threads[] }
 */
export function groupThreadsByCategory(threads) {
  const grouped = {};

  // Initialize all categories with empty arrays
  CATEGORY_DISPLAY_ORDER.forEach(category => {
    grouped[category] = [];
  });

  // Group threads
  threads.forEach(thread => {
    const category = thread.category || 'logistics';
    if (grouped[category]) {
      grouped[category].push(thread);
    } else {
      grouped.logistics.push(thread);
    }
  });

  return grouped;
}

/**
 * Get categories with threads (non-empty)
 * @param {object} groupedThreads - Result from groupThreadsByCategory
 * @returns {Array} Array of { category, config, threads }
 */
export function getCategoriesWithThreads(groupedThreads) {
  return CATEGORY_DISPLAY_ORDER.filter(category => groupedThreads[category]?.length > 0).map(
    category => ({
      category,
      config: THREAD_CATEGORIES[category],
      threads: groupedThreads[category],
    })
  );
}
