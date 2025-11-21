import React from 'react';
import { useContacts } from '../hooks/useContacts.js';
import { useGooglePlaces } from '../hooks/useGooglePlaces.js';
import { useActivities } from '../hooks/useActivities.js';
import { ActivityCard } from './ActivityCard.jsx';
import { AddActivityModal } from './modals/AddActivityModal.jsx';

export function ContactsPanel({ username }) {
  // Address autocomplete ref
  const addressInputRef = React.useRef(null);
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

  // Google Places autocomplete for address field
  const handlePlaceSelected = React.useCallback((addressComponents) => {
    setContactFormData({
      ...contactFormData,
      address: addressComponents.fullAddress,
    });
  }, [contactFormData, setContactFormData]);

  useGooglePlaces(addressInputRef, handlePlaceSelected);

  // AI profile assistant state
  const [isGeneratingProfile, setIsGeneratingProfile] = React.useState(false);
  const [profileSuggestions, setProfileSuggestions] = React.useState(null);
  const [showAiAssistant, setShowAiAssistant] = React.useState(false);

  // Activities modal state
  const [showActivityModal, setShowActivityModal] = React.useState(false);
  const [editingActivity, setEditingActivity] = React.useState(null);

  // Activities hook - only load when editing a "My Child" contact
  const {
    activities,
    isLoading: isLoadingActivities,
    isSaving: isSavingActivity,
    error: activitiesError,
    createActivity,
    updateActivity,
    deleteActivity
  } = useActivities(
    editingContact?.relationship === 'My Child' ? editingContact.id : null,
    username
  );

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
    setShowAiAssistant(false);
    setProfileSuggestions(null);
  };

  // Generate AI profile suggestions
  const generateProfileSuggestions = React.useCallback(async () => {
    if (!contactFormData.contact_name.trim() || !contactFormData.relationship) {
      alert('Please enter a name and select a relationship first');
      return;
    }

    setIsGeneratingProfile(true);
    try {
      const response = await fetch('/api/contacts/generate-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactData: {
            contact_name: contactFormData.contact_name,
            relationship: contactFormData.relationship
          },
          username: username
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate profile suggestions');
      }

      const data = await response.json();
      setProfileSuggestions(data);
      setShowAiAssistant(true);
    } catch (err) {
      console.error('Error generating profile suggestions:', err);
      alert('Failed to generate AI suggestions. Please try again.');
    } finally {
      setIsGeneratingProfile(false);
    }
  }, [contactFormData, username]);

  // Apply AI suggestion to a field
  const applySuggestion = React.useCallback((fieldName, value) => {
    setContactFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  }, [setContactFormData]);

  return (
    <div className="bg-gradient-to-br from-[#E6F7F5] to-white rounded-2xl border-2 border-[#C5E8E4] overflow-hidden flex flex-col h-full">
      <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 flex-shrink-0">
        <button
          onClick={startNewContact}
          className="px-3 py-2 sm:py-1.5 bg-[#4DA8B0] text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-[#1f4447] transition-all shadow-sm hover:shadow-md flex items-center gap-1.5 min-h-[36px] sm:min-h-[40px] touch-manipulation"
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
            className="w-full pl-10 sm:pl-11 pr-3 py-2.5 sm:py-1.5 border-2 border-[#C5E8E4] rounded-lg focus:outline-none focus:border-[#4DA8B0] transition-colors bg-white text-[#4DA8B0] placeholder-gray-400 text-sm min-h-[40px] sm:min-h-[44px]"
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
          <div className="text-center py-6 text-sm text-[#4DA8B0]">
            <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-[#C5E8E4] border-t-[#4DA8B0] mb-2" />
            <p>Loading…</p>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="text-center py-6 text-xs sm:text-sm text-[#4DA8B0] px-2">
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
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#4DA8B0] text-white flex items-center justify-center font-semibold text-sm sm:text-base flex-shrink-0">
                  {(contact.contact_name || '?').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm sm:text-base text-[#4DA8B0] truncate">
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4 pb-24 md:pb-4 overflow-y-auto">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-full flex flex-col border-2 border-[#C5E8E4] my-auto">
            <div className="border-b-2 border-[#C5E8E4] px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between flex-shrink-0">
              <h3 className="text-base sm:text-lg font-bold text-[#4DA8B0]">
                {editingContact ? 'Edit' : 'Add'}
              </h3>
              <button
                onClick={() => {
                  setShowContactForm(false);
                  resetForm();
                }}
                className="text-2xl leading-none text-[#4DA8B0] hover:text-[#4DA8B0] transition-colors p-1 touch-manipulation min-w-[36px] min-h-[36px] flex items-center justify-center"
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
                  <label className="block text-xs sm:text-sm font-semibold text-[#4DA8B0] mb-1.5">
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
                  <label className="block text-xs sm:text-sm font-semibold text-[#4DA8B0] mb-1.5">
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

                {/* AI Profile Assistant Button */}
                {contactFormData.contact_name.trim() && contactFormData.relationship && !editingContact && (
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-3 sm:p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-purple-900 mb-1">
                          AI Profile Assistant
                        </h4>
                        <p className="text-xs text-purple-700 mb-3">
                          Get intelligent suggestions for important fields based on the relationship type
                        </p>
                        <button
                          type="button"
                          onClick={generateProfileSuggestions}
                          disabled={isGeneratingProfile}
                          className="w-full px-3 py-2.5 bg-purple-600 text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md flex items-center justify-center gap-2 min-h-[44px] touch-manipulation"
                        >
                          {isGeneratingProfile ? (
                            <>
                              <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                              Generating suggestions...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              Get AI Suggestions
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* AI Suggestions Display */}
                {showAiAssistant && profileSuggestions && (
                  <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-indigo-900">
                        AI Suggestions
                      </h4>
                      <button
                        type="button"
                        onClick={() => setShowAiAssistant(false)}
                        className="text-indigo-600 hover:text-indigo-800 text-xs"
                      >
                        Hide
                      </button>
                    </div>

                    {profileSuggestions.profileCompletionTips && (
                      <p className="text-xs text-indigo-700 mb-3 p-2 bg-indigo-100 rounded-lg">
                        💡 {profileSuggestions.profileCompletionTips}
                      </p>
                    )}

                    {profileSuggestions.helpfulQuestions && profileSuggestions.helpfulQuestions.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-semibold text-indigo-900 mb-1.5">Helpful questions to consider:</p>
                        <ul className="space-y-1">
                          {profileSuggestions.helpfulQuestions.slice(0, 3).map((q, i) => (
                            <li key={i} className="text-xs text-indigo-700 pl-4 relative before:content-['•'] before:absolute before:left-0">
                              {q}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {profileSuggestions.suggestedFields && profileSuggestions.suggestedFields.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-indigo-900">Quick suggestions:</p>
                        {profileSuggestions.suggestedFields.filter(f => f.importance === 'required' || f.importance === 'recommended').slice(0, 3).map((field, i) => (
                          <div key={i} className="bg-white rounded-lg p-2 border border-indigo-200">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-900">{field.label}</p>
                                <p className="text-xs text-gray-600 mt-0.5">{field.suggestion}</p>
                              </div>
                              {field.suggestion && field.fieldName && (
                                <button
                                  type="button"
                                  onClick={() => applySuggestion(field.fieldName, field.suggestion)}
                                  className="flex-shrink-0 px-2 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700"
                                >
                                  Apply
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-[#4DA8B0] mb-1.5">
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
                        <label className="block text-xs font-semibold text-[#4DA8B0] mb-1">
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
                        <label className="block text-xs font-semibold text-[#4DA8B0] mb-1">
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
                      <label className="block text-xs font-semibold text-[#4DA8B0] mb-1">
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
                      <label className="block text-xs font-semibold text-[#4DA8B0] mb-1">
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
                        <label className="block text-xs font-semibold text-[#4DA8B0] mb-1">
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
                        <label className="block text-xs font-semibold text-[#4DA8B0] mb-1">
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

                    {/* Activities Schedule Section - Only for "My Child" */}
                    {contactFormData.relationship === 'My Child' && editingContact && (
                      <div className="bg-[#E6F7F5] rounded-lg p-3 space-y-3 mt-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-[#4DA8B0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <h4 className="font-semibold text-[#4DA8B0] text-sm">Activities & Schedule</h4>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setEditingActivity(null);
                              setShowActivityModal(true);
                            }}
                            className="px-2 py-1 bg-[#4DA8B0] text-white rounded text-xs font-semibold hover:bg-[#1f4447] transition-colors min-h-[32px] touch-manipulation"
                          >
                            + Add Activity
                          </button>
                        </div>

                        {activitiesError && (
                          <div className="bg-red-50 border border-red-200 text-red-700 px-2 py-1 rounded text-xs">
                            {activitiesError}
                          </div>
                        )}

                        {isLoadingActivities ? (
                          <div className="text-center py-3">
                            <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-[#E6F7F5] border-t-[#4DA8B0]" />
                            <p className="text-xs text-gray-500 mt-1">Loading activities...</p>
                          </div>
                        ) : activities && activities.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-3">No activities yet. Click "+ Add Activity" to create one.</p>
                        ) : (
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {activities && activities.map((activity) => (
                              <ActivityCard
                                key={activity.id}
                                activity={activity}
                                onEdit={(activity) => {
                                  setEditingActivity(activity);
                                  setShowActivityModal(true);
                                }}
                                onDelete={async (activityId) => {
                                  try {
                                    await deleteActivity(activityId);
                                  } catch (err) {
                                    console.error('Failed to delete activity:', err);
                                  }
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                {contactFormData.relationship === 'My Partner' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-[#4DA8B0] mb-1">
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
                      <label className="block text-xs font-semibold text-[#4DA8B0] mb-1">
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
                      <label className="block text-xs font-semibold text-[#4DA8B0] mb-1">
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
                      <label className="block text-xs font-semibold text-[#4DA8B0] mb-1">
                        Address
                      </label>
                      <input
                        ref={addressInputRef}
                        type="text"
                        value={contactFormData.address || ''}
                        onChange={(e) =>
                          setContactFormData({ ...contactFormData, address: e.target.value })
                        }
                        className="w-full px-3 py-2 border-2 border-[#C5E8E4] rounded-lg focus:outline-none focus:border-[#4DA8B0] text-sm"
                        placeholder="Start typing address..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#4DA8B0] mb-1">
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
                      <label className="block text-xs font-semibold text-[#4DA8B0] mb-1">
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
                      <label className="block text-xs font-semibold text-[#4DA8B0] mb-1">
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
                      <label className="block text-xs font-semibold text-[#4DA8B0] mb-1">
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
                      <label className="block text-xs font-semibold text-[#4DA8B0] mb-1">
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
                      <label className="block text-xs font-semibold text-[#4DA8B0] mb-1">
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
                    <label className="block text-xs font-semibold text-[#4DA8B0] mb-1">
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
                  <label className="block text-xs font-semibold text-[#4DA8B0] mb-1">
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
              <div className="px-3 sm:px-4 py-3 pb-4 border-t-2 border-[#C5E8E4] flex gap-2 flex-wrap sm:flex-nowrap flex-shrink-0 bg-white">
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
                  className="flex-1 bg-[#4DA8B0] text-white py-2.5 sm:py-2 rounded-lg font-semibold text-sm hover:bg-[#1f4447] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-sm min-h-[44px] touch-manipulation"
                >
                  {isSavingContact ? 'Saving…' : editingContact ? 'Update' : 'Add'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowContactForm(false);
                    resetForm();
                  }}
                  className="px-3 py-2.5 sm:py-2 rounded-lg border-2 border-[#C5E8E4] text-xs sm:text-sm font-medium text-[#4DA8B0] hover:bg-[#E6F7F5] transition-colors min-h-[44px] touch-manipulation"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Activity Modal */}
      <AddActivityModal
        isOpen={showActivityModal}
        onClose={() => {
          setShowActivityModal(false);
          setEditingActivity(null);
        }}
        onSave={async (formData) => {
          try {
            if (editingActivity) {
              await updateActivity(editingActivity.id, formData);
            } else {
              await createActivity(formData);
            }
            setShowActivityModal(false);
            setEditingActivity(null);
          } catch (err) {
            console.error('Failed to save activity:', err);
            // Error is already displayed by the hook
          }
        }}
        activity={editingActivity}
        isSaving={isSavingActivity}
      />
    </div>
  );
}


