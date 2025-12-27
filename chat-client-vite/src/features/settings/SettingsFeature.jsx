/**
 * SettingsView - Settings page with notifications, privacy, and invite management
 *
 * Refactored to use extracted presentational components for each settings section.
 * This component now acts as an orchestrator, delegating rendering to child components.
 */

import React from 'react';
import { PWAInstallButton } from '../pwa/PWAInstallButton.jsx';
import { NotificationSettingsCard } from '../notifications/components/NotificationSettingsCard.jsx';
import { InviteGenerationCard } from '../invitations/components/InviteGenerationCard.jsx';
import { InviteCodeEntryCard } from '../invitations/components/InviteCodeEntryCard.jsx';
import { PrivacySettingsWrapper } from '../profile/components/PrivacySettingsWrapper.jsx';

/**
 * SettingsView component
 *
 * Props have been grouped into logical objects:
 * - notifications: Browser notification API state
 * - notificationPrefs: User's notification preferences
 * - inviteState: All invite-related state (link, code, error, loading states)
 * - inviteHandlers: All invite-related handlers
 *
 * @param {Object} props
 * @param {string} props.username - Current user's username
 * @param {Object} props.notifications - Notification state from usePWA hook
 * @param {Object} props.notificationPrefs - User notification preferences
 * @param {Function} props.setNotificationPrefs - Update notification preferences
 * @param {boolean} props.hasCoParentConnected - Whether co-parent is connected
 * @param {Object} props.inviteState - Grouped invite state
 * @param {Object} props.inviteHandlers - Grouped invite handlers
 */
export function SettingsView({
  username,
  notifications,
  notificationPrefs,
  setNotificationPrefs,
  hasCoParentConnected,
  inviteState,
  inviteHandlers,
}) {
  const handleCopyCode = async () => {
    const { inviteCode, setInviteCopied } = inviteState;
    if (!inviteCode) return;
    try {
      await navigator.clipboard.writeText(inviteCode);
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2000);
    } catch {
      // Clipboard API failed
    }
  };

  const handleCloseInvite = () => {
    inviteState.setInviteLink('');
    inviteState.setInviteCode('');
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-teal-light shadow-lg">
      <div className="p-3 sm:p-4 md:p-6 space-y-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-semibold text-teal-dark mb-2">Settings</h2>
        </div>

        {/* PWA Install Section */}
        <div className="mb-3">
          <PWAInstallButton />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Notifications Settings */}
          <NotificationSettingsCard
            notifications={notifications}
            notificationPrefs={notificationPrefs}
            onPrefsChange={setNotificationPrefs}
          />

          {/* Privacy Settings */}
          <PrivacySettingsWrapper username={username} />
        </div>

        {/* Send Invite Section - Only shown when no co-parent connected */}
        {!hasCoParentConnected && (
          <InviteGenerationCard
            inviteState={inviteState}
            onGenerateInvite={inviteHandlers.onLoadInvite}
            onCopyLink={inviteHandlers.onCopyInvite}
            onCopyCode={handleCopyCode}
            onClose={handleCloseInvite}
          />
        )}

        {/* Enter Invite Code Section */}
        <InviteCodeEntryCard
          manualInviteCode={inviteState.manualInviteCode}
          onCodeChange={inviteState.setManualInviteCode}
          onSubmit={inviteHandlers.onManualAcceptInvite}
          isAccepting={inviteState.isAcceptingInvite}
          error={inviteState.inviteError}
        />
      </div>
    </div>
  );
}

/**
 * Legacy prop adapter for backwards compatibility
 *
 * This wrapper converts the old 20+ individual props format to the new grouped format.
 * Use SettingsView directly with grouped props for new code.
 */
export function SettingsViewLegacy({
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
  // Group invite state
  const inviteState = {
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
  };

  // Group invite handlers
  const inviteHandlers = {
    onLoadInvite,
    onCopyInvite,
    onManualAcceptInvite,
  };

  return (
    <SettingsView
      username={username}
      notifications={notifications}
      notificationPrefs={notificationPrefs}
      setNotificationPrefs={setNotificationPrefs}
      hasCoParentConnected={hasCoParentConnected}
      inviteState={inviteState}
      inviteHandlers={inviteHandlers}
    />
  );
}

export default SettingsViewLegacy;
