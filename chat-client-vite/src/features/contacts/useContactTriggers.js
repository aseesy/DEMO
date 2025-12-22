/**
 * useContactTriggers - External Event Handling
 *
 * Handles external triggers that open the contact form:
 * - Smart task actions (e.g., "Add Co-parent" from onboarding)
 * - Contact suggestions from chat (e.g., "Would you like to add Vira?")
 * - Co-parent joined events
 *
 * ACTOR: Integration/Cross-feature
 * REASON TO CHANGE: New trigger sources, event format changes
 */

import React from 'react';
import { getWithMigration, removeWithMigration } from '../../utils/storageMigration.js';

/**
 * Hook to handle external triggers for contact operations
 *
 * @param {Object} options
 * @param {Function} options.openNewContactForm - Function to open form with initial data
 * @param {Function} options.loadContacts - Function to reload contacts
 * @param {boolean} options.isAuthenticated - Whether user is authenticated
 */
export function useContactTriggers({ openNewContactForm, loadContacts, isAuthenticated }) {
  // Handle smart-task triggered actions (e.g., Add Co-parent from onboarding)
  React.useEffect(() => {
    const pending = getWithMigration('liaizenSmartTask');
    if (!pending) return;

    if (pending === 'add_coparent') {
      openNewContactForm({ relationship: 'My Co-Parent' });
    }

    removeWithMigration('liaizenSmartTask');
  }, [openNewContactForm]);

  // Handle contact suggestion from chat (e.g., "Would you like to add Vira?")
  React.useEffect(() => {
    const addContactData = getWithMigration('liaizenAddContact');
    if (!addContactData) return;

    try {
      const data = JSON.parse(addContactData);
      if (data.name) {
        openNewContactForm({
          contact_name: data.name,
          notes: data.context || '',
        });
      }
    } catch (err) {
      console.error('Error parsing add contact data:', err);
    }

    removeWithMigration('liaizenAddContact');
  }, [openNewContactForm]);

  // Handle co-parent joined event - reload contacts
  React.useEffect(() => {
    const handleCoParentJoined = () => {
      // Reload contacts after a short delay to ensure backend has created them
      setTimeout(() => {
        loadContacts(isAuthenticated);
      }, 1000);
    };

    window.addEventListener('coparent-joined', handleCoParentJoined);

    return () => {
      window.removeEventListener('coparent-joined', handleCoParentJoined);
    };
  }, [loadContacts, isAuthenticated]);
}

export default useContactTriggers;
