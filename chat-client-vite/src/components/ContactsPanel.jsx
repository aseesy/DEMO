import React from 'react';
import { useContacts } from '../hooks/useContacts.js';

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

  const filteredContacts = React.useMemo(() => {
    const q = contactSearch.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) =>
      `${c.contact_name || ''} ${c.relationship || ''} ${c.contact_email || ''}`
        .toLowerCase()
        .includes(q),
    );
  }, [contacts, contactSearch]);

  const startNewContact = () => {
    resetForm();
    setShowContactForm(true);
  };

  return (
    <div className="bg-white rounded-2xl p-0 border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
        <h2 className="text-2xl font-bold text-gray-900">Contacts</h2>
        <button
          onClick={startNewContact}
          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          title="Add Contact"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      <div className="px-6 py-4 flex-shrink-0">
        <div className="relative">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={contactSearch}
            onChange={(e) => setContactSearch(e.target.value)}
            placeholder="Search contacts"
            className="w-full pl-12 pr-4 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue transition-colors bg-white text-gray-900 placeholder-gray-400"
          />
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-2 mb-2 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-2">
        {isLoadingContacts ? (
          <div className="text-center py-8 text-sm text-gray-500">Loading contacts…</div>
        ) : filteredContacts.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-500">
            No contacts yet. Add your co-parent and other key people in your child&apos;s life.
          </div>
        ) : (
          filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-teal hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-teal text-white flex items-center justify-center font-semibold text-lg flex-shrink-0">
                  {(contact.contact_name || '?').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm sm:text-base text-gray-900 truncate">
                    {contact.contact_name || 'Unnamed contact'}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {contact.relationship || 'Relationship not set'}
                  </div>
                  {contact.contact_email && (
                    <div className="text-xs text-gray-400 truncate">{contact.contact_email}</div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => editContact(contact)}
                  className="px-2 py-1 text-xs border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteContact(contact.id)}
                  className="px-2 py-1 text-xs border border-red-200 rounded-lg text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showContactForm && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col border border-gray-200">
            <div className="border-b border-gray-100 px-6 py-5 flex items-center justify-between flex-shrink-0">
              <h3 className="text-xl font-bold text-gray-900">
                {editingContact ? 'Edit Contact' : 'Add Contact'}
              </h3>
              <button
                onClick={() => {
                  setShowContactForm(false);
                  resetForm();
                }}
                className="text-2xl font-bold text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveContact();
              }}
              className="flex-1 overflow-y-auto flex flex-col"
            >
              <div className="p-6 space-y-4 flex-1 overflow-y-auto">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    value={contactFormData.contact_name}
                    onChange={(e) =>
                      setContactFormData({ ...contactFormData, contact_name: e.target.value })
                    }
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-teal"
                    placeholder="Contact's name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Relationship *
                  </label>
                  <select
                    value={contactFormData.relationship}
                    onChange={(e) =>
                      setContactFormData({ ...contactFormData, relationship: e.target.value })
                    }
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue bg-white"
                    required
                  >
                    <option value="">Select relationship...</option>
                    <option value="My Co-Parent">My Co-Parent</option>
                    <option value="My Partner">My Partner</option>
                    <option value="My Partner's Child">My Partner's Child</option>
                    <option value="My Partner's Family">My Partner's Family</option>
                    <option value="My Partner's Co-Parent">My Partner's Co-Parent</option>
                    <option value="My Partner's Friend">My Partner's Friend</option>
                    <option value="My Child">My Child</option>
                    <option value="My Family">My Family</option>
                    <option value="My Friend">My Friend</option>
                    <option value="My Child's Friend">My Child's Friend</option>
                    <option value="My Child's Teacher">My Child's Teacher</option>
                    <option value="My Co-Parent's Partner">My Co-Parent's Partner</option>
                    <option value="My Co-Parent's Family">My Co-Parent's Family</option>
                    <option value="My Co-Parent's Friend">My Co-Parent's Friend</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={contactFormData.contact_email}
                    onChange={(e) =>
                      setContactFormData({
                        ...contactFormData,
                        contact_email: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-teal"
                    placeholder="contact@email.com"
                  />
                </div>
                {/* Additional notes textarea to keep it simpler for now */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={contactFormData.notes}
                    onChange={(e) =>
                      setContactFormData({ ...contactFormData, notes: e.target.value })
                    }
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-teal"
                    rows={3}
                    placeholder="Any extra details about this contact"
                  />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex gap-3 flex-shrink-0">
                <button
                  type="submit"
                  disabled={isSavingContact || !contactFormData.contact_name.trim() || !contactFormData.relationship}
                  className="flex-1 bg-[#4DA8B0] text-white py-2.5 rounded-xl font-semibold hover:bg-[#3d8a92] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  {isSavingContact ? 'Saving…' : editingContact ? 'Update Contact' : 'Add Contact'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowContactForm(false);
                    resetForm();
                  }}
                  className="px-4 py-2.5 rounded-xl border-2 border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


