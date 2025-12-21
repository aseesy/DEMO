/**
 * Cancelled Error Handler
 *
 * Handles CANCELLED error code.
 *
 * @module utils/errorHandlers/CancelledHandler
 */

import { ErrorHandler } from './ErrorHandler.js';

class CancelledHandler extends ErrorHandler {
  getMessage(code, context = {}) {
    return {
      title: 'Invitation Cancelled',
      message: 'This invitation has been cancelled by the sender.',
      suggestion: 'Please contact your co-parent if you believe this is a mistake.',
    };
  }
}

export { CancelledHandler };

