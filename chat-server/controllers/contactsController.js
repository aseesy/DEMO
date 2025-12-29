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
const { PostgresRoomRepository } = require('../src/repositories/postgres/PostgresRoomRepository');
const { createCoParentRoom } = require('../roomManager/coParent');
const { shareChildContactWithCoParents, isShareableRelationship } = require('../roomManager/contact');
const dbPostgres = require('../dbPostgres');

const roomRepo = new PostgresRoomRepository();

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
      console.error('[Contact Creation] Invalid request body:', req.body);
      return res.status(400).json({ error: 'Invalid request body' });
    }

    // Extract contact data, ignore any user-supplied username
    const { username: _ignoredUsername, contact_name, ...contactData } = req.body;

    if (!contact_name) {
      console.error('[Contact Creation] Missing contact_name in request');
      return res.status(400).json({ error: 'Contact name is required' });
    }

    // Use authenticated user's ID from JWT, not user-supplied input
    const userId = req.user.id;
    const username = req.user.username || 'unknown';

    console.log('[Contact Creation] Starting contact creation', {
      userId,
      username,
      contactName: contact_name,
      relationship: contactData.relationship || 'not set',
      hasEmail: !!contactData.contact_email,
    });

    const contactId = await contactsService.createContact(userId, {
      contact_name,
      ...contactData,
    });

    console.log('[Contact Creation] ✅ Contact created successfully', {
      contactId,
      userId,
      username,
      contactName: contact_name,
      relationship: contactData.relationship,
    });

    // Share child contacts with co-parents automatically
    if (isShareableRelationship(contactData.relationship)) {
      try {
        const sharedIds = await shareChildContactWithCoParents(userId, {
          contact_name,
          contact_email: contactData.contact_email,
          relationship: contactData.relationship,
          phone: contactData.phone,
          child_age: contactData.child_age,
          child_birthdate: contactData.child_birthdate,
          school: contactData.school,
          custody_arrangement: contactData.custody_arrangement,
        });
        if (sharedIds.length > 0) {
          console.log('[Contact Creation] ✅ Shared child contact with co-parents', {
            originalContactId: contactId,
            sharedContactIds: sharedIds,
            childName: contact_name,
          });
        }
      } catch (shareError) {
        // Don't fail the request if sharing fails, just log it
        console.error('[Contact Creation] Error sharing child contact:', shareError);
      }
    }

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
    console.error('[Contact Creation] ❌ Error creating contact:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      username: req.user?.username,
      contactName: req.body?.contact_name,
      relationship: req.body?.relationship,
      errorCode: error.code,
      errorDetail: error.detail,
      errorConstraint: error.constraint,
    });
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

/**
 * POST /api/contacts/:contactId/invite-to-chat
 *
 * Invites a contact to chat by creating a private room between the current user and the contact.
 * Only works for partner contacts with linked_user_id (registered users).
 *
 * @param {Object} req - Express request
 * @param {Object} req.user - Authenticated user from JWT
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.contactId - Contact ID
 * @param {Object} res - Express response
 */
