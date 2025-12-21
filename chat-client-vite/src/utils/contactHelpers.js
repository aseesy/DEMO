/**
 * contactHelpers.js
 * Pure functions for contact business logic with no React/DOM dependencies.
 * Extracted from ContactsPanel.jsx component.
 */

/**
 * Disambiguate contacts with the same name by adding email domain
 * When multiple contacts share the same name, appends the email domain
 * to help distinguish them (e.g., "John (gmail)" vs "John (work)")
 *
 * @param {Array} contacts - Array of contact objects
 * @returns {Array} Contacts with disambiguated displayName property
 */
export function disambiguateContacts(contacts) {
  if (!Array.isArray(contacts) || contacts.length === 0) {
    return contacts || [];
  }

  // Group contacts by name
  const nameGroups = contacts.reduce((acc, contact) => {
    const name = contact.contact_name || 'Unknown';
    if (!acc[name]) acc[name] = [];
    acc[name].push(contact);
    return acc;
  }, {});

  // Add disambiguation for duplicates
  return contacts.map(contact => {
    const name = contact.contact_name || 'Unknown';
    const group = nameGroups[name];

    if (group.length > 1 && contact.contact_email) {
      const domain = extractEmailDomain(contact.contact_email);
      return {
        ...contact,
        displayName: domain ? `${name} (${domain})` : name,
      };
    }

    return {
      ...contact,
      displayName: name,
    };
  });
}

/**
 * Extract the domain name from an email address
 * Returns just the domain name without TLD (e.g., "gmail" from "user@gmail.com")
 *
 * @param {string} email - Email address
 * @returns {string|null} Domain name or null if invalid
 */
export function extractEmailDomain(email) {
  if (!email || typeof email !== 'string') return null;

  const parts = email.split('@');
  if (parts.length !== 2) return null;

  const domainParts = parts[1].split('.');
  return domainParts[0] || null;
}

/**
 * Filter contacts by search query
 * Searches across name, displayName, relationship, and email
 *
 * @param {Array} contacts - Array of contact objects
 * @param {string} query - Search query
 * @returns {Array} Filtered contacts
 */
export function filterContactsBySearch(contacts, query) {
  if (!Array.isArray(contacts)) return [];
  if (!query || typeof query !== 'string') return contacts;

  const lowerQuery = query.trim().toLowerCase();
  if (!lowerQuery) return contacts;

  return contacts.filter(contact => {
    const searchableText = [
      contact.contact_name || '',
      contact.displayName || '',
      contact.relationship || '',
      contact.contact_email || '',
    ]
      .join(' ')
      .toLowerCase();

    return searchableText.includes(lowerQuery);
  });
}

/**
 * Get contacts by relationship type
 *
 * @param {Array} contacts - Array of contact objects
 * @param {string} relationship - Relationship type to filter
 * @returns {Array} Filtered contacts
 */
export function getContactsByRelationship(contacts, relationship) {
  if (!Array.isArray(contacts)) return [];
  if (!relationship) return contacts;

  return contacts.filter(
    contact =>
      contact.relationship === relationship ||
      contact.relationship?.toLowerCase() === relationship.toLowerCase()
  );
}

/**
 * Get all co-parent contacts
 *
 * @param {Array} contacts - Array of contact objects
 * @returns {Array} Co-parent contacts
 */
export function getCoParentContacts(contacts) {
  if (!Array.isArray(contacts)) return [];

  return contacts.filter(
    contact =>
      contact.relationship === 'co-parent' || contact.relationship === 'My Co-Parent'
  );
}

/**
 * Get all child contacts
 *
 * @param {Array} contacts - Array of contact objects
 * @returns {Array} Child contacts
 */
export function getChildContacts(contacts) {
  if (!Array.isArray(contacts)) return [];

  return contacts.filter(contact => contact.relationship === 'My Child');
}

/**
 * Check if a contact is a child relationship
 *
 * @param {Object} contact - Contact object
 * @returns {boolean}
 */
export function isChildContact(contact) {
  if (!contact) return false;
  const relationship = (contact.relationship || '').toLowerCase();
  return (
    relationship === 'my child' ||
    relationship === "my partner's child" ||
    relationship === "my co-parent's child"
  );
}

/**
 * Check if a contact is a co-parent relationship
 *
 * @param {Object} contact - Contact object
 * @returns {boolean}
 */
export function isCoParentContact(contact) {
  if (!contact) return false;
  const relationship = (contact.relationship || '').toLowerCase();
  return relationship === 'my co-parent' || relationship === 'co-parent';
}

/**
 * Get the initials from a contact name
 *
 * @param {string} name - Contact name
 * @returns {string} Initials (1-2 characters)
 */
export function getContactInitials(name) {
  if (!name || typeof name !== 'string') return '?';

  const trimmed = name.trim();
  if (!trimmed) return '?';

  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Sort contacts alphabetically by name
 *
 * @param {Array} contacts - Array of contact objects
 * @returns {Array} Sorted contacts
 */
export function sortContactsAlphabetically(contacts) {
  if (!Array.isArray(contacts)) return [];

  return [...contacts].sort((a, b) => {
    const nameA = (a.contact_name || '').toLowerCase();
    const nameB = (b.contact_name || '').toLowerCase();
    return nameA.localeCompare(nameB);
  });
}

/**
 * Sort contacts by relationship priority (co-parents and children first)
 *
 * @param {Array} contacts - Array of contact objects
 * @returns {Array} Sorted contacts
 */
export function sortContactsByRelationshipPriority(contacts) {
  if (!Array.isArray(contacts)) return [];

  const relationshipPriority = {
    'My Co-Parent': 0,
    'co-parent': 0,
    'My Child': 1,
    'My Partner': 2,
    "My Partner's Child": 3,
    'My Family': 4,
    "My Co-Parent's Partner": 5,
  };

  return [...contacts].sort((a, b) => {
    const priorityA = relationshipPriority[a.relationship] ?? 99;
    const priorityB = relationshipPriority[b.relationship] ?? 99;

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // Secondary sort by name
    const nameA = (a.contact_name || '').toLowerCase();
    const nameB = (b.contact_name || '').toLowerCase();
    return nameA.localeCompare(nameB);
  });
}
