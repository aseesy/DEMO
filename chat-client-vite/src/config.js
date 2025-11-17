// Shared frontend configuration for the LiaiZen Vite app
// Central place to control the backend API base URL.

// Prefer Vite env var if provided, otherwise fall back to localhost:3001
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3001';


