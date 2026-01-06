/**
 * OAuth Helper Utilities
 * Provides popup blocker detection, state parameter generation/validation, and OAuth error handling
 */

import { storage, sessionStorage as sessionStorageAdapter, StorageKeys } from '../adapters/storage';

/**
 * Generate a random state parameter for CSRF protection
 * @returns {string} Random state string
 */
export function generateOAuthState() {
  const array = new Uint32Array(28 / 4);
  crypto.getRandomValues(array);
  return Array.from(array, dec => ('0' + dec.toString(16)).substr(-2)).join('');
}

/**
 * Store OAuth state in both sessionStorage and localStorage
 * Using both provides resilience against Safari ITP clearing sessionStorage
 * @param {string} state - State parameter
 */
export function storeOAuthState(state) {
  const timestamp = Date.now().toString();
  // Store in both for resilience (Safari ITP can clear sessionStorage during redirects)
  sessionStorageAdapter.set(StorageKeys.OAUTH_STATE, state);
  sessionStorageAdapter.set(StorageKeys.OAUTH_STATE_TIMESTAMP, timestamp);
  storage.set(StorageKeys.OAUTH_STATE, state);
  storage.set(StorageKeys.OAUTH_STATE_TIMESTAMP, timestamp);
}

/**
 * Validate OAuth state parameter
 * Checks both sessionStorage and localStorage for resilience
 * @param {string} receivedState - State received from OAuth callback
 * @returns {boolean} True if state is valid
 */
export function validateOAuthState(receivedState) {
  // Try sessionStorage first, fall back to localStorage (Safari ITP resilience)
  let storedState = sessionStorageAdapter.getString(StorageKeys.OAUTH_STATE);
  let timestamp = sessionStorageAdapter.getString(StorageKeys.OAUTH_STATE_TIMESTAMP);

  // Fall back to localStorage if sessionStorage was cleared
  if (!storedState || !timestamp) {
    storedState = storage.getString(StorageKeys.OAUTH_STATE);
    timestamp = storage.getString(StorageKeys.OAUTH_STATE_TIMESTAMP);
    if (storedState && timestamp) {
      console.log('[OAuth] State recovered from localStorage (sessionStorage was cleared)');
    }
  }

  if (!storedState || !timestamp) {
    console.warn('[OAuth] No stored state found in sessionStorage or localStorage');
    return false;
  }

  // Check expiration (10 minutes)
  const age = Date.now() - parseInt(timestamp, 10);
  if (age > 10 * 60 * 1000) {
    // State expired
    console.warn('[OAuth] State expired after', Math.round(age / 1000), 'seconds');
    clearOAuthState();
    return false;
  }

  // Check if states match
  if (storedState !== receivedState) {
    // State mismatch - potential CSRF attack
    console.warn(
      '[OAuth] State mismatch - stored:',
      storedState?.substring(0, 8),
      'received:',
      receivedState?.substring(0, 8)
    );
    clearOAuthState();
    return false;
  }

  return true;
}

/**
 * Clear OAuth state from both sessionStorage and localStorage
 */
export function clearOAuthState() {
  sessionStorageAdapter.removeMany([StorageKeys.OAUTH_STATE, StorageKeys.OAUTH_STATE_TIMESTAMP]);
  storage.removeMany([StorageKeys.OAUTH_STATE, StorageKeys.OAUTH_STATE_TIMESTAMP]);
}

/**
 * Detect if popup blocker is active
 * Attempts to open a popup and checks if it was blocked
 * @returns {Promise<boolean>} True if popup blocker detected
 */
export function detectPopupBlocker() {
  return new Promise(resolve => {
    const popup = window.open('', '_blank', 'width=1,height=1');

    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      // Popup was blocked
      resolve(true);
    } else {
      // Popup opened successfully
      popup.close();
      resolve(false);
    }
  });
}

/**
 * Open OAuth popup with popup blocker detection
 * @param {string} authUrl - OAuth authorization URL
 * @returns {Promise<Window|null>} Popup window or null if blocked
 */
