/**
 * useContactsApi - Contact Data Operations
 *
 * Handles all contact CRUD operations and API communication.
 *
 * ACTOR: Infrastructure/Operations
 * REASON TO CHANGE: API changes, error handling, caching strategy
 */

import React from 'react';
import { apiGet, apiPost, apiPut } from '../../apiClient.js';
import { toBackendRelationship } from '../../utils/relationshipMapping.js';
import { mapFormDataToContact } from './contactMapper.js';

export function useContactsApi(username, isAuthenticated = true) {
  const [contacts, setContacts] = React.useState([]);
  const [isLoadingContacts, setIsLoadingContacts] = React.useState(false);
  const [isSavingContact, setIsSavingContact] = React.useState(false);
  const [error, setError] = React.useState('');

  const loadContacts = React.useCallback(
    async (authOverride = isAuthenticated) => {
      if (!username || !authOverride) {
        setContacts([]);
        return;
      }
      setIsLoadingContacts(true);
      try {
        const response = await apiGet(`/api/contacts?username=${encodeURIComponent(username)}`);
        if (response.ok) {
          const data = await response.json();
          setContacts(data.contacts || []);
        } else if (response.status === 401) {
          setContacts([]);
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error('Failed to load contacts:', response.status, errorData);
          setError(`Failed to load contacts: ${errorData.error || 'Unknown error'}`);
        }
      } catch (err) {
        console.error('Error loading contacts:', err);
        setError('Failed to load contacts');
      } finally {
        setIsLoadingContacts(false);
      }
    },
    [username, isAuthenticated]
  );

  const saveContact = React.useCallback(
    async (contactFormData, editingContact = null) => {
      if (!username || !contactFormData.contact_name.trim()) {
        setError('Contact name is required');
        return null;
      }
      if (!contactFormData.relationship) {
        setError('Relationship is required');
        return null;
      }

      setIsSavingContact(true);
      setError('');

      try {
        // Use mapper to transform form data to contact API format
        const contactData = mapFormDataToContact(contactFormData, toBackendRelationship);
        const path = editingContact ? `/api/contacts/${editingContact.id}` : '/api/contacts';
        const method = editingContact ? apiPut : apiPost;

        const payload = {
          username,
          ...contactData,
        };

        const response = await method(path, payload);

        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          const text = await response.text();
          if (!text) throw new Error('Empty response from server');
          data = JSON.parse(text);
        }

        if (response.ok) {
          // Reload contacts after save
          await loadContacts();
          setTimeout(() => loadContacts(), 500);
          return data;
        } else {
          const errorMessage =
            data.error || data.message || `Failed to save contact (Status: ${response.status})`;
          setError(errorMessage);
          console.error('Contact save failed:', response.status, errorMessage);
          return null;
        }
      } catch (err) {
        console.error('Error saving contact:', err);
        setError(err.message || 'Failed to save contact. Please try again.');
        return null;
      } finally {
        setIsSavingContact(false);
      }
    },
    [username, loadContacts]
  );

  const deleteContact = React.useCallback(
    async contactId => {
      if (!username) return false;
      if (!window.confirm('Are you sure you want to delete this contact?')) return false;

      try {
        const response = await apiPut(
          `/api/contacts/${contactId}?username=${encodeURIComponent(username)}`,
          { _method: 'DELETE' }
        );
        const data = await response.json();
        if (response.ok) {
          await loadContacts();
          return true;
        } else {
          setError(data.error || 'Failed to delete contact');
          return false;
        }
      } catch (err) {
        console.error('Error deleting contact:', err);
        setError('Failed to delete contact. Please try again.');
        return false;
      }
    },
    [username, loadContacts]
  );

  // Initial load
  React.useEffect(() => {
    loadContacts(isAuthenticated);
  }, [loadContacts, isAuthenticated]);

  return {
    // State
    contacts,
    isLoadingContacts,
    isSavingContact,
    error,
    setError,

    // Operations
    loadContacts,
    saveContact,
    deleteContact,
  };
}

export default useContactsApi;
