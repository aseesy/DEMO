/**
 * Authentication Module - Modular Entry Point
 *
 * Exports all authentication-related functions from submodules.
 */
const {
  RegistrationError,
  createRegistrationError,
  hashPassword,
  comparePassword,
  generateUsernameSuffix,
} = require('./auth/utils');

const { getUser, userExists, generateUniqueUsername, createUser } = require('./auth/user');
const { authenticateUser, authenticateUserByEmail } = require('./auth/authentication');
const {
  createUserWithEmail,
  createUserWithEmailNoRoom,
  registerWithInvitation,
  registerFromInvitation,
} = require('./auth/registration');
const { getOrCreateGoogleUser, getUserByGoogleId } = require('./auth/oauth');
const {
  registerFromShortCode,
  registerFromPairing,
  registerFromPairingCode,
} = require('./auth/pairing');
const { getDisambiguatedDisplay, disambiguateContacts } = require('./auth/display');

module.exports = {
  // Constants & Utils
  RegistrationError,
  createRegistrationError,
  hashPassword,
  comparePassword,
  generateUsernameSuffix,

  // User Management
  getUser,
  userExists,
  generateUniqueUsername,
  createUser,

  // Authentication
  authenticateUser,
  authenticateUserByEmail,

  // Registration
  createUserWithEmail, // Creates user WITH private room (for standalone signup)
  createUserWithEmailNoRoom, // Creates user WITHOUT room (for invite acceptance)
  registerWithInvitation, // Creates user AND sends invite (misleading name)
  registerFromInvitation, // Accepts invite via long token (invitation system)

  // OAuth
  getOrCreateGoogleUser,
  getUserByGoogleId,

  // Pairing / Invite Acceptance
  registerFromShortCode, // Accepts via short code LZ-XXXX (invitation system)
  registerFromPairing, // Accepts via pairing token (pairing system)
  registerFromPairingCode, // Accepts via pairing code (pairing system)

  // Display
  getDisambiguatedDisplay,
  disambiguateContacts,
};
