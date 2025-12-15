import React from 'react';
import { useContacts } from '../hooks/useContacts.js';
import { useGooglePlaces } from '../hooks/useGooglePlaces.js';
import { useGooglePlacesSchool } from '../hooks/useGooglePlacesSchool.js';
import { useActivities } from '../hooks/useActivities.js';
import { ActivityCard } from './ActivityCard.jsx';
import { AddActivityModal } from './modals/AddActivityModal.jsx';
import { Button } from './ui';

/**
 * Disambiguate contacts with the same name by adding email domain
 * @param {Array} contacts - Array of contact objects
 * @returns {Array} Contacts with disambiguated displayName property
 */
function disambiguateContacts(contacts) {
  if (!Array.isArray(contacts) || contacts.length === 0) {
    return contacts;
  }

  // Group contacts by name
  const nameGroups = contacts.reduce((acc, contact) => {
    const name = contact.contact_name || 'Unknown';
    if (!acc[name]) acc[name] = [];
    acc[name].push(contact);
    return acc;
  }, {});

  // Add disambiguation for duplicates
  return contacts.map(contact => {
    const name = contact.contact_name || 'Unknown';
    const group = nameGroups[name];

    if (group.length > 1 && contact.contact_email) {
      const domain = contact.contact_email.split('@')[1]?.split('.')[0];
      return {
        ...contact,
        displayName: domain ? `${name} (${domain})` : name
      };
    }

    return {
      ...contact,
      displayName: name
    };
  });
}

