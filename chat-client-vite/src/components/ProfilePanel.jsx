import React from 'react';
import { useProfile } from '../hooks/useProfile.js';
import { useGooglePlaces } from '../hooks/useGooglePlaces.js';
import { Button } from './ui';

export function ProfilePanel({ username, onLogout, onNavigateToContacts }) {
  const {
    profileData,
    isLoadingProfile,
    isSavingProfile,
    error,
    setProfileData,
    saveProfile,
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

  return (
    <div className="bg-white h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-3 sm:p-4 md:p-6">
        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-6 text-sm">
            {error}
          </div>
        )}

        {isLoadingProfile ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#E6F7F5] border-t-[#4DA8B0]" />
            <p className="mt-4 text-teal-medium font-medium">Loading profile...</p>
          </div>
        ) : (
          <div className="space-y-6">
          {/* Personal Info */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border-2 border-gray-200 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-teal-medium" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-teal-medium">
                Personal Information
              </h3>
            </div>
            <div className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-teal-medium mb-1.5 sm:mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={profileData.first_name}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        first_name: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 sm:py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-teal-medium transition-all text-gray-900 text-sm min-h-[44px]"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-teal-medium mb-1.5 sm:mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={profileData.last_name}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        last_name: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 sm:py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-teal-medium transition-all text-gray-900 text-sm min-h-[44px]"
                    placeholder="Last name"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-teal-medium mb-1.5 sm:mb-2">
                  Address
                </label>
                <div className="relative">
                  <input
                    ref={addressInputRef}
                    type="text"
                    value={profileData.address}
                    onChange={(e) =>
                      setProfileData({ ...profileData, address: e.target.value })
                    }
                    className="w-full px-3 py-2.5 sm:py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-teal-medium transition-all text-gray-900 text-sm min-h-[44px]"
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
                {googleMapsError && (
                  <p className="text-xs text-red-600 mt-2">
                    ⚠️ {googleMapsError}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-teal-medium mb-1">
                  Occupation / Daily Responsibilities
                </label>
                <p className="text-xs text-[#3d8a92] mb-2">
                  This helps understand your schedule demands.
                </p>
                <textarea
                  value={profileData.occupation}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      occupation: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2.5 sm:py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-teal-medium transition-all text-gray-900 text-sm min-h-[100px]"
                  rows={3}
                  placeholder="Describe your occupation and daily responsibilities..."
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-teal-medium mb-1.5 sm:mb-2">
                  What is your parenting philosophy?
                </label>
                <textarea
                  value={profileData.parenting_philosophy}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      parenting_philosophy: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2.5 sm:py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-teal-medium transition-all text-gray-900 text-sm min-h-[120px]"
                  rows={4}
                  placeholder="Share your parenting philosophy and approach..."
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-teal-medium mb-1.5 sm:mb-2">
                  What personal growth or changes would you like to work on during
                  this process?
                </label>
                <textarea
                  value={profileData.personal_growth}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      personal_growth: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2.5 sm:py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-teal-medium transition-all text-gray-900 text-sm min-h-[120px]"
                  rows={4}
                  placeholder="Describe areas you'd like to improve or work on..."
                />
              </div>
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
        )}
      </div>
    </div>
  );
}


