/**
 * Auth Routes - Modular Entry Point
 */
const express = require('express');
const router = express.Router();
const { requireDatabaseReady } = require('../../middleware/dbReady');

const signupRoutes = require('./auth/signup');
const loginRoutes = require('./auth/login');
const oauthRoutes = require('./auth/oauth');
const passwordRoutes = require('./auth/password');
const verificationRoutes = require('./auth/verification');

// CRITICAL: Require database to be ready before processing auth requests
// This prevents "Account Not Found" errors when database is still connecting
// Railway starts server before database initialization completes
router.use(requireDatabaseReady);

router.use('/', signupRoutes);
router.use('/', loginRoutes);
router.use('/', oauthRoutes);
router.use('/', passwordRoutes);
router.use('/', verificationRoutes);

module.exports = router;
