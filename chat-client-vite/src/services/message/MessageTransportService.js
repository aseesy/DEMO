/**
 * MessageTransportService - Transport Layer Abstraction
 *
 * Responsibility: Handle message delivery via any transport mechanism
 *
 * Why this exists:
 * - Decouples business logic from transport (Socket.io, HTTP, WebSocket, etc.)
 * - If we switch from Socket.io to HTTP REST or native WebSocket, only this changes
 * - Provides a stable API that validation/queue services can depend on
 *
 * Single Responsibility: Transport only - no validation, no business logic
 */

import { SocketEvents } from '../../adapters/socket/SocketAdapter.js';

/**
 * MessageTransportService
 *
 * Abstracts message sending over any transport mechanism
 */
export class MessageTransportService {
  /**
   * @param {Object} transport - Transport adapter (e.g., SocketConnection)
   */
  constructor(transport) {
    this._transport = transport;
  }

  /**
   * Check if transport is connected
   * @returns {boolean}
   */
  isConnected() {
    return this._transport?.connected ?? false;
  }

  /**
   * Get transport connection ID
   * @returns {string|null}
   */
  getConnectionId() {
    return this._transport?.id ?? null;
  }

  /**
   * Send a message via transport
   *
   * @param {Object} messagePayload - Message data to send
   * @param {string} messagePayload.text - Message text
   * @param {boolean} [messagePayload.isPreApprovedRewrite] - Is this a rewrite
   * @param {string} [messagePayload.originalRewrite] - Original message if rewrite
   * @param {string} [messagePayload.optimisticId] - Client-generated ID for reconciliation
   * @returns {Promise<boolean>} True if sent, false if queued/failed
   */
  async sendMessage(messagePayload) {
    if (!this.isConnected()) {
      console.warn('[MessageTransportService] ❌ Cannot send message - not connected');
      return false;
    }

    try {
      const payload = {
        text: messagePayload.text,
        isPreApprovedRewrite: messagePayload.isPreApprovedRewrite || false,
        originalRewrite: messagePayload.originalRewrite || null,
        optimisticId: messagePayload.optimisticId || null,
      };

      console.log('[MessageTransportService] 📤 Sending message to server:', {
        textPreview: payload.text?.substring(0, 50),
        isPreApprovedRewrite: payload.isPreApprovedRewrite,
        hasOptimisticId: !!payload.optimisticId,
        socketId: this._transport?.id,
        connected: this._transport?.connected,
      });

      const success = this._transport.emit(SocketEvents.SEND_MESSAGE, payload);

      if (!success) {
        console.warn('[MessageTransportService] ⚠️ emit() returned false');
      }

      return success;
    } catch (error) {
      console.error('[MessageTransportService] ❌ Error sending message:', error);
      return false;
    }
  }

  /**
   * Subscribe to message delivery events
   * @param {Function} handler - Event handler
   * @returns {Function} Unsubscribe function
   */
  onMessageDelivered(handler) {
    if (!this._transport) return () => {};
    return this._transport.on(SocketEvents.MESSAGE_DELIVERED, handler);
  }

  /**
   * Subscribe to message error events
   * @param {Function} handler - Event handler
   * @returns {Function} Unsubscribe function
   */
  onMessageError(handler) {
    if (!this._transport) return () => {};
    return this._transport.on(SocketEvents.MESSAGE_ERROR, handler);
  }

  /**
   * Subscribe to connection state changes
   * @param {Function} onConnect - Connect handler
   * @param {Function} onDisconnect - Disconnect handler
   * @returns {Function} Unsubscribe function
   */
  onConnectionChange(onConnect, onDisconnect) {
    if (!this._transport) return () => {};

    const unsubConnect = this._transport.on(SocketEvents.CONNECT, onConnect);
    const unsubDisconnect = this._transport.on(SocketEvents.DISCONNECT, onDisconnect);

    return () => {
      unsubConnect();
      unsubDisconnect();
    };
  }
}

/**
 * Create a MessageTransportService instance
 * @param {Object} transport - Transport adapter (SocketConnection, etc.)
 * @returns {MessageTransportService}
 */
export function createMessageTransportService(transport) {
  return new MessageTransportService(transport);
}
