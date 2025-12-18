import React from 'react';
import { PWAInstallButton } from '../components/PWAInstallButton.jsx';
import PrivacySettings from '../components/profile/PrivacySettings.jsx';
import { useProfile } from '../hooks/useProfile.js';
import { apiGet } from '../apiClient.js';

/**
 * PrivacySettingsWrapper - Wrapper component that handles privacy settings state
 * Uses useProfile hook to load and manage privacy settings
 */
function PrivacySettingsWrapper({ username }) {
  const {
    privacySettings,
    loadPrivacySettings,
    updatePrivacySettings,
  } = useProfile(username);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await loadPrivacySettings();
      setIsLoading(false);
    };
    if (username) {
      load();
    }
  }, [username, loadPrivacySettings]);

  const handleChange = React.useCallback(async (newSettings) => {
    setIsSaving(true);
    try {
      const result = await updatePrivacySettings(newSettings);
      if (!result?.success) {
        console.error('Failed to update privacy settings:', result?.error);
      }
    } catch (error) {
      console.error('Error updating privacy settings:', error);
    } finally {
      setIsSaving(false);
    }
  }, [updatePrivacySettings]);

  const handlePreview = React.useCallback(async () => {
    try {
      const response = await apiGet('/api/profile/preview-coparent-view');
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Failed to load preview');
    } catch (error) {
      console.error('Error loading preview:', error);
      throw error;
    }
  }, []);

  if (isLoading) {
    return (
      <div className="border-2 border-teal-light rounded-2xl p-8 bg-white shadow-sm">
        <div className="flex items-center justify-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-teal-medium" />
        </div>
      </div>
    );
  }

  // Default settings if none loaded (must use snake_case to match PrivacySettings component)
  const defaultSettings = {
    personal_visibility: 'shared',
    work_visibility: 'private',
    health_visibility: 'private',
    financial_visibility: 'private',
    background_visibility: 'shared',
    field_overrides: '{}',
  };

  // Check if privacySettings has the correct snake_case keys
  // The API returns snake_case, but the hook's initial state might have camelCase
  const hasSnakeCaseKeys = privacySettings && 'personal_visibility' in privacySettings;
  const currentSettings = hasSnakeCaseKeys ? privacySettings : defaultSettings;

  return (
    <div className="border-2 border-teal-light rounded-2xl p-8 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-teal-medium flex items-center justify-center shrink-0 shadow-md">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-teal-dark mb-2">Privacy Settings</h3>
          <p className="text-base text-gray-600 mb-4 leading-relaxed">
            Control what information your co-parent can see about you
          </p>
        </div>
      </div>
      <PrivacySettings
        settings={currentSettings}
        onChange={handleChange}
        onPreviewCoParentView={handlePreview}
        isSaving={isSaving}
      />
    </div>
  );
}

/**
 * SettingsView - Settings page with notifications, privacy, and invite management
 *
 * Extracted from ChatRoom.jsx for better code organization.
 */
