import React from 'react';
import { useGooglePlaces } from '../../../hooks/integrations/useGooglePlaces.js';
import { useGooglePlacesSchool } from '../../../hooks/integrations/useGooglePlacesSchool.js';
import { useActivities } from '../model/useActivities.js';
import { ActivityCard } from '../../dashboard/components/ActivityCard.jsx';
import { AddActivityModal } from './AddActivityModal.jsx';
import { Button } from '../../../components/ui';
import { isPartnerRelationship } from '../../../utils/relationshipMapping.js';

/**
 * ContactForm - Modal form for creating/editing contacts
 *
 * Single responsibility: Render and manage the contact form modal
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is visible
 * @param {Object} props.contact - Contact being edited (null for new contact)
 * @param {Object} props.formData - Form data state
 * @param {Function} props.setFormData - Form data setter
 * @param {Array} props.contacts - All contacts (for relationship linking)
 * @param {boolean} props.isSaving - Save in progress
 * @param {Function} props.onSave - Save handler
 * @param {Function} props.onDelete - Delete handler
 * @param {Function} props.onClose - Close modal handler
 * @param {string} props.username - Current username
 * @param {Function} props.onInviteToChat - Handler for inviting contact to chat
 * @param {Function} props.setCurrentView - Function to navigate to different views
 */
export function ContactForm({
  isOpen,
  contact,
  formData,
  setFormData,
  contacts,
  isSaving,
  onSave,
  onDelete,
  onClose,
  username,
  onInviteToChat,
  setCurrentView,
}) {
  // Refs for Google Places autocomplete
  const addressInputRef = React.useRef(null);
  const schoolInputRef = React.useRef(null);

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
    deleteActivity,
  } = useActivities(contact?.relationship === 'My Child' ? contact.id : null, username);

  // Google Places autocomplete for address field
  const handlePlaceSelected = React.useCallback(
    addressComponents => {
      setFormData(prev => ({
        ...prev,
        address: addressComponents.fullAddress,
      }));
    },
    [setFormData]
  );

  useGooglePlaces(addressInputRef, handlePlaceSelected);

  // School autocomplete callback
  const handleSchoolSelected = React.useCallback(
    schoolInfo => {
      setFormData(prev => ({
        ...prev,
        school: schoolInfo.name,
        school_address: schoolInfo.address,
        school_lat: schoolInfo.lat,
        school_lng: schoolInfo.lng,
      }));
    },
    [setFormData]
  );

  useGooglePlacesSchool(schoolInputRef, handleSchoolSelected);

  if (!isOpen) return null;

  const handleSubmit = e => {
    e.preventDefault();
    onSave();
  };

  const handleFormChange = field => e => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const isChildRelationship =
    formData.relationship === 'My Child' ||
    formData.relationship === "My Partner's Child" ||
    formData.relationship === "My Co-Parent's Child";

  const isCoParentRelationship =
    formData.relationship === 'My Co-Parent' || formData.relationship === "My Partner's Co-Parent";

  const isPartnerForm = formData.relationship === 'My Partner';

  const showPhoneField =
    formData.relationship === "My Child's Teacher" || formData.relationship === 'Other';

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 flex items-center justify-center z-modal p-4 pb-24 md:pb-4 overflow-y-auto"
        style={{ zIndex: 'var(--z-modal)' }}
      >
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-full flex flex-col border-2 border-teal-light my-auto">
          {/* Header */}
          <div className="border-b-2 border-teal-light px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between flex-shrink-0">
            <h3 className="text-base sm:text-lg font-bold text-teal-medium">
              {contact ? 'Edit' : 'Add'}
            </h3>
            <Button
              onClick={onClose}
              variant="ghost"
              size="small"
              className="text-2xl leading-none p-1 min-w-[36px]"
              aria-label="Close"
            >
              ×
            </Button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col">
            <div className="p-3 sm:p-4 space-y-3 flex-1 overflow-y-auto">
              {/* Basic Fields */}
              <BasicFields formData={formData} onChange={handleFormChange} />

              {/* Child-specific Fields */}
              {isChildRelationship && (
                <ChildFields
                  formData={formData}
                  onChange={handleFormChange}
                  setFormData={setFormData}
                  contacts={contacts}
                  contact={contact}
                  schoolInputRef={schoolInputRef}
                  showActivityModal={showActivityModal}
                  setShowActivityModal={setShowActivityModal}
                  setEditingActivity={setEditingActivity}
                  activities={activities}
                  isLoadingActivities={isLoadingActivities}
                  activitiesError={activitiesError}
                  deleteActivity={deleteActivity}
                />
              )}

              {/* Partner-specific Fields */}
              {isPartnerForm && <PartnerFields formData={formData} onChange={handleFormChange} />}

              {/* Co-Parent-specific Fields */}
              {isCoParentRelationship && (
                <CoParentFields
                  formData={formData}
                  onChange={handleFormChange}
                  addressInputRef={addressInputRef}
                />
              )}

              {/* Phone Field for Teacher/Other */}
              {showPhoneField && <PhoneField formData={formData} onChange={handleFormChange} />}
            </div>

            {/* Footer Actions */}
            <div className="px-3 sm:px-4 py-3 pb-4 border-t-2 border-teal-light flex gap-2 flex-wrap sm:flex-nowrap flex-shrink-0 bg-white">
              {contact && (
                <Button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this contact?')) {
                      onDelete(contact.id);
                    }
                  }}
                  variant="danger"
                  size="small"
                  className="text-xs sm:text-sm"
                >
                  Delete
                </Button>
              )}
              {contact &&
                isPartnerRelationship(contact.relationship) &&
                contact.linked_user_id &&
                onInviteToChat && (
                  <Button
                    type="button"
                    onClick={async () => {
                      try {
                        await onInviteToChat(contact);
                        if (setCurrentView) {
                          setCurrentView('chat');
                        }
                        onClose();
                      } catch (err) {
                        // Error is already handled by onInviteToChat
                        console.error('Failed to invite contact to chat:', err);
                      }
                    }}
                    variant="secondary"
                    size="small"
                    className="text-xs sm:text-sm flex items-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    Invite
                  </Button>
                )}
              <Button
                type="submit"
                disabled={isSaving || !formData.contact_name.trim() || !formData.relationship}
                loading={isSaving}
                variant="secondary"
                size="small"
                className="flex-1 text-sm"
              >
                {contact ? 'Update' : 'Add'}
              </Button>
              <Button
                type="button"
                onClick={onClose}
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

      {/* Activity Modal */}
      <AddActivityModal
        isOpen={showActivityModal}
        onClose={() => {
          setShowActivityModal(false);
          setEditingActivity(null);
        }}
        onSave={async activityFormData => {
          try {
            if (editingActivity) {
              await updateActivity(editingActivity.id, activityFormData);
            } else {
              await createActivity(activityFormData);
            }
            setShowActivityModal(false);
            setEditingActivity(null);
          } catch (err) {
            console.error('Failed to save activity:', err);
          }
        }}
        activity={editingActivity}
        isSaving={isSavingActivity}
      />
    </>
  );
}

