/**
 * Adapters - Abstraction layers for external dependencies
 *
 * Why adapters exist:
 * - Decouple application code from third-party libraries
 * - If we switch libraries, only adapter files change
 * - Provides stable APIs that application code can depend on
 * - Makes testing easier (can mock adapters)
 *
 * Available adapters:
 * - navigation: Wraps react-router-dom
 * - socket: Wraps socket.io-client
 * - storage: Wraps localStorage/sessionStorage
 */

// Navigation adapter
export { useAppNavigation, NavigationPaths } from './navigation/index.js';

// Socket adapter
export { createSocketConnection, getSocketUrl, SocketEvents } from './socket/index.js';

// Storage adapter
export {
  storage,
  StorageAdapter,
  StorageKeys,
  authStorage,
  preferencesStorage,
} from './storage/index.js';
