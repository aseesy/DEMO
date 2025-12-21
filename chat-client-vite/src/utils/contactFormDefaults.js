/**
 * Contact Form Default Values
 *
 * Single source of truth for contact form initial state.
 * Used by useContacts hook for both initial state and reset.
 */

export const DEFAULT_CONTACT_FORM_DATA = {
  contact_name: '',
  contact_email: '',
  relationship: '',
  notes: '',
  separation_date: '',
  separation_details: '',
  address: '',
  difficult_aspects: '',
  friction_situations: '',
  legal_matters: '',
  safety_concerns: '',
  substance_mental_health: '',
  additional_thoughts: '',
  other_parent: '',
  child_age: '',
  child_birthdate: '',
  school: '',
  phone: '',
  partner_duration: '',
  has_children: '',
  custody_arrangement: '',
  linked_contact_id: '',
  // Child health fields
  child_health_physical_conditions: '',
  child_health_allergies: '',
  child_health_medications: '',
  child_health_doctor: '',
  child_health_mental_conditions: '',
  child_health_mental_diagnosis: '',
  child_health_mental_treatment: '',
  child_health_therapist: '',
  child_health_developmental_delays: '',
  child_health_developmental_supports: '',
  // Co-parent financial and work fields
  coparent_pays_child_support: '',
  coparent_receives_child_support: '',
  coparent_work_schedule: '',
  coparent_work_flexibility: '',
};

/**
 * Get a fresh copy of the default form data
 * @returns {Object} New object with default values
 */
export function getDefaultContactFormData() {
  return { ...DEFAULT_CONTACT_FORM_DATA };
}