/**
 * BasicFields - Name, Relationship, Email fields
 */
function BasicFields({ formData, onChange }) {
  return (
    <>
      <div>
        <label className="block text-xs sm:text-sm font-semibold text-teal-medium mb-1.5">
          Name *
        </label>
        <input
          type="text"
          value={formData.contact_name}
          onChange={onChange('contact_name')}
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
          value={formData.relationship}
          onChange={onChange('relationship')}
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
      <div>
        <label className="block text-xs sm:text-sm font-semibold text-teal-medium mb-1.5">
          Email
        </label>
        <input
          type="email"
          value={formData.contact_email}
          onChange={onChange('contact_email')}
          className="w-full px-3 py-2.5 sm:py-2 border-2 border-teal-light rounded-lg focus:outline-none focus:border-teal-medium text-sm text-gray-900 min-h-[44px]"
          placeholder="email@example.com"
        />
      </div>
    </>
  );
}

/**
 * ChildFields - Fields specific to child contacts
 */
function ChildFields({
  formData,
  onChange,
  setFormData,
  contacts,
  contact,
  schoolInputRef,
  showActivityModal,
  setShowActivityModal,
  setEditingActivity,
  activities,
  isLoadingActivities,
  activitiesError,
  deleteActivity,
}) {
  return (
    <>
      <div>
        <label className="block text-xs font-semibold text-teal-medium mb-1">Birthdate</label>
        <input
          type="date"
          value={formData.child_birthdate || ''}
          onChange={onChange('child_birthdate')}
          className="w-full px-3 py-2 border-2 border-teal-light rounded-lg focus:outline-none focus:border-teal-medium text-sm text-gray-900"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-teal-medium mb-1">School</label>
        <input
          ref={schoolInputRef}
          type="text"
          value={formData.school || ''}
          onChange={onChange('school')}
          className="w-full px-3 py-2 border-2 border-teal-light rounded-lg focus:outline-none focus:border-teal-medium text-sm text-gray-900"
          placeholder="Start typing school name..."
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-teal-medium mb-1">
          Custody Arrangement
        </label>
        <textarea
          value={formData.custody_arrangement || ''}
          onChange={onChange('custody_arrangement')}
          className="w-full px-3 py-2 border-2 border-teal-light rounded-lg focus:outline-none focus:border-teal-medium text-sm text-gray-900"
          rows={2}
          placeholder="Describe custody arrangement..."
        />
      </div>

      {/* Other Parent Selection */}
      <OtherParentField
        formData={formData}
        setFormData={setFormData}
        contacts={contacts}
        relationship={formData.relationship}
      />

      {/* Activities Schedule - Only for "My Child" with existing contact */}
      {formData.relationship === 'My Child' && contact && (
        <ActivitiesSection
          showActivityModal={showActivityModal}
          setShowActivityModal={setShowActivityModal}
          setEditingActivity={setEditingActivity}
          activities={activities}
          isLoadingActivities={isLoadingActivities}
          activitiesError={activitiesError}
          deleteActivity={deleteActivity}
        />
      )}

      {/* Child Health Section */}
      <ChildHealthSection formData={formData} onChange={onChange} />
    </>
  );
}

