/**
 * PrivacySettingsWrapper - Wrapper component for privacy settings
 *
 * Handles privacy settings state management and renders the PrivacySettings component
 * inside a SettingsCard wrapper. Uses useProfile hook for data management.
 */

import React from 'react';
import PrivacySettings from '../profile/PrivacySettings.jsx';
import { SettingsCard, SettingsIcons } from './SettingsCard.jsx';
import { useProfile } from '../../features/profile';
import { apiGet } from '../../apiClient.js';

/**
 * PrivacySettingsWrapper component
 * @param {Object} props
 * @param {string} props.username - Current user's username
 */
export function PrivacySettingsWrapper({ username }) {
  const { privacySettings, loadPrivacySettings, updatePrivacySettings } = useProfile(username);
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

  const handleChange = React.useCallback(
    async newSettings => {
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
    },
    [updatePrivacySettings]
  );

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
      <SettingsCard icon={SettingsIcons.lock} title="Privacy Settings" description="">
        <div className="flex items-center justify-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-teal-medium" />
        </div>
      </SettingsCard>
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
    <SettingsCard
      icon={SettingsIcons.lock}
      title="Privacy Settings"
      description="Control what information your co-parent can see about you"
    >
      <PrivacySettings
        settings={currentSettings}
        onChange={handleChange}
        onPreviewCoParentView={handlePreview}
        isSaving={isSaving}
      />
    </SettingsCard>
  );
}

export default PrivacySettingsWrapper;
