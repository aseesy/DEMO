// API Configuration for LiaiZen
// Automatically detects the current domain and sets the API URL accordingly

(function() {
  'use strict';
  
  // Get current hostname
  const hostname = window.location.hostname;
  
  // Determine API URL based on hostname
  let API_URL;
  let SOCKET_URL;
  
  if (hostname === 'coparentliaizen.com' || hostname === 'www.coparentliaizen.com') {
    // Production domain - use HTTPS
    API_URL = 'https://coparentliaizen.com';
    SOCKET_URL = 'https://coparentliaizen.com';
  } else if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname.startsWith('10.') || hostname.startsWith('172.')) {
    // Local development - use localhost
    API_URL = 'http://localhost:3001';
    SOCKET_URL = 'http://localhost:3001';
  } else {
    // Other domains (staging, etc.) - use current domain with HTTPS
    API_URL = `https://${hostname}`;
    SOCKET_URL = `https://${hostname}`;
  }
  
  // Make API_URL and SOCKET_URL available globally
  window.API_URL = API_URL;
  window.SOCKET_URL = SOCKET_URL;
  
  // Log for debugging (remove in production if desired)
  console.log('API Configuration:', { API_URL, SOCKET_URL, hostname });
})();


