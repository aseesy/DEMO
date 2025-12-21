/**
 * Contacts Controller
 *
 * Handles HTTP request/response for contact endpoints.
 * Validates input, calls services, formats output.
 *
 * @module controllers/contactsController
 */

const { ServiceError, getUserIdByUsername } = require('../services/userService');
const contactsService = require('../services/contactsService');

// Injected helpers (set from server.js)
let autoCompleteOnboardingTasks = null;
let contactIntelligence = null;

/**
 * Set helper functions from server.js
 */
function setHelpers(helpers) {
  autoCompleteOnboardingTasks = helpers.autoCompleteOnboardingTasks;
  contactIntelligence = helpers.contactIntelligence;
}

/**
 * Handle ServiceError responses
 */
function handleError(res, error, defaultMessage = 'Operation failed') {
  console.error(`${defaultMessage}:`, error);

  if (error instanceof ServiceError) {
    return res.status(error.status).json({ error: error.message });
  }

  res.status(500).json({
    error: error.message || defaultMessage,
    details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
  });
}

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * GET /api/contacts
 *
 * Uses authenticated user's ID from JWT token (req.user.id).
 * Does NOT accept user-supplied username to prevent IDOR attacks.
 */
async function getContacts(req, res) {
  try {
    // Use authenticated user's ID from JWT, not user-supplied input
    const userId = req.user.id;
    const contacts = await contactsService.getContactsByUserId(userId);

    res.json({ contacts, count: contacts.length });
  } catch (error) {
    handleError(res, error, 'Error getting contacts');
  }
}

/**
 * POST /api/contacts
 *
 * Uses authenticated user's ID from JWT token (req.user.id).
 */
async function createContact(req, res) {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    // Extract contact data, ignore any user-supplied username
    const { username: _ignoredUsername, contact_name, ...contactData } = req.body;

    if (!contact_name) {
      return res.status(400).json({ error: 'Contact name is required' });
    }

    // Use authenticated user's ID from JWT, not user-supplied input
    const userId = req.user.id;
    const contactId = await contactsService.createContact(userId, {
      contact_name,
      ...contactData,
    });

    // Auto-complete onboarding tasks
    if (autoCompleteOnboardingTasks) {
      try {
        await autoCompleteOnboardingTasks(userId);
      } catch (err) {
        console.error('Error auto-completing onboarding tasks:', err);
      }
    }

    res.json({
      success: true,
      message: 'Contact created successfully',
      contactId,
    });
  } catch (error) {
    handleError(res, error, 'Error creating contact');
  }
}

/**
 * PUT /api/contacts/:contactId
 *
 * Uses authenticated user's ID from JWT token (req.user.id).
 */
async function updateContact(req, res) {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const contactId = parseInt(req.params.contactId);
    if (!contactId || isNaN(contactId)) {
      return res.status(400).json({ error: 'Invalid contact ID' });
    }

    // Extract update data, ignore any user-supplied username
    const { username: _ignoredUsername, ...updateData } = req.body;

    // Use authenticated user's ID from JWT, not user-supplied input
    const userId = req.user.id;

    await contactsService.verifyContactOwnership(contactId, userId);
    await contactsService.updateContact(contactId, updateData);

    res.json({ success: true, message: 'Contact updated successfully' });
  } catch (error) {
    handleError(res, error, 'Error updating contact');
  }
}

/**
 * DELETE /api/contacts/:contactId
 *
 * Uses authenticated user's ID from JWT token (req.user.id).
 */
async function deleteContact(req, res) {
  try {
    const contactId = parseInt(req.params.contactId);

    // Use authenticated user's ID from JWT, not user-supplied input
    const userId = req.user.id;

    await contactsService.verifyContactOwnership(contactId, userId);
    await contactsService.deleteContact(contactId);

    res.json({ success: true, message: 'Contact deleted' });
  } catch (error) {
    handleError(res, error, 'Error deleting contact');
  }
}

// ============================================================================
// MENTION DETECTION
// ============================================================================

/**
 * POST /api/contacts/detect-mentions
 *
 * Uses authenticated user's ID from JWT token (req.user.id).
 */
async function detectMentions(req, res) {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Use authenticated user's ID from JWT, not user-supplied input
    const userId = req.user.id;
    const contacts = await contactsService.getContactsByUserId(userId);
    const mentions = contactsService.detectMentions(message, contacts);

    res.json({ mentions, count: mentions.length });
  } catch (error) {
    handleError(res, error, 'Error detecting mentions');
  }
}

/**
 * POST /api/contacts/ai/detect-mentions
 *
 * Uses authenticated user's ID from JWT token (req.user.id).
 */
