/**
 * TokenManager - Centralized token management singleton
 * 
 * Expert Solution: Single source of truth for authentication tokens
 * 
 * Problem Solved:
 * - Eliminates race conditions between React state and localStorage
 * - Provides instant token access (in-memory cache) for API calls
 * - Maintains persistence for page reloads
 * - Synchronizes token state across AuthContext and apiClient
 * 
 * Architecture:
 * - In-memory cache for instant access (no localStorage reads on every API call)
 * - localStorage for persistence across page reloads
 * - Event emitter for React state synchronization
 * - Thread-safe token updates
 */

// In-memory token cache for instant access
// null = not initialized, undefined = explicitly cleared, string = valid token
let tokenCache = null;
let tokenListeners = new Set();
let isInitialized = false;

/**
 * TokenManager - Singleton token management
 */
export const tokenManager = {
  /**
   * Get current token (from cache, fallback to localStorage)
   * This is the single source of truth for token access
   */
  getToken() {
    // If explicitly cleared (undefined), don't fall back to localStorage
    if (tokenCache === undefined) {
      return null;
    }
    
    // If we have a cached token, return it
    if (tokenCache !== null && typeof tokenCache === 'string') {
      return tokenCache;
    }
    
    // Only fall back to localStorage if not yet initialized
    // This prevents returning stale tokens after explicit clear
    if (!isInitialized && typeof window !== 'undefined') {
      const stored = localStorage.getItem('auth_token_backup');
      if (stored) {
        tokenCache = stored; // Cache it for next time
        isInitialized = true;
        return stored;
      }
      isInitialized = true; // Mark as initialized even if no token
    }
    
    return null;
  },

  /**
   * Set token (updates cache and localStorage synchronously)
   * This ensures token is immediately available for API calls
   */
  setToken(token) {
    const previousToken = tokenCache;
    // Use undefined to explicitly mark as cleared (prevents localStorage fallback)
    tokenCache = token || undefined;
    isInitialized = true; // Mark as initialized
    
    // Update localStorage synchronously
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token_backup', token);
      } else {
        localStorage.removeItem('auth_token_backup');
      }
    }
    
    // Notify listeners if token changed
    if (previousToken !== tokenCache) {
      tokenListeners.forEach(listener => {
        try {
          listener(tokenCache === undefined ? null : tokenCache);
        } catch (error) {
          console.error('[TokenManager] Error in token listener:', error);
        }
      });
    }
    
    return tokenCache === undefined ? null : tokenCache;
  },

  /**
   * Clear token
   */
  clearToken() {
    return this.setToken(null);
  },

  /**
   * Check if token exists
   */
  hasToken() {
    return this.getToken() !== null;
  },

  /**
   * Subscribe to token changes
   * @param {Function} listener - Called when token changes
   * @returns {Function} Unsubscribe function
   */
  subscribe(listener) {
    tokenListeners.add(listener);
    // Immediately call with current token
    listener(this.getToken());
    
    return () => {
      tokenListeners.delete(listener);
    };
  },

  /**
   * Initialize token from localStorage (called on app startup)
   */
  initialize() {
    if (typeof window !== 'undefined' && !isInitialized) {
      const stored = localStorage.getItem('auth_token_backup');
      if (stored) {
        tokenCache = stored;
      }
      isInitialized = true;
    }
  },
};

// Initialize on module load
if (typeof window !== 'undefined') {
  tokenManager.initialize();
}

export default tokenManager;

