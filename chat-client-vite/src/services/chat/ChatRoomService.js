import { socketService } from '../socket';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('[ChatRoomService]');

/**
 * ChatRoomService - Domain service for room management
 *
 * Architecture (Event-Driven):
 * - Stores user email for auto-join on reconnect
 * - Subscribes to socket 'connect' events for auto-join
 * - Subscribes to 'join_success' for room state updates
 *
 * Flow:
 * 1. React calls setEmail(email) when user is authenticated
 * 2. Socket connects (triggered by tokenManager)
 * 3. ChatRoomService receives 'connect' → auto-joins with stored email
 * 4. Server responds with 'join_success' → updates room state
 *
 * This eliminates race conditions because:
 * - Email is stored before socket connects
 * - Auto-join happens on every connect (including reconnects)
 */
class ChatRoomService {
  constructor() {
    this.roomId = null;
    this.isJoined = false;
    this.error = null;
    this.email = null; // Stored email for auto-join
    this.subscribers = new Set();
    this.setupSubscriptions();
  }

  setupSubscriptions() {
    // Subscribe to socket events relevant to rooms
    socketService.subscribe('connect', this.handleConnect.bind(this));
    socketService.subscribe('join_success', this.handleJoinSuccess.bind(this));
    socketService.subscribe('room_created', this.handleRoomCreated.bind(this));
    socketService.subscribe('disconnect', this.handleDisconnect.bind(this));
    socketService.subscribe('error', this.handleError.bind(this));
  }

  /**
   * Handle socket connect - auto-join with stored email
   * This is the KEY to eliminating race conditions
   */
  handleConnect() {
    if (this.email) {
      logger.debug('Socket connected, auto-joining with email', { hasEmail: !!this.email });
      socketService.emit('join', { email: this.email });
    } else {
      logger.debug('Socket connected, but no email set yet');
    }
  }

  handleJoinSuccess(data) {
    logger.info('JOIN_SUCCESS received', {
      roomId: data.roomId,
      hasEmail: !!data.email,
    });
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
   * Set user email for auto-join
   * Called when user authenticates - stores email for current and future connections
   */
  setEmail(email) {
    const previousEmail = this.email;
    this.email = email;

    logger.debug('Email set', { emailChanged: email !== previousEmail });

    // If email changed and socket is connected, join immediately
    if (email && email !== previousEmail && socketService.isConnected()) {
      logger.debug('Socket already connected, joining now');
      socketService.emit('join', { email });
    }
  }

  /**
   * Clear email (on logout)
   */
  clearEmail() {
    this.email = null;
    this.roomId = null;
    this.isJoined = false;
    this.notify();
  }

  /**
   * Join a room (legacy method - prefer setEmail for event-driven flow)
   * Kept for backward compatibility
   */
  join(email) {
    if (!email) return false;

    // Store email for auto-join on reconnect
    this.email = email;

    // If connected, emit immediately
    if (socketService.isConnected()) {
      return socketService.emit('join', { email });
    }

    // Not connected - handleConnect will auto-join when socket connects
    logger.debug('Socket not connected, will auto-join when connected');
    return true; // Pending
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
