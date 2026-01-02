/**
 * Socket adapter exports
 *
 * Note: getSocketUrl is re-exported from config.js (single source of truth)
 * SocketAdapter.js only exports createSocketConnection and SocketEvents
 */
export { createSocketConnection, SocketEvents } from './SocketAdapter.js';
export { getSocketUrl } from '../../config.js';
