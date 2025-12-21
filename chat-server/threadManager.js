const dbSafe = require('./dbSafe');
const openaiClient = require('./openaiClient');

/**
 * Create a new thread
 */
async function createThread(roomId, title, createdBy, initialMessageId = null) {
  try {
    const db = require('./dbPostgres');
    const threadId = `thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    await dbSafe.safeInsert('threads', {
      id: threadId,
      room_id: roomId,
      title: title,
      created_by: createdBy,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      message_count: initialMessageId ? 1 : 0,
      last_message_at: initialMessageId ? new Date().toISOString() : null,
      is_archived: 0,
    });

    // If initial message provided, associate it with the thread
    if (initialMessageId) {
      await dbSafe.safeUpdate('messages', { thread_id: threadId }, { id: initialMessageId });
    }

    // PostgreSQL auto-commits, no manual save needed
    return threadId;
  } catch (error) {
    console.error('Error creating thread:', error);
    throw error;
  }
}

/**
 * Get all threads for a room
 */
async function getThreadsForRoom(roomId, includeArchived = false) {
  try {
    const db = require('./dbPostgres');
    const whereClause = includeArchived ? { room_id: roomId } : { room_id: roomId, is_archived: 0 };

    const result = await dbSafe.safeSelect('threads', whereClause, {
      orderBy: 'updated_at',
      orderDirection: 'DESC',
    });

    return dbSafe.parseResult(result);
  } catch (error) {
    console.error('Error getting threads:', error);
    return [];
  }
}

/**
 * Get messages for a specific thread
 */
async function getThreadMessages(threadId, limit = 50) {
  try {
    const db = require('./dbPostgres');
    const result = await dbSafe.safeSelect(
      'messages',
      { thread_id: threadId, private: 0, flagged: 0 },
      {
        orderBy: 'timestamp',
        orderDirection: 'ASC',
        limit: limit,
      }
    );

    return dbSafe.parseResult(result);
  } catch (error) {
    console.error('Error getting thread messages:', error);
    return [];
  }
}

/**
 * Add message to thread
 */
async function addMessageToThread(messageId, threadId) {
  try {
    const db = require('./dbPostgres');

    // Update message
    await dbSafe.safeUpdate('messages', { thread_id: threadId }, { id: messageId });

    // Update thread stats
    const threadResult = await dbSafe.safeSelect('threads', { id: threadId }, { limit: 1 });
    const threads = dbSafe.parseResult(threadResult);

    if (threads.length > 0) {
      const messageResult = await dbSafe.safeSelect('messages', { id: messageId }, { limit: 1 });
      const messages = dbSafe.parseResult(messageResult);
      const message = messages[0];

      await dbSafe.safeUpdate(
        'threads',
        {
          message_count: (threads[0].message_count || 0) + 1,
          last_message_at: message?.timestamp || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { id: threadId }
      );
    }

    // PostgreSQL auto-commits, no manual save needed
    return true;
  } catch (error) {
    console.error('Error adding message to thread:', error);
    return false;
  }
}

/**
 * Remove message from thread (move back to main conversation)
 */
async function removeMessageFromThread(messageId) {
  try {
    await dbSafe.safeUpdate('messages', { thread_id: null }, { id: messageId });

    // Update thread stats
    const messageResult = await dbSafe.safeSelect('messages', { id: messageId }, { limit: 1 });
    const messages = dbSafe.parseResult(messageResult);
    const threadId = messages[0]?.thread_id;

    if (threadId) {
      const threadResult = await dbSafe.safeSelect('threads', { id: threadId }, { limit: 1 });
      const threads = dbSafe.parseResult(threadResult);

      if (threads.length > 0) {
        await dbSafe.safeUpdate(
          'threads',
          {
            message_count: Math.max(0, (threads[0].message_count || 1) - 1),
            updated_at: new Date().toISOString(),
          },
          { id: threadId }
        );
      }
    }

    // PostgreSQL auto-commits, no manual save needed
    return true;
  } catch (error) {
    console.error('Error removing message from thread:', error);
    return false;
  }
}

/**
 * Update thread title
 */
async function updateThreadTitle(threadId, newTitle) {
  try {
    await dbSafe.safeUpdate(
      'threads',
      {
        title: newTitle,
        updated_at: new Date().toISOString(),
      },
      { id: threadId }
    );

    // PostgreSQL auto-commits, no manual save needed
    return true;
  } catch (error) {
    console.error('Error updating thread title:', error);
    return false;
  }
}

/**
 * Archive/unarchive thread
 */
async function archiveThread(threadId, archived = true) {
  try {
    await dbSafe.safeUpdate(
      'threads',
      {
        is_archived: archived ? 1 : 0,
        updated_at: new Date().toISOString(),
      },
      { id: threadId }
    );

    // PostgreSQL auto-commits, no manual save needed
    return true;
  } catch (error) {
    console.error('Error archiving thread:', error);
    return false;
  }
}

/**
 * Auto-detect if a message should start a new thread or belong to an existing thread
 * Uses AI to analyze message content and recent conversation
 */
async function suggestThreadForMessage(message, recentMessages, roomId) {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  try {
    // Get existing threads for this room
    const existingThreads = await getThreadsForRoom(roomId, false);

    // Analyze recent messages (last 10) to understand context
    const recentContext = recentMessages
      .slice(-10)
      .map(m => `${m.username}: ${m.text}`)
      .join('\n');

    const prompt = `Analyze this co-parenting message and determine if it:
1. Starts a NEW topic/thread (e.g., discussing pickup times, school events, medical appointments)
2. Belongs to an EXISTING thread (continuing a previous conversation)
3. Is a GENERAL message (doesn't need threading)

Current message: ${message.username}: "${message.text}"

Recent conversation:
${recentContext}

${
  existingThreads.length > 0
    ? `Existing threads:\n${existingThreads
        .slice(0, 5)
        .map(t => `- ${t.title} (${t.message_count} messages)`)
        .join('\n')}`
    : 'No existing threads'
}

Respond in JSON:
{
  "action": "new_thread|existing_thread|none",
  "threadTitle": "Suggested title if new_thread",
  "threadId": "thread_id if existing_thread",
  "confidence": 0-100,
  "reasoning": "Why this decision"
}`;

    const completion = await openaiClient.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert at analyzing co-parenting conversations to identify distinct topics and threads. Respond only with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 300,
    });

    const response = completion.choices[0].message.content.trim();
    const suggestion = JSON.parse(response);

    // Only suggest if confidence is high enough
    if (suggestion.confidence >= 60) {
      return {
        action: suggestion.action,
        threadTitle: suggestion.threadTitle || null,
        threadId: suggestion.threadId || null,
        confidence: suggestion.confidence,
        reasoning: suggestion.reasoning,
      };
    }

    return null;
  } catch (error) {
    console.error('Error suggesting thread:', error);
    return null;
  }
}

/**
 * Get thread details
 */
async function getThread(threadId) {
  try {
    const result = await dbSafe.safeSelect('threads', { id: threadId }, { limit: 1 });
    const threads = dbSafe.parseResult(result);
    return threads.length > 0 ? threads[0] : null;
  } catch (error) {
    console.error('Error getting thread:', error);
    return null;
  }
}

module.exports = {
  createThread,
  getThreadsForRoom,
  getThreadMessages,
  addMessageToThread,
  removeMessageFromThread,
  updateThreadTitle,
  archiveThread,
  suggestThreadForMessage,
  getThread,
};
