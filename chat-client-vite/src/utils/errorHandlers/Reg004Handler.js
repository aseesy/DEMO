/**
 * Registration Error 004 Handler
 *
 * Handles REG_004 error code (Already Connected).
 *
 * @module utils/errorHandlers/Reg004Handler
 */

import { ErrorHandler } from './ErrorHandler.js';

class Reg004Handler extends ErrorHandler {
  getMessage(code, context = {}) {
    return {
      title: 'Already Connected',
      message: 'This invitation has already been used.',
      suggestion: 'If you have an account, please sign in.',
      showLogin: true,
    };
  }
}

export { Reg004Handler };

