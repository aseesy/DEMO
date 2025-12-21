import { API_BASE_URL } from './config.js';
import { trackAPIError, trackAPIResponseTime } from './utils/analyticsEnhancements.js';
import { STORAGE_KEYS } from './utils/storageKeys.js';

// Thin wrappers around fetch so we have a single place to adjust
// base URLs, credentials, and common headers.

/**
 * Get authentication token from localStorage
 * @returns {string|null} The auth token or null if not available
 */
function getAuthToken() {
  if (typeof window === 'undefined') return null;
  // Try preferred key first, then legacy fallback for Safari/ITP issues
  return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) || localStorage.getItem('auth_token_backup');
}

/**
 * Add Authorization header to headers object if token is available
 * @param {Object} headers - Existing headers object
 * @returns {Object} Headers with Authorization added if applicable
 */
function addAuthHeader(headers = {}) {
  const token = getAuthToken();
  if (token && !headers.Authorization && !headers.authorization) {
    headers.Authorization = `Bearer ${token}`;
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

  try {
    const headers = addAuthHeader({
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(options.headers || {}),
    });

    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
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
