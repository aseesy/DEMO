/**
 * Socket Event Handlers - Orchestrator
 *
 * This file orchestrates all socket event handlers by importing
 * and setting up handlers from separate modules. This maintains
 * backward compatibility while organizing code into focused modules.
 *
 * IMPORTANT: All handler setup functions now return cleanup functions
 * to prevent memory leaks from stacked event listeners.
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
 * @returns {Function} Cleanup function to remove all listeners
 */
export function setupSocketEventHandlers(socket, handlers) {
  // Store cleanup functions from each handler module
  const cleanups = [];

  // Setup all handler modules and collect cleanup functions
  cleanups.push(setupConnectionHandlers(socket, handlers));
  cleanups.push(setupMessageHandlers(socket, handlers));
  cleanups.push(setupTypingHandlers(socket, handlers));
  cleanups.push(setupSearchHandlers(socket, handlers));
  cleanups.push(setupDraftCoachingHandlers(socket, handlers));
  cleanups.push(setupUserHandlers(socket, handlers));
  cleanups.push(setupErrorHandlers(socket, handlers));
  cleanups.push(setupThreadHandlers(socket, handlers));
  cleanups.push(setupPaginationHandlers(socket, handlers));

  // Return master cleanup function
  return () => {
    cleanups.forEach(cleanup => {
      if (typeof cleanup === 'function') {
        cleanup();
      }
    });
  };
}
