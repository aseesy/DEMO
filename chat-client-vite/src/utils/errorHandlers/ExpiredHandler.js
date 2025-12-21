/**
 * Expired Error Handler
 *
 * Handles EXPIRED error code.
 *
 * @module utils/errorHandlers/ExpiredHandler
 */

import { ErrorHandler } from './ErrorHandler.js';

class ExpiredHandler extends ErrorHandler {
  getMessage(code, context = {}) {
    return {
      title: 'Invitation Expired',
      message: 'This invitation has expired. Invitations are valid for 7 days.',
      suggestion: 'Please ask your co-parent to send you a new invitation.',
    };
  }
}

export { ExpiredHandler };

