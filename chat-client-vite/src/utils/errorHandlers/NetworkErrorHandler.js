/**
 * Network Error Handler
 *
 * Handles NETWORK_ERROR error code.
 *
 * @module utils/errorHandlers/NetworkErrorHandler
 */

import { ErrorHandler } from './ErrorHandler.js';

class NetworkErrorHandler extends ErrorHandler {
  getMessage(code, context = {}) {
    return {
      title: 'Connection Error',
      message: 'Unable to reach the server.',
      suggestion: 'Check your internet connection and try again.',
    };
  }
}

export { NetworkErrorHandler };

