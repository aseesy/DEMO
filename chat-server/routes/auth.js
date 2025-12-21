/**
 * Auth Routes - Modular Entry Point
 */
const express = require('express');
const router = express.Router();

const signupRoutes = require('./auth/signup');
const loginRoutes = require('./auth/login');
const oauthRoutes = require('./auth/oauth');
const passwordRoutes = require('./auth/password');
const verificationRoutes = require('./auth/verification');

router.use('/', signupRoutes);
router.use('/', loginRoutes);
router.use('/', oauthRoutes);
router.use('/', passwordRoutes);
router.use('/', verificationRoutes);

module.exports = router;
