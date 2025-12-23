/**
 * useContacts - Composition Hook
 *
 * Composes separate concern hooks into a single interface for backward compatibility.
 * New code should import individual hooks directly for better separation.
 *
 * Composed from:
 * - useContactsApi: Data operations (Infrastructure)
 * - useContactForm: Form state (Product/UX)
 * - useContactTriggers: External events (Integration)
 *
 * ACTOR: Backward compatibility layer
 * REASON TO CHANGE: Only when composed hooks change their interface
 */

import React from 'react';
import { useContactsApi } from './useContactsApi.js';
import { useContactForm } from './useContactForm.js';
import { useContactTriggers } from './useContactTriggers.js';

export function useContacts(username, isAuthenticated = true) {
  // Infrastructure: Data operations
  const api = useContactsApi(username, isAuthenticated);

  // Product/UX: Form state
  const form = useContactForm();

  // Integration: External triggers
  useContactTriggers({
    openNewContactForm: form.openNewContactForm,
    loadContacts: api.loadContacts,
    isAuthenticated,
  });

  // Composed save that closes form on success
  const saveContact = React.useCallback(async () => {
    const result = await api.saveContact(form.contactFormData, form.editingContact);
    if (result) {
      form.closeForm();
    }
    return result;
  }, [api, form]);

  // Composed delete
  const deleteContact = React.useCallback(
    async contactId => {
      return api.deleteContact(contactId);
    },
    [api]
  );

  // Backward-compatible editContact
  const editContact = React.useCallback(
    contact => {
      form.openEditContactForm(contact);
    },
    [form]
  );

  // Return unified interface for backward compatibility
  return {
    // From API hook
    contacts: api.contacts,
    isLoadingContacts: api.isLoadingContacts,
    isSavingContact: api.isSavingContact,
    error: api.error,

    // From Form hook
    showContactForm: form.showContactForm,
    contactSearch: form.contactSearch,
    editingContact: form.editingContact,
    contactFormData: form.contactFormData,
    setShowContactForm: form.setShowContactForm,
    setContactSearch: form.setContactSearch,
    setContactFormData: form.setContactFormData,
    resetForm: form.resetForm,

    // Composed operations
    saveContact,
    deleteContact,
    editContact,

    // Direct API operations
    inviteContactToChat: api.inviteContactToChat,
  };
}

// Also export individual hooks for new code
export { useContactsApi } from './useContactsApi.js';
export { useContactForm } from './useContactForm.js';
export { useContactTriggers } from './useContactTriggers.js';

export default useContacts;
