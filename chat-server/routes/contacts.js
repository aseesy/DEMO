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

// Helper references - set from server.js
let autoCompleteOnboardingTasks;
let contactIntelligence;

router.setHelpers = function(helpers) {
  autoCompleteOnboardingTasks = helpers.autoCompleteOnboardingTasks;
  contactIntelligence = helpers.contactIntelligence;
};

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

    const { username, contact_name, contact_email, relationship, notes, separation_date, separation_details, address,
      difficult_aspects, friction_situations, legal_matters, safety_concerns,
      substance_mental_health, neglect_abuse_concerns, additional_thoughts, other_parent,
      child_age, child_birthdate, school, phone, partner_duration, has_children,
      custody_arrangement, linked_contact_id } = req.body;

    // Debug logging
    console.log('Create contact request:', {
      username,
      contact_name,
      relationship,
      requestBodySize: JSON.stringify(req.body).length
    });

    if (!username || !contact_name) {
      return res.status(400).json({ error: 'Username and contact name are required' });
    }

    // Get user ID
    const userResult = await dbSafe.safeSelect('users', { username: username.toLowerCase() }, { limit: 1 });
    const users = dbSafe.parseResult(userResult);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = users[0].id;
    const now = new Date().toISOString();

    // Create contact using safeInsert with all extended fields
    const contactId = await dbSafe.safeInsert('contacts', {
      user_id: userId,
      contact_name: contact_name.trim(),
      contact_email: contact_email ? contact_email.trim().toLowerCase() : null,
      relationship: relationship || null,
      separation_date: separation_date || null,
      separation_details: separation_details || null,
      address: address || null,
      difficult_aspects: difficult_aspects || null,
      friction_situations: friction_situations || null,
      legal_matters: legal_matters || null,
      safety_concerns: safety_concerns || null,
      substance_mental_health: substance_mental_health || null,
      additional_thoughts: additional_thoughts || null,
      other_parent: other_parent || null,
      child_age: child_age || null,
      child_birthdate: child_birthdate || null,
      school: school || null,
      phone: phone || null,
      partner_duration: partner_duration || null,
      has_children: has_children || null,
      custody_arrangement: custody_arrangement || null,
      linked_contact_id: linked_contact_id || null,
      created_at: now,
      updated_at: now
    });

    console.log('Contact created successfully:', {
      contactId,
      userId,
      contact_name: contact_name.trim()
    });

    // Auto-complete onboarding tasks if conditions are met
    if (autoCompleteOnboardingTasks) {
      try {
        await autoCompleteOnboardingTasks(userId);
      } catch (error) {
        console.error('Error auto-completing onboarding tasks:', error);
        // Don't fail contact creation if this fails
      }
    }

    res.json({
      success: true,
      message: 'Contact created successfully',
      contactId: contactId
    });
  } catch (error) {
    console.error('Error creating contact:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      error: error.message || 'Failed to create contact',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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

    const contactId = parseInt(req.params.contactId);
    const { username, contact_name, contact_email, relationship, separation_date, separation_details, address,
      difficult_aspects, friction_situations, legal_matters, safety_concerns,
      substance_mental_health, additional_thoughts, other_parent,
      child_age, child_birthdate, school, phone, partner_duration, has_children,
      custody_arrangement, linked_contact_id } = req.body;

    if (!contactId || isNaN(contactId)) {
      return res.status(400).json({ error: 'Invalid contact ID' });
    }

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
    const contactResult = await dbSafe.safeSelect('contacts', { id: contactId }, { limit: 1 });
    const contacts = dbSafe.parseResult(contactResult);

    if (contacts.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    if (contacts[0].user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update contact - only include fields that are provided
    const updateData = {
      updated_at: new Date().toISOString()
    };
    if (contact_name !== undefined) updateData.contact_name = contact_name.trim();
    if (contact_email !== undefined) updateData.contact_email = contact_email ? contact_email.trim().toLowerCase() : null;
    if (relationship !== undefined) updateData.relationship = relationship || null;
    // Co-parent specific fields
    if (separation_date !== undefined) updateData.separation_date = separation_date || null;
    if (separation_details !== undefined) updateData.separation_details = separation_details || null;
    if (address !== undefined) updateData.address = address || null;
    if (difficult_aspects !== undefined) updateData.difficult_aspects = difficult_aspects || null;
    if (friction_situations !== undefined) updateData.friction_situations = friction_situations || null;
    if (legal_matters !== undefined) updateData.legal_matters = legal_matters || null;
    if (safety_concerns !== undefined) updateData.safety_concerns = safety_concerns || null;
    if (substance_mental_health !== undefined) updateData.substance_mental_health = substance_mental_health || null;
    if (additional_thoughts !== undefined) updateData.additional_thoughts = additional_thoughts || null;
    if (other_parent !== undefined) updateData.other_parent = other_parent || null;
    // Child-specific fields
    if (child_age !== undefined) updateData.child_age = child_age || null;
    if (child_birthdate !== undefined) updateData.child_birthdate = child_birthdate || null;
    if (school !== undefined) updateData.school = school || null;
    if (phone !== undefined) updateData.phone = phone || null;
    // Partner-specific fields
    if (partner_duration !== undefined) updateData.partner_duration = partner_duration || null;
    if (has_children !== undefined) updateData.has_children = has_children || null;
    if (custody_arrangement !== undefined) updateData.custody_arrangement = custody_arrangement || null;
    if (linked_contact_id !== undefined) updateData.linked_contact_id = linked_contact_id || null;

    await dbSafe.safeUpdate('contacts', updateData, { id: contactId });

    res.json({
      success: true,
      message: 'Contact updated successfully'
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

// ======================================
// AI Contact Intelligence Endpoints
// ======================================

/**
 * POST /api/contacts/ai/detect-mentions
 * AI-powered contact mention detection in messages
 */
router.post('/ai/detect-mentions', async (req, res) => {
  try {
    const { messageText, username, roomId } = req.body;

    if (!messageText || !username) {
      return res.status(400).json({ error: 'Message text and username are required' });
    }

    // Get user ID
    const userResult = await dbSafe.safeSelect('users', { username: username.toLowerCase() }, { limit: 1 });
    const users = dbSafe.parseResult(userResult);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = users[0].id;

    // Get user's contacts
    const contactsResult = await dbSafe.safeSelect('contacts', { user_id: userId });
    const userContacts = dbSafe.parseResult(contactsResult);

    // Get recent messages for context
    let recentMessages = [];
    if (roomId) {
      const messagesResult = await dbSafe.safeSelect('messages', { room_id: roomId }, {
        orderBy: 'timestamp',
        orderDirection: 'DESC',
        limit: 20
      });
      recentMessages = dbSafe.parseResult(messagesResult);
    }

    // Use AI contact intelligence if available
    if (contactIntelligence) {
      const result = await contactIntelligence.detectContactMentions(
        messageText,
        userContacts,
        recentMessages
      );
      return res.json(result || { mentions: [], suggestedContacts: [] });
    }

    // Fallback to simple detection
    const mentions = [];
    const lowerMessage = messageText.toLowerCase();

    for (const contact of userContacts) {
      const name = contact.contact_name.toLowerCase();
      if (lowerMessage.includes(name)) {
        mentions.push({
          contactId: contact.id,
          name: contact.contact_name,
          relationship: contact.relationship
        });
      }
    }

    res.json({ mentions, suggestedContacts: [] });
  } catch (error) {
    console.error('Error detecting contact mentions:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/contacts/generate-profile
 * Generate AI-assisted contact profile suggestions
 */
router.post('/generate-profile', async (req, res) => {
  try {
    const { contactData, username, roomId } = req.body;

    if (!contactData || !contactData.contact_name || !contactData.relationship || !username) {
      return res.status(400).json({ error: 'Contact data (name, relationship) and username are required' });
    }

    // Get user ID
    const userResult = await dbSafe.safeSelect('users', { username: username.toLowerCase() }, { limit: 1 });
    const users = dbSafe.parseResult(userResult);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = users[0].id;

    // Get user's existing contacts for relationship context
    const contactsResult = await dbSafe.safeSelect('contacts', { user_id: userId });
    const userContacts = dbSafe.parseResult(contactsResult);

    // Get recent messages for context
    let recentMessages = [];
    if (roomId) {
      const messagesResult = await dbSafe.safeSelect('messages', { room_id: roomId }, {
        orderBy: 'timestamp',
        orderDirection: 'DESC',
        limit: 15
      });
      recentMessages = dbSafe.parseResult(messagesResult);
    }

    // Generate profile suggestions using AI
    if (contactIntelligence) {
      try {
        const suggestions = await contactIntelligence.generateContactProfile(
          contactData,
          userContacts,
          recentMessages
        );

        if (suggestions) {
          return res.json(suggestions);
        }
      } catch (aiError) {
        console.error('AI profile generation error:', aiError);
        // Continue to fallback - don't fail the request
      }
    } else {
      console.warn('Contact intelligence not available - returning fallback suggestions');
    }

    // Fallback response (when AI is not available or fails)
    res.json({
      suggestedFields: [],
      helpfulQuestions: [],
      linkedContactSuggestion: { shouldLink: false },
      profileCompletionTips: 'Fill out the profile with as much detail as you feel comfortable sharing.'
    });
  } catch (error) {
    console.error('Error generating contact profile:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/contacts/ai/relationship-map
 * Get AI-enhanced relationship map with suggestions
 */
router.get('/ai/relationship-map', async (req, res) => {
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

    // Use AI contact intelligence if available
    if (contactIntelligence) {
      const relationshipMap = await contactIntelligence.mapContactRelationships(userId);
      return res.json(relationshipMap);
    }

    // Fallback to simple relationship map
    const contacts = await dbSafe.safeSelect('contacts', { user_id: userId });
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
    }

    res.json({ nodes, edges });
  } catch (error) {
    console.error('Error mapping contact relationships:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/contacts/:contactId/enrich
 * Enrich contact from conversation history using AI
 */
router.post('/:contactId/enrich', async (req, res) => {
  try {
    const contactId = parseInt(req.params.contactId);
    const { username, roomId } = req.body;

    if (!contactId || isNaN(contactId) || !username) {
      return res.status(400).json({ error: 'Contact ID and username are required' });
    }

    // Get user ID
    const userResult = await dbSafe.safeSelect('users', { username: username.toLowerCase() }, { limit: 1 });
    const users = dbSafe.parseResult(userResult);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = users[0].id;

    // Verify contact belongs to user
    const contactResult = await dbSafe.safeSelect('contacts', { id: contactId, user_id: userId }, { limit: 1 });
    const contacts = dbSafe.parseResult(contactResult);

    if (contacts.length === 0) {
      return res.status(404).json({ error: 'Contact not found or access denied' });
    }

    // Get messages from room
    let messages = [];
    if (roomId) {
      const messagesResult = await dbSafe.safeSelect('messages', { room_id: roomId }, {
        orderBy: 'timestamp',
        orderDirection: 'DESC',
        limit: 100
      });
      messages = dbSafe.parseResult(messagesResult);
    }

    // Enrich contact using AI
    if (contactIntelligence) {
      const enrichment = await contactIntelligence.enrichContactFromMessages(
        contactId,
        userId,
        messages
      );

      if (enrichment) {
        return res.json(enrichment);
      }
    }

    // Fallback response
    res.json({ enrichments: [], newInsights: [], shouldUpdate: false });
  } catch (error) {
    console.error('Error enriching contact:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