async function detectMentionsAI(req, res) {
  try {
    const { messageText, roomId } = req.body;

    if (!messageText) {
      return res.status(400).json({ error: 'Message text is required' });
    }

    // Use authenticated user's ID from JWT, not user-supplied input
    const userId = req.user.id;
    const contacts = await contactsService.getContactsByUserId(userId);
    const recentMessages = await contactsService.getRecentMessages(roomId, 20);

    // Use AI if available
    if (contactIntelligence) {
      const result = await contactIntelligence.detectContactMentions(
        messageText,
        contacts,
        recentMessages
      );
      return res.json(result || { mentions: [], suggestedContacts: [] });
    }

    // Fallback to simple detection
    const mentions = contactsService.detectMentions(messageText, contacts);
    res.json({ mentions, suggestedContacts: [] });
  } catch (error) {
    handleError(res, error, 'Error detecting contact mentions');
  }
}

// ============================================================================
// RELATIONSHIP MAPPING
// ============================================================================

/**
 * GET /api/contacts/relationship-map
 *
 * Uses authenticated user's ID from JWT token (req.user.id).
 */
async function getRelationshipMap(req, res) {
  try {
    // Use authenticated user's ID and username from JWT, not user-supplied input
    const userId = req.user.id;
    const username = req.user.username;
    const contacts = await contactsService.getContactsByUserId(userId);
    const map = contactsService.buildRelationshipMap(username, contacts);

    res.json(map);
  } catch (error) {
    handleError(res, error, 'Error building relationship map');
  }
}

/**
 * GET /api/contacts/ai/relationship-map
 *
 * Uses authenticated user's ID from JWT token (req.user.id).
 */
async function getRelationshipMapAI(req, res) {
  try {
    // Use authenticated user's ID and username from JWT, not user-supplied input
    const userId = req.user.id;
    const username = req.user.username;

    // Use AI if available
    if (contactIntelligence) {
      const relationshipMap = await contactIntelligence.mapContactRelationships(userId);
      return res.json(relationshipMap);
    }

    // Fallback to simple map
    const contacts = await contactsService.getContactsByUserId(userId);
    const map = contactsService.buildRelationshipMap(username, contacts);
    res.json(map);
  } catch (error) {
    handleError(res, error, 'Error mapping contact relationships');
  }
}

// ============================================================================
// AI PROFILE GENERATION
// ============================================================================

/**
 * POST /api/contacts/generate-profile
 *
 * Uses authenticated user's ID from JWT token (req.user.id).
 */
async function generateProfile(req, res) {
  try {
    const { contactData, roomId } = req.body;

    if (!contactData?.contact_name || !contactData?.relationship) {
      return res.status(400).json({
        error: 'Contact data (name, relationship) is required',
      });
    }

    // Use authenticated user's ID from JWT, not user-supplied input
    const userId = req.user.id;
    const contacts = await contactsService.getContactsByUserId(userId);
    const recentMessages = await contactsService.getRecentMessages(roomId, 15);

    // Use AI if available
    if (contactIntelligence) {
      try {
        const suggestions = await contactIntelligence.generateContactProfile(
          contactData,
          contacts,
          recentMessages
        );
        if (suggestions) return res.json(suggestions);
      } catch (aiError) {
        console.error('AI profile generation error:', aiError);
      }
    }

    // Fallback response
    res.json({
      suggestedFields: [],
      helpfulQuestions: [],
      linkedContactSuggestion: { shouldLink: false },
      profileCompletionTips:
        'Fill out the profile with as much detail as you feel comfortable sharing.',
    });
  } catch (error) {
    handleError(res, error, 'Error generating contact profile');
  }
}

/**
 * POST /api/contacts/:contactId/enrich
 *
 * Uses authenticated user's ID from JWT token (req.user.id).
 */
async function enrichContact(req, res) {
  try {
    const contactId = parseInt(req.params.contactId);
    const { roomId } = req.body;

    if (!contactId || isNaN(contactId)) {
      return res.status(400).json({ error: 'Contact ID is required' });
    }

    // Use authenticated user's ID from JWT, not user-supplied input
    const userId = req.user.id;
    await contactsService.verifyContactOwnership(contactId, userId);

    const messages = await contactsService.getRecentMessages(roomId, 100);

    // Use AI if available
    if (contactIntelligence) {
      const enrichment = await contactIntelligence.enrichContactFromMessages(
        contactId,
        userId,
        messages
      );
      if (enrichment) return res.json(enrichment);
    }

    // Fallback response
    res.json({ enrichments: [], newInsights: [], shouldUpdate: false });
  } catch (error) {
    handleError(res, error, 'Error enriching contact');
  }
}

module.exports = {
  setHelpers,
  // CRUD
  getContacts,
  createContact,
  updateContact,
  deleteContact,
  // Mentions
  detectMentions,
  detectMentionsAI,
  // Relationship mapping
  getRelationshipMap,
  getRelationshipMapAI,
  // AI features
  generateProfile,
  enrichContact,
};
