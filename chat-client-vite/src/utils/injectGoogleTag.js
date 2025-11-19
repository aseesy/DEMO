/**
 * Injects Google Tag from environment variable into the page head
 * This runs immediately on page load to ensure the tag is present before any other scripts
 */

export function injectGoogleTag() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  // Check if Google Tag is already present (check for common Google Tag patterns)
  const existingTag = document.querySelector(
    'script[src*="googletagmanager.com"], ' +
    'script[src*="google-analytics.com"], ' +
    'script[data-gtag], ' +
    'script[id*="google"], ' +
    'script[src*="gtag"], ' +
    'script[src*="gtm"]'
  );
  
  if (existingTag) {
    console.log('Google Tag already present, skipping injection');
    return;
  }

  // Get Google Tag from environment variable (support both VITE_GOOGLE_TAG and GOOGLE_TAG)
  const googleTag = import.meta.env.VITE_GOOGLE_TAG || import.meta.env.GOOGLE_TAG || '';
  
  if (!googleTag || !googleTag.trim()) {
    console.log('No GOOGLE_TAG found in environment variables');
    return;
  }

  try {
    // Parse the Google Tag HTML snippet
    const parser = new DOMParser();
    const doc = parser.parseFromString(googleTag.trim(), 'text/html');
    
    // Extract all script tags from the Google Tag snippet
    const scripts = doc.querySelectorAll('script');
    
    scripts.forEach((script) => {
      const newScript = document.createElement('script');
      
      // Copy all attributes
      Array.from(script.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });
      
      // Copy inline script content if present
      if (script.textContent) {
        newScript.textContent = script.textContent;
      }
      
      // Mark as Google Tag to prevent duplicates
      newScript.setAttribute('data-gtag', 'injected');
      
      // Insert immediately after <head> opening tag (at the beginning)
      document.head.insertBefore(newScript, document.head.firstChild);
    });

    // Also check for noscript tags (for GTM)
    const noscripts = doc.querySelectorAll('noscript');
    noscripts.forEach((noscript) => {
      const existingNoscript = document.querySelector('noscript[data-gtag]');
      if (!existingNoscript) {
        const newNoscript = document.createElement('noscript');
        newNoscript.innerHTML = noscript.innerHTML;
        newNoscript.setAttribute('data-gtag', 'injected');
        document.body.insertBefore(newNoscript, document.body.firstChild);
      }
    });

    console.log('Google Tag injected successfully');
  } catch (error) {
    console.error('Error injecting Google Tag:', error);
  }
}
