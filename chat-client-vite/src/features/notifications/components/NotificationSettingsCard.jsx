/**
 * NotificationSettingsCard - Notification preferences UI
 *
 * Presentational component for browser notification settings.
 * All state management is handled by parent via props.
 */

import React from 'react';
import { SettingsCard, SettingsIcons } from '../../../components/ui/SettingsCard.jsx';

/**
 * NotificationSettingsCard component
 * @param {Object} props
 * @param {Object} props.notifications - Notification state from usePWA hook
 * @param {Object} props.notificationPrefs - User notification preferences
 * @param {Function} props.onPrefsChange - Callback to update preferences
 */
export function NotificationSettingsCard({ notifications, notificationPrefs, onPrefsChange }) {
  const handleTestNotification = () => {
    notifications.showNotification({
      username: 'Co-parent',
      text: 'This is a test notification! You will see this every time a new message arrives.',
      id: 'test-' + Date.now(),
      timestamp: new Date().toISOString(),
    });
  };

  const handlePrefChange = (key, value) => {
    onPrefsChange(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <SettingsCard
      icon={SettingsIcons.notification}
      title="Notifications"
      description="Get notified when your co-parent sends you a message"
    >
      {notifications.isSupported ? (
        <div className="space-y-3">
          {notifications.permission === 'granted' ? (
            <NotificationsEnabled
              notificationPrefs={notificationPrefs}
              onPrefChange={handlePrefChange}
              onTestNotification={handleTestNotification}
            />
          ) : notifications.permission === 'denied' ? (
            <NotificationsBlocked />
          ) : (
            <NotificationsPrompt onRequestPermission={notifications.requestPermission} />
          )}
        </div>
      ) : (
        <NotificationsUnsupported />
      )}
    </SettingsCard>
  );
}

/**
 * Notifications enabled state with preferences
 */
function NotificationsEnabled({ notificationPrefs, onPrefChange, onTestNotification }) {
  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-teal-dark bg-teal-lightest px-3 py-2 rounded-lg">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span className="font-medium">Notifications enabled</span>
        </div>
        <button
          onClick={onTestNotification}
          className="w-full px-5 py-3 bg-white text-teal-medium border-2 border-teal-medium rounded-lg font-semibold hover:bg-teal-lightest transition-all min-h-[44px] shadow-sm hover:shadow-md"
        >
          Test Notification
        </button>
      </div>

      <div className="space-y-3 pt-3 border-t border-teal-light">
        <p className="text-sm font-medium text-teal-dark">Notification Preferences</p>
        <div className="space-y-2">
          <PreferenceCheckbox
            label="New messages from co-parent"
            checked={notificationPrefs.newMessages}
            onChange={checked => onPrefChange('newMessages', checked)}
          />
          <PreferenceCheckbox
            label="Task reminders"
            checked={notificationPrefs.taskReminders}
            onChange={checked => onPrefChange('taskReminders', checked)}
          />
          <PreferenceCheckbox
            label="Invitation requests"
            checked={notificationPrefs.invitations}
            onChange={checked => onPrefChange('invitations', checked)}
          />
        </div>
      </div>
    </>
  );
}

/**
 * Notifications blocked by browser
 */
function NotificationsBlocked() {
  return (
    <div className="text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
      <p className="font-medium mb-1">Notifications blocked</p>
      <p className="text-xs">Please enable notifications in your browser settings</p>
    </div>
  );
}

/**
 * Prompt to enable notifications
 */
function NotificationsPrompt({ onRequestPermission }) {
  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">
        <p className="font-medium mb-1">Get notified of new messages</p>
        <p className="text-xs text-gray-600">
          Enable notifications to receive alerts when your co-parent sends a message, even when the
          app is closed.
        </p>
      </div>
      <button
        onClick={onRequestPermission}
        className="w-full px-5 py-3 bg-teal-medium text-white rounded-lg font-semibold hover:bg-teal-dark transition-all shadow-sm hover:shadow-md min-h-[44px]"
      >
        Enable Notifications
      </button>
    </div>
  );
}

/**
 * Notifications not supported
 */
function NotificationsUnsupported() {
  return (
    <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
      Notifications are not supported in this browser
    </div>
  );
}

/**
 * Preference checkbox
 */
function PreferenceCheckbox({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="w-5 h-5 text-teal-medium border-teal-light rounded focus:ring-teal-medium focus:ring-2"
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}

export default NotificationSettingsCard;
