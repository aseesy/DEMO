import { socketService } from '../socket';

/**
 * ThreadService - Domain service for thread management
 *
 * Single Responsibility: Thread state and operations.
 * Nothing else.
 */
class ThreadService {
  constructor() {
    this.threads = [];
    this.threadMessages = {}; // threadId -> messages
    this.isLoading = false;
    this.subscribers = new Set();
    this.setupSubscriptions();
  }

  setupSubscriptions() {
    // Backend emits 'threads_list' for full list, 'thread_created' for delta
    socketService.subscribe('threads_list', this.handleThreads.bind(this));
    socketService.subscribe('thread_created', this.handleThreadCreated.bind(this));
    socketService.subscribe('thread_messages', this.handleThreadMessages.bind(this));
    socketService.subscribe('disconnect', this.handleDisconnect.bind(this));
  }

  handleThreads(data) {
    // Backend sends threads directly (not wrapped in {threads: []})
    this.threads = Array.isArray(data) ? data : data.threads || [];
    this.notify();
  }

  handleThreadCreated(data) {
    if (data.thread) {
      this.threads = [...this.threads, data.thread];
      this.notify();
    }
  }

  handleThreadMessages(data) {
    this.isLoading = false;
    this.threadMessages = {
      ...this.threadMessages,
      [data.threadId]: data.messages,
    };
    this.notify();
  }

  handleDisconnect() {
    // Keep threads but mark loading complete
    this.isLoading = false;
    this.notify();
  }

  /**
   * Create a new thread
   */
  create(roomId, title, messageId, category = 'logistics') {
    socketService.emit('create_thread', { roomId, title, messageId, category });
  }

  /**
   * Load threads for a room
   */
  loadThreads(roomId) {
    socketService.emit('get_threads', { roomId });
  }

  /**
   * Load messages for a thread
   */
  loadThreadMessages(threadId) {
    this.isLoading = true;
    this.notify();
    socketService.emit('get_thread_messages', { threadId });
  }

  /**
   * Add message to thread
   */
  addToThread(messageId, threadId) {
    socketService.emit('add_to_thread', { messageId, threadId });
  }

  getState() {
    return {
      threads: this.threads,
      threadMessages: this.threadMessages,
      isLoading: this.isLoading,
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

  clear() {
    this.threads = [];
    this.threadMessages = {};
    this.isLoading = false;
    this.notify();
  }
}

export const threadService = new ThreadService();
export default threadService;
