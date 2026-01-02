import { socketService } from '../socket';

/**
 * TypingService - Domain service for typing indicators
 *
 * Single Responsibility: Who is typing.
 * Nothing else.
 */
class TypingService {
  constructor() {
    this.typingUsers = new Set();
    this.subscribers = new Set();
    this.setupSubscriptions();
  }

  setupSubscriptions() {
    socketService.subscribe('user_typing', this.handleUserTyping.bind(this));
    socketService.subscribe('user_stopped_typing', this.handleUserStoppedTyping.bind(this));
    socketService.subscribe('disconnect', this.handleDisconnect.bind(this));
  }

  handleUserTyping(data) {
    this.typingUsers.add(data.username);
    this.notify();
  }

  handleUserStoppedTyping(data) {
    this.typingUsers.delete(data.username);
    this.notify();
  }

  handleDisconnect() {
    this.typingUsers.clear();
    this.notify();
  }

  /**
   * Emit that current user started typing
   */
  startTyping() {
    socketService.emit('typing', {});
  }

  /**
   * Emit that current user stopped typing
   */
  stopTyping() {
    socketService.emit('stop_typing', {});
  }

  getState() {
    return {
      typingUsers: Array.from(this.typingUsers),
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

export const typingService = new TypingService();
export default typingService;
