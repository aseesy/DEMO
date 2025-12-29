import React from 'react';
import { useContacts } from './model/useContacts.js';
import { Button } from '../../components/ui';
import { disambiguateContacts, filterContactsBySearch } from './model/contactHelpers.js';
import { ContactsList } from './components/ContactsList.jsx';
import { ContactForm } from './components/ContactForm.jsx';
import { ContactDetailView } from './components/ContactDetailView.jsx';

/**
 * ContactsPanel - Contacts management container
 *
 * Single responsibility: Orchestrate contacts list and form components
 * Delegates:
 * - List display to ContactsList
 * - Form handling to ContactForm
 *
 * @param {Object} props
 * @param {string} props.username - Current username (deprecated, use email)
 * @param {string} props.email - Current user email
 */
export function ContactsPanel({ username, email, setCurrentView }) {
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
    inviteContactToChat,
  } = useContacts(username);

  // State for readonly detail view
  const [viewingContact, setViewingContact] = React.useState(null);

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
    setViewingContact(contact);
  };

  const handleEditFromView = contact => {
    setViewingContact(null);
    editContact(contact);
  };

  const handleCloseView = () => {
    setViewingContact(null);
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

  const handleInviteToChat = React.useCallback(
    async contact => {
      if (!contact.id) {
        console.error('Contact missing ID');
        return;
      }

      try {
        const result = await inviteContactToChat(contact.id);
        // Navigate to chat view after successful room creation
        if (setCurrentView) {
          setCurrentView('chat');
        }
      } catch (err) {
        // Error is already set by inviteContactToChat
        console.error('Failed to invite contact to chat:', err);
      }
    },
    [inviteContactToChat, setCurrentView]
  );

  return (
    <div className="flex flex-col min-h-0">
      {/* Header with Add Button and Search */}
      <div className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 flex-shrink-0">
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
        {/* Search Input */}
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-teal-medium"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            value={contactSearch}
            onChange={e => setContactSearch(e.target.value)}
            placeholder="Search..."
            className="w-full pl-10 sm:pl-11 pr-3 py-2.5 sm:py-1.5 border-2 border-teal-light rounded-lg focus:outline-none focus:border-teal-medium transition-colors bg-white text-teal-medium placeholder-gray-400 text-sm min-h-[40px] sm:min-h-[44px]"
          />
        </div>
      </div>

      {/* Contacts List */}
      <ContactsList
        contacts={filteredContacts}
        searchTerm={contactSearch}
        onSearchChange={setContactSearch}
        onContactClick={handleContactClick}
        onInviteToChat={handleInviteToChat}
        isLoading={isLoadingContacts}
        error={error}
      />

      {/* Contact Detail View (Readonly) */}
      {viewingContact && (
        <ContactDetailView
          contact={viewingContact}
          onEdit={() => handleEditFromView(viewingContact)}
          onClose={handleCloseView}
          onDelete={contactId => {
            handleDeleteContact(contactId);
            setViewingContact(null);
          }}
          onInviteToChat={handleInviteToChat}
        />
      )}

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
        email={email}
        onInviteToChat={handleInviteToChat}
        setCurrentView={setCurrentView}
      />
    </div>
  );
}

export default ContactsPanel;
