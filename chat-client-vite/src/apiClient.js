import { API_BASE_URL } from './config.js';
import { trackAPIError, trackAPIResponseTime } from './utils/analyticsEnhancements.js';
import { tokenManager } from './utils/tokenManager.js';

// Thin wrappers around fetch so we have a single place to adjust
// base URLs, credentials, and common headers.

// Auth failure event for global handling
const AUTH_FAILURE_EVENT = 'liaizen:auth-failure';
// Rate limit event for global handling
const RATE_LIMIT_EVENT = 'liaizen:rate-limit';

// Rate limit state - prevent excessive retries
// Persisted to sessionStorage to survive page refreshes
const RATE_LIMIT_STORAGE_KEY = 'liaizen:rate-limit-until';

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

let rateLimitUntil = getRateLimitUntil();

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
      console.log('[apiClient] Adding auth header:', {
        hasToken: !!cleanToken,
        tokenParts: tokenParts.length,
        tokenLength: cleanToken.length,
        tokenPreview: cleanToken.substring(0, 20) + '...',
      });
    }
  }

  // Don't warn about missing tokens - it's expected for:
  // 1. Login/signup requests (no token yet)
  // 2. Public endpoints
  // 3. Initial page loads before auth is verified
  // Only log in debug mode if needed
  if (!token && import.meta.env.DEV && import.meta.env.VITE_DEBUG_AUTH) {
    console.log('[apiClient] No token available (this is normal for login/signup requests)');
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
        console.warn(
          `[apiClient] Rate limited on ${endpoint}. Retry after: ${retryAfterSeconds || 60}s`
        );
      }
    }

    return response;
  } catch (error) {
    // Track network errors
    const duration = performance.now() - startTime;
    trackAPIResponseTime(endpoint, duration);
    trackAPIError(endpoint, 0, error.message || 'Network error');
    throw error;
  }
}

export async function apiPost(path, body, options = {}) {
  const endpoint = path;
  const startTime = performance.now();

  // Only log in development to avoid exposing sensitive data in production
  if (import.meta.env.DEV) {
    console.log('[apiPost] Making request', {
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
      console.log('[apiPost] Fetching...', { url: `${API_BASE_URL}${path}` });
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify(body),
      ...options,
    });

    if (import.meta.env.DEV) {
      console.log('[apiPost] Response received', {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
      });
    }

    // Track API response time
    const duration = performance.now() - startTime;
    trackAPIResponseTime(endpoint, duration);

    // Track API errors (don't consume body - let caller handle it)
    if (!response.ok) {
      trackAPIError(endpoint, response.status, response.statusText);
      if (response.status === 401 && !endpoint.includes('/api/auth/')) {
        dispatchAuthFailure(endpoint);
      }
    }

    return response;
  } catch (error) {
    // Track network errors
    const duration = performance.now() - startTime;
    trackAPIResponseTime(endpoint, duration);
    trackAPIError(endpoint, 0, error.message || 'Network error');
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

    // Track API errors (don't consume body - let caller handle it)
    if (!response.ok) {
      trackAPIError(endpoint, response.status, response.statusText);
      if (response.status === 401 && !endpoint.includes('/api/auth/')) {
        dispatchAuthFailure(endpoint);
      }
    }

    return response;
  } catch (error) {
    // Track network errors
    const duration = performance.now() - startTime;
    trackAPIResponseTime(endpoint, duration);
    trackAPIError(endpoint, 0, error.message || 'Network error');
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

    // Track API errors (don't consume body - let caller handle it)
    if (!response.ok) {
      trackAPIError(endpoint, response.status, response.statusText);
      if (response.status === 401 && !endpoint.includes('/api/auth/')) {
        dispatchAuthFailure(endpoint);
      }
    }

    return response;
  } catch (error) {
    // Track network errors
    const duration = performance.now() - startTime;
    trackAPIResponseTime(endpoint, duration);
    trackAPIError(endpoint, 0, error.message || 'Network error');
    throw error;
  }
}
