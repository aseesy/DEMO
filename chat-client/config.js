// API Configuration for LiaiZen
// Frontend on Vercel, Backend on Railway
// Railway backend: https://demo-production-6dcd.up.railway.app

(function() {
  'use strict';
  
  // Get current hostname
  const hostname = window.location.hostname;
  
  // Railway backend domain
  // Public Railway domain for backend API
  const RAILWAY_DOMAIN = 'https://demo-production-6dcd.up.railway.app';
  
  // Determine API URL based on hostname
  let API_URL;
  let SOCKET_URL;
  
  // Production domain - Vercel frontend, Railway backend
  if (hostname === 'coparentliaizen.com' || hostname === 'www.coparentliaizen.com') {
    // Use Railway backend domain
    API_URL = RAILWAY_DOMAIN;
    SOCKET_URL = RAILWAY_DOMAIN;
  } 
  // Vercel preview deployments - use Railway backend
  else if (hostname.includes('vercel.app')) {
    API_URL = RAILWAY_DOMAIN;
    SOCKET_URL = RAILWAY_DOMAIN;
  }
  // Local development - use localhost
  else if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname.startsWith('10.') || hostname.startsWith('172.')) {
    API_URL = 'http://localhost:3001';
    SOCKET_URL = 'http://localhost:3001';
  } 
  // Fallback - use Railway backend
  else {
    API_URL = RAILWAY_DOMAIN;
    SOCKET_URL = RAILWAY_DOMAIN;
  }
  
  // Make API_URL and SOCKET_URL available globally
  window.API_URL = API_URL;
  window.SOCKET_URL = SOCKET_URL;
  
  // Log for debugging
  console.log('API Configuration:', { API_URL, SOCKET_URL, hostname });
})();


