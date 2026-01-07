/**
 * useMediationContext Hook
 *
 * Responsibility: Build frontend mediation context (current state)
 *
 * What it does:
 * - Loads user profile data
 * - Loads contacts data
 * - Builds sender/receiver profiles for frontend pre-check
 * - Provides context for useMessageMediation
 *
 * What it does NOT do:
 * - ❌ Backend context building (that's done server-side with historical data)
 * - ❌ UI state management
 * - ❌ Network transport
 */

import React from 'react';
import { useProfile } from '../../profile/model/useProfile.js';
import { useContactsApi } from '../../contacts/model/useContactsApi.js';
import { buildMediationContext } from '../../../utils/profileBuilder.js';

/**
 * useMediationContext - Builds frontend mediation context
 *
 * @param {string} username - Current username
 * @param {boolean} isAuthenticated - Whether user is authenticated
 * @returns {Object} { senderProfile, receiverProfile, isLoading, error }
 */
export function useMediationContext(username, isAuthenticated) {
  // Load user profile
  const { profileData, isLoadingProfile } = useProfile(username);

  // Load contacts - useContactsApi already handles initial load via its own useEffect
  const { contacts, isLoadingContacts } = useContactsApi(username, isAuthenticated);

  // Build mediation context when data is available
  const mediationContext = React.useMemo(() => {
    // Return empty context if profile data not loaded yet
    // Contacts can be empty array (no contacts) or undefined (not loaded)
    if (!profileData) {
      return {
        sender: {},
        receiver: {},
        context: {},
      };
    }

    // Build context using profileBuilder utility
    // Use empty array if contacts not loaded yet
    return buildMediationContext({
      user: {
        profile: profileData,
      },
      contacts: Array.isArray(contacts) ? contacts : [],
      room: {
        type: 'private', // TODO: Get actual room type when available
      },
    });
  }, [profileData, contacts]);

  // Note: Removed manual loadContacts() call - useContactsApi already loads on mount
  // That useEffect was causing an infinite loop when user has 0 contacts

  const isLoading = isLoadingProfile || isLoadingContacts;

  return {
    senderProfile: mediationContext.sender || {},
    receiverProfile: mediationContext.receiver || {},
    context: mediationContext.context || {},
    isLoading,
    error: null, // TODO: Handle errors from profile/contacts loading
  };
}

export default useMediationContext;
