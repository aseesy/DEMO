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
    socketService.subscribe('message_reconciled', this.handleMessageReconciled.bind(this));
    socketService.subscribe('message_error', this.handleMessageError.bind(this));
    socketService.subscribe('older_messages', this.handleOlderMessages.bind(this));
    socketService.subscribe('disconnect', this.handleDisconnect.bind(this));
  }

  /**
   * Merge server messages with existing messages and pending optimistic messages
   *
   * Deterministic merge algorithm:
   * 1. Build map from existing messages (keyed by id or tempId)
   * 2. Process server messages (remove confirmed pending, add/update server messages)
   * 3. Add unconfirmed pending messages
   * 4. Sort deterministically (timestamp, then id)
   *
   * @param {Array} serverMessages - Messages from server
   * @param {Array} existingMessages - Current messages array
   * @param {Map} pendingMessages - Map of pending optimistic messages
   * @returns {Array} Merged and sorted messages
   */
  mergeMessages(serverMessages, existingMessages, pendingMessages) {
    // 1. Build ID map from existing messages
    const byId = new Map();
    for (const msg of existingMessages) {
      const id = msg.id || msg.tempId || msg.optimisticId;
      if (id) {
        byId.set(id, msg);
      }
    }

    // 2. Process server messages (remove confirmed pending, add/update server)
    for (const msg of serverMessages) {
      const id = msg.id || msg.tempId || msg.optimisticId;
      if (!id) continue;

      // If server message has tempId/optimisticId, it confirms a pending message
      const tempId = msg.tempId || msg.optimisticId;
      if (tempId) {
        pendingMessages.delete(tempId);
        // Also remove optimistic message from existing (if present)
        byId.delete(tempId);
      }

      // Server version takes precedence (use id as key if available, otherwise tempId)
      const key = msg.id || tempId;
      byId.set(key, msg);
    }

    // 3. Add unconfirmed pending messages
    for (const [tempId, msg] of pendingMessages.entries()) {
      if (!byId.has(tempId)) {
        byId.set(tempId, msg);
      }
    }

    // 4. Sort deterministically (timestamp, then id)
    const merged = Array.from(byId.values()).sort((a, b) => {
      const timeA = new Date(a.timestamp || a.created_at || 0).getTime();
      const timeB = new Date(b.timestamp || b.created_at || 0).getTime();

      if (timeA !== timeB) {
        return timeA - timeB;
      }

      // Tiebreaker: sort by id (deterministic)
      const idA = a.id || a.tempId || a.optimisticId || '';
      const idB = b.id || b.tempId || b.optimisticId || '';
      return idA.localeCompare(idB);
    });

    return merged;
  }

  handleMessageHistory(data) {
    if (import.meta.env.DEV) {
      console.log('[MessageService] ========== MESSAGE_HISTORY RECEIVED ==========');
      console.log('[MessageService] Messages count:', data.messages?.length);
      console.log('[MessageService] HasMore:', data.hasMore);
    }
    if (data.messages) {
      // Root cause fix: Don't replace existing messages with empty array
      // message_history is meant to REPLACE (fresh load), but if server sends
      // empty array (error, race condition, new room), we shouldn't clear existing messages
      if (data.messages.length === 0 && this.messages.length > 0) {
        if (import.meta.env.DEV) {
          console.warn(
            '[MessageService] Ignoring empty message_history - preserving existing messages'
          );
        }
        return; // Don't replace existing messages with empty array
      }

      // Merge: replace all messages but preserve pending optimistic messages
      this.messages = this.mergeMessages(data.messages, [], this.pendingMessages);
      this.hasMore = data.hasMore ?? data.messages.length >= 50;
      this.notify();
    }
  }

  handleNewMessage(message) {
    // Merge: add new message (deduplicates if already exists)
    this.messages = this.mergeMessages([message], this.messages, this.pendingMessages);
    this.notify();
  }

  handleMessageSent(data) {
    const { tempId, message } = data;
    this.pendingMessages.delete(tempId);
    this.messageStatuses.set(tempId, 'sent');
    // Replace pending with confirmed message if needed
    this.notify();
  }

  /**
   * Handle message_reconciled event from server
   * This correlates the optimistic message with the server-persisted message
   * per the Conversation History Contract (Invariant I-11)
   */
  handleMessageReconciled(data) {
    const { optimisticId, messageId, timestamp } = data;

    // Remove from pending messages
    if (this.pendingMessages.has(optimisticId)) {
      this.pendingMessages.delete(optimisticId);
    }

    // Update status: remove old optimisticId key, set new messageId as 'sent'
    if (this.messageStatuses.has(optimisticId)) {
      this.messageStatuses.delete(optimisticId);
    }
    this.messageStatuses.set(messageId, 'sent');

    // Find optimistic message and create server version
    const optimisticMsg = this.messages.find(
      msg =>
        msg.id === optimisticId || msg.optimisticId === optimisticId || msg.tempId === optimisticId
    );

    if (optimisticMsg) {
      // Create server message with id (merge will replace optimistic)
      const serverMessage = {
        ...optimisticMsg,
        id: messageId,
        optimisticId: optimisticId, // Include optimisticId so merge can remove from pending
        timestamp: timestamp || optimisticMsg.timestamp,
        isOptimistic: false,
        isPending: false,
        status: 'sent',
      };

      // Use merge to replace optimistic with server version
      this.messages = this.mergeMessages([serverMessage], this.messages, this.pendingMessages);
    }

    this.notify();
  }

  /**
   * Handle message_error event from server
   * Per Conversation History Contract (Invariant I-15): mark as failed, retain for retry
   */
  handleMessageError(data) {
    const { optimisticId, tempId, error } = data;
    const id = optimisticId || tempId;

    // Mark status as failed
    this.messageStatuses.set(id, 'failed');

    // Update message in array to show failed state (keep for user action)
    this.messages = this.messages.map(msg => {
      if (msg.id === id || msg.optimisticId === id) {
        return { ...msg, status: 'failed', error };
      }
      return msg;
    });

    this.notify();
  }

  handleOlderMessages(data) {
    this.isLoadingOlder = false;
    if (data.messages?.length > 0) {
      // Merge: prepend older messages (deduplicates overlapping messages)
      this.messages = this.mergeMessages(data.messages, this.messages, this.pendingMessages);
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
   * Remove messages matching predicate (e.g., pending_original, ai_intervention)
   * @param {Function} predicate - Function that returns true for messages to remove
   */
  removeMessages(predicate) {
    const initialCount = this.messages.length;
    
    // Remove from messages array
    this.messages = this.messages.filter(msg => !predicate(msg));
    
    // Remove from pending messages map
    for (const [tempId, msg] of this.pendingMessages.entries()) {
      if (predicate(msg)) {
        this.pendingMessages.delete(tempId);
        this.messageStatuses.delete(tempId);
      }
    }
    
    // Only notify if messages were actually removed
    if (this.messages.length !== initialCount) {
      this.notify();
    }
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
