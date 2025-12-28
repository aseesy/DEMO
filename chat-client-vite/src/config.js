/**
 * Central Frontend Configuration - Single Source of Truth
 *
 * All configuration values should be imported from this file.
 * Never hardcode ports, URLs, or other config values elsewhere.
 *
 * HOW TO CHANGE PORTS:
 * 1. Backend port: Update chat-server/.env -> PORT=3000
 * 2. Frontend API URL: Update chat-client-vite/.env -> VITE_API_URL=http://localhost:3000
 *
 * The fallback ports below are ONLY used if VITE_API_URL is not set in .env
 */

// =============================================================================
// FALLBACK PORT CONFIGURATION - Only used if VITE_API_URL is not set
// These should match the backend's DEFAULT_BACKEND_PORT in chat-server/config.js
// =============================================================================
const DEV_BACKEND_PORT = 3000;
const DEV_FRONTEND_PORT = 5173;

// =============================================================================
// PRODUCTION URLs
// =============================================================================
const PRODUCTION_API_URL = 'https://demo-production-6dcd.up.railway.app';
const PRODUCTION_DOMAINS = ['coparentliaizen.com', 'vercel.app'];

// =============================================================================
// ENVIRONMENT DETECTION
// =============================================================================
const isProduction = () => {
  if (typeof window === 'undefined') return true;
  const origin = window.location.origin;
  return PRODUCTION_DOMAINS.some(domain => origin.includes(domain));
};

const isDevelopment = () => {
  if (typeof window === 'undefined') return false;
  const origin = window.location.origin;
  return origin.includes('localhost') || origin.includes('127.0.0.1');
};

// =============================================================================
// API URL RESOLUTION
// =============================================================================
function getApiBaseUrl() {
  // 1. Explicit env var takes precedence
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // 2. Development - use configured port
  if (isDevelopment()) {
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    return `http://${hostname}:${DEV_BACKEND_PORT}`;
  }

  // 3. Production fallback
  return PRODUCTION_API_URL;
}

// =============================================================================
// SOCKET URL RESOLUTION
// =============================================================================
function getSocketUrl() {
  // Socket URL is same as API URL (backend serves both)
  return getApiBaseUrl();
}

// =============================================================================
// EXPORTS
// =============================================================================
// Compute URLs - ensure they're available at build time
// During build, window is undefined, so we use production fallback
const apiBaseUrl = getApiBaseUrl();
const socketUrl = getSocketUrl();

// Explicit named exports for static analysis
export const API_BASE_URL = apiBaseUrl;
export const SOCKET_URL = socketUrl;

// Also export as getters for runtime access (if needed)
export function getSocketUrlValue() {
  return socketUrl;
}

export function getApiBaseUrlValue() {
  return apiBaseUrl;
}

// Export for use in other files that need the raw values
export const config = {
  // Ports
  DEV_BACKEND_PORT,
  DEV_FRONTEND_PORT,

  // URLs
  API_BASE_URL,
  SOCKET_URL,
  PRODUCTION_API_URL,

  // Environment
  isProduction,
  isDevelopment,

  // Helpers
  getApiBaseUrl,
  getSocketUrl,
};

export default config;
