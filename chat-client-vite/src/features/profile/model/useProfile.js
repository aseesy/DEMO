import React from 'react';
import { apiGet, apiPost } from '../../../apiClient.js';
import {
  useProfileQuery,
  useSaveProfileMutation,
  useSaveProfileSectionMutation,
  useUpdatePrivacySettingsMutation,
} from './useProfileQueries.js';

/**
 * Extended useProfile hook - Feature 010: Comprehensive User Profile System
 * Manages all profile data including personal, work, health, financial, and background sections.
 *
 * Migrated to TanStack Query for automatic caching, background refetching, and cache invalidation.
 */
export function useProfile(username) {
  // TanStack Query hooks
  const {
    data: profileQueryData,
    isLoading: isLoadingProfile,
    error: profileError,
  } = useProfileQuery(username, !!username);

  const saveProfileMutation = useSaveProfileMutation();
  const saveSectionMutation = useSaveProfileSectionMutation();
  const updatePrivacySettingsMutation = useUpdatePrivacySettingsMutation();

  // Initialize profile data from query result or defaults
  const [profileData, setProfileData] = React.useState({
    // Core fields
    username: '',
    email: '',

    // Personal Information
    first_name: '',
    last_name: '',
    display_name: '',
    preferred_name: '',
    pronouns: '',
    birthdate: '',
    language: 'en',
    timezone: '',
    phone: '',
    city: '',
    state: '',
    zip: '',
    address: '',

    // Work & Schedule
    employment_status: '',
    employer: '',
    work_schedule: '',
    schedule_flexibility: '',
    commute_time: '',
    travel_required: '',

    // Health & Wellbeing (private, encrypted)
    health_physical_conditions: '',
    health_physical_limitations: '',
    health_mental_conditions: '',
    health_mental_treatment: '',
    health_mental_history: '',
    health_substance_history: '',
    health_in_recovery: '',
    health_recovery_duration: '',

    // Financial Context (private, encrypted)
    finance_income_level: '',
    finance_income_stability: '',
    finance_employment_benefits: '',
    finance_housing_status: '',
    finance_housing_type: '',
    finance_vehicles: '',
    finance_debt_stress: '',
    finance_support_paying: '',
    finance_support_receiving: '',

    // Background & Education
    background_birthplace: '',
    background_raised: '',
    background_family_origin: '',
    background_culture: '',
    background_religion: '',
    background_military: '',
    background_military_branch: '',
    background_military_status: '',
    education_level: '',
    education_field: '',

    // Existing fields
    additional_context: '',
    profile_picture: '',
    household_members: '',
    communication_style: '',
    communication_triggers: '',
    communication_goals: '',

    // Metadata
    profile_completion_percentage: 0,
    profile_last_updated: null,
  });

  // Sync profile data from query result
  React.useEffect(() => {
    if (profileQueryData) {
      setProfileData(profileQueryData.profileData);
      setPrivacySettings(profileQueryData.privacySettings);
      setIsOwnProfile(profileQueryData.isOwnProfile);
    }
  }, [profileQueryData]);

  const [privacySettings, setPrivacySettings] = React.useState({
    personalVisibility: 'shared',
    workVisibility: 'private',
    healthVisibility: 'private',
    financialVisibility: 'private',
    backgroundVisibility: 'shared',
    fieldOverrides: {},
  });

  const [isSavingProfile, setIsSavingProfile] = React.useState(false);
  const [showPasswordChange, setShowPasswordChange] = React.useState(false);
  const [passwordData, setPasswordData] = React.useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isChangingPassword, setIsChangingPassword] = React.useState(false);
  const [error, setError] = React.useState('');
  const [isOwnProfile, setIsOwnProfile] = React.useState(true);

  // Derive error from query error
  React.useEffect(() => {
    if (profileError) {
      setError(profileError.message || 'Failed to load profile');
    }
  }, [profileError]);

  // Update a single field
  const updateField = (fieldName, value) => {
    setProfileData(prev => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  // Update multiple fields at once
  const updateFields = updates => {
    setProfileData(prev => ({
      ...prev,
      ...updates,
    }));
  };

  // Save profile using TanStack Query mutation
  const saveProfile = async () => {
    if (!username) {
      console.error('[useProfile] saveProfile called but username is missing');
      return { success: false, error: 'Username is required' };
    }
    console.log('[useProfile] saveProfile called for username:', username);
    setIsSavingProfile(true);
    setError('');

    try {
      const newUsername = profileData.username?.trim();
      if (newUsername && newUsername !== username) {
        if (newUsername.length < 2 || newUsername.length > 20) {
          setError('Username must be between 2 and 20 characters');
          setIsSavingProfile(false);
          return { success: false, error: 'Username must be between 2 and 20 characters' };
        }
      }

      const data = await saveProfileMutation.mutateAsync({
        username,
        profileData,
      });

      // Update completion percentage from response
      if (data.completionPercentage !== undefined) {
        setProfileData(prev => ({
          ...prev,
          profile_completion_percentage: data.completionPercentage,
        }));
      }

      // TanStack Query automatically invalidates and refetches, no manual reload needed
      return { success: true, completionPercentage: data.completionPercentage };
    } catch (err) {
      console.error('Error saving profile - full error:', err);
      const errorMessage =
        err.message || 'Failed to save profile. Please check your connection and try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Save specific section only using TanStack Query mutation
  const saveSection = async sectionFields => {
    if (!username) return { success: false, error: 'Username required' };
    setIsSavingProfile(true);
    setError('');
    try {
      const data = await saveSectionMutation.mutateAsync({
        username,
        sectionFields,
        profileData,
      });

      // Update completion percentage from response
      if (data.completionPercentage !== undefined) {
        setProfileData(prev => ({
          ...prev,
          profile_completion_percentage: data.completionPercentage,
        }));
      }

      // TanStack Query automatically invalidates and refetches
      return { success: true, completionPercentage: data.completionPercentage };
    } catch (err) {
      console.error('Error saving section:', err);
      const errorMessage = err.message || 'Failed to save section';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Load privacy settings
  const loadPrivacySettings = React.useCallback(async () => {
    if (!username) return null;
    try {
      // Try the profile route first, fallback to user route
      let response = await apiGet('/api/profile/privacy/me');
      if (!response.ok) {
        response = await apiGet('/api/user/profile/privacy');
      }
      if (response.ok) {
        const data = await response.json();
        setPrivacySettings(data);
        return data;
      }
    } catch (err) {
      console.error('Error loading privacy settings:', err);
    }
    return null;
  }, [username]);

  // Update privacy settings using TanStack Query mutation
  const updatePrivacySettings = React.useCallback(
    async newSettings => {
      if (!username) return { success: false, error: 'Username required' };
      try {
        await updatePrivacySettingsMutation.mutateAsync(newSettings);
        setPrivacySettings(prev => ({ ...prev, ...newSettings }));
        // TanStack Query automatically invalidates and refetches
        return { success: true };
      } catch (err) {
        console.error('Error updating privacy settings:', err);
        return { success: false, error: err.message };
      }
    },
    [username, updatePrivacySettingsMutation]
  );

  // Get profile completion status
  const getCompletionStatus = async () => {
    if (!username) return null;
    try {
      const response = await apiGet(
        `/api/user/profile/completion?username=${encodeURIComponent(username)}`
      );
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.error('Error getting completion status:', err);
    }
    return null;
  };

  // Preview how co-parent sees profile
  const getCoParentPreview = async () => {
    if (!username) return null;
    try {
      const response = await apiGet('/api/profile/preview-coparent-view');
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.error('Error getting co-parent preview:', err);
    }
    return null;
  };

  // Change password
  const changePassword = async () => {
    if (!username) return;
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      setError('Please fill in all password fields');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    setIsChangingPassword(true);
    setError('');
    try {
      const response = await apiPost('/api/user/change-password', {
        username,
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      const data = await response.json();
      if (response.ok) {
        alert('Password updated successfully');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setShowPasswordChange(false);
      } else {
        setError(data.error || 'Failed to change password');
      }
    } catch (err) {
      console.error('Error changing password:', err);
      setError('Failed to change password. Please try again.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Calculate local completion percentage (for real-time feedback)
  const calculateLocalCompletion = React.useMemo(() => {
    const sections = {
      personal: [
        'first_name',
        'last_name',
        'preferred_name',
        'pronouns',
        'birthdate',
        'language',
        'timezone',
        'phone',
        'city',
        'state',
        'zip',
      ],
      work: [
        'employment_status',
        'employer',
        'work_schedule',
        'schedule_flexibility',
        'commute_time',
        'travel_required',
      ],
      health: [
        'health_physical_conditions',
        'health_physical_limitations',
        'health_mental_conditions',
        'health_mental_treatment',
        'health_mental_history',
        'health_substance_history',
        'health_in_recovery',
        'health_recovery_duration',
      ],
      financial: [
        'finance_income_level',
        'finance_income_stability',
        'finance_employment_benefits',
        'finance_housing_status',
        'finance_housing_type',
        'finance_vehicles',
        'finance_debt_stress',
        'finance_support_paying',
        'finance_support_receiving',
      ],
      background: [
        'background_birthplace',
        'background_raised',
        'background_family_origin',
        'background_culture',
        'background_religion',
        'background_military',
        'background_military_branch',
        'background_military_status',
        'education_level',
        'education_field',
      ],
    };

    let totalScore = 0;
    for (const [, fields] of Object.entries(sections)) {
      const filledFields = fields.filter(field => {
        const value = profileData[field];
        return value && value.toString().trim().length > 0;
      });
      totalScore += (filledFields.length / fields.length) * 20;
    }

    return Math.round(totalScore);
  }, [profileData]);

  return {
    // Data
    profileData,
    privacySettings,
    isOwnProfile,

    // Loading states
    isLoadingProfile,
    isSavingProfile,
    isChangingPassword,
    error,

    // Password change
    showPasswordChange,
    passwordData,

    // Setters
    setProfileData,
    setShowPasswordChange,
    setPasswordData,
    setError,

    // Actions
    updateField,
    updateFields,
    saveProfile,
    saveSection,
    loadPrivacySettings,
    updatePrivacySettings,
    getCompletionStatus,
    getCoParentPreview,
    changePassword,

    // Computed
    profileCompletion: calculateLocalCompletion,
  };
}
