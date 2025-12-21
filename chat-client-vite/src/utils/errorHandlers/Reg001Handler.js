/**
 * Registration Error 001 Handler
 *
 * Handles REG_001 error code (Email Already Registered).
 *
 * @module utils/errorHandlers/Reg001Handler
 */

import { ErrorHandler } from './ErrorHandler.js';

class Reg001Handler extends ErrorHandler {
  getMessage(code, context = {}) {
    return {
      title: 'Email Already Registered',
      message: 'This email address is already associated with an account.',
      suggestion: 'Try signing in instead, or use a different email address.',
      showLogin: true,
    };
  }
}

export { Reg001Handler };

