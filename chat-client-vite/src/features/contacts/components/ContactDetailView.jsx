import React from 'react';
import { Button } from '../../../components/ui';
import { mapContactToFormData } from '../model/contactMapper.js';

/**
 * ContactDetailView - Readonly view of contact information
 *
 * Displays all contact information in an organized, readable format.
 * Shows extracted information prominently, especially health and appointment data.
 *
 * @param {Object} props
 * @param {Object} props.contact - Contact to display
 * @param {Function} props.onEdit - Handler to switch to edit mode
 * @param {Function} props.onClose - Handler to close the view
 * @param {Function} props.onDelete - Handler to delete the contact
 * @param {Function} props.onInviteToChat - Handler to invite contact to chat
 */
export function ContactDetailView({ contact, onEdit, onClose, onDelete, onInviteToChat }) {
  if (!contact) return null;

  const formData = mapContactToFormData(contact);
  const isChildRelationship =
    formData.relationship === 'My Child' ||
    formData.relationship === "My Partner's Child" ||
    formData.relationship === "My Co-Parent's Child";

  const isPartnerRelationship =
    formData.relationship === 'My Partner' || formData.relationship === "My Co-Parent's Partner";

  const isCoParentRelationship =
    formData.relationship === 'My Co-Parent' || formData.relationship === "My Partner's Co-Parent";

  const hasLinkedUser = !!contact.linked_user_id;
  const showInviteButton = isPartnerRelationship && hasLinkedUser && onInviteToChat;

  // Parse appointments from additional_thoughts
  const appointments = React.useMemo(() => {
    if (!formData.additional_thoughts) return [];
    const lines = formData.additional_thoughts.split('\n');
    return lines.filter(line => line.toLowerCase().includes('appointment'));
  }, [formData.additional_thoughts]);

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-modal p-4 pb-24 md:pb-4 overflow-y-auto"
      style={{ zIndex: 'var(--z-modal)' }}
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-full flex flex-col border-2 border-teal-light my-auto">
        {/* Header */}
        <div className="border-b-2 border-teal-light px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-teal-medium text-white flex items-center justify-center font-semibold text-lg sm:text-xl flex-shrink-0">
              {(formData.contact_name || '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-teal-medium">
                {formData.contact_name || 'Unnamed'}
              </h3>
              <p className="text-xs sm:text-sm text-teal-medium">
                {formData.relationship || 'Relationship not set'}
              </p>
            </div>
          </div>
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
          {/* Basic Information */}
          <DetailSection title="Basic Information">
            {formData.contact_email && <DetailField label="Email" value={formData.contact_email} />}
            {formData.phone && <DetailField label="Phone" value={formData.phone} />}
            {formData.address && <DetailField label="Address" value={formData.address} />}
            {formData.child_age && <DetailField label="Age" value={formData.child_age} />}
            {formData.child_birthdate && (
              <DetailField label="Birthdate" value={formData.child_birthdate} />
            )}
            {formData.school && <DetailField label="School" value={formData.school} />}
          </DetailSection>

          {/* Appointments - Highlighted */}
          {appointments.length > 0 && (
            <DetailSection
              title="Upcoming Appointments"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              }
              highlight
            >
              {appointments.map((appointment, idx) => (
                <div
                  key={idx}
                  className="bg-teal-lightest border-l-4 border-teal-medium p-3 rounded-r-lg"
                >
                  <p className="text-sm text-teal-dark font-medium">{appointment}</p>
                </div>
              ))}
            </DetailSection>
          )}

          {/* Child Health Information */}
          {isChildRelationship && (
            <DetailSection
              title="Health Information"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              }
            >
              {/* Physical Health */}
              {(formData.child_health_doctor ||
                formData.child_health_allergies ||
                formData.child_health_medications ||
                formData.child_health_physical_conditions) && (
                <HealthSubsection title="Physical Health">
                  {formData.child_health_doctor && (
                    <DetailField label="Doctor/Pediatrician" value={formData.child_health_doctor} />
                  )}
                  {formData.child_health_allergies && (
                    <DetailField label="Allergies" value={formData.child_health_allergies} />
                  )}
                  {formData.child_health_medications && (
                    <DetailField label="Medications" value={formData.child_health_medications} />
                  )}
                  {formData.child_health_physical_conditions && (
                    <DetailField
                      label="Conditions"
                      value={formData.child_health_physical_conditions}
                    />
                  )}
                </HealthSubsection>
              )}

              {/* Mental Health */}
              {(formData.child_health_therapist ||
                formData.child_health_mental_conditions ||
                formData.child_health_mental_diagnosis ||
                formData.child_health_mental_treatment) && (
                <HealthSubsection title="Mental Health">
                  {formData.child_health_therapist && (
                    <DetailField label="Therapist" value={formData.child_health_therapist} />
                  )}
                  {formData.child_health_mental_conditions && (
                    <DetailField
                      label="Conditions"
                      value={formData.child_health_mental_conditions}
                    />
                  )}
                  {formData.child_health_mental_diagnosis && (
                    <DetailField label="Diagnosis" value={formData.child_health_mental_diagnosis} />
                  )}
                  {formData.child_health_mental_treatment && (
                    <DetailField label="Treatment" value={formData.child_health_mental_treatment} />
                  )}
                </HealthSubsection>
              )}

              {/* Developmental */}
              {(formData.child_health_developmental_delays ||
                formData.child_health_developmental_supports) && (
                <HealthSubsection title="Developmental">
                  {formData.child_health_developmental_delays && (
                    <DetailField
                      label="Delays"
                      value={formData.child_health_developmental_delays}
                    />
                  )}
                  {formData.child_health_developmental_supports && (
                    <DetailField
                      label="Supports"
                      value={formData.child_health_developmental_supports}
                    />
                  )}
                </HealthSubsection>
              )}
            </DetailSection>
          )}

          {/* Co-Parent Information */}
          {isCoParentRelationship && (
            <DetailSection title="Co-Parent Information">
              {formData.custody_arrangement && (
                <DetailField label="Custody Arrangement" value={formData.custody_arrangement} />
              )}
              {formData.separation_date && (
                <DetailField label="Separation Date" value={formData.separation_date} />
              )}
              {formData.separation_details && (
                <DetailField label="Separation Details" value={formData.separation_details} />
              )}
              {formData.difficult_aspects && (
                <DetailField label="Difficult Aspects" value={formData.difficult_aspects} />
              )}
              {formData.friction_situations && (
                <DetailField label="Friction Situations" value={formData.friction_situations} />
              )}
              {formData.legal_matters && (
                <DetailField label="Legal Matters" value={formData.legal_matters} />
              )}
              {formData.safety_concerns && (
                <DetailField label="Safety Concerns" value={formData.safety_concerns} />
              )}
            </DetailSection>
          )}

          {/* Partner Information */}
          {isPartnerRelationship && (
            <DetailSection title="Partner Information">
              {formData.partner_duration && (
                <DetailField label="Duration" value={formData.partner_duration} />
              )}
              {formData.partner_living_together && (
                <DetailField label="Living Together" value={formData.partner_living_together} />
              )}
              {formData.partner_living_together_since && (
                <DetailField
                  label="Living Together Since"
                  value={formData.partner_living_together_since}
                />
              )}
              {formData.partner_relationship_notes && (
                <DetailField
                  label="Relationship Notes"
                  value={formData.partner_relationship_notes}
                />
              )}
            </DetailSection>
          )}

          {/* Additional Notes */}
          {formData.additional_thoughts && appointments.length === 0 && (
            <DetailSection title="Additional Notes">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {formData.additional_thoughts}
              </p>
            </DetailSection>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t-2 border-teal-light px-3 sm:px-4 py-3 flex gap-2 flex-wrap sm:flex-nowrap flex-shrink-0 bg-white">
          {showInviteButton && (
            <Button
              onClick={() => onInviteToChat(contact)}
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
          <Button onClick={onEdit} variant="secondary" size="small" className="flex-1 text-sm">
            Edit
          </Button>
          {contact.id && (
            <Button
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete ${formData.contact_name}?`)) {
                  onDelete(contact.id);
                }
              }}
              variant="tertiary"
              size="small"
              className="text-xs sm:text-sm text-red-600 hover:text-red-700"
            >
              Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * DetailSection - Section container with title
 */
function DetailSection({ title, icon, highlight, children }) {
  return (
    <div className={`rounded-lg p-3 sm:p-4 ${highlight ? 'bg-teal-lightest' : 'bg-gray-50'}`}>
      <div className="flex items-center gap-2 mb-3">
        {icon && <div className="text-teal-medium">{icon}</div>}
        <h4 className="font-semibold text-teal-medium text-sm sm:text-base">{title}</h4>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

/**
 * HealthSubsection - Subsection within health information
 */
function HealthSubsection({ title, children }) {
  return (
    <div className="space-y-2 mb-3 last:mb-0">
      <p className="text-xs font-semibold text-teal-medium border-b border-teal-light pb-1">
        {title}
      </p>
      {children}
    </div>
  );
}

/**
 * DetailField - Individual field display
 */
function DetailField({ label, value }) {
  if (!value) return null;

  return (
    <div>
      <p className="text-xs font-semibold text-teal-medium mb-1">{label}</p>
      <p className="text-sm text-gray-700 whitespace-pre-wrap">{value}</p>
    </div>
  );
}
