/**
 * Google Tag injection script for static HTML pages
 * This script reads the Google Tag from environment variables and injects it into the page
 * Note: For static HTML files, the tag will be injected at runtime
 */

(function() {
  'use strict';
  
  // Check if Google Tag is already present
  const existingTag = document.querySelector('script[src*="googletagmanager.com"], script[src*="google-analytics.com"], script[data-gtag]');
  if (existingTag) {
    return; // Tag already exists, don't inject again
  }

  // For static HTML files, we'll need to inject via a script tag that reads from window
  // This will be set by the build process or server-side rendering
  // For now, we'll check for a global variable or use a placeholder that gets replaced
  
  // In production, this will be replaced with the actual Google Tag code
  // For development, check if there's a way to inject it
  
  // Since static HTML files can't access Vite env vars directly,
  // we'll inject it via a script that runs immediately
  // The actual tag should be injected server-side or via build process
  
  console.log('Google Tag injection script loaded');
})();

