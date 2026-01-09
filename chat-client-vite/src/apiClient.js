import { API_BASE_URL } from './config.js';
import { trackAPIError, trackAPIResponseTime } from './utils/analyticsEnhancements.js';
import { tokenManager } from './utils/tokenManager.js';
import { createLogger } from './utils/logger.js';

const logger = createLogger('[apiClient]');

// Thin wrappers around fetch so we have a single place to adjust
// base URLs, credentials, and common headers.

// Auth failure event for global handling
const AUTH_FAILURE_EVENT = 'liaizen:auth-failure';
// Rate limit event for global handling
const RATE_LIMIT_EVENT = 'liaizen:rate-limit';

// Rate limit state - prevent excessive retries
// Persisted to sessionStorage to survive page refreshes
const RATE_LIMIT_STORAGE_KEY = 'liaizen:rate-limit-until';
const SERVER_DOWN_STORAGE_KEY = 'liaizen:server-down-until';

function getRateLimitUntil() {
  if (typeof window === 'undefined') return 0;
  try {
    const stored = sessionStorage.getItem(RATE_LIMIT_STORAGE_KEY);
    return stored ? parseInt(stored, 10) : 0;
  } catch {
    return 0;
  }
}

function setRateLimitUntil(timestamp) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(RATE_LIMIT_STORAGE_KEY, timestamp.toString());
  } catch {
    // Ignore storage errors (e.g., private browsing mode)
  }
}

function getServerDownUntil() {
  if (typeof window === 'undefined') return 0;
  try {
    const stored = sessionStorage.getItem(SERVER_DOWN_STORAGE_KEY);
    return stored ? parseInt(stored, 10) : 0;
  } catch {
    return 0;
  }
}

function setServerDownUntil(timestamp) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(SERVER_DOWN_STORAGE_KEY, timestamp.toString());
  } catch {
    // Ignore storage errors (e.g., private browsing mode)
  }
}

let rateLimitUntil = getRateLimitUntil();
let serverDownUntil = getServerDownUntil();
let connectionRefusedCount = 0;
let lastConnectionRefusedLog = 0;

/**
 * Check if server is down based on recent connection refused errors
 */
function isServerDown() {
  const stored = getServerDownUntil();
  if (stored > serverDownUntil) {
    serverDownUntil = stored;
  }
  return Date.now() < serverDownUntil;
}

/**
 * Export isServerDown for hooks to check before making requests
 * This prevents excessive API calls when the server is down
 */
export function checkServerStatus() {
  return isServerDown();
}

/**
 * Mark server as down for a cooldown period to suppress excessive errors
 */
function markServerDown(durationMs = 30000) {
  serverDownUntil = Date.now() + durationMs;
  setServerDownUntil(serverDownUntil);
}

/**
 * Mark server as up (called on successful connection)
 */
function markServerUp() {
  if (serverDownUntil > 0) {
    serverDownUntil = 0;
    setServerDownUntil(0);
    connectionRefusedCount = 0;
  }
}

/**
 * Dispatch auth failure event for global handling
 * Components can listen to this to trigger re-login
 */
function dispatchAuthFailure(endpoint) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(AUTH_FAILURE_EVENT, {
        detail: { endpoint, timestamp: Date.now() },
      })
    );
  }
}

/**
 * Dispatch rate limit event for global handling
 * Components can listen to this to prevent retries
 */
function dispatchRateLimit(endpoint, retryAfter) {
  if (typeof window !== 'undefined') {
    // Set rate limit cooldown period
    const cooldownMs = retryAfter ? retryAfter * 1000 : 60000; // Default 60s if no retry-after
    rateLimitUntil = Date.now() + cooldownMs;
    setRateLimitUntil(rateLimitUntil); // Persist to sessionStorage

    window.dispatchEvent(
      new CustomEvent(RATE_LIMIT_EVENT, {
        detail: { endpoint, retryAfter, timestamp: Date.now(), cooldownUntil: rateLimitUntil },
      })
    );
  }
}

/**
 * Check if we're currently rate limited
 * Checks both in-memory state and sessionStorage for persistence
 */
function isRateLimited() {
  // Sync with sessionStorage in case it was set elsewhere
  const stored = getRateLimitUntil();
  if (stored > rateLimitUntil) {
    rateLimitUntil = stored;
  }
  return Date.now() < rateLimitUntil;
}

/**
 * Subscribe to auth failure events
 * @param {Function} callback - Called when auth fails
 * @returns {Function} Unsubscribe function
 */
export function onAuthFailure(callback) {
  if (typeof window === 'undefined') return () => {};
  const handler = e => callback(e.detail);
  window.addEventListener(AUTH_FAILURE_EVENT, handler);
  return () => window.removeEventListener(AUTH_FAILURE_EVENT, handler);
}

/**
 * Subscribe to rate limit events
 * @param {Function} callback - Called when rate limited
 * @returns {Function} Unsubscribe function
 */
