/**
 * Simple API Client for Marketing Site
 * 
 * Only handles:
 * - POST /api/waitlist (waitlist signup)
 * - GET /api/stats/user-count (social proof)
 * - GET /api/blog/images/* (blog images - handled via direct URLs)
 */

import { API_BASE_URL } from '../config.js';

/**
 * Simple GET request
 */
export async function apiGet(endpoint) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for CORS
    });

    return response;
  } catch (error) {
    console.error(`API GET error (${endpoint}):`, error);
    throw error;
  }
}

/**
 * Simple POST request
 */
export async function apiPost(endpoint, data) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for CORS
      body: JSON.stringify(data),
    });

    return response;
  } catch (error) {
    console.error(`API POST error (${endpoint}):`, error);
    throw error;
  }
}

