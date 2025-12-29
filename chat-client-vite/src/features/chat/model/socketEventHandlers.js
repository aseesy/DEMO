/**
 * Socket Event Handlers - Orchestrator
 *
 * This file orchestrates all socket event handlers by importing
 * and setting up handlers from separate modules. This maintains
 * backward compatibility while organizing code into focused modules.
 */

import { setupConnectionHandlers } from '../handlers/connectionHandlers.js';
import { setupMessageHandlers } from '../handlers/messageHandlers.js';
import { setupTypingHandlers } from '../handlers/typingHandlers.js';
import { setupSearchHandlers } from '../handlers/searchHandlers.js';
import { setupDraftCoachingHandlers } from '../handlers/draftCoachingHandlers.js';
import { setupUserHandlers } from '../handlers/userHandlers.js';
import { setupErrorHandlers } from '../handlers/errorHandlers.js';
import { setupThreadHandlers } from '../handlers/threadHandlers.js';
import { setupPaginationHandlers } from '../handlers/paginationHandlers.js';

/**
 * Sets up socket event handlers for the chat connection
 * @param {Object} socket - Socket.io socket instance
 * @param {Object} handlers - Object containing all handler functions and refs
 */
export function setupSocketEventHandlers(socket, handlers) {
  // Setup all handler modules
  setupConnectionHandlers(socket, handlers);
  setupMessageHandlers(socket, handlers);
  setupTypingHandlers(socket, handlers);
  setupSearchHandlers(socket, handlers);
  setupDraftCoachingHandlers(socket, handlers);
  setupUserHandlers(socket, handlers);
  setupErrorHandlers(socket, handlers);
  setupThreadHandlers(socket, handlers);
  setupPaginationHandlers(socket, handlers);
}
