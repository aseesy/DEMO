/**
 * Marketing Site Configuration
 * 
 * Simple config for marketing site - only needs API URL
 */

function getApiBaseUrl() {
  // 1. Explicit env var takes precedence
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.trim();
  }

  // 2. Development - use localhost
  if (import.meta.env.DEV) {
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    return `http://${hostname}:3000`;
  }

  // 3. Production fallback
  return 'https://demo-production-6dcd.up.railway.app';
}

export const API_BASE_URL = getApiBaseUrl();

