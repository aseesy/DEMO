/**
 * Contacts Feature
 *
 * Package-by-feature: Everything related to Contacts lives here.
 * Delete this folder to remove the Contacts feature entirely.
 *
 * Public API:
 * - useContacts: Composition hook for backward compatibility
 * - useContactsApi: Data operations hook
 * - useContactForm: Form state hook
 * - useContactTriggers: External event handling hook
 * - ContactsPanel: Main Contacts UI component
 * - ContactSuggestionModal: Modal for AI-suggested contacts
 */

// Page (The View)
export { ContactsPanel } from './ContactsPanel.jsx';

// Model (The Logic)
export {
  useContacts,
  useContactsApi,
  useContactForm,
  useContactTriggers,
} from './model/useContacts.js';
export { useContactSuggestionModal } from './model/useContactSuggestionModal.js';
export {
  mapContactToFormData,
  mapFormDataToContact,
  getContactFormFields,
} from './model/contactMapper.js';
export {
  getDefaultContactFormData,
  DEFAULT_CONTACT_FORM_DATA,
} from './model/contactFormDefaults.js';
export {
  disambiguateContacts,
  filterContactsBySearch,
  getContactsByRelationship,
  getCoParentContacts,
  getChildContacts,
} from './model/contactHelpers.js';

// Components (The UI Details)
export { ContactSuggestionModal } from './components/ContactSuggestionModal.jsx';
export { ContactForm } from './components/ContactForm.jsx';
export { ContactsList } from './components/ContactsList.jsx';