export function onRateLimit(callback) {
  if (typeof window === 'undefined') return () => {};
  const handler = e => callback(e.detail);
  window.addEventListener(RATE_LIMIT_EVENT, handler);
  return () => window.removeEventListener(RATE_LIMIT_EVENT, handler);
}

/**
 * Check if currently rate limited (for components to check before making requests)
 */
export function checkRateLimit() {
  return isRateLimited();
}

/**
 * Get authentication token from TokenManager (single source of truth)
 * @returns {string|null} The auth token or null if not available
 */
function getAuthToken() {
  // Use TokenManager for instant, synchronized token access
  return tokenManager.getToken();
}

/**
 * Add Authorization header to headers object if token is available
 * @param {Object} headers - Existing headers object
 * @returns {Object} Headers with Authorization added if applicable
 */
function addAuthHeader(headers = {}) {
  const token = getAuthToken();
  if (token && !headers.Authorization && !headers.authorization) {
    // Ensure token doesn't already have "Bearer " prefix
    const cleanToken = token.startsWith('Bearer ') ? token.substring(7) : token;
    headers.Authorization = `Bearer ${cleanToken}`;

    // Debug logging in development
    if (import.meta.env.DEV) {
      const tokenParts = cleanToken.split('.');
      logger.debug('Adding auth header', {
        hasToken: !!cleanToken,
        tokenParts: tokenParts.length,
        tokenLength: cleanToken.length,
      });
    }
  }

  // Don't warn about missing tokens - it's expected for:
  // 1. Login/signup requests (no token yet)
  // 2. Public endpoints
  // 3. Initial page loads before auth is verified
  // Only log in debug mode if needed
  if (!token && import.meta.env.DEV && import.meta.env.VITE_DEBUG_AUTH) {
    logger.debug('No token available (this is normal for login/signup requests)');
  }
  return headers;
}

export async function apiGet(path, options = {}) {
  const endpoint = path;
  const startTime = performance.now();

  try {
    const headers = addAuthHeader({
      'X-Requested-With': 'XMLHttpRequest',
      ...(options.headers || {}),
    });

    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'GET',
      credentials: 'include',
      headers,
      ...options,
    });

    // Track API response time
    const duration = performance.now() - startTime;
    trackAPIResponseTime(endpoint, duration);

    // Server is up - mark it as such
    markServerUp();

    // Track API errors (don't consume body - let caller handle it)
    if (!response.ok) {
      trackAPIError(endpoint, response.status, response.statusText);
      // Dispatch auth failure for 401 errors (except for auth endpoints)
      if (response.status === 401 && !endpoint.includes('/api/auth/')) {
        dispatchAuthFailure(endpoint);
      }
      // Handle 429 rate limit errors - prevent excessive retries
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const retryAfterSeconds = retryAfter ? parseInt(retryAfter, 10) : null;
        dispatchRateLimit(endpoint, retryAfterSeconds);
        logger.warn('Rate limited', {
          endpoint,
          retryAfterSeconds: retryAfterSeconds || 60,
        });
      }
    }

    return response;
  } catch (error) {
    // Track network errors with offline/server classification
    const duration = performance.now() - startTime;
    trackAPIResponseTime(endpoint, duration);

    // Check if this is a connection refused error
    const isConnectionRefused =
      error.message?.includes('ERR_CONNECTION_REFUSED') ||
      error.message?.includes('Failed to fetch') ||
      error.message?.includes('NetworkError') ||
      (error.name === 'TypeError' && error.message?.includes('fetch'));

    if (isConnectionRefused) {
      connectionRefusedCount++;

      // Mark server as down for 30 seconds to suppress excessive errors
      markServerDown(30000);

      // Only log connection refused errors occasionally to avoid spam
      const now = Date.now();
      const timeSinceLastLog = now - lastConnectionRefusedLog;

      if (timeSinceLastLog > 10000 || connectionRefusedCount === 1) {
        // Log first error or if 10+ seconds have passed
        logger.warn('Server appears to be down (connection refused)', {
          endpoint,
          connectionRefusedCount,
          suppressingFor: '30s',
        });
        lastConnectionRefusedLog = now;
      }

      // Don't track connection refused errors excessively
      if (connectionRefusedCount <= 3) {
        trackAPIError(endpoint, 0, 'Connection refused - server may be down');
      }
    } else {
      // Not connection refused - track normally
      trackAPIError(endpoint, 0, error.message || 'Network error');
    }

    // Classify error type (offline vs server) for observability
    if (typeof window !== 'undefined') {
      import('./utils/pwaObservability.js')
        .then(({ trackErrorWithClassification }) => {
          trackErrorWithClassification(error, `api_get_${endpoint}`);
        })
        .catch(() => {
          // Silently ignore if module not available
        });
    }

    throw error;
  }
}

