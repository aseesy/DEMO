/**
 * Default Error Handler
 *
 * Handles unknown or unrecognized error codes.
 *
 * @module utils/errorHandlers/DefaultErrorHandler
 */

import { ErrorHandler } from './ErrorHandler.js';

class DefaultErrorHandler extends ErrorHandler {
  getMessage(code, context = {}) {
    const { inviteError, validationError } = context;
    return {
      title: 'Something Went Wrong',
      message: inviteError || validationError || "We couldn't validate this invitation.",
      suggestion: 'Please try again or contact support.',
    };
  }
}

export { DefaultErrorHandler };