export function ContactsPanel({ username }) {
  // Address autocomplete ref
  const addressInputRef = React.useRef(null);
  // School autocomplete ref
  const schoolInputRef = React.useRef(null);
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

  // School autocomplete callback
  const handleSchoolSelected = React.useCallback((schoolInfo) => {
    setContactFormData({
      ...contactFormData,
      school: schoolInfo.name,
      school_address: schoolInfo.address,
      school_lat: schoolInfo.lat,
      school_lng: schoolInfo.lng,
    });
  }, [contactFormData, setContactFormData]);

  useGooglePlacesSchool(schoolInputRef, handleSchoolSelected);

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

  // Apply disambiguation to contacts, then filter
  const filteredContacts = React.useMemo(() => {
    const disambiguated = disambiguateContacts(contacts);
    const q = contactSearch.trim().toLowerCase();
    if (!q) return disambiguated;
    return disambiguated.filter((c) =>
      `${c.contact_name || ''} ${c.displayName || ''} ${c.relationship || ''} ${c.contact_email || ''}`
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
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: `Server error: ${response.status}` };
        }
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      
      // Validate response structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response from server');
      }
      
      setProfileSuggestions(data);
      setShowAiAssistant(true);
    } catch (err) {
      console.error('Error generating profile suggestions:', err);
      const errorMessage = err.message || 'Failed to generate AI suggestions. Please try again.';
      alert(errorMessage);
      // Still show the assistant with empty suggestions so user can continue
      setProfileSuggestions({
        suggestedFields: [],
        helpfulQuestions: [],
        linkedContactSuggestion: { shouldLink: false },
        profileCompletionTips: 'Fill out the profile with as much detail as you feel comfortable sharing.'
      });
      setShowAiAssistant(true);
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
    <div className="bg-gradient-to-br from-[#E6F7F5] to-white rounded-2xl border-2 border-teal-light overflow-hidden flex flex-col h-full">
      <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 flex-shrink-0">
        <Button
          onClick={startNewContact}
          variant="secondary"
          size="small"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          }
        >
          Add
        </Button>
      </div>

      <div className="px-3 sm:px-4 py-2 flex-shrink-0">
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-teal-medium" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={contactSearch}
            onChange={(e) => setContactSearch(e.target.value)}
            placeholder="Search..."
            className="w-full pl-10 sm:pl-11 pr-3 py-2.5 sm:py-1.5 border-2 border-teal-light rounded-lg focus:outline-none focus:border-teal-medium transition-colors bg-white text-teal-medium placeholder-gray-400 text-sm min-h-[40px] sm:min-h-[44px]"
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
          <div className="text-center py-6 text-sm text-teal-medium">
            <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-teal-light border-t-[#4DA8B0] mb-2" />
            <p>Loading…</p>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="text-center py-6 text-xs sm:text-sm text-teal-medium px-2">
            {contactSearch ? 'No matches found' : 'No entries yet. Add your co-parent and other key people.'}
          </div>
        ) : (
          filteredContacts.map((contact) => (
            <div
              key={contact.id}
              onClick={() => editContact(contact)}
              className="flex items-center p-2.5 sm:p-3 rounded-lg border-2 border-teal-light hover:border-teal-medium bg-white transition-colors cursor-pointer touch-manipulation active:scale-[0.98]"
            >
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-teal-medium text-white flex items-center justify-center font-semibold text-sm sm:text-base flex-shrink-0">
                  {(contact.contact_name || '?').charAt(0).toUpperCase()}
                </div>
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
              </div>
            </div>
          ))
        )}
      </div>

      {showContactForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4 pb-24 md:pb-4 overflow-y-auto">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-full flex flex-col border-2 border-teal-light my-auto">
            <div className="border-b-2 border-teal-light px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between flex-shrink-0">
              <h3 className="text-base sm:text-lg font-bold text-teal-medium">
                {editingContact ? 'Edit' : 'Add'}
              </h3>
              <Button
                onClick={() => {
                  setShowContactForm(false);
                  resetForm();
                }}
                variant="ghost"
                size="small"
                className="text-2xl leading-none p-1 min-w-[36px]"
                aria-label="Close"
              >
                ×
              </Button>
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
                  <label className="block text-xs sm:text-sm font-semibold text-teal-medium mb-1.5">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={contactFormData.contact_name}
                    onChange={(e) =>
                      setContactFormData({ ...contactFormData, contact_name: e.target.value })
                    }
                    className="w-full px-3 py-2.5 sm:py-2 border-2 border-teal-light rounded-lg focus:outline-none focus:border-teal-medium text-sm text-gray-900 min-h-[44px]"
                    placeholder="Name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-teal-medium mb-1.5">
                    Relationship *
                  </label>
                  <select
                    value={contactFormData.relationship}
                    onChange={(e) =>
                      setContactFormData({ ...contactFormData, relationship: e.target.value })
                    }
                    className="w-full px-3 py-2.5 sm:py-2 border-2 border-teal-light rounded-lg focus:outline-none focus:border-teal-medium bg-white text-sm text-gray-900 min-h-[44px]"
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
                        <Button
                          type="button"
                          onClick={generateProfileSuggestions}
                          disabled={isGeneratingProfile}
                          loading={isGeneratingProfile}
                          fullWidth
                          size="small"
                          className="bg-purple-600 hover:bg-purple-700"
                          icon={!isGeneratingProfile && (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          )}
                        >
                          Get AI Suggestions
                        </Button>
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
                      <Button
                        type="button"
                        onClick={() => setShowAiAssistant(false)}
                        variant="ghost"
                        size="small"
                        className="text-indigo-600 hover:text-indigo-800 text-xs"
                      >
                        Hide
                      </Button>
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
                                <Button
                                  type="button"
                                  onClick={() => applySuggestion(field.fieldName, field.suggestion)}
                                  size="small"
                                  className="flex-shrink-0 px-2 py-1 bg-indigo-600 text-white text-xs hover:bg-indigo-700"
                                >
                                  Apply
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-teal-medium mb-1.5">
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
                    className="w-full px-3 py-2.5 sm:py-2 border-2 border-teal-light rounded-lg focus:outline-none focus:border-teal-medium text-sm text-gray-900 min-h-[44px]"
                    placeholder="email@example.com"
                  />
                </div>

                {/* Relationship-specific fields */}
                {(contactFormData.relationship === 'My Child' || contactFormData.relationship === "My Partner's Child" || contactFormData.relationship === "My Co-Parent's Child") && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-teal-medium mb-1">
                        Birthdate
                      </label>
                      <input
                        type="date"
                        value={contactFormData.child_birthdate || ''}
                        onChange={(e) =>
                          setContactFormData({ ...contactFormData, child_birthdate: e.target.value })
                        }
                        className="w-full px-3 py-2 border-2 border-teal-light rounded-lg focus:outline-none focus:border-teal-medium text-sm text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-teal-medium mb-1">
                        School
                      </label>
                      <input
                        ref={schoolInputRef}
                        type="text"
                        value={contactFormData.school || ''}
                        onChange={(e) =>
                          setContactFormData({ ...contactFormData, school: e.target.value })
                        }
                        className="w-full px-3 py-2 border-2 border-teal-light rounded-lg focus:outline-none focus:border-teal-medium text-sm text-gray-900"
                        placeholder="Start typing school name..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-teal-medium mb-1">
                        Custody Arrangement
                      </label>
                      <textarea
                        value={contactFormData.custody_arrangement || ''}
                        onChange={(e) =>
                          setContactFormData({ ...contactFormData, custody_arrangement: e.target.value })
                        }
                        className="w-full px-3 py-2 border-2 border-teal-light rounded-lg focus:outline-none focus:border-teal-medium text-sm text-gray-900"
                        rows={2}
                        placeholder="Describe custody arrangement..."
                      />
                    </div>
                    {contactFormData.relationship === "My Partner's Child" && (
                      <div>
                        <label className="block text-xs font-semibold text-teal-medium mb-1">
                          Other Parent
                        </label>
                        <select
                          value={contactFormData.linked_contact_id || ''}
                          onChange={(e) =>
                            setContactFormData({ ...contactFormData, linked_contact_id: e.target.value })
                          }
                          className="w-full px-3 py-2 border-2 border-teal-light rounded-lg focus:outline-none focus:border-teal-medium bg-white text-sm text-gray-900"
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
                        <label className="block text-xs font-semibold text-teal-medium mb-1">
                          Other Parent
                        </label>
                        <select
                          value={contactFormData.linked_contact_id || ''}
                          onChange={(e) =>
                            setContactFormData({ ...contactFormData, linked_contact_id: e.target.value })
                          }
                          className="w-full px-3 py-2 border-2 border-teal-light rounded-lg focus:outline-none focus:border-teal-medium bg-white text-sm text-gray-900"
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
                      <div className="bg-teal-lightest rounded-lg p-3 space-y-3 mt-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-teal-medium" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <h4 className="font-semibold text-teal-medium text-sm">Activities & Schedule</h4>
                          </div>
                          <Button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setEditingActivity(null);
                              setShowActivityModal(true);
                            }}
                            variant="secondary"
                            size="small"
                            className="text-xs px-2 py-1"
                          >
                            + Add Activity
                          </Button>
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

                    {/* Child Health Section */}
                    <div className="bg-teal-lightest rounded-lg p-3 space-y-3 mt-3">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-teal-medium" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <h4 className="font-semibold text-teal-medium text-sm">Health Information</h4>
                      </div>

                      {/* Physical Health */}
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-teal-medium border-b border-teal-light pb-1">Physical Health</p>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Conditions</label>
                          <textarea
                            value={contactFormData.child_health_physical_conditions || ''}
                            onChange={(e) =>
                              setContactFormData({ ...contactFormData, child_health_physical_conditions: e.target.value })
                            }
                            className="w-full px-3 py-2 border-2 border-teal-light rounded-lg focus:outline-none focus:border-teal-medium text-sm text-gray-900"
                            rows={2}
                            placeholder="Any physical health conditions..."
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Allergies</label>
                          <textarea
                            value={contactFormData.child_health_allergies || ''}
                            onChange={(e) =>
                              setContactFormData({ ...contactFormData, child_health_allergies: e.target.value })
                            }
                            className="w-full px-3 py-2 border-2 border-teal-light rounded-lg focus:outline-none focus:border-teal-medium text-sm text-gray-900"
                            rows={2}
                            placeholder="Food, environmental, medication allergies..."
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Medications</label>
                          <textarea
                            value={contactFormData.child_health_medications || ''}
                            onChange={(e) =>
                              setContactFormData({ ...contactFormData, child_health_medications: e.target.value })
                            }
                            className="w-full px-3 py-2 border-2 border-teal-light rounded-lg focus:outline-none focus:border-teal-medium text-sm text-gray-900"
                            rows={2}
                            placeholder="Current medications and dosages..."
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Doctor/Pediatrician</label>
                          <input
                            type="text"
                            value={contactFormData.child_health_doctor || ''}
                            onChange={(e) =>
                              setContactFormData({ ...contactFormData, child_health_doctor: e.target.value })
                            }
                            className="w-full px-3 py-2 border-2 border-teal-light rounded-lg focus:outline-none focus:border-teal-medium text-sm text-gray-900"
                            placeholder="Primary care doctor name and contact..."
                          />
                        </div>
                      </div>

                      {/* Mental Health */}
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-teal-medium border-b border-teal-light pb-1">Mental Health</p>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Conditions</label>
                          <textarea
                            value={contactFormData.child_health_mental_conditions || ''}
                            onChange={(e) =>
                              setContactFormData({ ...contactFormData, child_health_mental_conditions: e.target.value })
                            }
                            className="w-full px-3 py-2 border-2 border-teal-light rounded-lg focus:outline-none focus:border-teal-medium text-sm text-gray-900"
                            rows={2}
                            placeholder="Any mental health conditions..."
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Diagnosis</label>
                          <textarea
                            value={contactFormData.child_health_mental_diagnosis || ''}
                            onChange={(e) =>
                              setContactFormData({ ...contactFormData, child_health_mental_diagnosis: e.target.value })
                            }
                            className="w-full px-3 py-2 border-2 border-teal-light rounded-lg focus:outline-none focus:border-teal-medium text-sm text-gray-900"
                            rows={2}
                            placeholder="Official diagnoses if any..."
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Treatment</label>
                          <textarea
                            value={contactFormData.child_health_mental_treatment || ''}
                            onChange={(e) =>
                              setContactFormData({ ...contactFormData, child_health_mental_treatment: e.target.value })
                            }
                            className="w-full px-3 py-2 border-2 border-teal-light rounded-lg focus:outline-none focus:border-teal-medium text-sm text-gray-900"
                            rows={2}
                            placeholder="Current treatments or therapies..."
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Therapist</label>
                          <input
                            type="text"
                            value={contactFormData.child_health_therapist || ''}
                            onChange={(e) =>
                              setContactFormData({ ...contactFormData, child_health_therapist: e.target.value })
                            }
                            className="w-full px-3 py-2 border-2 border-teal-light rounded-lg focus:outline-none focus:border-teal-medium text-sm text-gray-900"
                            placeholder="Therapist name and contact..."
                          />
                        </div>
                      </div>

                      {/* Developmental */}
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-teal-medium border-b border-teal-light pb-1">Developmental</p>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Delays</label>
                          <textarea
                            value={contactFormData.child_health_developmental_delays || ''}
                            onChange={(e) =>
                              setContactFormData({ ...contactFormData, child_health_developmental_delays: e.target.value })
                            }
                            className="w-full px-3 py-2 border-2 border-teal-light rounded-lg focus:outline-none focus:border-teal-medium text-sm text-gray-900"
                            rows={2}
                            placeholder="Any developmental delays or concerns..."
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Supports</label>
                          <textarea
                            value={contactFormData.child_health_developmental_supports || ''}
                            onChange={(e) =>
                              setContactFormData({ ...contactFormData, child_health_developmental_supports: e.target.value })
                            }
                            className="w-full px-3 py-2 border-2 border-teal-light rounded-lg focus:outline-none focus:border-teal-medium text-sm text-gray-900"
                            rows={2}
                            placeholder="IEP, 504 plan, tutoring, speech therapy, etc..."
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {contactFormData.relationship === 'My Partner' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-teal-medium mb-1">
                        When did you start dating?
                      </label>
                      <input
                        type="date"
                        value={contactFormData.partner_duration || ''}
                        onChange={(e) =>
                          setContactFormData({ ...contactFormData, partner_duration: e.target.value })
                        }
                        className="w-full px-3 py-2 border-2 border-teal-light rounded-lg focus:outline-none focus:border-teal-medium text-sm text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-teal-medium mb-1">
                        Does your partner have children?
                      </label>
                      <select
                        value={contactFormData.has_children || ''}
                        onChange={(e) =>
                          setContactFormData({ ...contactFormData, has_children: e.target.value })
                        }
                        className="w-full px-3 py-2 border-2 border-teal-light rounded-lg focus:outline-none focus:border-teal-medium bg-white text-sm text-gray-900"
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
                      <label className="block text-xs font-semibold text-teal-medium mb-1">
                        Separation Date
                      </label>
                      <input
                        type="date"
                        value={contactFormData.separation_date || ''}
                        onChange={(e) =>
                          setContactFormData({ ...contactFormData, separation_date: e.target.value })
                        }
                        className="w-full px-3 py-2 border-2 border-teal-light rounded-lg focus:outline-none focus:border-teal-medium text-sm text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-teal-medium mb-1">
                        Separation Details
                      </label>
                      <textarea
                        value={contactFormData.separation_details || ''}
                        onChange={(e) =>
                          setContactFormData({ ...contactFormData, separation_details: e.target.value })
                        }
                        className="w-full px-3 py-2 border-2 border-teal-light rounded-lg focus:outline-none focus:border-teal-medium text-sm text-gray-900"
                        rows={3}
                        placeholder="Additional details about the separation..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-teal-medium mb-1">
                        Address
                      </label>
                      <input
                        ref={addressInputRef}
                        type="text"
                        value={contactFormData.address || ''}
                        onChange={(e) =>
                          setContactFormData({ ...contactFormData, address: e.target.value })
                        }
                        className="w-full px-3 py-2 border-2 border-teal-light rounded-lg focus:outline-none focus:border-teal-medium text-sm text-gray-900"
                        placeholder="Start typing address..."
                      />
                    </div>

                    {/* Financial Section */}
                    <div className="bg-teal-lightest rounded-lg p-3 space-y-3 mt-3">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-teal-medium" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h4 className="font-semibold text-teal-medium text-sm">Financial</h4>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Do they pay child support?</label>
                        <select
                          value={contactFormData.coparent_pays_child_support || ''}
                          onChange={(e) => {
                            const paysSupport = e.target.value;
                            setContactFormData({ 
                              ...contactFormData, 
                              coparent_pays_child_support: paysSupport,
                              // If they pay, they can't receive - automatically set to 'no'
                              coparent_receives_child_support: (paysSupport === 'yes' || paysSupport === 'sometimes') ? 'no' : contactFormData.coparent_receives_child_support
                            });
                          }}
                          className="w-full px-3 py-2 border-2 border-teal-light rounded-lg focus:outline-none focus:border-teal-medium bg-white text-sm text-gray-900"
                        >
                          <option value="">Select...</option>
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                          <option value="sometimes">Sometimes/Inconsistent</option>
                          <option value="pending">Pending court order</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Do they receive child support?</label>
                        <select
                          value={contactFormData.coparent_receives_child_support || ''}
                          onChange={(e) => {
                            const receivesSupport = e.target.value;
                            setContactFormData({ 
                              ...contactFormData, 
                              coparent_receives_child_support: receivesSupport,
                              // If they receive, they can't pay - automatically set to 'no'
                              coparent_pays_child_support: receivesSupport === 'yes' ? 'no' : contactFormData.coparent_pays_child_support
                            });
                          }}
                          disabled={contactFormData.coparent_pays_child_support === 'yes' || contactFormData.coparent_pays_child_support === 'sometimes'}
                          className="w-full px-3 py-2 border-2 border-teal-light rounded-lg focus:outline-none focus:border-teal-medium bg-white text-sm text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                          <option value="">Select...</option>
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                          <option value="pending">Pending court order</option>
                        </select>
                        {(contactFormData.coparent_pays_child_support === 'yes' || contactFormData.coparent_pays_child_support === 'sometimes') && (
                          <p className="text-xs text-gray-500 mt-1">If they pay child support, they don't receive it.</p>
                        )}
                      </div>
                    </div>

                    {/* Work Section */}
                    <div className="bg-teal-lightest rounded-lg p-3 space-y-3 mt-3">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-teal-medium" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <h4 className="font-semibold text-teal-medium text-sm">Work</h4>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Work Schedule</label>
                        <select
                          value={contactFormData.coparent_work_schedule || ''}
                          onChange={(e) =>
                            setContactFormData({ ...contactFormData, coparent_work_schedule: e.target.value })
                          }
                          className="w-full px-3 py-2 border-2 border-teal-light rounded-lg focus:outline-none focus:border-teal-medium bg-white text-sm text-gray-900"
                        >
                          <option value="">Select...</option>
                          <option value="9to5">Standard 9-5</option>
                          <option value="shift">Shift work</option>
                          <option value="remote">Remote/Work from home</option>
                          <option value="parttime">Part-time</option>
                          <option value="irregular">Irregular hours</option>
                          <option value="unemployed">Not currently working</option>
                          <option value="unknown">I don't know</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Schedule Flexibility</label>
                        <select
                          value={contactFormData.coparent_work_flexibility || ''}
                          onChange={(e) =>
                            setContactFormData({ ...contactFormData, coparent_work_flexibility: e.target.value })
                          }
                          className="w-full px-3 py-2 border-2 border-teal-light rounded-lg focus:outline-none focus:border-teal-medium bg-white text-sm text-gray-900"
                        >
                          <option value="">Select...</option>
                          <option value="very_flexible">Very flexible</option>
                          <option value="somewhat_flexible">Somewhat flexible</option>
                          <option value="not_flexible">Not flexible</option>
                          <option value="unknown">I don't know</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-teal-medium mb-1">
                        What aspects of co-parenting would you like to see improve?
                      </label>
                      <textarea
                        value={contactFormData.difficult_aspects || ''}
                        onChange={(e) =>
                          setContactFormData({ ...contactFormData, difficult_aspects: e.target.value })
                        }
                        className="w-full px-3 py-2 border-2 border-teal-light rounded-lg focus:outline-none focus:border-teal-medium text-sm text-gray-900"
                        rows={3}
                        placeholder="Describe areas for improvement..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-teal-medium mb-1">
                        Any legal matters or custody concerns?
                      </label>
                      <textarea
                        value={contactFormData.legal_matters || ''}
                        onChange={(e) =>
                          setContactFormData({ ...contactFormData, legal_matters: e.target.value })
                        }
                        className="w-full px-3 py-2 border-2 border-teal-light rounded-lg focus:outline-none focus:border-teal-medium text-sm text-gray-900"
                        rows={2}
                        placeholder="Legal matters..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-teal-medium mb-1">
                        Any safety concerns?
                      </label>
                      <textarea
                        value={contactFormData.safety_concerns || ''}
                        onChange={(e) =>
                          setContactFormData({ ...contactFormData, safety_concerns: e.target.value })
                        }
                        className="w-full px-3 py-2 border-2 border-teal-light rounded-lg focus:outline-none focus:border-teal-medium text-sm text-gray-900"
                        rows={2}
                        placeholder="Safety concerns..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-teal-medium mb-1">
                        Any substance abuse or mental health concerns?
                      </label>
                      <textarea
                        value={contactFormData.substance_mental_health || ''}
                        onChange={(e) =>
                          setContactFormData({ ...contactFormData, substance_mental_health: e.target.value })
                        }
                        className="w-full px-3 py-2 border-2 border-teal-light rounded-lg focus:outline-none focus:border-teal-medium text-sm text-gray-900"
                        rows={2}
                        placeholder="Concerns..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-teal-medium mb-1">
                        Additional thoughts or context
                      </label>
                      <textarea
                        value={contactFormData.additional_thoughts || ''}
                        onChange={(e) =>
                          setContactFormData({ ...contactFormData, additional_thoughts: e.target.value })
                        }
                        className="w-full px-3 py-2 border-2 border-teal-light rounded-lg focus:outline-none focus:border-teal-medium text-sm text-gray-900"
                        rows={3}
                        placeholder="Anything else that would help..."
                      />
                    </div>
                  </>
                )}

                {(contactFormData.relationship === "My Child's Teacher" || contactFormData.relationship === 'Other') && (
                  <div>
                    <label className="block text-xs font-semibold text-teal-medium mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={contactFormData.phone || ''}
                      onChange={(e) =>
                        setContactFormData({ ...contactFormData, phone: e.target.value })
                      }
                      className="w-full px-3 py-2 border-2 border-teal-light rounded-lg focus:outline-none focus:border-teal-medium text-sm text-gray-900"
                      placeholder="Phone number"
                    />
                  </div>
                )}

              </div>
              <div className="px-3 sm:px-4 py-3 pb-4 border-t-2 border-teal-light flex gap-2 flex-wrap sm:flex-nowrap flex-shrink-0 bg-white">
                {editingContact && (
                  <Button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this contact?')) {
                        deleteContact(editingContact.id);
                        setShowContactForm(false);
                        resetForm();
                      }
                    }}
                    variant="danger"
                    size="small"
                    className="text-xs sm:text-sm"
                  >
                    Delete
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={isSavingContact || !contactFormData.contact_name.trim() || !contactFormData.relationship}
                  loading={isSavingContact}
                  variant="secondary"
                  size="small"
                  className="flex-1 text-sm"
                >
                  {editingContact ? 'Update' : 'Add'}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setShowContactForm(false);
                    resetForm();
                  }}
                  variant="tertiary"
                  size="small"
                  className="text-xs sm:text-sm"
                >
                  Cancel
                </Button>
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


