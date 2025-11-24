import { API_BASE_URL } from './config.js';
import { trackAPIError, trackAPIResponseTime } from './utils/analyticsEnhancements.js';

// Thin wrappers around fetch so we have a single place to adjust
// base URLs, credentials, and common headers.

export async function apiGet(path, options = {}) {
  const endpoint = path;
  const startTime = performance.now();
  
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'GET',
      credentials: 'include',
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
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
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
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
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
    const response = await fetch(url, {
      method: 'DELETE',
      credentials: 'include',
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


