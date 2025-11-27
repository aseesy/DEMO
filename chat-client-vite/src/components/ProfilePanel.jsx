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

  // State for toast notification
  const [showSuccessToast, setShowSuccessToast] = React.useState(false);

  // File input ref for profile picture upload
  const fileInputRef = React.useRef(null);

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

  // Calculate profile completion percentage
  const calculateCompletion = () => {
    const fields = [
      profileData.first_name,
      profileData.last_name,
      profileData.email,
      profileData.address,
    ];
    const filledFields = fields.filter(field => field && field.trim().length > 0).length;
    return Math.round((filledFields / fields.length) * 100);
  };

  const completionPercentage = calculateCompletion();

  // Handle profile picture upload
  const handlePictureSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be less than 5MB');
        return;
      }

      // Read file as base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setProfileData({
          ...profileData,
          profile_picture: base64String
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Wrap saveProfile to show success toast
  const handleSaveProfile = async () => {
    await saveProfile();
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  if (isLoadingProfile) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-100 border-t-teal-medium" />
            <p className="mt-4 text-teal-medium font-semibold text-base">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-[#f0f9f9] via-white to-[#e8f5f2]">
      <div className="px-4 sm:px-6 md:px-8 pt-6 pb-24 md:pb-8 space-y-4 max-w-4xl mx-auto">
        {/* Success Toast */}
        {showSuccessToast && (
          <div className="fixed top-4 right-4 left-4 sm:left-auto sm:w-96 bg-white border-2 border-teal-medium rounded-xl shadow-lg p-4 z-50 animate-[slideInRight_0.3s_ease-out]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-teal-medium rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-teal-dark">Profile saved!</p>
                <p className="text-sm text-gray-600">Your changes have been saved successfully.</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm shadow-sm">
            <div className="font-semibold mb-1">Error</div>
            <div>{error}</div>
          </div>
        )}

        {/* Profile Header - Minimalist */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-1">
            {/* Avatar */}
            <div
              className="relative w-14 h-14 rounded-full bg-[#275559] flex items-center justify-center cursor-pointer group overflow-hidden flex-shrink-0"
              onClick={() => fileInputRef.current?.click()}
            >
              {profileData.profile_picture ? (
                <img
                  src={profileData.profile_picture}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white text-xl font-medium">
                  {(profileData.first_name || profileData.username || '?').charAt(0).toUpperCase()}
                </span>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>

            <div>
              <h1 className="text-2xl font-semibold text-[#275559]">Edit Profile</h1>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-sm text-[#4DA8B0] hover:text-[#275559] transition-colors"
              >
                {profileData.profile_picture ? 'Change photo' : 'Add photo'}
              </button>
            </div>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePictureSelect}
            className="hidden"
          />
        </div>

        {/* Personal Information */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm mb-4">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">Personal Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#275559] mb-1.5">First Name</label>
              <input
                type="text"
                name="first_name"
                value={profileData.first_name || ''}
                onChange={handleNameChange}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#4DA8B0] focus:ring-2 focus:ring-[#4DA8B0]/20 transition-all text-[#275559]"
                placeholder="First Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#275559] mb-1.5">Last Name</label>
              <input
                type="text"
                name="last_name"
                value={profileData.last_name || ''}
                onChange={handleNameChange}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#4DA8B0] focus:ring-2 focus:ring-[#4DA8B0]/20 transition-all text-[#275559]"
                placeholder="Last Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#275559] mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                name="display_name"
                value={profileData.display_name || ''}
                onChange={handleNameChange}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#4DA8B0] focus:ring-2 focus:ring-[#4DA8B0]/20 transition-all text-[#275559]"
                placeholder="How your name will appear to others"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#275559] mb-1.5">Address</label>
              <div className="relative">
                <input
                  ref={addressInputRef}
                  type="text"
                  value={profileData.address || ''}
                  onChange={(e) =>
                    setProfileData({ ...profileData, address: e.target.value })
                  }
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#4DA8B0] focus:ring-2 focus:ring-[#4DA8B0]/20 transition-all text-[#275559]"
                  placeholder="Start typing your address..."
                />
                {!isGoogleMapsLoaded && !googleMapsError && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-200 border-t-[#4DA8B0]" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Additional Context */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm mb-4">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">Additional Context</h3>

          <div className="space-y-4">
            <Textarea
              label="Is there anything else that LiaiZen should know about you or your situation to better serve your needs?"
              value={profileData.additional_context || ''}
              onChange={(value) =>
                setProfileData({
                  ...profileData,
                  additional_context: value,
                })
              }
              rows={4}
              maxLength={1000}
              showCharCount={true}
              placeholder="Share any relevant information about your co-parenting situation, communication preferences, or specific needs..."
            />
          </div>
        </div>

        {/* Save button */}
        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleSaveProfile}
            disabled={isSavingProfile}
            loading={isSavingProfile}
            variant="primary"
            size="medium"
            className="bg-[#275559] hover:bg-[#1e4144] text-white font-medium px-8"
          >
            {isSavingProfile ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>
      </div>
    </div>
  );
}
