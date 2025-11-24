// Shared frontend configuration for the LiaiZen Vite app
// Central place to control the backend API base URL.

// Determine API URL:
// 1. Use VITE_API_URL if explicitly set (recommended - set in .env.local for dev, Vercel env vars for production)
// 2. Fall back to localhost:3001 for development
// 3. For production domains, you MUST set VITE_API_URL environment variable
function getApiBaseUrl() {
  // Explicit configuration takes precedence - this should be set in all environments
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Fallback for local development only (when VITE_API_URL is not set)
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    
    // Development - use localhost:3001
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return 'http://localhost:3001';
    }
  }

  // Server-side rendering fallback
  return 'http://localhost:3001';
}

export const API_BASE_URL = getApiBaseUrl();


