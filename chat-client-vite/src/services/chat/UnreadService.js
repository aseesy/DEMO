import { socketService } from '../socket';

/**
 * UnreadService - Domain service for unread message counts
 *
 * Single Responsibility: Unread count.
 * Nothing else.
 */
class UnreadService {
  constructor() {
    this.count = 0;
    this.currentUsername = null;
    this.isViewingChat = false;
    this.subscribers = new Set();
    this.setupSubscriptions();
  }

  setupSubscriptions() {
    socketService.subscribe('new_message', this.handleNewMessage.bind(this));
    socketService.subscribe('disconnect', this.handleDisconnect.bind(this));
  }

  handleNewMessage(message) {
    // Only increment if not viewing chat and message is from someone else
    if (!this.isViewingChat && message.sender !== this.currentUsername) {
      this.count++;
      this.notify();
    }
  }

  handleDisconnect() {
    // Keep count on disconnect
  }

  /**
   * Set current username (to filter out own messages)
   */
  setUsername(username) {
    this.currentUsername = username;
  }

  /**
   * Set whether user is viewing chat
   */
  setViewingChat(isViewing) {
    this.isViewingChat = isViewing;
    if (isViewing) {
      this.count = 0;
      this.notify();
    }
  }

  /**
   * Mark all as read
   */
  markAllRead() {
    this.count = 0;
    this.notify();
  }

  getState() {
    return {
      count: this.count,
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
}

export const unreadService = new UnreadService();
export default unreadService;