export async function apiPost(path, body, options = {}) {
  const endpoint = path;
  const startTime = performance.now();

  // Only log in development to avoid exposing sensitive data in production
  if (import.meta.env.DEV) {
    logger.debug('Making POST request', {
      path,
      url: `${API_BASE_URL}${path}`,
      hasBody: !!body,
      bodyKeys: body ? Object.keys(body) : [],
    });
  }

  try {
    const headers = addAuthHeader({
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(options.headers || {}),
    });

    if (import.meta.env.DEV) {
      logger.debug('Fetching POST request', { url: `${API_BASE_URL}${path}` });
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify(body),
      ...options,
    });

    if (import.meta.env.DEV) {
      logger.debug('POST response received', {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        endpoint: path,
      });
    }

    // Track API response time
    const duration = performance.now() - startTime;
    trackAPIResponseTime(endpoint, duration);

    // Server is up - mark it as such
    markServerUp();

    // Track API errors (don't consume body - let caller handle it)
    if (!response.ok) {
      trackAPIError(endpoint, response.status, response.statusText);
      if (response.status === 401 && !endpoint.includes('/api/auth/')) {
        dispatchAuthFailure(endpoint);
      }
    }

    return response;
  } catch (error) {
    // Track network errors with connection refused handling
    const duration = performance.now() - startTime;
    trackAPIResponseTime(endpoint, duration);

    const isConnectionRefused =
      error.message?.includes('ERR_CONNECTION_REFUSED') ||
      error.message?.includes('Failed to fetch') ||
      error.message?.includes('NetworkError');

    if (isConnectionRefused) {
      markServerDown(30000);
      if (connectionRefusedCount <= 3) {
        trackAPIError(endpoint, 0, 'Connection refused - server may be down');
      }
    } else {
      trackAPIError(endpoint, 0, error.message || 'Network error');
    }
    throw error;
  }
}

export async function apiPut(path, body, options = {}) {
  const endpoint = path;
  const startTime = performance.now();

  try {
    const headers = addAuthHeader({
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(options.headers || {}),
    });

    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'PUT',
      credentials: 'include',
      headers,
      body: JSON.stringify(body),
      ...options,
    });

    // Track API response time
    const duration = performance.now() - startTime;
    trackAPIResponseTime(endpoint, duration);

    // Server is up - mark it as such
    markServerUp();

    // Track API errors (don't consume body - let caller handle it)
    if (!response.ok) {
      trackAPIError(endpoint, response.status, response.statusText);
      if (response.status === 401 && !endpoint.includes('/api/auth/')) {
        dispatchAuthFailure(endpoint);
      }
    }

    return response;
  } catch (error) {
    // Track network errors with connection refused handling
    const duration = performance.now() - startTime;
    trackAPIResponseTime(endpoint, duration);

    const isConnectionRefused =
      error.message?.includes('ERR_CONNECTION_REFUSED') ||
      error.message?.includes('Failed to fetch') ||
      error.message?.includes('NetworkError');

    if (isConnectionRefused) {
      markServerDown(30000);
      if (connectionRefusedCount <= 3) {
        trackAPIError(endpoint, 0, 'Connection refused - server may be down');
      }
    } else {
      trackAPIError(endpoint, 0, error.message || 'Network error');
    }
    throw error;
  }
}

export async function apiDelete(path, params = {}) {
  const endpoint = path;
  const startTime = performance.now();
  const queryString = new URLSearchParams(params).toString();
  const url = queryString ? `${API_BASE_URL}${path}?${queryString}` : `${API_BASE_URL}${path}`;

  try {
    const headers = addAuthHeader({
      'X-Requested-With': 'XMLHttpRequest',
    });

    const response = await fetch(url, {
      method: 'DELETE',
      credentials: 'include',
      headers,
    });

    // Track API response time
    const duration = performance.now() - startTime;
    trackAPIResponseTime(endpoint, duration);

    // Server is up - mark it as such
    markServerUp();

    // Track API errors (don't consume body - let caller handle it)
    if (!response.ok) {
      trackAPIError(endpoint, response.status, response.statusText);
      if (response.status === 401 && !endpoint.includes('/api/auth/')) {
        dispatchAuthFailure(endpoint);
      }
    }

    return response;
  } catch (error) {
    // Track network errors with connection refused handling
    const duration = performance.now() - startTime;
    trackAPIResponseTime(endpoint, duration);

    const isConnectionRefused =
      error.message?.includes('ERR_CONNECTION_REFUSED') ||
      error.message?.includes('Failed to fetch') ||
      error.message?.includes('NetworkError');

    if (isConnectionRefused) {
      markServerDown(30000);
      if (connectionRefusedCount <= 3) {
        trackAPIError(endpoint, 0, 'Connection refused - server may be down');
      }
    } else {
      trackAPIError(endpoint, 0, error.message || 'Network error');
    }
    throw error;
  }
}