export async function openOAuthPopup(authUrl) {
  // First check if popup blocker is active
  const isBlocked = await detectPopupBlocker();

  if (isBlocked) {
    return null;
  }

  // Open popup
  const popup = window.open(
    authUrl,
    'google_oauth',
    'width=500,height=600,scrollbars=yes,resizable=yes'
  );

  // Check if popup was actually opened
  if (!popup || popup.closed || typeof popup.closed === 'undefined') {
    return null;
  }

  return popup;
}

/**
 * Wait for OAuth popup to complete
 * @param {Window} popup - Popup window
 * @param {Function} onMessage - Callback when OAuth completes
 * @returns {Promise<Object>} OAuth result
 */
export function waitForOAuthPopup(popup, onMessage) {
  return new Promise((resolve, reject) => {
    const checkInterval = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkInterval);
        reject(new Error('Popup was closed before completing authentication'));
      }
    }, 1000);

    // Listen for message from popup
    const messageHandler = event => {
      // Verify origin for security
      const allowedOrigins = [window.location.origin, 'https://accounts.google.com'];

      if (!allowedOrigins.includes(event.origin)) {
        return;
      }

      if (event.data.type === 'oauth_complete') {
        clearInterval(checkInterval);
        window.removeEventListener('message', messageHandler);
        popup.close();
        resolve(event.data);
      } else if (event.data.type === 'oauth_error') {
        clearInterval(checkInterval);
        window.removeEventListener('message', messageHandler);
        popup.close();
        reject(new Error(event.data.error));
      }
    };

    window.addEventListener('message', messageHandler);

    // Timeout after 5 minutes
    setTimeout(
      () => {
        clearInterval(checkInterval);
        window.removeEventListener('message', messageHandler);
        if (!popup.closed) {
          popup.close();
        }
        reject(new Error('OAuth authentication timed out'));
      },
      5 * 60 * 1000
    );
  });
}

/**
 * Parse OAuth error from URL or error parameter
 * @param {string} error - Error code from OAuth
 * @param {string} errorDescription - Error description
 * @returns {Object} Error info with user-friendly message
 */
export function parseOAuthError(error, errorDescription) {
  const errorMap = {
    access_denied: {
      message: 'Access denied by user',
      userMessage: 'You cancelled the sign-in. You can try again or use email/password instead.',
      action: 'try_again',
      retryable: true,
    },
    server_error: {
      message: 'OAuth server error',
      userMessage:
        'Google sign-in is temporarily unavailable. Please try again in a moment or use email/password.',
      action: 'retry_or_email',
      retryable: true,
    },
    invalid_request: {
      message: 'Invalid OAuth request',
      userMessage: 'There was a problem with the sign-in request. Please try again.',
      action: 'retry',
      retryable: true,
    },
    invalid_client: {
      message: 'Invalid OAuth client',
      userMessage: 'Sign-in configuration error. Please contact support.',
      action: 'contact_support',
      retryable: false,
    },
    invalid_grant: {
      message: 'Invalid OAuth grant',
      userMessage: 'The sign-in session expired. Please try again.',
      action: 'retry',
      retryable: true,
    },
    unauthorized_client: {
      message: 'Unauthorized OAuth client',
      userMessage: 'Sign-in configuration error. Please contact support.',
      action: 'contact_support',
      retryable: false,
    },
    unsupported_response_type: {
      message: 'Unsupported OAuth response type',
      userMessage: 'Sign-in configuration error. Please contact support.',
      action: 'contact_support',
      retryable: false,
    },
    invalid_scope: {
      message: 'Invalid OAuth scope',
      userMessage: 'Sign-in configuration error. Please contact support.',
      action: 'contact_support',
      retryable: false,
    },
  };

  const errorInfo = errorMap[error] || {
    message: error || 'Unknown OAuth error',
    userMessage: errorDescription || 'An error occurred during sign-in. Please try again.',
    action: 'retry',
    retryable: true,
  };

  return {
    ...errorInfo,
    code: error,
    description: errorDescription,
  };
}
