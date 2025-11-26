import React from 'react';
import { useProfile } from '../hooks/useProfile.js';
import { useGooglePlaces } from '../hooks/useGooglePlaces.js';
import { Button, Input, Textarea } from './ui';

export function ProfilePanel({ username }) {
  const {
    profileData,
    isLoadingProfile,
    isSavingProfile,
    showPasswordChange,
    passwordData,
    isChangingPassword,
    error,
    setProfileData,
    setShowPasswordChange,
    setPasswordData,
    saveProfile,
    changePassword,
  } = useProfile(username);

  // Google Places autocomplete
  const addressInputRef = React.useRef(null);

  const handlePlaceSelected = React.useCallback((addressComponents) => {
    setProfileData({
      ...profileData,
      address: addressComponents.fullAddress,
    });
  }, [profileData, setProfileData]);

  const { isLoaded: isGoogleMapsLoaded, error: googleMapsError } = useGooglePlaces(
    addressInputRef,
    handlePlaceSelected
  );

  const handleNameChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (isLoadingProfile) {
    return (
      <div className="bg-white rounded-2xl border-2 border-teal-light shadow-lg overflow-hidden">
        <div className="p-8 sm:p-10">
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-100 border-t-teal-medium" />
            <p className="mt-6 text-teal-medium font-semibold text-lg">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-teal-light shadow-lg overflow-hidden h-full overflow-y-auto">
      <div className="p-6 sm:p-8 space-y-8">
        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 px-5 py-4 rounded-xl mb-6 text-sm shadow-sm">
            <div className="font-semibold mb-1">Error</div>
            <div>{error}</div>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-teal-dark mb-3">Profile</h2>
          <p className="text-base text-gray-600 leading-relaxed">
            Manage your personal information and account settings.
          </p>
        </div>

        {/* Profile Identity Header */}
        <div className="bg-gradient-to-br from-[#E6F7F5] to-white rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border-2 border-teal-light mb-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-teal-medium text-white flex items-center justify-center font-bold text-xl sm:text-2xl flex-shrink-0 shadow-md">
              {(profileData.first_name || profileData.username || '?').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl sm:text-2xl font-bold text-teal-medium truncate">
                {profileData.first_name && profileData.last_name
                  ? `${profileData.first_name} ${profileData.last_name}`
                  : profileData.first_name || profileData.username || 'User'}
              </h2>
              {profileData.email && (
                <p className="text-sm text-gray-600 mt-0.5 truncate">{profileData.email}</p>
              )}
              <p className="text-xs text-gray-400 mt-0.5">@{profileData.username || username}</p>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-teal-light shadow-sm hover:shadow-md transition-shadow mb-6">
          <h3 className="text-xl font-semibold text-teal-dark mb-6">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
              <input
                type="text"
                name="first_name"
                value={profileData.first_name || ''}
                onChange={handleNameChange}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-teal-medium focus:ring-0 transition-colors"
                placeholder="First Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
              <input
                type="text"
                name="last_name"
                value={profileData.last_name || ''}
                onChange={handleNameChange}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-teal-medium focus:ring-0 transition-colors"
                placeholder="Last Name"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
              <input
                type="text"
                name="display_name"
                value={profileData.display_name || ''}
                onChange={handleNameChange}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-teal-medium focus:ring-0 transition-colors"
                placeholder="Display Name (optional)"
              />
              <p className="text-xs text-gray-500 mt-1">This is how your name will appear to others.</p>
            </div>
          </div>
        </div>

        {/* Address Section */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-teal-light shadow-sm hover:shadow-md transition-shadow mb-6">
          <h3 className="text-xl font-semibold text-teal-dark mb-6">Address</h3>
          <div className="relative">
            <input
              ref={addressInputRef}
              type="text"
              value={profileData.address || ''}
              onChange={(e) =>
                setProfileData({ ...profileData, address: e.target.value })
              }
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-teal-medium focus:ring-0 transition-colors"
              placeholder="Start typing your address..."
            />
            {!isGoogleMapsLoaded && !googleMapsError && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#E6F7F5] border-t-[#4DA8B0]" />
              </div>
            )}
          </div>
          <p className="text-xs text-[#3d8a92] mt-2 flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            Enter your complete street address, city, state, and ZIP code
          </p>
        </div>

        {/* Communication Preferences */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-teal-light shadow-sm hover:shadow-md transition-shadow mb-6">
          <h3 className="text-xl font-semibold text-teal-dark mb-6">Communication Preferences</h3>
          <div className="space-y-6">
            <div>
              <p className="text-xs text-[#3d8a92] mb-2">
                This helps understand your schedule demands.
              </p>
              <Textarea
                label="Occupation / Daily Responsibilities"
                value={profileData.occupation || ''}
                onChange={(value) =>
                  setProfileData({
                    ...profileData,
                    occupation: value,
                  })
                }
                rows={3}
                placeholder="Describe your occupation and daily responsibilities..."
                className="text-sm"
              />
            </div>
            <Textarea
              label="What is your communication style or preferences?"
              value={profileData.communication_style || ''}
              onChange={(value) =>
                setProfileData({
                  ...profileData,
                  communication_style: value,
                })
              }
              rows={3}
              placeholder="e.g., 'I prefer direct communication', 'I need time to process before responding', 'I respond better to questions than statements'..."
              className="text-sm"
            />
            <div>
              <p className="text-xs text-[#3d8a92] mb-2">
                This helps the AI understand what topics or approaches might trigger defensive responses.
              </p>
              <Textarea
                label="What topics or communication patterns are most difficult for you?"
                value={profileData.communication_triggers || ''}
                onChange={(value) =>
                  setProfileData({
                    ...profileData,
                    communication_triggers: value,
                  })
                }
                rows={3}
                placeholder="e.g., 'I get defensive when criticized about parenting', 'Money discussions are difficult', 'Past relationship issues'..."
                className="text-sm"
              />
            </div>
            <Textarea
              label="What are your main communication goals in co-parenting?"
              value={profileData.communication_goals || ''}
              onChange={(value) =>
                setProfileData({
                  ...profileData,
                  communication_goals: value,
                })
              }
              rows={3}
              placeholder="e.g., 'Keep conversations focused on the kids', 'Stay calm during disagreements', 'Avoid personal attacks'..."
              className="text-sm"
            />
          </div>
        </div>

        {/* Save button */}
        <div className="bg-gradient-to-br from-teal-medium to-[#3d8a92] rounded-xl sm:rounded-2xl p-1 shadow-lg hover:shadow-xl transition-all">
          <Button
            onClick={saveProfile}
            disabled={isSavingProfile}
            loading={isSavingProfile}
            variant="secondary"
            size="large"
            fullWidth
            icon={!isSavingProfile && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            className="bg-gradient-to-br from-teal-medium to-[#3d8a92] hover:from-[#3d8a92] hover:to-[#2d6d75] text-sm sm:text-base"
          >
            Save Profile
          </Button>
        </div>
      </div>
    </div>
  );
}