/**
 * OtherParentField - Select field for linking child to co-parent
 */
function OtherParentField({ formData, setFormData, contacts, relationship }) {
  const filterRelationship =
    relationship === "My Partner's Child"
      ? "My Partner's Co-Parent"
      : relationship === 'My Child'
        ? ['co-parent', 'My Co-Parent']
        : null;

  if (!filterRelationship) return null;

  const availableParents = contacts.filter(c =>
    Array.isArray(filterRelationship)
      ? filterRelationship.includes(c.relationship)
      : c.relationship === filterRelationship
  );

  return (
    <div>
      <label className="block text-xs font-semibold text-teal-medium mb-1">Other Parent</label>
      <select
        value={formData.linked_contact_id || ''}
        onChange={e => setFormData(prev => ({ ...prev, linked_contact_id: e.target.value }))}
        className="w-full px-3 py-2 border-2 border-teal-light rounded-lg focus:outline-none focus:border-teal-medium bg-white text-sm text-gray-900"
      >
        <option value="">Select other parent...</option>
        {availableParents.map(c => (
          <option key={c.id} value={c.id}>
            {c.contact_name}
          </option>
        ))}
        {availableParents.length === 0 && <option disabled>Add a co-parent contact first</option>}
      </select>
    </div>
  );
}

/**
 * ActivitiesSection - Activities schedule management for children
 */
