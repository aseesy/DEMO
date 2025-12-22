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

// Hooks
export { useContacts, useContactsApi, useContactForm, useContactTriggers } from './useContacts.js';
export { useContactSuggestionModal } from './useContactSuggestionModal.js';

// Components
export { ContactsPanel } from './ContactsPanel.jsx';
export { ContactSuggestionModal } from './components/ContactSuggestionModal.jsx';
export { ContactForm } from './components/ContactForm.jsx';
export { ContactsList } from './components/ContactsList.jsx';

// Utilities
export {
  mapContactToFormData,
  mapFormDataToContact,
  getContactFormFields,
} from './contactMapper.js';
export { getDefaultContactFormData, DEFAULT_CONTACT_FORM_DATA } from './contactFormDefaults.js';