export function SettingsView({
  username,
  notifications,
  notificationPrefs,
  setNotificationPrefs,
  hasCoParentConnected,
  inviteLink,
  inviteCode,
  inviteError,
  isLoadingInvite,
  inviteCopied,
  setInviteCopied,
  setInviteLink,
  setInviteCode,
  manualInviteCode,
  setManualInviteCode,
  isAcceptingInvite,
  onLoadInvite,
  onCopyInvite,
  onManualAcceptInvite,
}) {
  return (
    <div className="bg-white rounded-2xl border-2 border-teal-light shadow-lg overflow-hidden">
      <div className="p-8 sm:p-10 space-y-8">
        <div>
          <h2 className="text-3xl font-semibold text-teal-dark mb-3">Settings</h2>
        </div>

        {/* PWA Install Section */}
        <div className="mb-4">
          <PWAInstallButton />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Notifications Settings */}
          <div className="border-2 border-teal-light rounded-2xl p-8 bg-white shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-teal-medium flex items-center justify-center shrink-0 shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-teal-dark mb-2">Notifications</h3>
                <p className="text-base text-gray-600 mb-6 leading-relaxed">
                  Get notified when your co-parent sends you a message
                </p>

                {notifications.isSupported ? (
                  <div className="space-y-3">
                    {notifications.permission === 'granted' ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-teal-dark bg-teal-lightest px-3 py-2 rounded-lg">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="font-medium">Notifications enabled</span>
                        </div>
                        <button
                          onClick={() => {
                            notifications.showNotification({
                              username: 'Co-parent',
                              text: 'This is a test notification! You will see this every time a new message arrives.',
                              id: 'test-' + Date.now(),
                              timestamp: new Date().toISOString()
                            });
                          }}
                          className="w-full px-5 py-3 bg-white text-teal-medium border-2 border-teal-medium rounded-lg font-semibold hover:bg-teal-lightest transition-all min-h-[44px] shadow-sm hover:shadow-md"
                        >
                          Test Notification
                        </button>
                      </div>
                    ) : notifications.permission === 'denied' ? (
                      <div className="text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
                        <p className="font-medium mb-1">Notifications blocked</p>
                        <p className="text-xs">Please enable notifications in your browser settings</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">
                          <p className="font-medium mb-1">Get notified of new messages</p>
                          <p className="text-xs text-gray-600">Enable notifications to receive alerts when your co-parent sends a message, even when the app is closed.</p>
                        </div>
                        <button
                          onClick={notifications.requestPermission}
                          className="w-full px-5 py-3 bg-teal-medium text-white rounded-lg font-semibold hover:bg-teal-dark transition-all shadow-sm hover:shadow-md min-h-[44px]"
                        >
                          Enable Notifications
                        </button>
                      </div>
                    )}

                    {notifications.permission === 'granted' && (
                      <div className="space-y-3 pt-3 border-t border-teal-light">
                        <p className="text-sm font-medium text-teal-dark">Notification Preferences</p>
                        <div className="space-y-2">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notificationPrefs.newMessages}
                              onChange={(e) => setNotificationPrefs(prev => ({ ...prev, newMessages: e.target.checked }))}
                              className="w-5 h-5 text-teal-medium border-teal-light rounded focus:ring-teal-medium focus:ring-2"
                            />
                            <span className="text-sm text-gray-700">New messages from co-parent</span>
                          </label>
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notificationPrefs.taskReminders}
                              onChange={(e) => setNotificationPrefs(prev => ({ ...prev, taskReminders: e.target.checked }))}
                              className="w-5 h-5 text-teal-medium border-teal-light rounded focus:ring-teal-medium focus:ring-2"
                            />
                            <span className="text-sm text-gray-700">Task reminders</span>
                          </label>
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notificationPrefs.invitations}
                              onChange={(e) => setNotificationPrefs(prev => ({ ...prev, invitations: e.target.checked }))}
                              className="w-5 h-5 text-teal-medium border-teal-light rounded focus:ring-teal-medium focus:ring-2"
                            />
                            <span className="text-sm text-gray-700">Invitation requests</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                    Notifications are not supported in this browser
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Privacy Settings */}
          <PrivacySettingsWrapper username={username} />
        </div>

        {/* Send Invite Section - Always visible when no co-parent connected */}
        {!hasCoParentConnected && (
          <div className="border-2 border-emerald-300 rounded-2xl p-8 bg-emerald-50 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0 shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-emerald-800 mb-2">Invite Someone to Chat</h3>
                <p className="text-base text-emerald-700 mb-4 leading-relaxed">
                  Generate a link or code to share so they can join your private chat room.
                </p>
                {inviteLink ? (
                  <div className="space-y-3">
                    {inviteCode && (
                      <div>
                        <label className="block text-xs font-medium text-emerald-800 mb-1">Invite Code</label>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-white border-2 border-emerald-200 rounded-lg p-3 text-center">
                            <span className="text-xl font-mono font-bold text-emerald-800 tracking-wider">{inviteCode}</span>
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              await navigator.clipboard.writeText(inviteCode);
                              setInviteCopied(true);
                              setTimeout(() => setInviteCopied(false), 2000);
                            }}
                            className="p-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                          >
                            {inviteCopied ? '✓' : 'Copy'}
                          </button>
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-medium text-emerald-800 mb-1">Invite Link</label>
                      <div className="p-3 bg-white rounded-lg border-2 border-emerald-200 break-all text-emerald-800 font-mono text-xs">
                        {inviteLink}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={onCopyInvite}
                        className="flex-1 px-4 py-3 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-all"
                      >
                        {inviteCopied ? 'Copied!' : 'Copy Link'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setInviteLink(''); setInviteCode(''); }}
                        className="px-4 py-3 rounded-lg border-2 border-emerald-300 text-emerald-700 font-semibold hover:bg-emerald-100 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={onLoadInvite}
                    disabled={isLoadingInvite}
                    className="w-full px-5 py-3 rounded-lg bg-emerald-600 text-white text-base font-semibold hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 min-h-[44px] shadow-sm hover:shadow-md"
                  >
                    {isLoadingInvite ? (
                      <>
                        <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Generate Invite Link</span>
                      </>
                    )}
                  </button>
                )}
                {inviteError && (
                  <div className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                    {inviteError}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Enter Invite Code Section */}
        <div className="border-2 border-teal-light rounded-2xl p-8 bg-white shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-medium flex items-center justify-center shrink-0 shadow-md">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-teal-dark mb-2">Enter Invite Code</h3>
              <p className="text-base text-gray-600 mb-4 leading-relaxed">
                Have an invite code? Enter it here to connect and start chatting.
              </p>
              <div className="space-y-3">
                <input
                  type="text"
                  value={manualInviteCode}
                  onChange={(e) => setManualInviteCode(e.target.value.toUpperCase())}
                  placeholder="Enter code (e.g., LZ-ABC123)"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-teal-medium focus:ring-2 focus:ring-teal-light focus:ring-opacity-20 text-gray-900 text-base min-h-[44px] transition-all"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      onManualAcceptInvite();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={onManualAcceptInvite}
                  disabled={isAcceptingInvite || !manualInviteCode.trim()}
                  className="w-full px-5 py-3 rounded-lg bg-teal-medium text-white text-base font-semibold hover:bg-teal-dark disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 min-h-[44px] shadow-sm hover:shadow-md"
                >
                  {isAcceptingInvite ? (
                    <>
                      <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      <span>Connect</span>
                    </>
                  )}
                </button>
                {inviteError && (
                  <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                    {inviteError}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsView;
