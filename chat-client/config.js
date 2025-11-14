// API Configuration for LiaiZen
// Frontend on Vercel, Backend on Railway
// Replace RAILWAY_DOMAIN with your actual Railway domain after deployment

(function() {
  'use strict';
  
  // Get current hostname
  const hostname = window.location.hostname;
  
  // Railway backend domain - update this after Railway deployment
  // Format: https://your-app.up.railway.app
  const RAILWAY_DOMAIN = 'RAILWAY_DOMAIN_PLACEHOLDER';
  
  // Determine API URL based on hostname
  let API_URL;
  let SOCKET_URL;
  
  // Production domain - Vercel frontend, Railway backend
  if (hostname === 'coparentliaizen.com' || hostname === 'www.coparentliaizen.com') {
    // Use Railway backend domain (will be updated after deployment)
    if (RAILWAY_DOMAIN !== 'RAILWAY_DOMAIN_PLACEHOLDER') {
      API_URL = RAILWAY_DOMAIN;
      SOCKET_URL = RAILWAY_DOMAIN;
    } else {
      // Fallback: will need to update this with actual Railway domain
      console.warn('⚠️ Railway domain not configured. Please update config.js with your Railway domain.');
      API_URL = 'https://your-railway-app.up.railway.app';
      SOCKET_URL = 'https://your-railway-app.up.railway.app';
    }
  } 
  // Vercel preview deployments - use Railway backend
  else if (hostname.includes('vercel.app')) {
    if (RAILWAY_DOMAIN !== 'RAILWAY_DOMAIN_PLACEHOLDER') {
      API_URL = RAILWAY_DOMAIN;
      SOCKET_URL = RAILWAY_DOMAIN;
    } else {
      API_URL = 'https://your-railway-app.up.railway.app';
      SOCKET_URL = 'https://your-railway-app.up.railway.app';
    }
  }
  // Local development - use localhost
  else if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname.startsWith('10.') || hostname.startsWith('172.')) {
    API_URL = 'http://localhost:3001';
    SOCKET_URL = 'http://localhost:3001';
  } 
  // Fallback - use Railway backend
  else {
    if (RAILWAY_DOMAIN !== 'RAILWAY_DOMAIN_PLACEHOLDER') {
      API_URL = RAILWAY_DOMAIN;
      SOCKET_URL = RAILWAY_DOMAIN;
    } else {
      API_URL = 'https://your-railway-app.up.railway.app';
      SOCKET_URL = 'https://your-railway-app.up.railway.app';
    }
  }
  
  // Make API_URL and SOCKET_URL available globally
  window.API_URL = API_URL;
  window.SOCKET_URL = SOCKET_URL;
  
  // Log for debugging
  console.log('API Configuration:', { API_URL, SOCKET_URL, hostname });
})();


