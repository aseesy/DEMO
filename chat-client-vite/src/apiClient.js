import { API_BASE_URL } from './config.js';

// Thin wrappers around fetch so we have a single place to adjust
// base URLs, credentials, and common headers.

export async function apiGet(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'GET',
    credentials: 'include',
    ...options,
  });
  return response;
}

export async function apiPost(path, body, options = {}) {
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
  return response;
}

export async function apiPut(path, body, options = {}) {
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
  return response;
}