async function inviteContactToChat(req, res) {
  try {
    const userId = req.user.id;
    const contactId = parseInt(req.params.contactId, 10);

    if (!contactId || isNaN(contactId)) {
      return res.status(400).json({ error: 'Invalid contact ID' });
    }

    // Get contact and verify ownership
    const contact = await contactsService.getContactById(contactId);
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    if (contact.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Verify contact has linked_user_id (is a registered user)
    if (!contact.linked_user_id) {
      return res.status(400).json({
        error: 'This contact is not a registered LiaiZen user. They need to sign up first.',
      });
    }

    // Verify contact is a partner
    const relationship = contact.relationship?.toLowerCase() || '';
    const isPartner =
      relationship === 'my partner' ||
      relationship === 'partner' ||
      (relationship.includes('partner') && !relationship.includes('co-parent'));

    if (!isPartner) {
      return res.status(400).json({
        error: 'This feature is only available for partner contacts',
      });
    }

    const contactUserId = contact.linked_user_id;

    // Check if room already exists between these users
    const existingRoom = await roomRepo.findRoomBetweenUsers(userId, contactUserId);
    if (existingRoom) {
      return res.json({
        roomId: existingRoom.id,
        roomName: existingRoom.name,
        alreadyExists: true,
      });
    }

    // Get user display names for room creation
    const [currentUser, contactUser] = await Promise.all([
      dbPostgres.query('SELECT first_name, display_name, username FROM users WHERE id = $1', [
        userId,
      ]),
      dbPostgres.query('SELECT first_name, display_name, username FROM users WHERE id = $1', [
        contactUserId,
      ]),
    ]);

    const currentUserName =
      currentUser.rows[0]?.first_name ||
      currentUser.rows[0]?.display_name ||
      currentUser.rows[0]?.username ||
      'You';
    const contactUserName =
      contactUser.rows[0]?.first_name ||
      contactUser.rows[0]?.display_name ||
      contactUser.rows[0]?.username ||
      contact.contact_name ||
      'Partner';

    // Create co-parent room
    const room = await createCoParentRoom(userId, contactUserId, currentUserName, contactUserName);

    return res.json({
      roomId: room.roomId,
      roomName: room.roomName,
      alreadyExists: false,
    });
  } catch (error) {
    handleError(res, error, 'Error inviting contact to chat');
  }
}

/**
 * GET /api/contacts/diagnose/:contactName
 *
 * Diagnostic endpoint to check if a contact exists and why it might not be appearing.
 * Useful for debugging missing contacts in production.
 *
 * @param {Object} req - Express request
 * @param {Object} req.user - Authenticated user from JWT
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.contactName - Contact name to diagnose
 * @param {Object} res - Express response
 */
async function diagnoseContact(req, res) {
  try {
    const userId = req.user.id;
    const contactName = req.params.contactName;

    if (!contactName) {
      return res.status(400).json({ error: 'Contact name is required' });
    }

    // Get all contacts for the user
    const allContacts = await contactsService.getContactsByUserId(userId);

    // Find matching contacts
    const matchingContacts = allContacts.filter(
      c => c.contact_name && c.contact_name.toLowerCase().includes(contactName.toLowerCase())
    );

    // Helper function to transform relationship (matches frontend logic)
    const toDisplayRelationship = storedValue => {
      if (!storedValue) return '';
      const lowerValue = storedValue.toLowerCase();
      const STORAGE_TO_DISPLAY = {
        'co-parent': 'My Co-Parent',
        'my child': 'My Child',
        'my partner': 'My Partner',
        'my family': 'My Family',
        'my friend': 'My Friend',
        other: 'Other',
      };
      const STORAGE_VARIATIONS = {
        'co-parent': 'My Co-Parent',
        coparent: 'My Co-Parent',
        'my co-parent': 'My Co-Parent',
        'my child': 'My Child',
        child: 'My Child',
        'my partner': 'My Partner',
        partner: 'My Partner',
        'my family': 'My Family',
        family: 'My Family',
        'my friend': 'My Friend',
        friend: 'My Friend',
        other: 'Other',
      };
      return STORAGE_TO_DISPLAY[lowerValue] || STORAGE_VARIATIONS[lowerValue] || storedValue;
    };

    // Format results
    const results = {
      contactName,
      totalContacts: allContacts.length,
      matchingContacts: matchingContacts.length,
      contacts: matchingContacts.map(contact => ({
        id: contact.id,
        name: contact.contact_name,
        email: contact.contact_email || null,
        relationship: {
          raw: contact.relationship || null,
          transformed: contact.relationship ? toDisplayRelationship(contact.relationship) : null,
        },
        created_at: contact.created_at,
        updated_at: contact.updated_at,
        issues: [],
      })),
      allChildContacts: allContacts
        .filter(c => {
          const rel = (c.relationship || '').toLowerCase();
          return rel === 'my child' || rel === 'child' || rel.includes('child');
        })
        .map(c => ({
          name: c.contact_name,
          relationship: c.relationship,
          transformed: toDisplayRelationship(c.relationship),
        })),
    };

    // Identify potential issues
    matchingContacts.forEach((contact, index) => {
      if (!contact.contact_name) {
        results.contacts[index].issues.push('Missing contact_name');
      }
      if (contact.contact_email === null && contact.relationship === 'co-parent') {
        results.contacts[index].issues.push(
          'Co-parent with NULL email (might violate unique constraint)'
        );
      }
      if (!contact.relationship) {
        results.contacts[index].issues.push('Missing relationship value');
      }
    });

    res.json(results);
  } catch (error) {
    handleError(res, error, 'Error diagnosing contact');
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
  // Chat invitation
  inviteContactToChat,
  // Diagnostics
  diagnoseContact,
};