function ActivitiesSection({
  setShowActivityModal,
  setEditingActivity,
  activities,
  isLoadingActivities,
  activitiesError,
  deleteActivity,
}) {
  return (
    <div className="bg-teal-lightest rounded-lg p-3 space-y-3 mt-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-teal-medium"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <h4 className="font-semibold text-teal-medium text-sm">Activities & Schedule</h4>
        </div>
        <Button
          type="button"
          onClick={e => {
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
        <p className="text-sm text-gray-500 text-center py-3">
          No activities yet. Click "+ Add Activity" to create one.
        </p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {activities &&
            activities.map(activity => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                onEdit={act => {
                  setEditingActivity(act);
                  setShowActivityModal(true);
                }}
                onDelete={async activityId => {
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
  );
}

/**
 * ChildHealthSection - Health information for children
 */
function ChildHealthSection({ formData, onChange }) {
  return (
    <div className="bg-teal-lightest rounded-lg p-3 space-y-3 mt-3">
      <div className="flex items-center gap-2 mb-2">
        <svg
          className="w-4 h-4 text-teal-medium"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
        <h4 className="font-semibold text-teal-medium text-sm">Health Information</h4>
      </div>

      {/* Physical Health */}
      <HealthSubsection title="Physical Health">
        <FormTextarea
          label="Conditions"
          value={formData.child_health_physical_conditions}
          onChange={onChange('child_health_physical_conditions')}
          placeholder="Any physical health conditions..."
        />
        <FormTextarea
          label="Allergies"
          value={formData.child_health_allergies}
          onChange={onChange('child_health_allergies')}
          placeholder="Food, environmental, medication allergies..."
        />
        <FormTextarea
          label="Medications"
          value={formData.child_health_medications}
          onChange={onChange('child_health_medications')}
          placeholder="Current medications and dosages..."
        />
        <FormInput
          label="Doctor/Pediatrician"
          value={formData.child_health_doctor}
          onChange={onChange('child_health_doctor')}
          placeholder="Primary care doctor name and contact..."
        />
      </HealthSubsection>

      {/* Mental Health */}
      <HealthSubsection title="Mental Health">
        <FormTextarea
          label="Conditions"
          value={formData.child_health_mental_conditions}
          onChange={onChange('child_health_mental_conditions')}
          placeholder="Any mental health conditions..."
        />
        <FormTextarea
          label="Diagnosis"
          value={formData.child_health_mental_diagnosis}
          onChange={onChange('child_health_mental_diagnosis')}
          placeholder="Official diagnoses if any..."
        />
        <FormTextarea
          label="Treatment"
          value={formData.child_health_mental_treatment}
          onChange={onChange('child_health_mental_treatment')}
          placeholder="Current treatments or therapies..."
        />
        <FormInput
          label="Therapist"
          value={formData.child_health_therapist}
          onChange={onChange('child_health_therapist')}
          placeholder="Therapist name and contact..."
        />
      </HealthSubsection>

      {/* Developmental */}
      <HealthSubsection title="Developmental">
        <FormTextarea
          label="Delays"
          value={formData.child_health_developmental_delays}
          onChange={onChange('child_health_developmental_delays')}
          placeholder="Any developmental delays or concerns..."
        />
        <FormTextarea
          label="Supports"
          value={formData.child_health_developmental_supports}
          onChange={onChange('child_health_developmental_supports')}
          placeholder="IEP, 504 plan, tutoring, speech therapy, etc..."
        />
      </HealthSubsection>
    </div>
  );
}

/**
 * HealthSubsection - Section within health information
 */
function HealthSubsection({ title, children }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-teal-medium border-b border-teal-light pb-1">
        {title}
      </p>
      {children}
    </div>
  );
}

/**
 * PartnerFields - Fields specific to partner contacts
 */
function PartnerFields({ formData, onChange }) {
  const isLivingTogether = formData.partner_living_together === 'yes';

  return (
    <>
      <div>
        <label className="block text-xs font-semibold text-teal-medium mb-1">
          When did you start dating?
        </label>
        <input
          type="date"
          value={formData.partner_duration || ''}
          onChange={onChange('partner_duration')}
          className="w-full px-3 py-2 border-2 border-teal-light rounded-lg focus:outline-none focus:border-teal-medium text-sm text-gray-900 min-h-[44px]"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-teal-medium mb-1">
          Are you living together?
        </label>
        <select
          value={formData.partner_living_together || ''}
          onChange={onChange('partner_living_together')}
          className="w-full px-3 py-2 border-2 border-teal-light rounded-lg focus:outline-none focus:border-teal-medium bg-white text-sm text-gray-900 min-h-[44px]"
        >
          <option value="">Select...</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      </div>
      {isLivingTogether && (
        <div>
          <label className="block text-xs font-semibold text-teal-medium mb-1">Since when?</label>
          <input
            type="date"
            value={formData.partner_living_together_since || ''}
            onChange={onChange('partner_living_together_since')}
            className="w-full px-3 py-2 border-2 border-teal-light rounded-lg focus:outline-none focus:border-teal-medium text-sm text-gray-900 min-h-[44px]"
          />
        </div>
      )}
      <div>
        <label className="block text-xs font-semibold text-teal-medium mb-1">
          Does your partner have children?
        </label>
        <select
          value={formData.has_children || ''}
          onChange={onChange('has_children')}
          className="w-full px-3 py-2 border-2 border-teal-light rounded-lg focus:outline-none focus:border-teal-medium bg-white text-sm text-gray-900 min-h-[44px]"
        >
          <option value="">Select...</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      </div>
      <FormTextarea
        label="Relationship Notes"
        value={formData.partner_relationship_notes}
        onChange={onChange('partner_relationship_notes')}
        placeholder="Any additional notes about your relationship..."
        rows={3}
      />
    </>
  );
}

/**
 * CoParentFields - Fields specific to co-parent contacts
 */
function CoParentFields({ formData, onChange, addressInputRef }) {
  return (
    <>
      <div>
        <label className="block text-xs font-semibold text-teal-medium mb-1">Separation Date</label>
        <input
          type="date"
          value={formData.separation_date || ''}
          onChange={onChange('separation_date')}
          className="w-full px-3 py-2 border-2 border-teal-light rounded-lg focus:outline-none focus:border-teal-medium text-sm text-gray-900"
        />
      </div>
      <FormTextarea
        label="Separation Details"
        value={formData.separation_details}
        onChange={onChange('separation_details')}
        placeholder="Additional details about the separation..."
        rows={3}
      />
      <div>
        <label className="block text-xs font-semibold text-teal-medium mb-1">Address</label>
        <input
          ref={addressInputRef}
          type="text"
          value={formData.address || ''}
          onChange={onChange('address')}
          className="w-full px-3 py-2 border-2 border-teal-light rounded-lg focus:outline-none focus:border-teal-medium text-sm text-gray-900"
          placeholder="Start typing address..."
        />
      </div>

      {/* Work Section */}
      <WorkSection formData={formData} onChange={onChange} />

      <FormTextarea
        label="What aspects of co-parenting would you like to see improve?"
        value={formData.difficult_aspects}
        onChange={onChange('difficult_aspects')}
        placeholder="Describe areas for improvement..."
        rows={3}
      />
      <FormTextarea
        label="Any legal matters or custody concerns?"
        value={formData.legal_matters}
        onChange={onChange('legal_matters')}
        placeholder="Legal matters..."
        rows={2}
      />
      <FormTextarea
        label="Any safety concerns?"
        value={formData.safety_concerns}
        onChange={onChange('safety_concerns')}
        placeholder="Safety concerns..."
        rows={2}
      />
      <FormTextarea
        label="Any substance abuse or mental health concerns?"
        value={formData.substance_mental_health}
        onChange={onChange('substance_mental_health')}
        placeholder="Concerns..."
        rows={2}
      />
      <FormTextarea
        label="Additional thoughts or context"
        value={formData.additional_thoughts}
        onChange={onChange('additional_thoughts')}
        placeholder="Anything else that would help..."
        rows={3}
      />
    </>
  );
}

/**
 * WorkSection - Co-parent work schedule fields
 */
function WorkSection({ formData, onChange }) {
  return (
    <div className="bg-teal-lightest rounded-lg p-3 space-y-3 mt-3">
      <div className="flex items-center gap-2 mb-2">
        <svg
          className="w-4 h-4 text-teal-medium"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
        <h4 className="font-semibold text-teal-medium text-sm">Work</h4>
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">Work Schedule</label>
        <select
          value={formData.coparent_work_schedule || ''}
          onChange={onChange('coparent_work_schedule')}
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
          value={formData.coparent_work_flexibility || ''}
          onChange={onChange('coparent_work_flexibility')}
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
  );
}

/**
 * PhoneField - Phone number field for teachers/other contacts
 */
function PhoneField({ formData, onChange }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-teal-medium mb-1">Phone Number</label>
      <input
        type="tel"
        value={formData.phone || ''}
        onChange={onChange('phone')}
        className="w-full px-3 py-2 border-2 border-teal-light rounded-lg focus:outline-none focus:border-teal-medium text-sm text-gray-900"
        placeholder="Phone number"
      />
    </div>
  );
}

/**
 * FormInput - Reusable text input field
 */
function FormInput({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-xs text-gray-600 mb-1">{label}</label>
      <input
        type="text"
        value={value || ''}
        onChange={onChange}
        className="w-full px-3 py-2 border-2 border-teal-light rounded-lg focus:outline-none focus:border-teal-medium text-sm text-gray-900"
        placeholder={placeholder}
      />
    </div>
  );
}

/**
 * FormTextarea - Reusable textarea field
 */
function FormTextarea({ label, value, onChange, placeholder, rows = 2 }) {
  return (
    <div>
      <label className="block text-xs text-gray-600 mb-1">{label}</label>
      <textarea
        value={value || ''}
        onChange={onChange}
        className="w-full px-3 py-2 border-2 border-teal-light rounded-lg focus:outline-none focus:border-teal-medium text-sm text-gray-900"
        rows={rows}
        placeholder={placeholder}
      />
    </div>
  );
}

export default ContactForm;
