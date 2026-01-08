/**
 * 🔒 SEALED FILE - DO NOT MODIFY WITHOUT APPROVAL
 * 
 * TokenManager - Centralized token management singleton
 * 
 * ⚠️ CRITICAL: This file is SEALED and SET IN STONE.
 * This is the SINGLE SOURCE OF TRUTH for token storage.
 * AuthContext and apiClient depend on this exact interface.
 * 
 * RULES FOR AI ASSISTANTS:
 * - ❌ DO NOT modify subscription pattern (used by AuthContext)
 * - ❌ DO NOT change token get/set API contract
 * - ❌ DO NOT alter storage backends without migration plan
 * - ✅ CAN add new storage backends (if needed for new browser APIs)
 * - ✅ CAN modify cache strategies (with testing)
 * 
 * Before modifying: Check docs/AUTH_FLOW_SEALED.md for approval process.
 * 
 * Expert Solution: Single source of truth for authentication tokens
 * 
 * Problem Solved:
 * - Eliminates race conditions between React state and localStorage
 * - Provides instant token access (in-memory cache) for API calls
 * - Maintains persistence for page reloads
 * - Synchronizes token state across AuthContext and apiClient
 * - Survives Safari ITP clearing localStorage (multi-storage strategy)
 * 
 * Architecture:
 * - In-memory cache for instant access (no localStorage reads on every API call)
 * - localStorage for persistence across page reloads (primary)
 * - sessionStorage as backup (survives ITP clearing localStorage)
 * - IndexedDB for recovery (most persistent, survives ITP)
 * - Event emitter for React state synchronization
 * - Thread-safe token updates
 * - ITP detection and auto-recovery
 * 
 * See: docs/AUTH_FLOW_SEALED.md for complete sealing documentation.
 */

// In-memory token cache for instant access
// null = not initialized, undefined = explicitly cleared, string = valid token
let tokenCache = null;
let tokenListeners = new Set();
let isInitialized = false;
let syncInterval = null;

// Storage keys
const STORAGE_KEY = 'auth_token_backup';
const SESSION_KEY = 'auth_token_backup';
const INDEXEDDB_STORE = 'auth_tokens';
const INDEXEDDB_DB = 'liaizen_auth';

/**
 * IndexedDB helper functions
 */
async function getIndexedDBToken() {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return null;
  }

  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(INDEXEDDB_DB, 1);
      
      request.onerror = () => resolve(null);
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(INDEXEDDB_STORE)) {
          db.createObjectStore(INDEXEDDB_STORE);
        }
      };
      
      request.onsuccess = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(INDEXEDDB_STORE)) {
          resolve(null);
          return;
        }
        const transaction = db.transaction([INDEXEDDB_STORE], 'readonly');
        const store = transaction.objectStore(INDEXEDDB_STORE);
        const getRequest = store.get('token');
        
        getRequest.onerror = () => resolve(null);
        getRequest.onsuccess = () => {
          resolve(getRequest.result?.value || null);
        };
      };
    } catch (error) {
      console.warn('[TokenManager] IndexedDB access failed:', error);
      resolve(null);
    }
  });
}

async function setIndexedDBToken(token) {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return;
  }

  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(INDEXEDDB_DB, 1);
      
      request.onerror = () => resolve();
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(INDEXEDDB_STORE)) {
          db.createObjectStore(INDEXEDDB_STORE);
        }
      };
      
      request.onsuccess = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(INDEXEDDB_STORE)) {
          resolve();
          return;
        }
        
        const transaction = db.transaction([INDEXEDDB_STORE], 'readwrite');
        const store = transaction.objectStore(INDEXEDDB_STORE);
        const putRequest = store.put({ value: token }, 'token');
        
        putRequest.onerror = () => resolve();
        putRequest.onsuccess = () => resolve();
      };
    } catch (error) {
      console.warn('[TokenManager] IndexedDB write failed:', error);
      resolve();
    }
  });
}

