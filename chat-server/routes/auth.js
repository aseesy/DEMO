/**
 * Auth Routes - Modular Entry Point
 */
const express = require('express');
const router = express.Router();
// Temporarily make dbReady optional to fix Railway cache issue
let requireDatabaseReady;
try {
  requireDatabaseReady = require('../../middleware/dbReady').requireDatabaseReady;
} catch (err) {
  console.warn('[auth.js] dbReady middleware not found, using no-op middleware:', err.message);
  requireDatabaseReady = (req, res, next) => next(); // No-op middleware
}

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
