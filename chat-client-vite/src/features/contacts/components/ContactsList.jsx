import React from 'react';
import { isPartnerRelationship } from '../../../utils/relationshipMapping.js';

/**
 * ContactsList - Displays a searchable list of contacts
 *
 * Single responsibility: Render the contacts list with search functionality
 *
 * @param {Object} props
 * @param {Array} props.contacts - Filtered and disambiguated contacts
 * @param {string} props.searchTerm - Current search term
 * @param {Function} props.onSearchChange - Search term change handler
 * @param {Function} props.onContactClick - Contact selection handler
 * @param {Function} props.onInviteToChat - Handler for inviting contact to chat
 * @param {boolean} props.isLoading - Loading state
 * @param {string} props.error - Error message
 */
export function ContactsList({
  contacts,
  searchTerm,
  onSearchChange,
  onContactClick,
  onInviteToChat,
  isLoading,
  error,
}) {
  return (
    <>
      {/* Error Message */}
      {error && (
        <div className="mx-4 mt-2 mb-2 bg-red-50 border-2 border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs">
          {error}
        </div>
      )}

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 pb-3 space-y-2">
        {isLoading ? (
          <LoadingState />
        ) : contacts.length === 0 ? (
          <EmptyState hasSearch={!!searchTerm} />
        ) : (
          contacts.map(contact => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onClick={() => onContactClick(contact)}
              onInviteToChat={onInviteToChat ? () => onInviteToChat(contact) : null}
            />
          ))
        )}
      </div>
    </>
  );
}

/**
 * ContactCard - Individual contact item in the list
 */
function ContactCard({ contact, onClick, onInviteToChat }) {
  const isPartner = isPartnerRelationship(contact.relationship);
  const hasLinkedUser = !!contact.linked_user_id;
  const showInviteButton = isPartner && hasLinkedUser && onInviteToChat;

  const handleInviteClick = e => {
    e.stopPropagation(); // Prevent card click
    onInviteToChat(contact);
  };

  return (
    <div
      onClick={onClick}
      className="flex items-center p-2.5 sm:p-3 rounded-lg border-2 border-teal-light hover:border-teal-medium bg-white transition-colors cursor-pointer touch-manipulation active:scale-[0.98]"
    >
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
        <ContactAvatar name={contact.contact_name} />
        <ContactInfo contact={contact} />
      </div>
      {showInviteButton && (
        <button
          onClick={handleInviteClick}
          className="ml-2 px-3 py-1.5 bg-teal-medium text-white text-xs font-semibold rounded-lg hover:bg-teal-dark transition-colors flex items-center gap-1.5 flex-shrink-0 touch-manipulation"
          title="Invite to chat on LiaiZen"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          Chat
        </button>
      )}
    </div>
  );
}

/**
 * ContactAvatar - Circular avatar with initial
 */
function ContactAvatar({ name }) {
  return (
    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-teal-medium text-white flex items-center justify-center font-semibold text-sm sm:text-base flex-shrink-0">
      {(name || '?').charAt(0).toUpperCase()}
    </div>
  );
}

/**
 * ContactInfo - Contact name, relationship, and email
 */
function ContactInfo({ contact }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="font-semibold text-sm sm:text-base text-teal-medium truncate">
        {contact.displayName || contact.contact_name || 'Unnamed'}
      </div>
      <div className="text-xs sm:text-sm text-teal-medium truncate">
        {contact.relationship || 'Relationship not set'}
      </div>
      {/* Show email only if not already shown in displayName */}
      {contact.contact_email && !contact.displayName?.includes('(') && (
        <div className="text-xs text-gray-500 truncate">{contact.contact_email}</div>
      )}
    </div>
  );
}

/**
 * LoadingState - Spinner while contacts load
 */
function LoadingState() {
  return (
    <div className="text-center py-6 text-sm text-teal-medium">
      <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-teal-light border-t-[#4DA8B0] mb-2" />
      <p>Loading…</p>
    </div>
  );
}

/**
 * EmptyState - Message when no contacts found
 */
function EmptyState({ hasSearch }) {
  return (
    <div className="text-center py-6 text-xs sm:text-sm text-teal-medium px-2">
      {hasSearch ? 'No matches found' : 'No entries yet. Add your co-parent and other key people.'}
    </div>
  );
}

export default ContactsList;
