import React from 'react';
import { useProfile } from '../hooks/useProfile.js';

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

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 h-full overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Profile</h2>
        <p className="text-gray-600">
          Manage your personal information and profile details.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      {isLoadingProfile ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-teal" />
          <p className="mt-2 text-gray-600 text-sm">Loading profile...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Account Info */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-teal-dark mb-4">
              Account Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={profileData.username || ''}
                  onChange={(e) => {
                    const newUsername = e.target.value.trim();
                    if (newUsername.length <= 20) {
                      setProfileData({ ...profileData, username: newUsername });
                    }
                  }}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-teal"
                  placeholder="Username"
                  maxLength={20}
                />
                <p className="text-xs text-gray-500 mt-1">2-20 characters</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) =>
                    setProfileData({ ...profileData, email: e.target.value })
                  }
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-teal"
                  placeholder="your@email.com"
                />
              </div>
            </div>
          </div>

          {/* Personal Info */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-teal-dark mb-4">
              Personal Information
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
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
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-teal"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
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
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-teal"
                    placeholder="Last name"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={profileData.address}
                  onChange={(e) =>
                    setProfileData({ ...profileData, address: e.target.value })
                  }
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-teal"
                  placeholder="Your address"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Household Members{' '}
                  <span className="text-xs text-gray-500">(Private to you)</span>
                </label>
                <textarea
                  value={profileData.household_members}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      household_members: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-teal"
                  rows={3}
                  placeholder="List household members..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
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
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-teal"
                  rows={3}
                  placeholder="Describe your occupation and daily responsibilities..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  This helps understand your schedule demands.
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
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
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-teal"
                  rows={4}
                  placeholder="Share your parenting philosophy and approach..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
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
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-teal"
                  rows={4}
                  placeholder="Describe areas you'd like to improve or work on..."
                />
              </div>
            </div>
          </div>

          {/* Password section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-teal-dark">Password</h3>
              <button
                onClick={() => setShowPasswordChange(!showPasswordChange)}
                className="px-4 py-2 bg-teal text-white rounded-xl font-semibold text-sm"
              >
                {showPasswordChange ? 'Cancel' : 'Change Password'}
              </button>
            </div>
            {showPasswordChange && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
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
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-teal"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
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
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-teal"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
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
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-teal"
                  />
                </div>
                <button
                  onClick={changePassword}
                  disabled={isChangingPassword}
                  className="w-full bg-teal text-white py-3 rounded-xl font-semibold disabled:bg-gray-400 text-sm"
                >
                  {isChangingPassword ? 'Changing...' : 'Update Password'}
                </button>
              </div>
            )}
          </div>

          {/* Save button */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={saveProfile}
              disabled={isSavingProfile}
              className="flex-1 bg-teal text-white py-3 rounded-xl font-semibold disabled:bg-gray-400 text-sm flex items-center justify-center gap-2"
            >
              {isSavingProfile ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Profile'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


