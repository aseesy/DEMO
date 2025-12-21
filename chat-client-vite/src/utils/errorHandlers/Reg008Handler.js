/**
 * Registration Error 008 Handler
 *
 * Handles REG_008 error code (Inviter Not Found).
 *
 * @module utils/errorHandlers/Reg008Handler
 */

import { ErrorHandler } from './ErrorHandler.js';

class Reg008Handler extends ErrorHandler {
  getMessage(code, context = {}) {
    return {
      title: 'Inviter Not Found',
      message: 'The account that sent this invitation no longer exists.',
      suggestion: 'Please contact support if you need assistance.',
    };
  }
}

export { Reg008Handler };

