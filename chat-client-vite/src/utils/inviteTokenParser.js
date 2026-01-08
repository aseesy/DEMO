/**
 * Invite Token Parser Utility
 * 
 * Single source of truth for parsing invite tokens from URLs.
 * Handles both query params (?token=... or ?code=...) and path params.
 * 
 * Usage:
 *   const { token, code } = getInviteTokenFromUrl();
 *   const { token, code } = getInviteTokenFromUrl(searchParams);
 */

/**
 * Parse invite token/code from URL
 * 
 * @param {URLSearchParams} [searchParams] - Optional search params (defaults to window.location.search)
 * @returns {{ token: string | null, code: string | null }}
 */
export function getInviteTokenFromUrl(searchParams = null) {
  // If searchParams not provided, get from current URL
  if (!searchParams && typeof window !== 'undefined') {
    searchParams = new URLSearchParams(window.location.search);
  }
  
  if (!searchParams) {
    return { token: null, code: null };
  }
  
  const token = searchParams.get('token');
  const code = searchParams.get('code');
  
  // Log in dev mode
  if (import.meta.env.DEV) {
    console.log('[InviteTokenParser] Parsed from URL:', { token: token ? `${token.substring(0, 8)}...` : null, code });
  }
  
  return { token, code };
}

/**
 * Build invite URL with token or code
 * 
 * @param {string} basePath - Base path (e.g., '/accept-invite')
 * @param {string} [token] - Invite token
 * @param {string} [code] - Invite short code
 * @returns {string} Full URL with query params
 */
export function buildInviteUrl(basePath, token = null, code = null) {
  const url = new URL(basePath, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
  
  if (token) {
    url.searchParams.set('token', token);
  }
  if (code) {
    url.searchParams.set('code', code);
  }
  
  return url.pathname + url.search;
}

/**
 * Check if current URL is an invite URL
 * 
 * @returns {boolean}
 */
export function isInviteUrl() {
  if (typeof window === 'undefined') return false;
  return window.location.pathname === '/accept-invite';
}

