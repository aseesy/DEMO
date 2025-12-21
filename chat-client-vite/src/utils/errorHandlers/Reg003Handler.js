/**
 * Registration Error 003 Handler
 *
 * Handles REG_003 error code (Invitation Expired).
 *
 * @module utils/errorHandlers/Reg003Handler
 */

import { ErrorHandler } from './ErrorHandler.js';

class Reg003Handler extends ErrorHandler {
  getMessage(code, context = {}) {
    return {
      title: 'Invitation Expired',
      message: 'This invitation has expired.',
      suggestion: 'Please ask your co-parent to send you a new invitation.',
    };
  }
}

export { Reg003Handler };

