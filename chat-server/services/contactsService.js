/**
 * Contacts Service
 *
 * Business logic for contact management.
 * Handles CRUD operations, mention detection, and relationship mapping.
 *
 * @module services/contactsService
 */

const dbSafe = require('../dbSafe');
const { ServiceError } = require('./userService');

// ============================================================================
// CONTACT CRUD OPERATIONS
// ============================================================================

/**
 * Get all contacts for a user with linked contact enrichment
 *
 * @param {number} userId - User ID
 * @returns {Promise<Array>} Array of contacts
 */
async function getContactsByUserId(userId) {
  let contacts = await dbSafe.safeSelect(
    'contacts',
    { user_id: userId },
    { orderBy: 'created_at', orderDirection: 'DESC' }
  );

  // Enrich contacts with linked contact information
  for (let contact of contacts) {
    if (contact.linked_contact_id) {
      const linkedContacts = await dbSafe.safeSelect(
        'contacts',
        { id: contact.linked_contact_id },
        { limit: 1 }
      );
      if (linkedContacts.length > 0) {
        contact.linked_contact_name = linkedContacts[0].contact_name;
        contact.linked_contact_relationship = linkedContacts[0].relationship;
      }
    }
  }

  return contacts;
}

/**
 * Get a single contact by ID
 *
 * @param {number} contactId - Contact ID
 * @returns {Promise<Object|null>} Contact or null
 */
async function getContactById(contactId) {
  const contacts = await dbSafe.safeSelect('contacts', { id: contactId }, { limit: 1 });
  return contacts.length > 0 ? contacts[0] : null;
}

/**
 * Verify contact ownership
 *
 * @param {number} contactId - Contact ID
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Contact if owned by user
 * @throws {ServiceError} If contact not found or not owned
 */
async function verifyContactOwnership(contactId, userId) {
  const contact = await getContactById(contactId);

  if (!contact) {
    throw new ServiceError('Contact not found', 404);
  }

  if (contact.user_id !== userId) {
    throw new ServiceError('Access denied', 403);
  }

  return contact;
}

/**
 * Create a new contact
 *
 * @param {number} userId - User ID
 * @param {Object} contactData - Contact data
 * @returns {Promise<number>} New contact ID
 */
async function createContact(userId, contactData) {
  const now = new Date().toISOString();

  const contactId = await dbSafe.safeInsert('contacts', {
    user_id: userId,
    contact_name: contactData.contact_name.trim(),
    contact_email: contactData.contact_email
      ? contactData.contact_email.trim().toLowerCase()
      : null,
    relationship: contactData.relationship || null,
    separation_date: contactData.separation_date || null,
    separation_details: contactData.separation_details || null,
    address: contactData.address || null,
    difficult_aspects: contactData.difficult_aspects || null,
    friction_situations: contactData.friction_situations || null,
    legal_matters: contactData.legal_matters || null,
    safety_concerns: contactData.safety_concerns || null,
    substance_mental_health: contactData.substance_mental_health || null,
    additional_thoughts: contactData.additional_thoughts || null,
    other_parent: contactData.other_parent || null,
    child_age: contactData.child_age || null,
    child_birthdate: contactData.child_birthdate || null,
    school: contactData.school || null,
    phone: contactData.phone || null,
    partner_duration: contactData.partner_duration || null,
    has_children: contactData.has_children || null,
    custody_arrangement: contactData.custody_arrangement || null,
    linked_contact_id: contactData.linked_contact_id || null,
    created_at: now,
    updated_at: now,
  });

  return contactId;
}

/**
 * Update a contact
 *
 * @param {number} contactId - Contact ID
 * @param {Object} updateData - Fields to update
 * @returns {Promise<void>}
 */
async function updateContact(contactId, updateData) {
  const updates = {
    updated_at: new Date().toISOString(),
  };

  // Only include provided fields
  const allowedFields = [
    'contact_name',
    'contact_email',
    'relationship',
    'separation_date',
    'separation_details',
    'address',
    'difficult_aspects',
    'friction_situations',
    'legal_matters',
    'safety_concerns',
    'substance_mental_health',
    'additional_thoughts',
    'other_parent',
    'child_age',
    'child_birthdate',
    'school',
    'phone',
    'partner_duration',
    'has_children',
    'custody_arrangement',
    'linked_contact_id',
  ];

  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      if (field === 'contact_name') {
        updates[field] = updateData[field].trim();
      } else if (field === 'contact_email') {
        updates[field] = updateData[field] ? updateData[field].trim().toLowerCase() : null;
      } else {
        updates[field] = updateData[field] || null;
      }
    }
  }

  await dbSafe.safeUpdate('contacts', updates, { id: contactId });
}

/**
 * Delete a contact
 *
 * @param {number} contactId - Contact ID
 * @returns {Promise<void>}
 */
async function deleteContact(contactId) {
  await dbSafe.safeDelete('contacts', { id: contactId });
}

// ============================================================================
// MENTION DETECTION
// ============================================================================

/**
 * Detect contact mentions in a message (simple algorithm)
 *
 * @param {string} message - Message text
 * @param {Array} contacts - User's contacts
 * @returns {Array} Detected mentions
 */
function detectMentions(message, contacts) {
  const mentions = [];
  const lowerMessage = message.toLowerCase();

  for (const contact of contacts) {
    const name = contact.contact_name.toLowerCase();
    if (lowerMessage.includes(name)) {
      mentions.push({
        contactId: contact.id,
        name: contact.contact_name,
        relationship: contact.relationship,
      });
    }
  }

  return mentions;
}

/**
 * Get recent messages from a room
 *
 * @param {string} roomId - Room ID
 * @param {number} limit - Max messages to fetch
 * @returns {Promise<Array>} Messages
 */
async function getRecentMessages(roomId, limit = 20) {
  if (!roomId) return [];

  const messagesResult = await dbSafe.safeSelect(
    'messages',
    { room_id: roomId },
    { orderBy: 'timestamp', orderDirection: 'DESC', limit }
  );

  return dbSafe.parseResult(messagesResult);
}

// ============================================================================
// RELATIONSHIP MAPPING
// ============================================================================

/**
 * Build relationship map for visualization
 *
 * @param {string} username - Username for the center node
 * @param {Array} contacts - User's contacts
 * @returns {Object} { nodes, edges }
 */
function buildRelationshipMap(username, contacts) {
  const nodes = [{ id: 'user', name: username, type: 'user' }];
  const edges = [];

  for (const contact of contacts) {
    nodes.push({
      id: `contact_${contact.id}`,
      name: contact.contact_name,
      type: contact.relationship,
    });

    edges.push({
      source: 'user',
      target: `contact_${contact.id}`,
      relationship: contact.relationship,
    });

    // Add linked contact edges
    if (contact.linked_contact_id) {
      edges.push({
        source: `contact_${contact.id}`,
        target: `contact_${contact.linked_contact_id}`,
        relationship: 'linked',
      });
    }
  }

  return { nodes, edges };
}

module.exports = {
  // CRUD
  getContactsByUserId,
  getContactById,
  verifyContactOwnership,
  createContact,
  updateContact,
  deleteContact,

  // Mentions
  detectMentions,
  getRecentMessages,

  // Relationships
  buildRelationshipMap,
};
