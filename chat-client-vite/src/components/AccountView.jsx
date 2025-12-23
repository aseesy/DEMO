import React from 'react';
import { useProfile } from '../features/profile';

/**
 * AccountView - Account settings and password management component
 * Lazy-loaded for code-splitting to reduce initial bundle size
 */
export function AccountView({ username }) {
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

  if (isLoadingProfile) {
    return (
      <div className="bg-white rounded-2xl border-2 border-teal-light shadow-lg overflow-hidden">
        <div className="p-8 sm:p-10">
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-100 border-t-teal-medium" />
            <p className="mt-6 text-teal-medium font-semibold text-lg">Loading account...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-teal-light shadow-lg overflow-hidden">
      <div className="p-6 sm:p-8 space-y-8">
        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 px-5 py-4 rounded-xl mb-6 text-sm shadow-sm">
            <div className="font-semibold mb-1">Error</div>
            <div>{error}</div>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-teal-dark mb-3">Account</h2>
          <p className="text-base text-gray-600 leading-relaxed">
            Manage billing, authentication, and household members connected to your space.
          </p>
        </div>

        {/* Account Information */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-teal-light shadow-sm hover:shadow-md transition-shadow mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-white border-2 border-teal-light rounded-xl flex items-center justify-center shadow-sm">
              <svg
                className="w-6 h-6 text-teal-medium"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-teal-dark mb-1">Account Information</h3>
              <p className="text-sm text-gray-500">
                Signed in as{' '}
                <span className="font-medium text-teal-dark">
                  {profileData?.firstName || username}
                </span>
              </p>
            </div>
          </div>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-teal-dark mb-2.5">
                Email Address
              </label>
              <input
                type="email"
                value={profileData.email}
                onChange={e => setProfileData({ ...profileData, email: e.target.value })}
                className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-teal-dark focus:ring-2 focus:ring-teal-light focus:ring-opacity-20 transition-all text-base text-gray-900 placeholder-gray-400 min-h-[44px]"
                placeholder="your@email.com"
              />
            </div>
          </div>
        </div>

        {/* Password Section */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-teal-light shadow-sm hover:shadow-md transition-shadow mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white border-2 border-teal-light rounded-xl flex items-center justify-center shadow-sm">
                <svg
                  className="w-6 h-6 text-teal-medium"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-teal-dark mb-1">Password</h3>
                <p className="text-sm text-gray-600">Update your account password</p>
              </div>
            </div>
            <button
              onClick={() => setShowPasswordChange(!showPasswordChange)}
              className="px-5 py-3 bg-white text-teal-medium border-2 border-teal-light hover:bg-teal-lightest rounded-lg font-semibold text-sm transition-all shadow-sm hover:shadow-md min-h-[44px] whitespace-nowrap"
            >
              {showPasswordChange ? 'Cancel' : 'Change Password'}
            </button>
          </div>
          {showPasswordChange && (
            <div className="space-y-5 pt-4 border-t-2 border-teal-light">
              <div>
                <label className="block text-sm font-semibold text-teal-dark mb-2.5">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={e =>
                    setPasswordData({
                      ...passwordData,
                      currentPassword: e.target.value,
                    })
                  }
                  className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-teal-dark focus:ring-2 focus:ring-teal-light focus:ring-opacity-20 transition-all text-base text-gray-900 placeholder-gray-400 min-h-[44px]"
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-teal-dark mb-2.5">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={e =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                  className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-teal-dark focus:ring-2 focus:ring-teal-light focus:ring-opacity-20 transition-all text-base text-gray-900 placeholder-gray-400 min-h-[44px]"
                  placeholder="Enter new password"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-teal-dark mb-2.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={e =>
                    setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-teal-dark focus:ring-2 focus:ring-teal-light focus:ring-opacity-20 transition-all text-base text-gray-900 placeholder-gray-400 min-h-[44px]"
                  placeholder="Confirm new password"
                />
              </div>
              <button
                onClick={changePassword}
                disabled={isChangingPassword}
                className="w-full bg-teal-dark hover:bg-teal-darkest text-white py-3.5 px-5 rounded-lg font-semibold disabled:bg-gray-400 transition-all shadow-sm hover:shadow-md min-h-[44px] flex items-center justify-center gap-2"
              >
                {isChangingPassword ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Changing...</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Update Password</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Other Account Sections */}
        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <div className="border-2 border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-lg text-teal-dark mb-2">Plan &amp; Billing</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Upgrade plans or download invoices.
            </p>
          </div>
          <div className="border-2 border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-lg text-teal-dark mb-2">Household Access</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Invite, remove, or update connected caregivers.
            </p>
          </div>
        </div>

        {/* Save button */}
        <div className="bg-teal-dark rounded-xl p-1.5 shadow-md hover:shadow-lg transition-shadow">
          <button
            onClick={saveProfile}
            disabled={isSavingProfile}
            className="w-full bg-teal-dark hover:bg-teal-darkest text-white py-3.5 px-6 rounded-lg font-semibold text-base disabled:bg-gray-400 transition-all flex items-center justify-center gap-2 min-h-[44px]"
          >
            {isSavingProfile ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>Save Account</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AccountView;
