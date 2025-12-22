/**
 * Contact Mapper - Translates between Contact API objects and Form Data
 *
 * Single Responsibility: Field mapping between contact domain objects and form state
 *
 * ACTOR: Infrastructure/Data Layer
 * REASON TO CHANGE: Database schema changes, API contract changes, form field additions
 *
 * This mapper eliminates the need to manually map 30+ fields in multiple places.
 * When a field is added to the database, update this mapper once.
 */

import { toDisplayRelationship } from '../../../utils/relationshipMapping.js';
import { DEFAULT_CONTACT_FORM_DATA } from './contactFormDefaults.js';

/**
 * Maps a contact object from the API to form data structure
 * Handles all field transformations (relationship display, defaults, etc.)
 *
 * @param {Object} contact - Contact object from API
 * @returns {Object} Form data object ready for form state
 */
export function mapContactToFormData(contact) {
  if (!contact) {
    return { ...DEFAULT_CONTACT_FORM_DATA };
  }

  // Start with defaults, then override with contact values
  const formData = { ...DEFAULT_CONTACT_FORM_DATA };

  // Map all fields with defaults
  // When adding a new field: add it here and to DEFAULT_CONTACT_FORM_DATA
  const fieldMappings = [
    'contact_name',
    'contact_email',
    'separation_details',
    'separation_date',
    'address',
    'difficult_aspects',
    'friction_situations',
    'legal_matters',
    'safety_concerns',
    'substance_mental_health',
    'additional_thoughts',
    'other_parent',
    'child_age',
    'child_birthdate',
    'school',
    'phone',
    'partner_duration',
    'has_children',
    'partner_living_together',
    'partner_living_together_since',
    'partner_relationship_notes',
    'custody_arrangement',
    'linked_contact_id',
    // Child health fields
    'child_health_physical_conditions',
    'child_health_allergies',
    'child_health_medications',
    'child_health_doctor',
    'child_health_mental_conditions',
    'child_health_mental_diagnosis',
    'child_health_mental_treatment',
    'child_health_therapist',
    'child_health_developmental_delays',
    'child_health_developmental_supports',
    // Co-parent financial and work fields
    'coparent_pays_child_support',
    'coparent_receives_child_support',
    'coparent_work_schedule',
    'coparent_work_flexibility',
  ];

  // Apply field mappings
  fieldMappings.forEach(field => {
    if (contact[field] !== undefined && contact[field] !== null) {
      formData[field] = contact[field];
    }
  });

  // Special handling for relationship (needs display transformation)
  if (contact.relationship) {
    formData.relationship = toDisplayRelationship(contact.relationship);
  }

  return formData;
}

/**
 * Maps form data to contact API object structure
 * Handles reverse transformations (display relationship -> backend relationship)
 *
 * @param {Object} formData - Form data object
 * @param {Function} toBackendRelationship - Function to convert display relationship to backend format
 * @returns {Object} Contact object ready for API
 */
export function mapFormDataToContact(formData, toBackendRelationship) {
  if (!formData) {
    return {};
  }

  const contact = { ...formData };

  // Transform relationship if needed
  if (formData.relationship && toBackendRelationship) {
    contact.relationship = toBackendRelationship(formData.relationship);
  }

  // Remove any undefined/null values to keep payload clean
  Object.keys(contact).forEach(key => {
    if (contact[key] === undefined || contact[key] === null) {
      delete contact[key];
    }
  });

  return contact;
}

/**
 * Gets the list of all contact form fields
 * Useful for validation, iteration, or documentation
 *
 * @returns {Array<string>} Array of field names
 */
export function getContactFormFields() {
  return Object.keys(DEFAULT_CONTACT_FORM_DATA);
}
