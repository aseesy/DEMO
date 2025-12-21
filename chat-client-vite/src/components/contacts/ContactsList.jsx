import React from 'react';

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
 * @param {boolean} props.isLoading - Loading state
 * @param {string} props.error - Error message
 */
export function ContactsList({
  contacts,
  searchTerm,
  onSearchChange,
  onContactClick,
  isLoading,
  error,
}) {
  return (
    <>
      {/* Search Input */}
      <div className="px-3 sm:px-4 py-2 flex-shrink-0">
        <div className="relative">
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
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search..."
            className="w-full pl-10 sm:pl-11 pr-3 py-2.5 sm:py-1.5 border-2 border-teal-light rounded-lg focus:outline-none focus:border-teal-medium transition-colors bg-white text-teal-medium placeholder-gray-400 text-sm min-h-[40px] sm:min-h-[44px]"
          />
        </div>
      </div>

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
            <ContactCard key={contact.id} contact={contact} onClick={() => onContactClick(contact)} />
          ))
        )}
      </div>
    </>
  );
}

/**
 * ContactCard - Individual contact item in the list
 */
function ContactCard({ contact, onClick }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center p-2.5 sm:p-3 rounded-lg border-2 border-teal-light hover:border-teal-medium bg-white transition-colors cursor-pointer touch-manipulation active:scale-[0.98]"
    >
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
        <ContactAvatar name={contact.contact_name} />
        <ContactInfo contact={contact} />
      </div>
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
