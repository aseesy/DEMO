/**
 * Profile Form Sections
 *
 * Presentational components for each profile tab section.
 * All business logic is handled by parent via props.
 */

import React from 'react';
import {
  FormInput,
  FormTextarea,
  FormSelect,
  FormSection,
  FormInfoBox,
  FormGrid,
} from './FormField.jsx';
import { MultiSelectButtons } from './MultiSelectButtons.jsx';
import {
  CORE_VALUES_OPTIONS,
  SCHEDULE_FLEXIBILITY_OPTIONS,
  EDUCATION_LEVEL_OPTIONS,
  TREATMENT_OPTIONS,
  SUBSTANCE_HISTORY_OPTIONS,
  RECOVERY_OPTIONS,
  ADDITIONAL_CONTEXT_CONFIG,
} from '../../config/profileConfig.js';

/**
 * Personal Information Section
 */
export function PersonalInfoSection({
  profileData,
  onFieldChange,
  addressInputRef,
  isGoogleMapsLoaded,
  googleMapsError,
}) {
  return (
    <>
      <FormGrid>
        <FormInput
          label="First Name"
          name="first_name"
          value={profileData.first_name}
          onChange={onFieldChange}
        />
        <FormInput
          label="Last Name"
          name="last_name"
          value={profileData.last_name}
          onChange={onFieldChange}
        />
      </FormGrid>

      <FormInput
        label="Preferred Name"
        name="preferred_name"
        value={profileData.preferred_name}
        onChange={onFieldChange}
        placeholder="What you'd like to be called"
      />

      <FormInput
        label="Phone"
        name="phone"
        type="tel"
        value={profileData.phone}
        onChange={onFieldChange}
        placeholder="(555) 123-4567"
      />

      <FormInput
        label="Address"
        name="address"
        value={profileData.address}
        onChange={onFieldChange}
        placeholder="Start typing your address..."
        inputRef={addressInputRef}
      >
        {!isGoogleMapsLoaded && !googleMapsError && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-200 border-t-teal-medium" />
          </div>
        )}
      </FormInput>

      <FormSection description="Your schedule helps LiaiZen coordinate better." />

      <FormTextarea
        label="Work Schedule"
        name="work_schedule"
        value={profileData.work_schedule}
        onChange={onFieldChange}
        placeholder="e.g., Mon-Fri 9-5, rotating shifts, work from home..."
        rows={2}
      />

      <FormSelect
        label="Schedule Flexibility"
        name="schedule_flexibility"
        value={profileData.schedule_flexibility}
        onChange={onFieldChange}
        options={SCHEDULE_FLEXIBILITY_OPTIONS}
      />
    </>
  );
}

/**
 * Motivations Section
 */
export function MotivationsSection({ profileData, onFieldChange, onValuesChange }) {
  return (
    <>
      <MultiSelectButtons
        label="What values are most important to you?"
        options={CORE_VALUES_OPTIONS}
        value={profileData.motivation_values}
        onChange={onValuesChange}
      />

      <FormTextarea
        label="What are your main goals as a parent?"
        name="motivation_goals"
        value={profileData.motivation_goals}
        onChange={onFieldChange}
        placeholder="e.g., Raise a confident, kind child. Maintain a stable routine..."
        rows={3}
      />

      <FormTextarea
        label="What are your strengths as a parent?"
        name="motivation_strengths"
        value={profileData.motivation_strengths}
        onChange={onFieldChange}
        placeholder="e.g., I'm patient, I'm good at explaining things..."
        rows={3}
      />

      <FormTextarea
        label="What would you like to improve?"
        name="motivation_improvements"
        value={profileData.motivation_improvements}
        onChange={onFieldChange}
        placeholder="e.g., Being more patient during stressful moments, better time management..."
        rows={3}
      />

      <FormInfoBox title="Why we ask">
        Understanding your values and motivations helps LiaiZen provide more personalized
        support. This information is <strong>completely private</strong> and never shared
        with your co-parent.
      </FormInfoBox>
    </>
  );
}

/**
 * Background Section
 */
export function BackgroundSection({ profileData, onFieldChange }) {
  const showRecoveryDuration =
    profileData.health_in_recovery === 'yes';

  const showRecoveryQuestion =
    profileData.health_substance_history === 'past' ||
    profileData.health_substance_history === 'current';

  return (
    <>
      <FormInput
        label="Cultural Background"
        name="background_culture"
        value={profileData.background_culture}
        onChange={onFieldChange}
        placeholder="Optional"
      />

      <FormInput
        label="Religion"
        name="background_religion"
        value={profileData.background_religion}
        onChange={onFieldChange}
        placeholder="Optional"
      />

      <FormSelect
        label="Education"
        name="education_level"
        value={profileData.education_level}
        onChange={onFieldChange}
        options={EDUCATION_LEVEL_OPTIONS}
      />

      <FormInput
        label="Field of Study"
        name="education_field"
        value={profileData.education_field}
        onChange={onFieldChange}
        placeholder="e.g., Business, Engineering, Education"
      />

      {/* Health Section */}
      <FormSection description="Health information is private and only used by LiaiZen to provide better support." />

      <FormTextarea
        label="Physical Health Conditions"
        name="health_physical_conditions"
        value={profileData.health_physical_conditions}
        onChange={onFieldChange}
        placeholder="Any conditions that may affect scheduling or availability"
        rows={2}
      />

      <FormTextarea
        label="Physical Limitations"
        name="health_physical_limitations"
        value={profileData.health_physical_limitations}
        onChange={onFieldChange}
        placeholder="Any limitations that affect daily activities"
        rows={2}
      />

      <FormTextarea
        label="Mental Health"
        name="health_mental_conditions"
        value={profileData.health_mental_conditions}
        onChange={onFieldChange}
        placeholder="Any conditions LiaiZen should be aware of"
        rows={2}
      />

      <FormSelect
        label="Currently in Treatment?"
        name="health_mental_treatment"
        value={profileData.health_mental_treatment}
        onChange={onFieldChange}
        options={TREATMENT_OPTIONS}
      />

      <FormSelect
        label="Substance History"
        name="health_substance_history"
        value={profileData.health_substance_history}
        onChange={onFieldChange}
        options={SUBSTANCE_HISTORY_OPTIONS}
      />

      {showRecoveryQuestion && (
        <FormSelect
          label="In Recovery?"
          name="health_in_recovery"
          value={profileData.health_in_recovery}
          onChange={onFieldChange}
          options={RECOVERY_OPTIONS}
        />
      )}

      {showRecoveryDuration && (
        <FormInput
          label="Recovery Duration"
          name="health_recovery_duration"
          value={profileData.health_recovery_duration}
          onChange={onFieldChange}
          placeholder="e.g., 2 years"
        />
      )}

      {/* Additional Context */}
      <FormSection />
      <FormTextarea
        label="Anything else LiaiZen should know?"
        name="additional_context"
        value={profileData.additional_context}
        onChange={onFieldChange}
        placeholder="Share anything else you'd like LiaiZen to know about you..."
        rows={4}
        maxLength={ADDITIONAL_CONTEXT_CONFIG.maxLength}
        showCount
      />
    </>
  );
}
