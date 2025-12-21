/**
 * Contacts Routes
 *
 * Thin router that maps endpoints to controller functions.
 * No business logic here - just routing.
 *
 * All routes require authentication.
 *
 * @module routes/contacts
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const contactsController = require('../controllers/contactsController');

/**
 * Set helper functions (called from server.js)
 */
router.setHelpers = function (helpers) {
  contactsController.setHelpers(helpers);
};

// ============================================================================
// CRUD ROUTES - All require authentication
// ============================================================================

// GET /api/contacts - Get all contacts for authenticated user
router.get('/', authenticate, contactsController.getContacts);

// POST /api/contacts - Create new contact for authenticated user
router.post('/', authenticate, contactsController.createContact);

// PUT /api/contacts/:contactId - Update contact (ownership verified in controller)
router.put('/:contactId', authenticate, contactsController.updateContact);

// DELETE /api/contacts/:contactId - Delete contact (ownership verified in controller)
router.delete('/:contactId', authenticate, contactsController.deleteContact);

// ============================================================================
// MENTION DETECTION ROUTES - All require authentication
// ============================================================================

// POST /api/contacts/detect-mentions - Simple mention detection
router.post('/detect-mentions', authenticate, contactsController.detectMentions);

// POST /api/contacts/ai/detect-mentions - AI-powered mention detection
router.post('/ai/detect-mentions', authenticate, contactsController.detectMentionsAI);

// ============================================================================
// RELATIONSHIP MAP ROUTES - All require authentication
// ============================================================================

// GET /api/contacts/relationship-map - Simple relationship map
router.get('/relationship-map', authenticate, contactsController.getRelationshipMap);

// GET /api/contacts/ai/relationship-map - AI-enhanced relationship map
router.get('/ai/relationship-map', authenticate, contactsController.getRelationshipMapAI);

// ============================================================================
// AI PROFILE ROUTES - All require authentication
// ============================================================================

// POST /api/contacts/generate-profile - AI-assisted profile generation
router.post('/generate-profile', authenticate, contactsController.generateProfile);

// POST /api/contacts/:contactId/enrich - Enrich contact from messages
router.post('/:contactId/enrich', authenticate, contactsController.enrichContact);

module.exports = router;
