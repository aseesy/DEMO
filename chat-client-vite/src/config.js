// Shared frontend configuration for the LiaiZen Vite app
// Central place to control the backend API base URL.

// Determine API URL:
// 1. Use VITE_API_URL if explicitly set
// 2. If on production domain (coparentliaizen.clm), use same origin with /api
// 3. Fall back to localhost:3001 for development
function getApiBaseUrl() {
  // Explicit configuration takes precedence
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // In browser, detect from current location
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    
    // Production domain - use Railway backend (not same origin)
    if (origin.includes('coparentliaizen.com') || origin.includes('liaizen.com')) {
      // Frontend on Vercel, backend on Railway
      return 'https://demo-production-6dcd.up.railway.app';
    }
    
    // Development - use localhost:3001
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return 'http://localhost:3001';
    }
    
    // For other domains, assume API is on same origin with /api
    return `${origin}/api`;
  }

  // Server-side rendering fallback
  return 'http://localhost:3001';
}

export const API_BASE_URL = getApiBaseUrl();


