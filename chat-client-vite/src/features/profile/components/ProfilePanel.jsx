/**
 * ProfilePanel - User profile editing interface
 *
 * This is a thin orchestration component that:
 * - Uses useProfile for data management
 * - Uses useImageUpload for profile picture handling
 * - Uses useGooglePlaces for address autocomplete
 * - Renders ProfileSection components for each tab
 */

import React, { useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useProfile } from '../index.js';
import { useGooglePlaces } from '../../../hooks/integrations/useGooglePlaces.js';
import { useImageUpload } from '../../../hooks/files/useImageUpload.js';
import { Button } from '../../../components/ui';
import { PROFILE_TABS } from '../../../config/profileConfig.js';
import { PersonalInfoSection, MotivationsSection, BackgroundSection } from './index.js';

export function ProfilePanel({ username }) {
  const {
    profileData,
    isLoadingProfile,
    isSavingProfile,
    error,
    setProfileData,
    updateField,
    saveProfile,
  } = useProfile(username);

  const [showSuccessToast, setShowSuccessToast] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('personal');
  const addressInputRef = useRef(null);

  // Image upload handling
  const handleImageSelected = useCallback(
    dataURL => {
      setProfileData(prev => ({ ...prev, profile_picture: dataURL }));
    },
    [setProfileData]
  );

  const { fileInputRef, openFilePicker, inputProps } = useImageUpload({
    onImageSelected: handleImageSelected,
  });

  // Google Places autocomplete
  const handlePlaceSelected = useCallback(
    addressComponents => {
      setProfileData(prev => ({
        ...prev,
        address: addressComponents.fullAddress,
        city: addressComponents.city || prev.city,
        state: addressComponents.state || prev.state,
        zip: addressComponents.zip || prev.zip,
      }));
    },
    [setProfileData]
  );

  const { isLoaded: isGoogleMapsLoaded, error: googleMapsError } = useGooglePlaces(
    addressInputRef,
    handlePlaceSelected
  );

  // Form handlers
  const handleSaveProfile = async () => {
    const result = await saveProfile();
    if (result?.success) {
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    }
  };

  const handleFieldChange = e => {
    const { name, value } = e.target;
    updateField(name, value);
  };

  const handleValuesChange = newValues => {
    updateField('motivation_values', newValues);
  };

  if (isLoadingProfile) {
    return <LoadingState />;
  }

  return (
    <div className="p-4 sm:p-6">
      {showSuccessToast &&
        typeof document !== 'undefined' &&
        createPortal(<SuccessToast />, document.body)}
      {error && <ErrorBanner error={error} />}

      <ProfileHeader
        profileData={profileData}
        onAvatarClick={openFilePicker}
        onSave={handleSaveProfile}
        isSaving={isSavingProfile}
      />

      <input {...inputProps} />

      <ProfileTabs tabs={PROFILE_TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="space-y-4">
        {activeTab === 'personal' && (
          <PersonalInfoSection
            profileData={profileData}
            onFieldChange={handleFieldChange}
            addressInputRef={addressInputRef}
            isGoogleMapsLoaded={isGoogleMapsLoaded}
            googleMapsError={googleMapsError}
          />
        )}

        {activeTab === 'motivations' && (
          <MotivationsSection
            profileData={profileData}
            onFieldChange={handleFieldChange}
            onValuesChange={handleValuesChange}
          />
        )}

        {activeTab === 'background' && (
          <BackgroundSection profileData={profileData} onFieldChange={handleFieldChange} />
        )}
      </div>
    </div>
  );
}

// Sub-components

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-teal-medium" />
    </div>
  );
}

function SuccessToast() {
  return (
    <div
      className="fixed top-4 right-4 left-4 sm:left-auto sm:w-80 bg-white border-2 border-teal-medium rounded-lg shadow-xl p-4 animate-slide-in-right"
      style={{ zIndex: 9999 }}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-6 h-6 bg-teal-lightest rounded-full flex items-center justify-center">
          <svg
            className="w-4 h-4 text-teal-medium"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span className="text-sm font-semibold text-teal-dark">Profile saved successfully!</span>
      </div>
    </div>
  );
}

function ErrorBanner({ error }) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
      {error}
    </div>
  );
}

function ProfileHeader({ profileData, onAvatarClick, onSave, isSaving }) {
  const initial = (profileData.first_name || profileData.username || '?').charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-4 mb-6">
      <div
        className="relative w-14 h-14 rounded-full bg-teal-medium flex items-center justify-center cursor-pointer group overflow-hidden"
        onClick={onAvatarClick}
      >
        {profileData.profile_picture ? (
          <img
            src={profileData.profile_picture}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-white text-xl font-medium">{initial}</span>
        )}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>
      </div>

      <h1 className="flex-1 text-xl font-semibold text-teal-medium">Your Profile</h1>

      <Button
        onClick={onSave}
        disabled={isSaving}
        loading={isSaving}
        variant="primary"
        className="bg-teal-medium hover:bg-teal-medium/90 text-white px-6"
      >
        {isSaving ? 'Saving...' : 'Save'}
      </Button>
    </div>
  );
}

function ProfileTabs({ tabs, activeTab, onTabChange }) {
  return (
    <div className="flex border-b border-gray-200 mb-6">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === tab.id
              ? 'border-teal-medium text-teal-medium'
              : 'border-transparent text-gray-500 hover:text-teal-medium'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export default ProfilePanel;
