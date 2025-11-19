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
    <div className="bg-gradient-to-br from-[#E6F7F5] to-white rounded-2xl border-2 border-[#C5E8E4] overflow-hidden flex flex-col h-full">
      <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 flex-shrink-0">
        <button
          onClick={startNewContact}
          className="px-3 py-2 sm:py-1.5 bg-[#275559] text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-[#1f4447] transition-all shadow-sm hover:shadow-md flex items-center gap-1.5 min-h-[36px] sm:min-h-[40px] touch-manipulation"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add
        </button>
      </div>

      <div className="px-3 sm:px-4 py-2 flex-shrink-0">
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#4DA8B0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={contactSearch}
            onChange={(e) => setContactSearch(e.target.value)}
            placeholder="Search..."
            className="w-full pl-10 sm:pl-11 pr-3 py-2.5 sm:py-1.5 border-2 border-[#C5E8E4] rounded-lg focus:outline-none focus:border-[#4DA8B0] transition-colors bg-white text-[#275559] placeholder-gray-400 text-sm min-h-[40px] sm:min-h-[44px]"
          />
        </div>
      </div>

      {error && (
        <div className="mx-4 mt-2 mb-2 bg-red-50 border-2 border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-3 sm:px-4 pb-3 space-y-2">
        {isLoadingContacts ? (
          <div className="text-center py-6 text-sm text-[#275559]">
            <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-[#C5E8E4] border-t-[#275559] mb-2" />
            <p>Loading…</p>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="text-center py-6 text-xs sm:text-sm text-[#275559] px-2">
            {contactSearch ? 'No matches found' : 'No entries yet. Add your co-parent and other key people.'}
          </div>
        ) : (
          filteredContacts.map((contact) => (
            <div
              key={contact.id}
              onClick={() => editContact(contact)}
              className="flex items-center p-2.5 sm:p-3 rounded-lg border-2 border-[#C5E8E4] hover:border-[#4DA8B0] bg-white transition-colors cursor-pointer touch-manipulation active:scale-[0.98]"
            >
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#275559] text-white flex items-center justify-center font-semibold text-sm sm:text-base flex-shrink-0">
                  {(contact.contact_name || '?').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm sm:text-base text-[#275559] truncate">
                    {contact.contact_name || 'Unnamed'}
                  </div>
                  <div className="text-xs sm:text-sm text-[#4DA8B0] truncate">
                    {contact.relationship || 'Relationship not set'}
                  </div>
                  {contact.contact_email && (
                    <div className="text-xs text-gray-500 truncate">{contact.contact_email}</div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showContactForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[calc(100vh-1rem)] sm:max-h-[90vh] flex flex-col border-2 border-[#C5E8E4] my-auto">
            <div className="border-b-2 border-[#C5E8E4] px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between flex-shrink-0">
              <h3 className="text-base sm:text-lg font-bold text-[#275559]">
                {editingContact ? 'Edit' : 'Add'}
              </h3>
              <button
                onClick={() => {
                  setShowContactForm(false);
                  resetForm();
                }}
                className="text-2xl leading-none text-[#275559] hover:text-[#4DA8B0] transition-colors p-1 touch-manipulation min-w-[36px] min-h-[36px] flex items-center justify-center"
                aria-label="Close"
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
              <div className="p-3 sm:p-4 space-y-3 flex-1 overflow-y-auto">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-[#275559] mb-1.5">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={contactFormData.contact_name}
                    onChange={(e) =>
                      setContactFormData({ ...contactFormData, contact_name: e.target.value })
                    }
                    className="w-full px-3 py-2.5 sm:py-2 border-2 border-[#C5E8E4] rounded-lg focus:outline-none focus:border-[#4DA8B0] text-sm min-h-[44px]"
                    placeholder="Name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-[#275559] mb-1.5">
                    Relationship *
                  </label>
                  <select
                    value={contactFormData.relationship}
                    onChange={(e) =>
                      setContactFormData({ ...contactFormData, relationship: e.target.value })
                    }
                    className="w-full px-3 py-2.5 sm:py-2 border-2 border-[#C5E8E4] rounded-lg focus:outline-none focus:border-[#4DA8B0] bg-white text-sm min-h-[44px]"
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
                  <label className="block text-xs sm:text-sm font-semibold text-[#275559] mb-1.5">
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
                    className="w-full px-3 py-2.5 sm:py-2 border-2 border-[#C5E8E4] rounded-lg focus:outline-none focus:border-[#4DA8B0] text-sm min-h-[44px]"
                    placeholder="email@example.com"
                  />
                </div>

                {/* Relationship-specific fields */}
                {(contactFormData.relationship === 'My Child' || contactFormData.relationship === "My Partner's Child") && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#275559] mb-1">
                          Age
                        </label>
                        <input
                          type="number"
                          value={contactFormData.child_age || ''}
                          onChange={(e) =>
                            setContactFormData({ ...contactFormData, child_age: e.target.value })
                          }
                          className="w-full px-3 py-2 border-2 border-[#C5E8E4] rounded-lg focus:outline-none focus:border-[#4DA8B0] text-sm"
                          placeholder="Age"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#275559] mb-1">
                          Birthdate
                        </label>
                        <input
                          type="date"
                          value={contactFormData.child_birthdate || ''}
                          onChange={(e) =>
                            setContactFormData({ ...contactFormData, child_birthdate: e.target.value })
                          }
                          className="w-full px-3 py-2 border-2 border-[#C5E8E4] rounded-lg focus:outline-none focus:border-[#4DA8B0] text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#275559] mb-1">
                        School
                      </label>
                      <input
                        type="text"
                        value={contactFormData.school || ''}
                        onChange={(e) =>
                          setContactFormData({ ...contactFormData, school: e.target.value })
                        }
                        className="w-full px-3 py-2 border-2 border-[#C5E8E4] rounded-lg focus:outline-none focus:border-[#4DA8B0] text-sm"
                        placeholder="School name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#275559] mb-1">
                        Custody Arrangement
                      </label>
                      <textarea
                        value={contactFormData.custody_arrangement || ''}
                        onChange={(e) =>
                          setContactFormData({ ...contactFormData, custody_arrangement: e.target.value })
                        }
                        className="w-full px-3 py-2 border-2 border-[#C5E8E4] rounded-lg focus:outline-none focus:border-[#4DA8B0] text-sm"
                        rows={2}
                        placeholder="Describe custody arrangement..."
                      />
                    </div>
                    {contactFormData.relationship === "My Partner's Child" && (
                      <div>
                        <label className="block text-xs font-semibold text-[#275559] mb-1">
                          Other Parent
                        </label>
                        <select
                          value={contactFormData.linked_contact_id || ''}
                          onChange={(e) =>
                            setContactFormData({ ...contactFormData, linked_contact_id: e.target.value })
                          }
                          className="w-full px-3 py-2 border-2 border-[#C5E8E4] rounded-lg focus:outline-none focus:border-[#4DA8B0] bg-white text-sm"
                        >
                          <option value="">Select other parent...</option>
                          {contacts
                            .filter((c) => c.relationship === "My Partner's Co-Parent")
                            .map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.contact_name}
                              </option>
                            ))}
                        </select>
                      </div>
                    )}
                    {contactFormData.relationship === 'My Child' && (
                      <div>
                        <label className="block text-xs font-semibold text-[#275559] mb-1">
                          Other Parent
                        </label>
                        <select
                          value={contactFormData.linked_contact_id || ''}
                          onChange={(e) =>
                            setContactFormData({ ...contactFormData, linked_contact_id: e.target.value })
                          }
                          className="w-full px-3 py-2 border-2 border-[#C5E8E4] rounded-lg focus:outline-none focus:border-[#4DA8B0] bg-white text-sm"
                        >
                          <option value="">Select other parent...</option>
                          {contacts
                            .filter((c) => c.relationship === "co-parent" || c.relationship === "My Co-Parent")
                            .map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.contact_name}
                              </option>
                            ))}
                          {contacts.filter((c) => c.relationship === "co-parent" || c.relationship === "My Co-Parent").length === 0 && (
                            <option disabled>Add a co-parent contact first</option>
                          )}
                        </select>
                      </div>
                    )}
                  </>
                )}

                {contactFormData.relationship === 'My Partner' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-[#275559] mb-1">
                        How long have you been together?
                      </label>
                      <input
                        type="text"
                        value={contactFormData.partner_duration || ''}
                        onChange={(e) =>
                          setContactFormData({ ...contactFormData, partner_duration: e.target.value })
                        }
                        className="w-full px-3 py-2 border-2 border-[#C5E8E4] rounded-lg focus:outline-none focus:border-[#4DA8B0] text-sm"
                        placeholder="e.g., 2 years, 6 months"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#275559] mb-1">
                        Does your partner have children?
                      </label>
                      <select
                        value={contactFormData.has_children || ''}
                        onChange={(e) =>
                          setContactFormData({ ...contactFormData, has_children: e.target.value })
                        }
                        className="w-full px-3 py-2 border-2 border-[#C5E8E4] rounded-lg focus:outline-none focus:border-[#4DA8B0] bg-white text-sm"
                      >
                        <option value="">Select...</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </div>
                  </>
                )}

                {(contactFormData.relationship === 'My Co-Parent' || contactFormData.relationship === "My Partner's Co-Parent") && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-[#275559] mb-1">
                        Separation Date
                      </label>
                      <input
                        type="date"
                        value={contactFormData.separation_date || ''}
                        onChange={(e) =>
                          setContactFormData({ ...contactFormData, separation_date: e.target.value })
                        }
                        className="w-full px-3 py-2 border-2 border-[#C5E8E4] rounded-lg focus:outline-none focus:border-[#4DA8B0] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#275559] mb-1">
                        Address
                      </label>
                      <input
                        type="text"
                        value={contactFormData.address || ''}
                        onChange={(e) =>
                          setContactFormData({ ...contactFormData, address: e.target.value })
                        }
                        className="w-full px-3 py-2 border-2 border-[#C5E8E4] rounded-lg focus:outline-none focus:border-[#4DA8B0] text-sm"
                        placeholder="Address"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#275559] mb-1">
                        What aspects of co-parenting are most difficult?
                      </label>
                      <textarea
                        value={contactFormData.difficult_aspects || ''}
                        onChange={(e) =>
                          setContactFormData({ ...contactFormData, difficult_aspects: e.target.value })
                        }
                        className="w-full px-3 py-2 border-2 border-[#C5E8E4] rounded-lg focus:outline-none focus:border-[#4DA8B0] text-sm"
                        rows={3}
                        placeholder="Describe challenges..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#275559] mb-1">
                        What situations create the most friction?
                      </label>
                      <textarea
                        value={contactFormData.friction_situations || ''}
                        onChange={(e) =>
                          setContactFormData({ ...contactFormData, friction_situations: e.target.value })
                        }
                        className="w-full px-3 py-2 border-2 border-[#C5E8E4] rounded-lg focus:outline-none focus:border-[#4DA8B0] text-sm"
                        rows={3}
                        placeholder="Describe friction points..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#275559] mb-1">
                        Any legal matters or custody concerns?
                      </label>
                      <textarea
                        value={contactFormData.legal_matters || ''}
                        onChange={(e) =>
                          setContactFormData({ ...contactFormData, legal_matters: e.target.value })
                        }
                        className="w-full px-3 py-2 border-2 border-[#C5E8E4] rounded-lg focus:outline-none focus:border-[#4DA8B0] text-sm"
                        rows={2}
                        placeholder="Legal matters..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#275559] mb-1">
                        Any safety concerns?
                      </label>
                      <textarea
                        value={contactFormData.safety_concerns || ''}
                        onChange={(e) =>
                          setContactFormData({ ...contactFormData, safety_concerns: e.target.value })
                        }
                        className="w-full px-3 py-2 border-2 border-[#C5E8E4] rounded-lg focus:outline-none focus:border-[#4DA8B0] text-sm"
                        rows={2}
                        placeholder="Safety concerns..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#275559] mb-1">
                        Any substance abuse or mental health concerns?
                      </label>
                      <textarea
                        value={contactFormData.substance_mental_health || ''}
                        onChange={(e) =>
                          setContactFormData({ ...contactFormData, substance_mental_health: e.target.value })
                        }
                        className="w-full px-3 py-2 border-2 border-[#C5E8E4] rounded-lg focus:outline-none focus:border-[#4DA8B0] text-sm"
                        rows={2}
                        placeholder="Concerns..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#275559] mb-1">
                        Any neglect or abuse concerns?
                      </label>
                      <textarea
                        value={contactFormData.neglect_abuse_concerns || ''}
                        onChange={(e) =>
                          setContactFormData({ ...contactFormData, neglect_abuse_concerns: e.target.value })
                        }
                        className="w-full px-3 py-2 border-2 border-[#C5E8E4] rounded-lg focus:outline-none focus:border-[#4DA8B0] text-sm"
                        rows={2}
                        placeholder="Concerns..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#275559] mb-1">
                        Additional thoughts or context
                      </label>
                      <textarea
                        value={contactFormData.additional_thoughts || ''}
                        onChange={(e) =>
                          setContactFormData({ ...contactFormData, additional_thoughts: e.target.value })
                        }
                        className="w-full px-3 py-2 border-2 border-[#C5E8E4] rounded-lg focus:outline-none focus:border-[#4DA8B0] text-sm"
                        rows={3}
                        placeholder="Anything else that would help..."
                      />
                    </div>
                  </>
                )}

                {(contactFormData.relationship === "My Child's Teacher" || contactFormData.relationship === 'Other') && (
                  <div>
                    <label className="block text-xs font-semibold text-[#275559] mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={contactFormData.phone || ''}
                      onChange={(e) =>
                        setContactFormData({ ...contactFormData, phone: e.target.value })
                      }
                      className="w-full px-3 py-2 border-2 border-[#C5E8E4] rounded-lg focus:outline-none focus:border-[#4DA8B0] text-sm"
                      placeholder="Phone number"
                    />
                  </div>
                )}

                {/* Additional notes textarea */}
                <div>
                  <label className="block text-xs font-semibold text-[#275559] mb-1">
                    Notes
                  </label>
                  <textarea
                    value={contactFormData.notes}
                    onChange={(e) =>
                      setContactFormData({ ...contactFormData, notes: e.target.value })
                    }
                    className="w-full px-3 py-2 border-2 border-[#C5E8E4] rounded-lg focus:outline-none focus:border-[#4DA8B0] text-sm"
                    rows={3}
                    placeholder="Any extra details"
                  />
                </div>
              </div>
              <div className="px-3 sm:px-4 py-3 border-t-2 border-[#C5E8E4] flex gap-2 flex-wrap sm:flex-nowrap flex-shrink-0">
                {editingContact && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this contact?')) {
                        deleteContact(editingContact.id);
                        setShowContactForm(false);
                        resetForm();
                      }
                    }}
                    className="px-3 py-2.5 sm:py-2 rounded-lg border-2 border-red-200 text-xs sm:text-sm font-medium text-red-600 hover:bg-red-50 transition-colors min-h-[44px] touch-manipulation"
                  >
                    Delete
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSavingContact || !contactFormData.contact_name.trim() || !contactFormData.relationship}
                  className="flex-1 bg-[#275559] text-white py-2.5 sm:py-2 rounded-lg font-semibold text-sm hover:bg-[#1f4447] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-sm min-h-[44px] touch-manipulation"
                >
                  {isSavingContact ? 'Saving…' : editingContact ? 'Update' : 'Add'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowContactForm(false);
                    resetForm();
                  }}
                  className="px-3 py-2.5 sm:py-2 rounded-lg border-2 border-[#C5E8E4] text-xs sm:text-sm font-medium text-[#275559] hover:bg-[#E6F7F5] transition-colors min-h-[44px] touch-manipulation"
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


