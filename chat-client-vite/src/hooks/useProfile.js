import React from 'react';
import { apiGet, apiPost, apiPut } from '../apiClient.js';

export function useProfile(username) {
  const [profileData, setProfileData] = React.useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    display_name: '',
    address: '',
    additional_context: '',
    profile_picture: '',
    household_members: '',
    occupation: '',
    communication_style: '',
    communication_triggers: '',
    communication_goals: '',
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

  React.useEffect(() => {
    const loadProfile = async () => {
      if (!username) return;
      setIsLoadingProfile(true);
      try {
        const response = await apiGet(
          `/api/user/profile?username=${encodeURIComponent(username)}`,
        );
        if (response.ok) {
          const data = await response.json();
          setProfileData({
            username: data.username || username,
            email: data.email || '',
            first_name: data.first_name || '',
            last_name: data.last_name || '',
            display_name: data.display_name || '',
            address: data.address || '',
            additional_context: data.additional_context || '',
            profile_picture: data.profile_picture || '',
            household_members: data.household_members || '',
            occupation: data.occupation || '',
            communication_style: data.communication_style || '',
            communication_triggers: data.communication_triggers || '',
            communication_goals: data.communication_goals || '',
          });
        }
      } catch (err) {
        console.error('Error loading profile (Vite):', err);
        setError('Failed to load profile');
      } finally {
        setIsLoadingProfile(false);
      }
    };
    loadProfile();
  }, [username]);

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
        email:
          profileDataWithoutUsername.email !== undefined
            ? profileDataWithoutUsername.email
            : null,
        first_name:
          profileDataWithoutUsername.first_name !== undefined
            ? profileDataWithoutUsername.first_name
            : null,
        last_name:
          profileDataWithoutUsername.last_name !== undefined
            ? profileDataWithoutUsername.last_name
            : null,
        display_name:
          profileDataWithoutUsername.display_name !== undefined
            ? profileDataWithoutUsername.display_name
            : null,
        address:
          profileDataWithoutUsername.address !== undefined
            ? profileDataWithoutUsername.address
            : null,
        additional_context:
          profileDataWithoutUsername.additional_context !== undefined
            ? profileDataWithoutUsername.additional_context
            : null,
        profile_picture:
          profileDataWithoutUsername.profile_picture !== undefined
            ? profileDataWithoutUsername.profile_picture
            : null,
        household_members:
          profileDataWithoutUsername.household_members !== undefined
            ? profileDataWithoutUsername.household_members
            : null,
        occupation:
          profileDataWithoutUsername.occupation !== undefined
            ? profileDataWithoutUsername.occupation
            : null,
        communication_style:
          profileDataWithoutUsername.communication_style !== undefined
            ? profileDataWithoutUsername.communication_style
            : null,
        communication_triggers:
          profileDataWithoutUsername.communication_triggers !== undefined
            ? profileDataWithoutUsername.communication_triggers
            : null,
        communication_goals:
          profileDataWithoutUsername.communication_goals !== undefined
            ? profileDataWithoutUsername.communication_goals
            : null,
      };

      const response = await apiPut('/api/user/profile', requestBody);
      const text = await response.text();
      if (!text) {
        throw new Error('Empty response from server');
      }
      const data = JSON.parse(text);

      if (response.ok) {
        if (data.username && data.username !== username) {
          const updatedUsername = data.username;
          localStorage.setItem('username', updatedUsername);
          setProfileData((prev) => ({ ...prev, username: updatedUsername }));
        }
        
        // Reload profile data to ensure UI is in sync
        const reloadResponse = await apiGet(
          `/api/user/profile?username=${encodeURIComponent(data.username || username)}`,
        );
        if (reloadResponse.ok) {
          const reloadData = await reloadResponse.json();
          setProfileData({
            username: reloadData.username || data.username || username,
            email: reloadData.email || '',
            first_name: reloadData.first_name || '',
            last_name: reloadData.last_name || '',
            display_name: reloadData.display_name || '',
            address: reloadData.address || '',
            additional_context: reloadData.additional_context || '',
            profile_picture: reloadData.profile_picture || '',
            household_members: reloadData.household_members || '',
            occupation: reloadData.occupation || '',
            communication_style: reloadData.communication_style || '',
            communication_triggers: reloadData.communication_triggers || '',
            communication_goals: reloadData.communication_goals || '',
          });
        }
        
        // Success - toast notification is handled by ProfilePanel component
      } else {
        const errorMessage =
          data.error || data.message || `Failed to save profile (Status: ${response.status})`;
        setError(errorMessage);
        alert(`Failed to save profile: ${errorMessage}`);
      }
    } catch (err) {
      console.error('Error saving profile (Vite):', err);
      setError(
        err.message ||
          'Failed to save profile. Please check your connection and try again.'
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

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
      console.error('Error changing password (Vite):', err);
      setError('Failed to change password. Please try again.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return {
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
  };
}


