import { socketService } from '../socket';

/**
 * ChatRoomService - Domain service for room management
 *
 * Single Responsibility: Room joining, leaving, and room state.
 * Nothing else.
 *
 * This service subscribes to SocketService events directly.
 * React hooks subscribe to this service's state.
 */
class ChatRoomService {
  constructor() {
    this.roomId = null;
    this.isJoined = false;
    this.error = null;
    this.subscribers = new Set();
    this.setupSubscriptions();
  }

  setupSubscriptions() {
    // Subscribe to socket events relevant to rooms
    // Server emits 'join_success' (not 'joined')
    socketService.subscribe('join_success', this.handleJoinSuccess.bind(this));
    socketService.subscribe('room_created', this.handleRoomCreated.bind(this));
    socketService.subscribe('disconnect', this.handleDisconnect.bind(this));
    socketService.subscribe('error', this.handleError.bind(this));
  }

  handleJoinSuccess(data) {
    this.roomId = data.roomId || this.roomId;
    this.isJoined = true;
    this.error = null;
    this.notify();
  }

  handleRoomCreated(data) {
    if (data.roomId) {
      this.roomId = data.roomId;
      this.notify();
    }
  }

  handleDisconnect() {
    this.isJoined = false;
    this.notify();
  }

  handleError(data) {
    this.error = data.message || 'Room error';
    this.notify();
  }

  /**
   * Join a room
   */
  join(email) {
    if (!email) return false;
    return socketService.emit('join', { email });
  }

  /**
   * Leave current room
   */
  leave() {
    if (this.roomId) {
      socketService.emit('leave', { roomId: this.roomId });
      this.roomId = null;
      this.isJoined = false;
      this.notify();
    }
  }

  /**
   * Get current state
   */
  getState() {
    return {
      roomId: this.roomId,
      isJoined: this.isJoined,
      error: this.error,
    };
  }

  /**
   * Subscribe to state changes
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notify() {
    const state = this.getState();
    this.subscribers.forEach(cb => cb(state));
  }

  /**
   * Clear error
   */
  clearError() {
    this.error = null;
    this.notify();
  }
}

export const chatRoomService = new ChatRoomService();
export default chatRoomService;
