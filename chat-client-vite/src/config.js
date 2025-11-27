// Shared frontend configuration for the LiaiZen Vite app
// Central place to control the backend API base URL.
// Build timestamp: 2025-11-27T07:47:00Z - force rebuild for API URL fix

// Production Railway API URL
const PRODUCTION_API_URL = 'https://demo-production-6dcd.up.railway.app';

// Determine API URL:
// 1. Use VITE_API_URL if explicitly set (recommended - set in .env.local for dev, Vercel env vars for production)
// 2. Fall back to production Railway URL for production domains
// 3. Fall back to localhost:3001 for development
function getApiBaseUrl() {
  // Explicit configuration takes precedence - this should be set in all environments
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Fallback logic based on the current domain
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;

    // Development - use localhost:3001
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return 'http://localhost:3001';
    }

    // Production domains - use Railway API
    if (origin.includes('coparentliaizen.com') || origin.includes('vercel.app')) {
      return PRODUCTION_API_URL;
    }
  }

  // Server-side rendering fallback - use production for safety
  return PRODUCTION_API_URL;
}

export const API_BASE_URL = getApiBaseUrl();


