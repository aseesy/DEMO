import React from 'react';
import { useContacts } from './useContacts.js';
import { Button } from '../../components/ui';
import { disambiguateContacts, filterContactsBySearch } from './contactHelpers.js';
import { ContactsList } from './components/ContactsList.jsx';
import { ContactForm } from './components/ContactForm.jsx';

/**
 * ContactsPanel - Contacts management container
 *
 * Single responsibility: Orchestrate contacts list and form components
 * Delegates:
 * - List display to ContactsList
 * - Form handling to ContactForm
 *
 * @param {Object} props
 * @param {string} props.username - Current username
 */
export function ContactsPanel({ username }) {
  const {
    contacts,
    isLoadingContacts,
    showContactForm,
    contactSearch,
    editingContact,
    contactFormData,
    isSavingContact,
    error,
    setShowContactForm,
    setContactSearch,
    setContactFormData,
    saveContact,
    deleteContact,
    editContact,
    resetForm,
  } = useContacts(username);

  // Apply disambiguation to contacts, then filter using utility functions
  const filteredContacts = React.useMemo(() => {
    const disambiguated = disambiguateContacts(contacts);
    return filterContactsBySearch(disambiguated, contactSearch);
  }, [contacts, contactSearch]);

  const startNewContact = () => {
    resetForm();
    setShowContactForm(true);
  };

  const handleContactClick = contact => {
    editContact(contact);
  };

  const handleCloseForm = () => {
    setShowContactForm(false);
    resetForm();
  };

  const handleSaveContact = () => {
    saveContact();
  };

  const handleDeleteContact = contactId => {
    deleteContact(contactId);
    setShowContactForm(false);
    resetForm();
  };

  return (
    <div className="flex flex-col min-h-0">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 flex-shrink-0">
        <Button
          onClick={startNewContact}
          variant="secondary"
          size="small"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          }
        >
          Add
        </Button>
      </div>

      {/* Contacts List */}
      <ContactsList
        contacts={filteredContacts}
        searchTerm={contactSearch}
        onSearchChange={setContactSearch}
        onContactClick={handleContactClick}
        isLoading={isLoadingContacts}
        error={error}
      />

      {/* Contact Form Modal */}
      <ContactForm
        isOpen={showContactForm}
        contact={editingContact}
        formData={contactFormData}
        setFormData={setContactFormData}
        contacts={contacts}
        isSaving={isSavingContact}
        onSave={handleSaveContact}
        onDelete={handleDeleteContact}
        onClose={handleCloseForm}
        username={username}
      />
    </div>
  );
}

export default ContactsPanel;
