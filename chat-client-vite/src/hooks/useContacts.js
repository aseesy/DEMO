import React from 'react';
import { apiGet, apiPost, apiPut } from '../apiClient.js';

export function useContacts(username) {
  const [contacts, setContacts] = React.useState([]);
  const [isLoadingContacts, setIsLoadingContacts] = React.useState(false);
  const [showContactForm, setShowContactForm] = React.useState(false);
  const [contactSearch, setContactSearch] = React.useState('');
  const [editingContact, setEditingContact] = React.useState(null);
  const [contactFormData, setContactFormData] = React.useState({
    contact_name: '',
    contact_email: '',
    relationship: '',
    notes: '',
    separation_date: '',
    address: '',
    difficult_aspects: '',
    friction_situations: '',
    legal_matters: '',
    safety_concerns: '',
    substance_mental_health: '',
    neglect_abuse_concerns: '',
    additional_thoughts: '',
    other_parent: '',
    child_age: '',
    child_birthdate: '',
    school: '',
    phone: '',
    partner_duration: '',
    has_children: '',
    custody_arrangement: '',
    linked_contact_id: '',
  });
  const [isSavingContact, setIsSavingContact] = React.useState(false);
  const [error, setError] = React.useState('');

  // Handle smart-task triggered actions (e.g., Add Co-parent)
  React.useEffect(() => {
    const pending = localStorage.getItem('liaizen_smart_task');
    if (!pending) return;

    if (pending === 'add_coparent') {
      resetForm();
      setContactFormData((prev) => ({
        ...prev,
        relationship: 'My Co-Parent',
      }));
      setShowContactForm(true);
    }

    localStorage.removeItem('liaizen_smart_task');
  }, []);

  // Handle contact suggestion from chat (e.g., "Would you like to add Vira?")
  React.useEffect(() => {
    const addContactData = localStorage.getItem('liaizen_add_contact');
    if (!addContactData) return;

    try {
      const data = JSON.parse(addContactData);
      if (data.name) {
        resetForm();
        setContactFormData((prev) => ({
          ...prev,
          contact_name: data.name,
          notes: data.context || '',
        }));
        setShowContactForm(true);
      }
    } catch (err) {
      console.error('Error parsing add contact data:', err);
    }

    localStorage.removeItem('liaizen_add_contact');
  }, []);

  const loadContacts = React.useCallback(async () => {
    if (!username) {
      // Silently skip if no username (e.g., on landing page)
      return;
    }
    setIsLoadingContacts(true);
    try {
      const response = await apiGet(`/api/contacts?username=${encodeURIComponent(username)}`);
      if (response.ok) {
        const data = await response.json();
        const contactsList = data.contacts || [];
        console.log('Contacts loaded:', contactsList.length, 'contacts for', username);
        setContacts(contactsList);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to load contacts:', response.status, errorData);
        setError(`Failed to load contacts: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error loading contacts (Vite):', err);
      setError('Failed to load contacts');
    } finally {
      setIsLoadingContacts(false);
    }
  }, [username]);

  React.useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  // Reload contacts when a co-parent joins the room
  React.useEffect(() => {
    const handleCoParentJoined = (event) => {
      console.log('Co-parent joined event received, reloading contacts...', event.detail);
      // Reload contacts after a short delay to ensure backend has created them
      setTimeout(() => {
        loadContacts();
      }, 1000);
    };

    window.addEventListener('coparent-joined', handleCoParentJoined);

    return () => {
      window.removeEventListener('coparent-joined', handleCoParentJoined);
    };
  }, [loadContacts]);

  const resetForm = () => {
    setEditingContact(null);
    setContactFormData({
      contact_name: '',
      contact_email: '',
      relationship: '',
      notes: '',
      separation_date: '',
      address: '',
      difficult_aspects: '',
      friction_situations: '',
      legal_matters: '',
      safety_concerns: '',
      substance_mental_health: '',
      neglect_abuse_concerns: '',
      additional_thoughts: '',
      other_parent: '',
      child_age: '',
      child_birthdate: '',
      school: '',
      phone: '',
      partner_duration: '',
      has_children: '',
      custody_arrangement: '',
      linked_contact_id: '',
    });
  };

  const saveContact = async () => {
    if (!username || !contactFormData.contact_name.trim()) {
      setError('Contact name is required');
      return;
    }
    if (!contactFormData.relationship) {
      setError('Relationship is required');
      return;
    }

    setIsSavingContact(true);
    setError('');
    try {
      const relationshipValue =
        contactFormData.relationship === 'My Co-Parent'
          ? 'co-parent'
          : contactFormData.relationship;

      const path = editingContact ? `/api/contacts/${editingContact.id}` : '/api/contacts';
      const method = editingContact ? apiPut : apiPost;

      const payload = {
        username,
        ...contactFormData,
        relationship: relationshipValue,
      };

      console.log('Saving contact:', { username, contact_name: contactFormData.contact_name, relationship: relationshipValue });

      const response = await method(path, payload);

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        if (!text) {
          throw new Error('Empty response from server');
        }
        data = JSON.parse(text);
      }

      if (response.ok) {
        console.log('Contact saved successfully:', data);
        setShowContactForm(false);
        resetForm();
        // Reload contacts immediately and also after a short delay to ensure it's updated
        console.log('Reloading contacts after save...');
        await loadContacts();
        setTimeout(() => {
          console.log('Reloading contacts again after delay...');
          loadContacts();
        }, 500);
        return data;
      } else {
        const errorMessage =
          data.error || data.message || `Failed to save contact (Status: ${response.status})`;
        setError(errorMessage);
        console.error('Contact save failed:', response.status, errorMessage, data);
      }
    } catch (err) {
      console.error('Error saving contact (Vite):', err);
      setError(
        err.message ||
          'Failed to save contact. Please check your connection and try again.'
      );
    } finally {
      setIsSavingContact(false);
    }
  };

  const deleteContact = async (contactId) => {
    if (!username) return;
    if (!window.confirm('Are you sure you want to delete this contact?')) return;
    try {
      const response = await apiPut(
        `/api/contacts/${contactId}?username=${encodeURIComponent(username)}`,
        { _method: 'DELETE' }
      );
      const data = await response.json();
      if (response.ok) {
        loadContacts();
      } else {
        setError(data.error || 'Failed to delete contact');
      }
    } catch (err) {
      console.error('Error deleting contact (Vite):', err);
      setError('Failed to delete contact. Please try again.');
    }
  };

  const editContact = (contact) => {
    setEditingContact(contact);
    // Normalize relationship values to match dropdown options
    let relationshipDisplay = contact.relationship || '';
    if (contact.relationship) {
      // Convert lowercase to title case to match dropdown options
      if (contact.relationship.toLowerCase() === 'co-parent' || contact.relationship.toLowerCase() === 'my co-parent') {
        relationshipDisplay = 'My Co-Parent';
      } else if (contact.relationship.toLowerCase() === 'my child') {
        relationshipDisplay = 'My Child';
      }
    }
    setContactFormData({
      contact_name: contact.contact_name || '',
      contact_email: contact.contact_email || '',
      relationship: relationshipDisplay,
      notes: contact.notes || '',
      separation_date: contact.separation_date || '',
      address: contact.address || '',
      difficult_aspects: contact.difficult_aspects || '',
      friction_situations: contact.friction_situations || '',
      legal_matters: contact.legal_matters || '',
      safety_concerns: contact.safety_concerns || '',
      substance_mental_health: contact.substance_mental_health || '',
      neglect_abuse_concerns: contact.neglect_abuse_concerns || '',
      additional_thoughts: contact.additional_thoughts || '',
      other_parent: contact.other_parent || '',
      child_age: contact.child_age || '',
      child_birthdate: contact.child_birthdate || '',
      school: contact.school || '',
      phone: contact.phone || '',
      partner_duration: contact.partner_duration || '',
      has_children: contact.has_children || '',
      custody_arrangement: contact.custody_arrangement || '',
      linked_contact_id: contact.linked_contact_id || '',
    });
    setShowContactForm(true);
  };

  return {
    contacts,
    isLoadingContacts,
    showContactForm,
    contactSearch,
    editingContact,
    contactFormData,
    isSavingContact,
    error,
    setShowContactForm,
    setContactSearch,
    setContactFormData,
    saveContact,
    deleteContact,
    editContact,
    resetForm,
  };
}


