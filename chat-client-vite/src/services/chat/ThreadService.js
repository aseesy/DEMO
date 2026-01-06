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
    this.isAnalysisComplete = false; // Track if conversation analysis has completed
    this.analysisTimeout = null; // Timeout to stop showing "analyzing" after a delay
    this.subscribers = new Set();
    this.setupSubscriptions();
  }

  setupSubscriptions() {
    // Backend emits 'threads_list' for full list, 'thread_created' for delta
    socketService.subscribe('threads_list', this.handleThreads.bind(this));
    socketService.subscribe('thread_created', this.handleThreadCreated.bind(this));
    socketService.subscribe('thread_messages', this.handleThreadMessages.bind(this));
    socketService.subscribe('conversation_analysis_complete', this.handleAnalysisComplete.bind(this));
    socketService.subscribe('disconnect', this.handleDisconnect.bind(this));
    
    // NEW: Add subscriptions for new events
    socketService.subscribe('reply_in_thread_success', this.handleReplySuccess.bind(this));
    socketService.subscribe('message_moved_to_thread_success', this.handleMoveSuccess.bind(this));
    socketService.subscribe('thread_archived', this.handleThreadArchived.bind(this));
    socketService.subscribe('thread_archived_success', this.handleArchiveSuccess.bind(this));
    socketService.subscribe('thread_message_count_changed', this.handleMessageCountChanged.bind(this));
  }

  handleThreads(data) {
    // Backend sends threads directly (not wrapped in {threads: []})
    const receivedThreads = Array.isArray(data) ? data : data.threads || [];
    this.threads = receivedThreads;
    
    // Only mark analysis complete if we received threads OR if we've already been notified
    // Empty threads_list doesn't mean analysis is done - it might still be running
    // We wait for explicit conversation_analysis_complete event or timeout
    if (receivedThreads.length > 0) {
      // If we have threads, analysis must be complete (either existing or newly created)
      this.isAnalysisComplete = true;
      this.clearAnalysisTimeout();
    }
    // If threads_list is empty, DON'T mark complete yet - wait for analysis_complete event
    
    this.notify();
  }

  handleAnalysisComplete(data) {
    // Backend explicitly notified us that analysis is complete
    this.isAnalysisComplete = true;
    this.clearAnalysisTimeout();
    if (import.meta.env.DEV) {
      console.log('[ThreadService] Conversation analysis complete', {
        roomId: data?.roomId,
        createdThreadsCount: data?.createdThreadsCount || 0,
      });
    }
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
    
    const { threadId, messages, limit, offset } = data;
    
    if (offset === 0) {
      // First page - replace messages
      this.threadMessages = {
        ...this.threadMessages,
        [threadId]: messages,
      };
    } else {
      // Subsequent pages - append messages
      const existing = this.threadMessages[threadId] || [];
      this.threadMessages = {
        ...this.threadMessages,
        [threadId]: [...existing, ...messages],
      };
    }
    
    this.notify();
  }

  handleDisconnect() {
    // Keep threads but mark loading complete
    this.isLoading = false;
    this.notify();
  }

  handleReplySuccess(data) {
    // { threadId, messageId }
    // Message will arrive via 'new_message' event
    // Thread count will update via 'thread_message_count_changed'
    // No state update needed - handled by existing handlers
    if (import.meta.env.DEV) {
      console.log('[ThreadService] Reply in thread success:', data);
    }
  }

  handleMoveSuccess(data) {
    // { messageId, oldThreadId, newThreadId, affectedThreads }
    // Update thread counts in local state
    // Remove message from old thread messages if loaded
    // Add message to new thread messages if loaded
    if (import.meta.env.DEV) {
      console.log('[ThreadService] Message moved successfully:', data);
    }
    this.updateThreadCounts(data.affectedThreads);
    this.moveMessageInState(data.messageId, data.oldThreadId, data.newThreadId);
  }

  handleThreadArchived(data) {
    // { threadId, archived, cascade, affectedThreadIds }
    // Update archived state for all affected threads
    if (import.meta.env.DEV) {
      console.log('[ThreadService] Thread archived event:', data);
    }
    this.updateArchivedState(data.affectedThreadIds, data.archived);
  }

  handleArchiveSuccess(data) {
    // { threadId, archived }
    // Confirmation - state already updated by handleThreadArchived
    // Could show toast notification here
    if (import.meta.env.DEV) {
      console.log('[ThreadService] Archive success confirmation:', data);
    }
  }

  handleMessageCountChanged(data) {
    // { threadId, messageCount, lastMessageAt }
    // Update thread's message_count in local state
    this.updateThreadMessageCount(data.threadId, data.messageCount, data.lastMessageAt);
  }

  updateThreadCounts(affectedThreads) {
    this.threads = this.threads.map(thread => {
      const affected = affectedThreads.find(a => a.threadId === thread.id);
      if (affected) {
        return { ...thread, message_count: affected.messageCount };
      }
      return thread;
    });
    this.notify();
  }

  moveMessageInState(messageId, oldThreadId, newThreadId) {
    // Remove from old thread messages
    if (oldThreadId && this.threadMessages[oldThreadId]) {
      this.threadMessages[oldThreadId] = this.threadMessages[oldThreadId].filter(
        msg => msg.id !== messageId
      );
    }
    
    // Add to new thread messages (if loaded)
    // Note: Message will arrive via 'new_message' event, but we need to update thread_id
    // This is handled by the message handler checking thread context
    this.notify();
  }

  updateArchivedState(threadIds, archived) {
    this.threads = this.threads.map(thread => {
      if (threadIds.includes(thread.id)) {
        return { ...thread, is_archived: archived ? 1 : 0 };
      }
      return thread;
    });
    this.notify();
  }

  updateThreadMessageCount(threadId, messageCount, lastMessageAt) {
    this.threads = this.threads.map(thread => {
      if (thread.id === threadId) {
        return { 
          ...thread, 
          message_count: messageCount,
          last_message_at: lastMessageAt 
        };
      }
      return thread;
    });
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
    // Reset analysis complete state when loading new room
    this.isAnalysisComplete = false;
    // Set a timeout: if no response after 30s, assume analysis completed (prevents infinite loading)
    this.clearAnalysisTimeout();
    this.analysisTimeout = setTimeout(() => {
      if (!this.isAnalysisComplete) {
        console.warn('[ThreadService] Threads loading timeout - assuming analysis complete');
        this.isAnalysisComplete = true;
        this.notify();
      }
    }, 30000); // 30 second timeout
    
    socketService.emit('get_threads', { roomId });
  }

  clearAnalysisTimeout() {
    if (this.analysisTimeout) {
      clearTimeout(this.analysisTimeout);
      this.analysisTimeout = null;
    }
  }

  /**
   * Load messages for a thread
   */
  loadThreadMessages(threadId, limit = 50, offset = 0) {
    this.isLoading = true;
    this.notify();
    socketService.emit('get_thread_messages', { threadId, limit, offset });
  }

  /**
   * Add message to thread
   */
  addToThread(messageId, threadId) {
    socketService.emit('add_to_thread', { messageId, threadId });
  }

  /**
   * Reply in thread
   */
  replyInThread(threadId, text, messageData = {}) {
    socketService.emit('reply_in_thread', { threadId, text, messageData });
  }

  /**
   * Move message to thread
   */
  moveMessageToThread(messageId, targetThreadId, roomId) {
    socketService.emit('move_message_to_thread', { 
      messageId, 
      targetThreadId, 
      roomId 
    });
  }

  /**
   * Archive/unarchive thread
   */
  archiveThread(threadId, archived = true, cascade = true) {
    socketService.emit('archive_thread', { threadId, archived, cascade });
  }

  getState() {
    return {
      threads: this.threads,
      threadMessages: this.threadMessages,
      isLoading: this.isLoading,
      isAnalysisComplete: this.isAnalysisComplete,
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
    this.isAnalysisComplete = false;
    this.clearAnalysisTimeout();
    this.notify();
  }
}

export const threadService = new ThreadService();
export default threadService;
