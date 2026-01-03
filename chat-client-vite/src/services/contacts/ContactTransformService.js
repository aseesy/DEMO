/**
 * ContactTransformService - Application Layer
 *
 * Responsibility: Transform contact data between API format and display format.
 *
 * This service encapsulates business rules for:
 * - How contact relationships are displayed to users
 * - Data transformation between backend and frontend formats
 *
 * Why this exists:
 * - Separates business rules from UI hooks/components
 * - Reusable across multiple hooks/components
 * - Testable independently
 * - Single source of truth for transformation logic
 */

import { toDisplayRelationship } from '../../utils/relationshipMapping.js';
import { logContactTransform } from '../../utils/dataTransformDebug.js';

/**
 * Transform contacts from API format to display format
 *
 * Business Rule: Backend stores relationships in lowercase format (e.g., "co-parent"),
 * but UI displays them in title case (e.g., "My Co-Parent").
 *
 * @param {Array<Object>} contacts - Raw contacts from API
 * @returns {Array<Object>} Transformed contacts for display
 */
export function transformContactsForDisplay(contacts) {
  if (!contacts || !Array.isArray(contacts)) {
    return [];
  }

  return contacts.map(contact => {
    const transformed = {
      ...contact,
      relationship: contact.relationship
        ? toDisplayRelationship(contact.relationship)
        : contact.relationship,
    };

    // Debug logging for relationship transformations
    // Enable via VITE_DEBUG_DATA_TRANSFORM=true or in development
    if (contact.relationship) {
      logContactTransform(contact, transformed);
    }

    return transformed;
  });
}

/**
 * Transform contact from display format to API format
 *
 * Business Rule: UI uses display format, but backend expects storage format.
 *
 * @param {Object} contact - Contact in display format
 * @returns {Object} Contact in API format
 */
export function transformContactForApi(contact) {
  if (!contact) {
    return contact;
  }

  // If relationship needs transformation, it should be handled by the API layer
  // This function is here for completeness, but typically the form handles this
  return {
    ...contact,
    // Relationship transformation handled by form submission
  };
}
