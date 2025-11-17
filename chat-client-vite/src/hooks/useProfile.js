import React from 'react';
import { apiGet, apiPost, apiPut } from '../apiClient.js';

export function useProfile(username) {
  const [profileData, setProfileData] = React.useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    address: '',
    household_members: '',
    occupation: '',
    parenting_philosophy: '',
    personal_growth: '',
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
            address: data.address || '',
            household_members: data.household_members || '',
            occupation: data.occupation || '',
            parenting_philosophy: data.parenting_philosophy || '',
            personal_growth: data.personal_growth || '',
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
        address:
          profileDataWithoutUsername.address !== undefined
            ? profileDataWithoutUsername.address
            : null,
        household_members:
          profileDataWithoutUsername.household_members !== undefined
            ? profileDataWithoutUsername.household_members
            : null,
        occupation:
          profileDataWithoutUsername.occupation !== undefined
            ? profileDataWithoutUsername.occupation
            : null,
        parenting_philosophy:
          profileDataWithoutUsername.parenting_philosophy !== undefined
            ? profileDataWithoutUsername.parenting_philosophy
            : null,
        personal_growth:
          profileDataWithoutUsername.personal_growth !== undefined
            ? profileDataWithoutUsername.personal_growth
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
        alert('Profile saved successfully!');
      } else {
        const errorMessage =
          data.error || data.message || `Failed to save profile (Status: ${response.status})`;
        setError(errorMessage);
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


