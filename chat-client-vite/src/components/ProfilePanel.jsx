import React from 'react';
import { useProfile } from '../hooks/useProfile.js';

export function ProfilePanel({ username, onLogout, onNavigateToContacts }) {
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

  // Google Places autocomplete disabled for now - will re-enable once API is fully configured
  // const addressContainerRef = React.useRef(null);
  // const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = React.useState(false);

  return (
    <div className="bg-gradient-to-br from-[#E6F7F5] to-white h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-3 sm:p-4 md:p-6">
        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-6 text-sm">
            {error}
          </div>
        )}

        {isLoadingProfile ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#E6F7F5] border-t-[#4DA8B0]" />
            <p className="mt-4 text-[#275559] font-medium">Loading profile...</p>
          </div>
        ) : (
          <div className="space-y-6">
          {/* Personal Info */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border-2 border-[#A8D9D3] shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-[#D4F0EC] to-[#A8D9D3] rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#275559]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-[#275559]">
                Personal Information
              </h3>
            </div>
            <div className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-[#275559] mb-1.5 sm:mb-2">
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
                    className="w-full px-3 py-2.5 sm:py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#4DA8B0] transition-all text-gray-900 text-sm min-h-[44px]"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-[#275559] mb-1.5 sm:mb-2">
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
                    className="w-full px-3 py-2.5 sm:py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#4DA8B0] transition-all text-gray-900 text-sm min-h-[44px]"
                    placeholder="Last name"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-[#275559] mb-1.5 sm:mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={profileData.address}
                  onChange={(e) =>
                    setProfileData({ ...profileData, address: e.target.value })
                  }
                  className="w-full px-3 py-2.5 sm:py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#4DA8B0] transition-all text-gray-900 text-sm min-h-[44px]"
                  placeholder="Enter your full address..."
                />
                <p className="text-xs text-[#3d8a92] mt-2 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  Enter your complete street address, city, state, and ZIP code
                </p>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-[#275559] mb-1.5 sm:mb-2">
                  Occupation / Daily Responsibilities
                </label>
                <textarea
                  value={profileData.occupation}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      occupation: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2.5 sm:py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#4DA8B0] transition-all text-gray-900 text-sm min-h-[100px]"
                  rows={3}
                  placeholder="Describe your occupation and daily responsibilities..."
                />
                <p className="text-xs text-[#3d8a92] mt-2">
                  This helps understand your schedule demands.
                </p>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-[#275559] mb-1.5 sm:mb-2">
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
                  className="w-full px-3 py-2.5 sm:py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#4DA8B0] transition-all text-gray-900 text-sm min-h-[120px]"
                  rows={4}
                  placeholder="Share your parenting philosophy and approach..."
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-[#275559] mb-1.5 sm:mb-2">
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
                  className="w-full px-3 py-2.5 sm:py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#4DA8B0] transition-all text-gray-900 text-sm min-h-[120px]"
                  rows={4}
                  placeholder="Describe areas you'd like to improve or work on..."
                />
              </div>
            </div>
          </div>

          {/* Password section */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border-2 border-gray-200 shadow-sm hover:shadow-md transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="flex items-center gap-2 sm:gap-3 flex-1">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#275559]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-[#275559]">Password</h3>
              </div>
              <button
                onClick={() => setShowPasswordChange(!showPasswordChange)}
                className="px-3 py-2 sm:py-1.5 bg-gradient-to-br from-[#E6F7F5] to-[#C5E8E4] text-[#275559] border border-[#C5E8E4] hover:from-[#C5E8E4] hover:to-[#A8D9D3] rounded-lg font-semibold text-xs sm:text-sm transition-all shadow-sm hover:shadow-md min-h-[36px] sm:min-h-[40px] touch-manipulation self-start sm:self-auto"
              >
                {showPasswordChange ? 'Cancel' : 'Change Password'}
              </button>
            </div>
            {showPasswordChange && (
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-[#275559] mb-1.5 sm:mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        currentPassword: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 sm:py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#4DA8B0] transition-all text-gray-900 text-sm min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-[#275559] mb-1.5 sm:mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 sm:py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#4DA8B0] transition-all text-gray-900 text-sm min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-[#275559] mb-1.5 sm:mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 sm:py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#4DA8B0] transition-all text-gray-900 text-sm min-h-[44px]"
                  />
                </div>
                <button
                  onClick={changePassword}
                  disabled={isChangingPassword}
                  className="w-full bg-[#275559] hover:bg-[#1f4447] text-white py-3 sm:py-2 px-4 rounded-lg font-semibold disabled:bg-gray-400 transition-all shadow-md hover:shadow-lg min-h-[44px] touch-manipulation text-sm"
                >
                  {isChangingPassword ? 'Changing...' : 'Update Password'}
                </button>
              </div>
            )}
          </div>

          {/* Save button */}
          <div className="bg-gradient-to-br from-[#4DA8B0] to-[#3d8a92] rounded-xl sm:rounded-2xl p-1 shadow-lg hover:shadow-xl transition-all">
            <button
              onClick={saveProfile}
              disabled={isSavingProfile}
              className="w-full bg-gradient-to-br from-[#4DA8B0] to-[#3d8a92] hover:from-[#3d8a92] hover:to-[#2d6d75] text-white py-3 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base disabled:from-gray-400 disabled:to-gray-500 transition-all flex items-center justify-center gap-2 min-h-[48px] touch-manipulation"
            >
              {isSavingProfile ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Profile
                </>
              )}
            </button>
          </div>

          </div>
        )}
      </div>
    </div>
  );
}


