/**
 * useContactForm - Contact Form State Management
 *
 * Handles form visibility and editing state only.
 * Field mapping is delegated to contactMapper utility.
 *
 * ACTOR: Product/UX
 * REASON TO CHANGE: UX flow changes, validation rules (NOT field additions)
 */

import React from 'react';
import { getDefaultContactFormData } from '../utils/contactFormDefaults.js';
import { mapContactToFormData } from '../utils/contactMapper.js';

export function useContactForm() {
  const [showContactForm, setShowContactForm] = React.useState(false);
  const [editingContact, setEditingContact] = React.useState(null);
  const [contactFormData, setContactFormData] = React.useState(getDefaultContactFormData());
  const [contactSearch, setContactSearch] = React.useState('');

  const resetForm = React.useCallback(() => {
    setEditingContact(null);
    setContactFormData(getDefaultContactFormData());
  }, []);

  const openNewContactForm = React.useCallback(
    (initialData = {}) => {
      resetForm();
      if (Object.keys(initialData).length > 0) {
        setContactFormData(prev => ({ ...prev, ...initialData }));
      }
      setShowContactForm(true);
    },
    [resetForm]
  );

  const openEditContactForm = React.useCallback(contact => {
    setEditingContact(contact);
    // Delegate mapping to contactMapper - single source of truth
    const formData = mapContactToFormData(contact);
    setContactFormData(formData);
    setShowContactForm(true);
  }, []);

  const closeForm = React.useCallback(() => {
    setShowContactForm(false);
    resetForm();
  }, [resetForm]);

  return {
    // State
    showContactForm,
    editingContact,
    contactFormData,
    contactSearch,

    // Setters
    setShowContactForm,
    setContactFormData,
    setContactSearch,

    // Actions
    resetForm,
    openNewContactForm,
    openEditContactForm,
    closeForm,
  };
}

export default useContactForm;