async function removeIndexedDBToken() {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return;
  }

  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(INDEXEDDB_DB, 1);
      
      request.onerror = () => resolve();
      request.onsuccess = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(INDEXEDDB_STORE)) {
          resolve();
          return;
        }
        const transaction = db.transaction([INDEXEDDB_STORE], 'readwrite');
        const store = transaction.objectStore(INDEXEDDB_STORE);
        const deleteRequest = store.delete('token');
        
        deleteRequest.onerror = () => resolve();
        deleteRequest.onsuccess = () => resolve();
      };
    } catch (error) {
      console.warn('[TokenManager] IndexedDB delete failed:', error);
      resolve();
    }
  });
}

/**
 * TokenManager - Singleton token management
 */
export const tokenManager = {
  /**
   * Get current token (synchronous - from cache, fallback to localStorage/sessionStorage)
   * This is the single source of truth for token access
   * 
   * Storage priority (synchronous):
   * 1. In-memory cache (fastest)
   * 2. localStorage (primary)
   * 3. sessionStorage (backup - survives ITP)
   * 
   * For IndexedDB recovery, use recoverToken() separately
   */
  getToken() {
    // If explicitly cleared (undefined), don't fall back to storage
    if (tokenCache === undefined) {
      return null;
    }
    
    // If we have a cached token, return it
    if (tokenCache !== null && typeof tokenCache === 'string') {
      return tokenCache;
    }
    
    // Only fall back to storage if not yet initialized
    // This prevents returning stale tokens after explicit clear
    if (!isInitialized && typeof window !== 'undefined') {
      // Try localStorage first (primary)
      let stored = localStorage.getItem(STORAGE_KEY);
      
      // If localStorage is empty, try sessionStorage (backup)
      if (!stored) {
        stored = sessionStorage.getItem(SESSION_KEY);
        // If found in sessionStorage, sync to localStorage (ITP recovery)
        if (stored) {
          console.log('[TokenManager] Recovered token from sessionStorage (ITP recovery)');
          try {
            localStorage.setItem(STORAGE_KEY, stored);
          } catch (error) {
            console.warn('[TokenManager] Failed to sync sessionStorage to localStorage:', error);
          }
        }
      }
      
      if (stored) {
        tokenCache = stored; // Cache it for next time
        isInitialized = true;
        return stored;
      }
      isInitialized = true; // Mark as initialized even if no token
      
      // Try IndexedDB recovery asynchronously (don't block)
      this.recoverTokenFromIndexedDB();
    }
    
    return null;
  },

  /**
   * Recover token from IndexedDB (async - called when localStorage/sessionStorage empty)
   * This handles ITP clearing localStorage
   */
  async recoverTokenFromIndexedDB() {
    if (typeof window === 'undefined' || isInitialized) {
      return;
    }
    
    const stored = await getIndexedDBToken();
    if (stored) {
      console.log('[TokenManager] Recovered token from IndexedDB (ITP recovery)');
      tokenCache = stored;
      isInitialized = true;
      
      // Sync to all storages
      try {
        localStorage.setItem(STORAGE_KEY, stored);
        sessionStorage.setItem(SESSION_KEY, stored);
      } catch (error) {
        console.warn('[TokenManager] Failed to sync IndexedDB to storages:', error);
      }
      
      // Notify listeners of recovery
      tokenListeners.forEach(listener => {
        try {
          listener(stored);
        } catch (error) {
          console.error('[TokenManager] Error in token listener:', error);
        }
      });
    }
  },

  /**
   * Set token (updates cache and all storage types synchronously)
   * This ensures token is immediately available for API calls
   * and survives Safari ITP clearing localStorage
   */
  async setToken(token) {
    const previousToken = tokenCache;
    // Use undefined to explicitly mark as cleared (prevents storage fallback)
    tokenCache = token || undefined;
    isInitialized = true; // Mark as initialized
    
    // Update all storage types synchronously (multi-storage strategy)
    if (typeof window !== 'undefined') {
      if (token) {
        // Write to localStorage (primary)
        try {
          localStorage.setItem(STORAGE_KEY, token);
        } catch (error) {
          console.warn('[TokenManager] localStorage write failed:', error);
        }
        
        // Write to sessionStorage (backup - survives ITP)
        try {
          sessionStorage.setItem(SESSION_KEY, token);
        } catch (error) {
          console.warn('[TokenManager] sessionStorage write failed:', error);
        }
        
        // Write to IndexedDB (recovery - most persistent)
        setIndexedDBToken(token).catch(error => {
          console.warn('[TokenManager] IndexedDB write failed:', error);
        });
      } else {
        // Clear all storage types
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
          console.warn('[TokenManager] localStorage remove failed:', error);
        }
        
        try {
          sessionStorage.removeItem(SESSION_KEY);
        } catch (error) {
          console.warn('[TokenManager] sessionStorage remove failed:', error);
        }
        
        removeIndexedDBToken().catch(error => {
          console.warn('[TokenManager] IndexedDB remove failed:', error);
        });
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
   * Check if token exists (synchronous check of cache)
   * For async check with storage fallback, use getToken()
   */
  hasToken() {
    return tokenCache !== null && tokenCache !== undefined && typeof tokenCache === 'string';
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
   * Initialize token from multi-storage (called on app startup)
   * Tries localStorage → sessionStorage → IndexedDB (fallback chain)
   */
  async initialize() {
    if (typeof window !== 'undefined' && !isInitialized) {
      // Try localStorage first (primary)
      let stored = localStorage.getItem(STORAGE_KEY);
      
      // If localStorage is empty, try sessionStorage (backup)
      if (!stored) {
        stored = sessionStorage.getItem(SESSION_KEY);
        // If found in sessionStorage, sync to localStorage (ITP recovery)
        if (stored) {
          console.log('[TokenManager] Initialized from sessionStorage (ITP recovery)');
          try {
            localStorage.setItem(STORAGE_KEY, stored);
          } catch (error) {
            console.warn('[TokenManager] Failed to sync sessionStorage to localStorage:', error);
          }
        }
      }
      
      // If still empty, try IndexedDB (recovery)
      if (!stored) {
        stored = await getIndexedDBToken();
        // If found in IndexedDB, sync to all storages (ITP recovery)
        if (stored) {
          console.log('[TokenManager] Initialized from IndexedDB (ITP recovery)');
          try {
            localStorage.setItem(STORAGE_KEY, stored);
            sessionStorage.setItem(SESSION_KEY, stored);
          } catch (error) {
            console.warn('[TokenManager] Failed to sync IndexedDB to storages:', error);
          }
        }
      }
      
      if (stored) {
        tokenCache = stored;
      }
      isInitialized = true;
    }
  },

  /**
   * Sync token to all storage types (periodic sync for ITP recovery)
   * Called every 30 seconds to ensure token exists in all storages
   */
  async syncToAllStorages() {
    const token = tokenCache;
    if (token && typeof token === 'string' && typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, token);
        sessionStorage.setItem(SESSION_KEY, token);
        await setIndexedDBToken(token);
      } catch (error) {
        console.warn('[TokenManager] Sync to all storages failed:', error);
      }
    }
  },

  /**
   * Start periodic sync (every 30 seconds)
   * Ensures token exists in all storages even if ITP clears localStorage
   */
  startPeriodicSync() {
    if (syncInterval) {
      return; // Already started
    }
    
    syncInterval = setInterval(() => {
      this.syncToAllStorages();
    }, 30000); // 30 seconds
  },

  /**
   * Stop periodic sync
   */
  stopPeriodicSync() {
    if (syncInterval) {
      clearInterval(syncInterval);
      syncInterval = null;
    }
  },
};

// Initialize on module load (async)
if (typeof window !== 'undefined') {
  tokenManager.initialize().then(() => {
    // Start periodic sync after initialization
    tokenManager.startPeriodicSync();
    
    // Listen for storage events (ITP detection)
    window.addEventListener('storage', (e) => {
      // If localStorage was cleared (ITP), recover from backup
      if (e.key === STORAGE_KEY && e.newValue === null && e.oldValue !== null) {
        console.log('[TokenManager] localStorage cleared (possible ITP), recovering from backup');
        tokenManager.initialize().then(() => {
          // Notify listeners of recovery
          tokenListeners.forEach(listener => {
            try {
              listener(tokenManager.getToken());
            } catch (error) {
              console.error('[TokenManager] Error in token listener:', error);
            }
          });
        });
      }
    });
    
    // Sync on visibility change (user returns to app)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        tokenManager.syncToAllStorages();
      }
    });
    
    // Sync on focus (user returns to tab)
    window.addEventListener('focus', () => {
      tokenManager.syncToAllStorages();
    });
  });
}

export default tokenManager;

