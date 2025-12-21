import React from 'react';
import { apiGet, apiPost, apiPut } from '../apiClient.js';

/**
 * Extended useProfile hook - Feature 010: Comprehensive User Profile System
 * Manages all profile data including personal, work, health, financial, and background sections.
 */
export function useProfile(username) {
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
    occupation: '',
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

  const [privacySettings, setPrivacySettings] = React.useState({
    personalVisibility: 'shared',
    workVisibility: 'private',
    healthVisibility: 'private',
    financialVisibility: 'private',
    backgroundVisibility: 'shared',
    fieldOverrides: {},
  });

  const [isLoadingProfile, setIsLoadingProfile] = React.useState(false);
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

  // Load profile data
  React.useEffect(() => {
    const loadProfile = async () => {
      if (!username) return;
      setIsLoadingProfile(true);
      try {
        const response = await apiGet('/api/profile/me');
        if (response.ok) {
          const data = await response.json();
          console.log('DEBUG: Received profile data from API:', data);
          setProfileData({
            // Core fields
            username: data.username || username,
            email: data.email || '',

            // Personal Information
            first_name: data.first_name || '',
            last_name: data.last_name || '',
            display_name: data.display_name || '',
            preferred_name: data.preferred_name || '',
            pronouns: data.pronouns || '',
            birthdate: data.birthdate || '',
            language: data.language || 'en',
            timezone: data.timezone || '',
            phone: data.phone || '',
            city: data.city || '',
            state: data.state || '',
            zip: data.zip || '',
            address: data.address || '',

            // Work & Schedule
            employment_status: data.employment_status || '',
            occupation: data.occupation || '',
            employer: data.employer || '',
            work_schedule: data.work_schedule || '',
            schedule_flexibility: data.schedule_flexibility || '',
            commute_time: data.commute_time || '',
            travel_required: data.travel_required || '',

            // Health & Wellbeing
            health_physical_conditions: data.health_physical_conditions || '',
            health_physical_limitations: data.health_physical_limitations || '',
            health_mental_conditions: data.health_mental_conditions || '',
            health_mental_treatment: data.health_mental_treatment || '',
            health_mental_history: data.health_mental_history || '',
            health_substance_history: data.health_substance_history || '',
            health_in_recovery: data.health_in_recovery || '',
            health_recovery_duration: data.health_recovery_duration || '',

            // Financial Context
            finance_income_level: data.finance_income_level || '',
            finance_income_stability: data.finance_income_stability || '',
            finance_employment_benefits: data.finance_employment_benefits || '',
            finance_housing_status: data.finance_housing_status || '',
            finance_housing_type: data.finance_housing_type || '',
            finance_vehicles: data.finance_vehicles || '',
            finance_debt_stress: data.finance_debt_stress || '',
            finance_support_paying: data.finance_support_paying || '',
            finance_support_receiving: data.finance_support_receiving || '',

            // Background & Education
            background_birthplace: data.background_birthplace || '',
            background_raised: data.background_raised || '',
            background_family_origin: data.background_family_origin || '',
            background_culture: data.background_culture || '',
            background_religion: data.background_religion || '',
            background_military: data.background_military || '',
            background_military_branch: data.background_military_branch || '',
            background_military_status: data.background_military_status || '',
            education_level: data.education_level || '',
            education_field: data.education_field || '',

            // Existing fields
            additional_context: data.additional_context || '',
            profile_picture: data.profile_picture || '',
            household_members: data.household_members || '',
            communication_style: data.communication_style || '',
            communication_triggers: data.communication_triggers || '',
            communication_goals: data.communication_goals || '',

            // Metadata
            profile_completion_percentage: data.profile_completion_percentage || 0,
            profile_last_updated: data.profile_last_updated || null,
          });

          // Set privacy settings if available
          if (data.privacySettings) {
            setPrivacySettings(data.privacySettings);
          }
          setIsOwnProfile(data.isOwnProfile !== false);
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile');
      } finally {
        setIsLoadingProfile(false);
      }
    };
    loadProfile();
  }, [username]);

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

  // Save profile
  const saveProfile = async () => {
    if (!username) return;
    setIsSavingProfile(true);
    setError('');
    try {
      const newUsername = profileData.username?.trim();
      if (newUsername && newUsername !== username) {
        if (newUsername.length < 2 || newUsername.length > 20) {
          setError('Username must be between 2 and 20 characters');
          setIsSavingProfile(false);
          return;
        }
      }

      const { username: newUsernameFromProfile, ...profileDataWithoutUsername } = profileData;

      const requestBody = {
        currentUsername: username,
        username: newUsernameFromProfile || username,
        ...profileDataWithoutUsername,
      };

      console.log('DEBUG saveProfile - sending request body:', requestBody);
      console.log('DEBUG saveProfile - request body keys:', Object.keys(requestBody));

      const response = await apiPut('/api/profile/me', requestBody);
      console.log('DEBUG saveProfile - response status:', response.status);
      const data = await response.json();
      console.log('DEBUG saveProfile - response data:', data);

      if (response.ok) {
        if (data.username && data.username !== username) {
          const updatedUsername = data.username;
          localStorage.setItem('username', updatedUsername);
          setProfileData(prev => ({ ...prev, username: updatedUsername }));
        }

        // Update completion percentage from response
        if (data.completionPercentage !== undefined) {
          setProfileData(prev => ({
            ...prev,
            profile_completion_percentage: data.completionPercentage,
          }));
        }

        // Reload profile data to ensure UI is in sync
        const reloadResponse = await apiGet('/api/profile/me');
        if (reloadResponse.ok) {
          const reloadData = await reloadResponse.json();
          setProfileData(prev => ({
            ...prev,
            ...reloadData,
            username: reloadData.username || data.username || username,
          }));
        }

        return { success: true, completionPercentage: data.completionPercentage };
      } else {
        const errorMessage =
          data.error || data.message || `Failed to save profile (Status: ${response.status})`;
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (err) {
      console.error('Error saving profile - full error:', err);
      console.error('Error saving profile - stack:', err.stack);
      const errorMessage =
        err.message || 'Failed to save profile. Please check your connection and try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Save specific section only
  const saveSection = async sectionFields => {
    if (!username) return;
    setIsSavingProfile(true);
    setError('');
    try {
      const requestBody = {
        currentUsername: username,
      };

      // Only include the specified fields
      for (const field of sectionFields) {
        if (profileData[field] !== undefined) {
          requestBody[field] = profileData[field];
        }
      }

      const response = await apiPut('/api/user/profile', requestBody);
      const data = await response.json();

      if (response.ok) {
        if (data.completionPercentage !== undefined) {
          setProfileData(prev => ({
            ...prev,
            profile_completion_percentage: data.completionPercentage,
          }));
        }
        return { success: true, completionPercentage: data.completionPercentage };
      } else {
        const errorMessage = data.error || 'Failed to save section';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (err) {
      console.error('Error saving section:', err);
      setError('Failed to save section');
      return { success: false, error: err.message };
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

  // Update privacy settings
  const updatePrivacySettings = React.useCallback(
    async newSettings => {
      if (!username) return { success: false, error: 'Username required' };
      try {
        // Try the profile route first, fallback to user route
        let response = await apiPut('/api/profile/privacy/me', newSettings);
        if (!response.ok) {
          response = await apiPut('/api/user/profile/privacy', newSettings);
        }
        if (response.ok) {
          setPrivacySettings(prev => ({ ...prev, ...newSettings }));
          return { success: true };
        } else {
          const data = await response.json();
          return { success: false, error: data.error };
        }
      } catch (err) {
        console.error('Error updating privacy settings:', err);
        return { success: false, error: err.message };
      }
    },
    [username]
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
        'occupation',
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
    for (const [sectionName, fields] of Object.entries(sections)) {
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
