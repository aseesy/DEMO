/**
 * Invalid Code Error Handler
 *
 * Handles INVALID_CODE error code.
 *
 * @module utils/errorHandlers/InvalidCodeHandler
 */

import { ErrorHandler } from './ErrorHandler.js';

class InvalidCodeHandler extends ErrorHandler {
  getMessage(code, context = {}) {
    return {
      title: 'Invalid Code',
      message: 'This invitation code is not valid.',
      suggestion:
        'Please check the code and try again, or ask your co-parent to send a new invitation.',
    };
  }
}

export { InvalidCodeHandler };

