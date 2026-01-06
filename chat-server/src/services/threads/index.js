/**
 * Thread Services - Conversation threading with AI analysis
 *
 * Provides:
 * - ConversationWindower: Groups messages into conversation windows
 * - ThreadAnalyzer: AI-powered conversation analysis
 * - ThreadService: Orchestration and database persistence
 *
 * @module services/threads
 */

const ConversationWindower = require('./ConversationWindower');
const ThreadAnalyzer = require('./ThreadAnalyzer');
const { ThreadService, getThreadService } = require('./ThreadService');

module.exports = {
  ConversationWindower,
  ThreadAnalyzer,
  ThreadService,
  getThreadService,
};
