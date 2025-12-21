/**
 * Relationship value mapping utilities
 * Feature: 012-data-persistence-fix
 *
 * Handles conversion between frontend display values and backend storage values
 * to ensure consistent data storage and retrieval.
 */

/**
 * Mapping from frontend display values to backend storage values
 */
const DISPLAY_TO_STORAGE = {
  'My Co-Parent': 'co-parent',
  "My Co-Parent's Partner": 'coparent-partner',
  "My Co-Parent's Co-Parent": 'coparent-coparent',
  "My Co-Parent's Family": 'coparent-family',
  "My Co-Parent's Friend": 'coparent-friend',
  'My Child': 'my child',
  "My Child's Friend": 'child-friend',
  "My Child's Teacher": 'child-teacher',
  'My Partner': 'my partner',
  "My Partner's Child": 'partner-child',
  "My Partner's Co-Parent": 'partner-coparent',
  "My Partner's Family": 'partner-family',
  "My Partner's Friend": 'partner-friend',
  'My Family': 'my family',
  'My Friend': 'my friend',
  Other: 'other',
};

/**
 * Mapping from backend storage values to frontend display values
 */
const STORAGE_TO_DISPLAY = Object.fromEntries(
  Object.entries(DISPLAY_TO_STORAGE).map(([display, storage]) => [storage, display])
);

// Add common variations for backwards compatibility
const STORAGE_VARIATIONS = {
  'co-parent': 'My Co-Parent',
  coparent: 'My Co-Parent',
  'my co-parent': 'My Co-Parent',
  'my child': 'My Child',
  child: 'My Child',
  'my partner': 'My Partner',
  partner: 'My Partner',
  'my family': 'My Family',
  family: 'My Family',
  'my friend': 'My Friend',
  friend: 'My Friend',
  other: 'Other',
};

/**
 * Convert frontend display value to backend storage value
 * @param {string} displayValue - The display value from the UI
 * @returns {string} - The value to store in the database
 */
export function toBackendRelationship(displayValue) {
  if (!displayValue) return '';

  // Check direct mapping first
  if (DISPLAY_TO_STORAGE[displayValue]) {
    return DISPLAY_TO_STORAGE[displayValue];
  }

  // If not found, return lowercase version (for any custom values)
  return displayValue.toLowerCase();
}

/**
 * Convert backend storage value to frontend display value
 * @param {string} storedValue - The value from the database
 * @returns {string} - The display value for the UI
 */
export function toDisplayRelationship(storedValue) {
  if (!storedValue) return '';

  const lowerValue = storedValue.toLowerCase();

  // Check direct mapping first
  if (STORAGE_TO_DISPLAY[lowerValue]) {
    return STORAGE_TO_DISPLAY[lowerValue];
  }

  // Check variations
  if (STORAGE_VARIATIONS[lowerValue]) {
    return STORAGE_VARIATIONS[lowerValue];
  }

  // If not found, return original (might be custom value)
  return storedValue;
}

/**
 * Check if a relationship type indicates a child contact
 * @param {string} relationship - The relationship value (display or storage)
 * @returns {boolean}
 */
export function isChildRelationship(relationship) {
  if (!relationship) return false;

  const lower = relationship.toLowerCase();
  return (
    lower === 'my child' ||
    lower === 'child' ||
    (lower.includes('child') && !lower.includes('partner'))
  );
}

/**
 * Check if a relationship type indicates a co-parent contact
 * @param {string} relationship - The relationship value (display or storage)
 * @returns {boolean}
 */
export function isCoParentRelationship(relationship) {
  if (!relationship) return false;

  const lower = relationship.toLowerCase();
  return (
    lower === 'co-parent' ||
    lower === 'coparent' ||
    lower === 'my co-parent' ||
    (lower.includes('co-parent') && !lower.includes('partner'))
  );
}

/**
 * Check if a relationship type indicates a partner contact
 * @param {string} relationship - The relationship value (display or storage)
 * @returns {boolean}
 */
export function isPartnerRelationship(relationship) {
  if (!relationship) return false;

  const lower = relationship.toLowerCase();
  return (
    lower === 'my partner' ||
    lower === 'partner' ||
    (lower.includes('partner') && !lower.includes('co-parent'))
  );
}

/**
 * Get all relationship options for dropdowns
 * @returns {Array<{value: string, label: string}>}
 */
export function getRelationshipOptions() {
  return [
    // Co-parent relationships
    { value: 'My Co-Parent', label: 'My Co-Parent', category: 'co-parent' },
    { value: "My Co-Parent's Partner", label: "My Co-Parent's Partner", category: 'co-parent' },
    { value: "My Co-Parent's Co-Parent", label: "My Co-Parent's Co-Parent", category: 'co-parent' },
    { value: "My Co-Parent's Family", label: "My Co-Parent's Family", category: 'co-parent' },
    { value: "My Co-Parent's Friend", label: "My Co-Parent's Friend", category: 'co-parent' },

    // Child relationships
    { value: 'My Child', label: 'My Child', category: 'child' },
    { value: "My Child's Friend", label: "My Child's Friend", category: 'child' },
    { value: "My Child's Teacher", label: "My Child's Teacher", category: 'child' },

    // Partner relationships
    { value: 'My Partner', label: 'My Partner', category: 'partner' },
    { value: "My Partner's Child", label: "My Partner's Child", category: 'partner' },
    { value: "My Partner's Co-Parent", label: "My Partner's Co-Parent", category: 'partner' },
    { value: "My Partner's Family", label: "My Partner's Family", category: 'partner' },
    { value: "My Partner's Friend", label: "My Partner's Friend", category: 'partner' },

    // Other relationships
    { value: 'My Family', label: 'My Family', category: 'other' },
    { value: 'My Friend', label: 'My Friend', category: 'other' },
    { value: 'Other', label: 'Other', category: 'other' },
  ];
}

export default {
  toBackendRelationship,
  toDisplayRelationship,
  isChildRelationship,
  isCoParentRelationship,
  isPartnerRelationship,
  getRelationshipOptions,
};
