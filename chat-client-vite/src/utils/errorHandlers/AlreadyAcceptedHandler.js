/**
 * Already Accepted Error Handler
 *
 * Handles ALREADY_ACCEPTED error code.
 *
 * @module utils/errorHandlers/AlreadyAcceptedHandler
 */

import { ErrorHandler } from './ErrorHandler.js';

class AlreadyAcceptedHandler extends ErrorHandler {
  getMessage(code, context = {}) {
    return {
      title: 'Already Accepted',
      message: 'This invitation has already been accepted.',
      suggestion:
        'If you already have an account, please sign in. Otherwise, contact your co-parent.',
      showLogin: true,
    };
  }
}

export { AlreadyAcceptedHandler };

