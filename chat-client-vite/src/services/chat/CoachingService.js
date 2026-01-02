import { socketService } from '../socket';

/**
 * CoachingService - Domain service for AI draft coaching
 *
 * Single Responsibility: AI coaching/intervention state.
 * Nothing else.
 */
class CoachingService {
  constructor() {
    this.coaching = null; // Current coaching intervention
    this.subscribers = new Set();
    this.setupSubscriptions();
  }

  setupSubscriptions() {
    socketService.subscribe('draft_coaching', this.handleDraftCoaching.bind(this));
    socketService.subscribe('coaching_dismissed', this.handleCoachingDismissed.bind(this));
    socketService.subscribe('disconnect', this.handleDisconnect.bind(this));
  }

  handleDraftCoaching(data) {
    this.coaching = data;
    this.notify();
  }

  handleCoachingDismissed() {
    this.coaching = null;
    this.notify();
  }

  handleDisconnect() {
    // Keep coaching state - user might reconnect
  }

  /**
   * Dismiss current coaching
   */
  dismiss() {
    this.coaching = null;
    this.notify();
    socketService.emit('dismiss_coaching', {});
  }

  /**
   * Accept a rewrite suggestion
   */
  acceptRewrite(rewriteIndex) {
    socketService.emit('accept_rewrite', { rewriteIndex });
    this.coaching = null;
    this.notify();
  }

  getState() {
    return {
      coaching: this.coaching,
      hasCoaching: this.coaching !== null,
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

export const coachingService = new CoachingService();
export default coachingService;
