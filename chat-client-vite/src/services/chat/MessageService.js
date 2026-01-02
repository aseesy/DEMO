import { socketService } from '../socket';

/**
 * MessageService - Domain service for message management
 *
 * Single Responsibility: Message state, sending, receiving.
 * Nothing else.
 */
class MessageService {
  constructor() {
    this.messages = [];
    this.pendingMessages = new Map(); // tempId -> message
    this.messageStatuses = new Map(); // tempId -> status
    this.hasMore = true;
    this.isLoadingOlder = false;
    this.subscribers = new Set();
    this.setupSubscriptions();
  }

  setupSubscriptions() {
    // Server emits 'message_history' separately from 'join_success'
    socketService.subscribe('message_history', this.handleMessageHistory.bind(this));
    socketService.subscribe('new_message', this.handleNewMessage.bind(this));
    socketService.subscribe('message_sent', this.handleMessageSent.bind(this));
    socketService.subscribe('message_error', this.handleMessageError.bind(this));
    socketService.subscribe('older_messages', this.handleOlderMessages.bind(this));
    socketService.subscribe('disconnect', this.handleDisconnect.bind(this));
  }

  handleMessageHistory(data) {
    if (data.messages) {
      // Root cause fix: Don't replace existing messages with empty array
      // message_history is meant to REPLACE (fresh load), but if server sends
      // empty array (error, race condition, new room), we shouldn't clear existing messages
      if (data.messages.length === 0 && this.messages.length > 0) {
        console.warn(
          '[MessageService] Ignoring empty message_history - preserving existing messages'
        );
        return; // Don't replace existing messages with empty array
      }

      // Replace messages (intended behavior for message_history - fresh load on join)
      this.messages = data.messages;
      this.hasMore = data.hasMore ?? data.messages.length >= 50;
      this.notify();
    }
  }

  handleNewMessage(message) {
    this.messages = [...this.messages, message];
    this.notify();
  }

  handleMessageSent(data) {
    const { tempId, message } = data;
    this.pendingMessages.delete(tempId);
    this.messageStatuses.set(tempId, 'sent');
    // Replace pending with confirmed message if needed
    this.notify();
  }

  handleMessageError(data) {
    const { tempId } = data;
    this.messageStatuses.set(tempId, 'error');
    this.notify();
  }

  handleOlderMessages(data) {
    this.isLoadingOlder = false;
    if (data.messages?.length > 0) {
      this.messages = [...data.messages, ...this.messages];
      this.hasMore = data.messages.length >= 50;
    } else {
      this.hasMore = false;
    }
    this.notify();
  }

  handleDisconnect() {
    // Keep messages but mark connection lost
    this.notify();
  }

  /**
   * Send a message
   */
  send(payload) {
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.pendingMessages.set(tempId, { ...payload, tempId });
    this.messageStatuses.set(tempId, 'sending');
    this.notify();

    socketService.emit('send_message', { ...payload, tempId });
    return tempId;
  }

  /**
   * Load older messages
   */
  loadOlder() {
    if (this.isLoadingOlder || !this.hasMore || this.messages.length === 0) {
      return;
    }

    this.isLoadingOlder = true;
    this.notify();

    socketService.emit('load_older_messages', {
      beforeTimestamp: this.messages[0].timestamp,
      limit: 50,
    });

    // Timeout safety
    setTimeout(() => {
      if (this.isLoadingOlder) {
        this.isLoadingOlder = false;
        this.notify();
      }
    }, 10000);
  }

  getState() {
    return {
      messages: this.messages,
      pendingMessages: Array.from(this.pendingMessages.values()),
      messageStatuses: Object.fromEntries(this.messageStatuses),
      hasMore: this.hasMore,
      isLoadingOlder: this.isLoadingOlder,
    };
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notify() {
    const state = this.getState();
    this.subscribers.forEach(cb => cb(state));
  }

  /**
   * Clear all messages (e.g., on logout)
   */
  clear() {
    this.messages = [];
    this.pendingMessages.clear();
    this.messageStatuses.clear();
    this.hasMore = true;
    this.isLoadingOlder = false;
    this.notify();
  }
}

export const messageService = new MessageService();
export default messageService;
