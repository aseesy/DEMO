/**
 * Invalid Token Error Handler
 *
 * Handles INVALID_TOKEN error code.
 *
 * @module utils/errorHandlers/InvalidTokenHandler
 */

import { ErrorHandler } from './ErrorHandler.js';

class InvalidTokenHandler extends ErrorHandler {
  getMessage(code, context = {}) {
    return {
      title: 'Invalid Invitation',
      message: 'This invitation link is not valid. It may have been entered incorrectly.',
      suggestion:
        'Please check your message for the correct link or ask your co-parent to send a new invitation.',
    };
  }
}

export { InvalidTokenHandler };

