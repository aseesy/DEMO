/**
 * Contacts Routes
 *
 * Handles contact management including CRUD operations,
 * AI-powered features like mention detection and profile generation.
 * Extracted from server.js for better maintainability.
 */

const express = require('express');
const router = express.Router();

const dbSafe = require('../dbSafe');
const db = require('../dbPostgres');
const { verifyAuth } = require('../middleware/auth');

/**
 * GET /api/contacts
 * Get all contacts for a user
 */
router.get('/', async (req, res) => {
  try {
    const username = req.query.username || req.body.username;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Get user ID
    const userResult = await dbSafe.safeSelect('users', { username: username.toLowerCase() }, { limit: 1 });
    const users = dbSafe.parseResult(userResult);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = users[0].id;

    // Get contacts
    let contacts = await dbSafe.safeSelect('contacts', { user_id: userId }, { orderBy: 'created_at', orderDirection: 'DESC' });

    // Enrich contacts with linked contact information
    for (let contact of contacts) {
      if (contact.linked_contact_id) {
        const linkedContacts = await dbSafe.safeSelect('contacts', { id: contact.linked_contact_id }, { limit: 1 });
        if (linkedContacts.length > 0) {
          contact.linked_contact_name = linkedContacts[0].contact_name;
          contact.linked_contact_relationship = linkedContacts[0].relationship;
        }
      }
    }

    res.json({
      contacts,
      count: contacts.length
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/contacts
 * Create new contact
 */
router.post('/', async (req, res) => {
  try {
    // Check if request body was parsed correctly
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body. Request may be too large.' });
    }

    const { username, contact_name, relationship, notes, email, phone, linked_contact_id } = req.body;

    // Debug logging
    console.log('Create contact request:', {
      username,
      contact_name,
      relationship,
      hasLinkedContactId: linked_contact_id !== undefined,
      requestBodySize: JSON.stringify(req.body).length
    });

    if (!username || !contact_name || !relationship) {
      return res.status(400).json({ error: 'Username, contact name, and relationship are required' });
    }

    // Get user ID
    const userResult = await dbSafe.safeSelect('users', { username: username.toLowerCase() }, { limit: 1 });
    const users = dbSafe.parseResult(userResult);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = users[0].id;

    // Create contact using safeInsert
    const contactData = {
      user_id: userId,
      contact_name,
      relationship,
      notes: notes || null,
      email: email || null,
      phone: phone || null,
      linked_contact_id: linked_contact_id || null
    };

    const newContact = await dbSafe.safeInsert('contacts', contactData);

    res.status(201).json({
      success: true,
      contact: newContact
    });
  } catch (error) {
    console.error('Error creating contact:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/contacts/:contactId
 * Update contact
 */
router.put('/:contactId', async (req, res) => {
  try {
    // Check if request body was parsed correctly
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body. Request may be too large.' });
    }

    const { contactId } = req.params;
    const { username, contact_name, relationship, notes, email, phone, linked_contact_id } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Get user ID
    const userResult = await dbSafe.safeSelect('users', { username: username.toLowerCase() }, { limit: 1 });
    const users = dbSafe.parseResult(userResult);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = users[0].id;

    // Verify contact belongs to user
    const contactResult = await dbSafe.safeSelect('contacts', { id: parseInt(contactId), user_id: userId }, { limit: 1 });
    const contacts = dbSafe.parseResult(contactResult);

    if (contacts.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Update contact - only include fields that are provided
    const updateData = {};
    if (contact_name !== undefined) updateData.contact_name = contact_name;
    if (relationship !== undefined) updateData.relationship = relationship;
    if (notes !== undefined) updateData.notes = notes;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (linked_contact_id !== undefined) updateData.linked_contact_id = linked_contact_id;

    const updatedContact = await dbSafe.safeUpdate('contacts', updateData, { id: parseInt(contactId) });

    res.json({
      success: true,
      contact: updatedContact
    });
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/contacts/:contactId
 * Delete contact
 */
router.delete('/:contactId', async (req, res) => {
  try {
    const { contactId } = req.params;
    const username = req.query.username || req.body.username;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Get user ID
    const userResult = await dbSafe.safeSelect('users', { username: username.toLowerCase() }, { limit: 1 });
    const users = dbSafe.parseResult(userResult);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = users[0].id;

    // Verify contact belongs to user
    const contactResult = await dbSafe.safeSelect('contacts', { id: parseInt(contactId), user_id: userId }, { limit: 1 });
    const contacts = dbSafe.parseResult(contactResult);

    if (contacts.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Delete contact
    await dbSafe.safeDelete('contacts', { id: parseInt(contactId) });

    res.json({
      success: true,
      message: 'Contact deleted'
    });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/contacts/detect-mentions
 * Detect contact mentions in a message
 */
router.post('/detect-mentions', async (req, res) => {
  try {
    const { message, username } = req.body;

    if (!message || !username) {
      return res.status(400).json({ error: 'Message and username are required' });
    }

    // Get user ID
    const userResult = await dbSafe.safeSelect('users', { username: username.toLowerCase() }, { limit: 1 });
    const users = dbSafe.parseResult(userResult);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = users[0].id;

    // Get user's contacts
    const contacts = await dbSafe.safeSelect('contacts', { user_id: userId });

    // Simple mention detection: look for contact names in message
    const mentions = [];
    const lowerMessage = message.toLowerCase();

    for (const contact of contacts) {
      const name = contact.contact_name.toLowerCase();
      if (lowerMessage.includes(name)) {
        mentions.push({
          contactId: contact.id,
          name: contact.contact_name,
          relationship: contact.relationship
        });
      }
    }

    res.json({
      mentions,
      count: mentions.length
    });
  } catch (error) {
    console.error('Error detecting mentions:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/contacts/relationship-map
 * Get relationship map for visualization
 */
router.get('/relationship-map', async (req, res) => {
  try {
    const username = req.query.username;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Get user ID
    const userResult = await dbSafe.safeSelect('users', { username: username.toLowerCase() }, { limit: 1 });
    const users = dbSafe.parseResult(userResult);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = users[0].id;

    // Get all contacts with their relationships
    const contacts = await dbSafe.safeSelect('contacts', { user_id: userId });

    // Build relationship map
    const nodes = [{ id: 'user', name: username, type: 'user' }];
    const edges = [];

    for (const contact of contacts) {
      nodes.push({
        id: `contact_${contact.id}`,
        name: contact.contact_name,
        type: contact.relationship
      });

      edges.push({
        source: 'user',
        target: `contact_${contact.id}`,
        relationship: contact.relationship
      });

      // Add linked contact edges
      if (contact.linked_contact_id) {
        edges.push({
          source: `contact_${contact.id}`,
          target: `contact_${contact.linked_contact_id}`,
          relationship: 'linked'
        });
      }
    }

    res.json({
      nodes,
      edges
    });
  } catch (error) {
    console.error('Error building relationship map:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
