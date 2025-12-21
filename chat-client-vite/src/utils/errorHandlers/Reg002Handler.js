/**
 * Registration Error 002 Handler
 *
 * Handles REG_002 error code (Invalid Invitation).
 *
 * @module utils/errorHandlers/Reg002Handler
 */

import { ErrorHandler } from './ErrorHandler.js';

class Reg002Handler extends ErrorHandler {
  getMessage(code, context = {}) {
    return {
      title: 'Invalid Invitation',
      message: 'This invitation token is not valid.',
      suggestion: 'Please ask your co-parent to send a new invitation.',
    };
  }
}

export { Reg002Handler };

